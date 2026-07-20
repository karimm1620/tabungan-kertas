import { create } from "zustand";
import { getDb } from "../db/client";

const SETTINGS_KEY = "reminder";

interface ReminderSettings {
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

interface SettingsState {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  reminderNotificationId: string | null;
  hasHydrated: boolean;

  /** Load setting dari SQLite ke memory. Panggil sekali di bootstrap app. */
  hydrate: () => Promise<void>;
  setReminder: (
    enabled: boolean,
    hour: number,
    minute: number,
    notificationId: string | null,
  ) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  reminderEnabled: DEFAULT_REMINDER.enabled,
  reminderHour: DEFAULT_REMINDER.hour,
  reminderMinute: DEFAULT_REMINDER.minute,
  reminderNotificationId: DEFAULT_REMINDER.notificationId,
  hasHydrated: false,

  hydrate: async () => {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      [SETTINGS_KEY],
    );
    const reminder: ReminderSettings = row
      ? JSON.parse(row.value)
      : DEFAULT_REMINDER;

    set({
      reminderEnabled: reminder.enabled,
      reminderHour: reminder.hour,
      reminderMinute: reminder.minute,
      reminderNotificationId: reminder.notificationId,
      hasHydrated: true,
    });
  },

  setReminder: async (enabled, hour, minute, notificationId) => {
    const db = await getDb();
    const value: ReminderSettings = { enabled, hour, minute, notificationId };
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [SETTINGS_KEY, JSON.stringify(value)],
    );

    set({
      reminderEnabled: enabled,
      reminderHour: hour,
      reminderMinute: minute,
      reminderNotificationId: notificationId,
    });
  },
}));
