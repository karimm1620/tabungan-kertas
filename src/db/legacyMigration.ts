import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Goal, Transaction } from "../types";
import { getDb } from "./client";

const MIGRATION_FLAG_KEY = "migrated_from_async_storage_v1";
const OLD_GOALS_KEY = "saving-tracker-storage";
const OLD_SETTINGS_KEY = "saving-tracker-settings";

interface OldGoalsBlob {
  state?: {
    goals?: Goal[];
    transactions?: Transaction[];
  };
}

interface OldSettingsBlob {
  state?: {
    reminderEnabled?: boolean;
    reminderHour?: number;
    reminderMinute?: number;
    reminderNotificationId?: string | null;
  };
}

/**
 * Migrasi SATU KALI dari AsyncStorage (Zustand `persist` middleware, format
 * lama sebelum Checkpoint 0) ke SQLite. Idempotent — cek flag di tabel
 * `settings` dulu sebelum jalan.
 *
 * SENGAJA GAK menghapus key AsyncStorage lama walau migrasi sukses — cuma
 * berhenti DIBACA setelah ini. Kalau ternyata ada bug di pembacaan datanya,
 * data asli masih utuh dan bisa di-recover manual.
 *
 * Kalau migrasi gagal di tengah jalan: `withTransactionAsync` roll-back
 * otomatis (atomic), dan flag SENGAJA gak ditandai selesai — supaya dicoba
 * lagi di launch berikutnya. Aman diulang karena insert goal/transaksi pakai
 * `INSERT OR IGNORE` (idempotent lewat primary key).
 */
export async function migrateFromAsyncStorageIfNeeded(): Promise<void> {
  const db = await getDb();

  const flag = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [MIGRATION_FLAG_KEY],
  );
  if (flag) return;

  try {
    const [goalsRaw, settingsRaw] = await Promise.all([
      AsyncStorage.getItem(OLD_GOALS_KEY),
      AsyncStorage.getItem(OLD_SETTINGS_KEY),
    ]);

    await db.withTransactionAsync(async () => {
      if (goalsRaw) {
        const parsed: OldGoalsBlob = JSON.parse(goalsRaw);
        const goals = parsed.state?.goals ?? [];
        const transactions = parsed.state?.transactions ?? [];

        for (const g of goals) {
          await db.runAsync(
            `INSERT OR IGNORE INTO savings_goals
              (id, name, target_amount, current_amount, image_uri, emoji, accent, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              g.id,
              g.name,
              g.targetAmount,
              g.currentAmount,
              g.imageUri ?? null,
              g.emoji ?? null,
              g.accent,
              g.createdAt,
            ],
          );
        }

        for (const t of transactions) {
          await db.runAsync(
            `INSERT OR IGNORE INTO savings_tx (id, goal_id, type, amount, note, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [t.id, t.goalId, t.type, t.amount, t.note ?? null, t.createdAt],
          );
        }
      }

      if (settingsRaw) {
        const parsed: OldSettingsBlob = JSON.parse(settingsRaw);
        const s = parsed.state;
        if (s) {
          await db.runAsync(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            [
              "reminder",
              JSON.stringify({
                enabled: s.reminderEnabled ?? false,
                hour: s.reminderHour ?? 20,
                minute: s.reminderMinute ?? 0,
                notificationId: s.reminderNotificationId ?? null,
              }),
            ],
          );
        }
      }

      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [MIGRATION_FLAG_KEY, String(Date.now())],
      );
    });
  } catch (error) {
    console.error(
      "[legacyMigration] Gagal migrasi dari AsyncStorage, akan dicoba lagi launch berikutnya:",
      error,
    );
  }
}
