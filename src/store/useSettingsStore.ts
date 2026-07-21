import { create } from "zustand";
import { getDb } from "../db/client";

export type ReminderDomain = "savings" | "planner";

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId: string | null;
}

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
  notificationId: null,
};

/**
 * Key `settings` per domain reminder. `savings` pakai key LAMA (`reminder`,
 * dari sebelum ada domain lain) — JANGAN diubah, biar reminder savings user
 * existing gak kereset ke default pas update ke versi ini.
 */
const SETTINGS_KEY_BY_DOMAIN: Record<ReminderDomain, string> = {
  savings: "reminder",
  planner: "planner_reminder",
};

interface SettingsState {
  savingsReminder: ReminderSettings;
  plannerReminder: ReminderSettings;
  hasHydrated: boolean;

  /** Load setting dari SQLite ke memory. Panggil sekali di bootstrap app. */
  hydrate: () => Promise<void>;
  setReminder: (
    domain: ReminderDomain,
    enabled: boolean,
    hour: number,
    minute: number,
    notificationId: string | null,
  ) => Promise<void>;
}

async function readReminder(
  db: Awaited<ReturnType<typeof getDb>>,
  domain: ReminderDomain,
): Promise<ReminderSettings> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [SETTINGS_KEY_BY_DOMAIN[domain]],
  );
  return row ? JSON.parse(row.value) : DEFAULT_REMINDER;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  savingsReminder: DEFAULT_REMINDER,
  plannerReminder: DEFAULT_REMINDER,
  hasHydrated: false,

  hydrate: async () => {
    const db = await getDb();
    const [savingsReminder, plannerReminder] = await Promise.all([
      readReminder(db, "savings"),
      readReminder(db, "planner"),
    ]);
    set({ savingsReminder, plannerReminder, hasHydrated: true });
  },

  setReminder: async (domain, enabled, hour, minute, notificationId) => {
    const db = await getDb();
    const value: ReminderSettings = { enabled, hour, minute, notificationId };
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [SETTINGS_KEY_BY_DOMAIN[domain], JSON.stringify(value)],
    );

    set(
      domain === "savings"
        ? { savingsReminder: value }
        : { plannerReminder: value },
    );
  },
}));
