import { Directory, File, Paths } from "expo-file-system";
import { getDb } from "../db/client";
import {
  type GoalRow,
  rowToGoal,
  rowToTx,
  type TxRow,
} from "../store/useGoalsStore";
import {
  type HabitLogRow,
  type HabitRow,
  rowToHabit,
  rowToLog,
} from "../store/useHabitsStore";
import { rowToTodo, type TodoRow } from "../store/useTodosStore";
import type { Goal, Habit, HabitLog, Todo, Transaction } from "../types";
import { getLocalDateKey } from "./date";

export const BACKUP_FORMAT_VERSION = 1;

/**
 * Key di tabel `settings` yang SENGAJA gak ikut backup/restore — ini state
 * internal/transient, bukan data user. Restore `pending_goal_deletion` dari
 * device lain misalnya, bisa bikin state undo-delete yang aneh; restore
 * migration flag jelas gak relevan di device manapun.
 */
const INTERNAL_SETTINGS_KEYS = new Set<string>([
  "migrated_from_async_storage_v1",
  "pending_goal_deletion",
]);

interface SettingRow {
  key: string;
  value: string;
}

export interface BackupPayload {
  formatVersion: number;
  exportedAt: number;
  data: {
    savingsGoals: Goal[];
    savingsTransactions: Transaction[];
    habits: Habit[];
    habitLogs: HabitLog[];
    todos: Todo[];
    settings: SettingRow[];
  };
}

/** Baca semua data dari SQLite, susun jadi satu payload backup. */
export async function buildBackupPayload(): Promise<BackupPayload> {
  const db = await getDb();
  const [goalRows, txRows, habitRows, logRows, todoRows, settingsRows] =
    await Promise.all([
      db.getAllAsync<GoalRow>("SELECT * FROM savings_goals"),
      db.getAllAsync<TxRow>("SELECT * FROM savings_tx"),
      db.getAllAsync<HabitRow>("SELECT * FROM habits"),
      db.getAllAsync<HabitLogRow>("SELECT * FROM habit_logs"),
      db.getAllAsync<TodoRow>("SELECT * FROM todos"),
      db.getAllAsync<SettingRow>("SELECT * FROM settings"),
    ]);

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: Date.now(),
    data: {
      savingsGoals: goalRows.map(rowToGoal),
      savingsTransactions: txRows.map(rowToTx),
      habits: habitRows.map(rowToHabit),
      habitLogs: logRows.map(rowToLog),
      todos: todoRows.map(rowToTodo),
      settings: settingsRows.filter((r) => !INTERNAL_SETTINGS_KEYS.has(r.key)),
    },
  };
}

const backupsDir = new Directory(Paths.cache, "backups");

function ensureBackupsDir() {
  if (!backupsDir.exists) {
    backupsDir.create({ intermediates: true, idempotent: true });
  }
}

/**
 * Tulis backup ke file JSON di cache directory (buat di-share, BUKAN
 * penyimpanan permanen — cache bisa dibersihin OS kapan aja). Return
 * `File` yang siap dilempar ke `expo-sharing`.
 */
export async function exportBackupToFile(): Promise<File> {
  const payload = await buildBackupPayload();
  ensureBackupsDir();

  const filename = `heibi-backup-${getLocalDateKey()}.json`;
  const file = new File(backupsDir, filename);
  file.create({ overwrite: true });
  file.write(JSON.stringify(payload, null, 2));
  return file;
}

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  payload?: BackupPayload;
}

/**
 * Validasi RUNTIME (bukan cuma type-check TypeScript, itu gak ngaruh ke JSON
 * dari luar) — cek field wajib & tipe dasar tiap record, biar backup file
 * yang corrupt/gak lengkap/dari versi lain gak nge-crash pas di-restore,
 * dan errornya jelas buat user (bukan cuma "gagal").
 */
export function validateBackupPayload(raw: unknown): BackupValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, error: "File bukan format JSON yang valid." };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.formatVersion !== "number") {
    return { valid: false, error: "File ini gak dikenali sebagai backup heibi." };
  }
  if (obj.formatVersion > BACKUP_FORMAT_VERSION) {
    return {
      valid: false,
      error: "Backup ini dibuat dari versi app yang lebih baru — update app dulu sebelum restore.",
    };
  }
  if (typeof obj.data !== "object" || obj.data === null) {
    return { valid: false, error: "Backup ini gak punya data yang bisa dipulihkan." };
  }

  const data = obj.data as Record<string, unknown>;
  const arrayFields: (keyof BackupPayload["data"])[] = [
    "savingsGoals",
    "savingsTransactions",
    "habits",
    "habitLogs",
    "todos",
    "settings",
  ];
  for (const field of arrayFields) {
    if (!Array.isArray(data[field])) {
      return { valid: false, error: `Bagian "${field}" di backup ini rusak atau hilang.` };
    }
  }

  // Cek dangkal per-record — bukan validasi tiap field exhaustive, cukup
  // buat nangkep file yang jelas-jelas bukan backup heibi atau kepotong.
  const goals = data.savingsGoals as unknown[];
  for (const g of goals) {
    if (
      typeof g !== "object" ||
      g === null ||
      typeof (g as Goal).id !== "string" ||
      typeof (g as Goal).name !== "string" ||
      typeof (g as Goal).targetAmount !== "number"
    ) {
      return { valid: false, error: "Ada data goal tabungan yang gak valid di backup ini." };
    }
  }

  const habits = data.habits as unknown[];
  for (const h of habits) {
    if (
      typeof h !== "object" ||
      h === null ||
      typeof (h as Habit).id !== "string" ||
      typeof (h as Habit).name !== "string"
    ) {
      return { valid: false, error: "Ada data habit yang gak valid di backup ini." };
    }
  }

  return { valid: true, payload: obj as unknown as BackupPayload };
}

/**
 * REPLACE total — semua data existing di device DIHAPUS, diganti isi backup.
 * Bukan merge. UI WAJIB konfirmasi eksplisit ke user sebelum manggil ini
 * (lihat `app/settings.tsx`), karena ini destruktif dan gak ada undo.
 */
export async function restoreFromBackup(payload: BackupPayload): Promise<void> {
  const db = await getDb();
  const { data } = payload;

  await db.withTransactionAsync(async () => {
    // Urutan hapus: anak dulu baru induk gak masalah di sini karena semua
    // FK udah ON DELETE CASCADE — tapi tetap eksplisit hapus semua tabel
    // biar gak nyisa baris "yatim" kalau backup lama gak lengkap.
    await db.runAsync("DELETE FROM savings_tx");
    await db.runAsync("DELETE FROM savings_goals");
    await db.runAsync("DELETE FROM habit_logs");
    await db.runAsync("DELETE FROM habits");
    await db.runAsync("DELETE FROM todos");
    // Setting internal punya device ini SENGAJA dipertahankan (bukan ikut
    // di-hapus/restore dari backup) — flag migrasi & pending-deletion itu
    // fakta lokal device ini, bukan sesuatu yang masuk akal "dipulihkan".
    await db.runAsync(
      `DELETE FROM settings WHERE key NOT IN (${[...INTERNAL_SETTINGS_KEYS].map(() => "?").join(",") || "''"})`,
      [...INTERNAL_SETTINGS_KEYS],
    );

    for (const g of data.savingsGoals) {
      await db.runAsync(
        `INSERT INTO savings_goals (id, name, target_amount, current_amount, image_uri, emoji, accent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [g.id, g.name, g.targetAmount, g.currentAmount, g.imageUri ?? null, g.emoji ?? null, g.accent, g.createdAt],
      );
    }
    for (const t of data.savingsTransactions) {
      await db.runAsync(
        `INSERT INTO savings_tx (id, goal_id, type, amount, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.goalId, t.type, t.amount, t.note ?? null, t.createdAt],
      );
    }
    for (const h of data.habits) {
      await db.runAsync(
        `INSERT INTO habits
          (id, name, icon, color, frequency_type, weekdays_mask, reminder_time, notification_id, best_streak, created_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          h.id,
          h.name,
          h.icon,
          h.color,
          h.frequencyType,
          h.weekdaysMask,
          h.reminderTime,
          // notification_id SENGAJA gak dipulihkan — ID notifikasi lama itu
          // gak valid lagi di device ini (belum tentu ke-schedule ulang).
          // Reminder tetap kesimpen di reminderTime, user tinggal edit
          // habit-nya kalau mau nyalain lagi remindernya.
          null,
          h.bestStreak,
          h.createdAt,
          h.archivedAt,
        ],
      );
    }
    for (const l of data.habitLogs) {
      await db.runAsync(
        `INSERT INTO habit_logs (id, habit_id, date, completed_at) VALUES (?, ?, ?, ?)`,
        [l.id, l.habitId, l.date, l.completedAt],
      );
    }
    for (const td of data.todos) {
      await db.runAsync(
        `INSERT INTO todos (id, title, date, completed_at, created_at) VALUES (?, ?, ?, ?, ?)`,
        [td.id, td.title, td.date, td.completedAt, td.createdAt],
      );
    }
    for (const s of data.settings) {
      if (INTERNAL_SETTINGS_KEYS.has(s.key)) continue;
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [s.key, s.value],
      );
    }
  });
}
