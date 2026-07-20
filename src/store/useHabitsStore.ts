import { create } from "zustand";
import { getDb } from "../db/client";
import type { CreateHabitInput, Habit, HabitLog } from "../types";
import { calculateCurrentStreak, getLocalDateKey, isHabitDueOnDate } from "../utils/date";
import { generateId } from "../utils/id";

interface HabitRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency_type: Habit["frequencyType"];
  weekdays_mask: number;
  reminder_time: string | null;
  notification_id: string | null;
  best_streak: number;
  created_at: number;
  archived_at: number | null;
}

interface HabitLogRow {
  id: string;
  habit_id: string;
  date: string;
  completed_at: number;
}

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    frequencyType: row.frequency_type,
    weekdaysMask: row.weekdays_mask,
    reminderTime: row.reminder_time,
    notificationId: row.notification_id,
    bestStreak: row.best_streak,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
}

function rowToLog(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completedAt: row.completed_at,
  };
}

interface HabitsState {
  habits: Habit[];
  habitLogs: HabitLog[];
  hasHydrated: boolean;

  hydrate: () => Promise<void>;
  addHabit: (input: CreateHabitInput) => Promise<Habit>;
  updateHabit: (id: string, patch: Partial<CreateHabitInput>) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  unarchiveHabit: (id: string) => Promise<void>;
  deleteHabitPermanently: (id: string) => Promise<void>;
  /**
   * Set/clear ID notifikasi terjadwal yang aktif buat habit ini. Store CUMA
   * persist ID-nya — actual schedule/cancel ke expo-notifications itu
   * tanggung jawab UI layer (`habit/add.tsx`, `habit/[id].tsx`), konsisten
   * sama pola `ReminderSheet.tsx` buat reminder savings.
   */
  setHabitNotificationId: (id: string, notificationId: string | null) => Promise<void>;
  /** Toggle selesai/belum buat HARI INI. Otomatis update `bestStreak` kalau streak baru lebih tinggi. */
  toggleHabitToday: (habitId: string) => Promise<void>;

  getHabitById: (id: string) => Habit | undefined;
  /** Habit yang due hari ini DAN belum di-archive, urutan gak berubah (createdAt DESC). */
  getTodayHabits: () => Habit[];
  isHabitCompletedToday: (habitId: string) => boolean;
  getCompletedDateKeys: (habitId: string) => Set<string>;
  getCurrentStreak: (habitId: string) => number;
  // ⚠️ 5 method di atas (`getHabitById` s/d `getCurrentStreak`) itu HELPER
  // IMPERATIF — panggil langsung (`useHabitsStore.getState().getTodayHabits()`
  // atau dari dalam action lain lewat `get()`), JANGAN dipakai sebagai
  // reactive selector (`useHabitsStore((s) => s.getTodayHabits())`). Semua
  // balikin array/Set BARU tiap dipanggil, jadi kalau dipakai sebagai
  // selector, Zustand nganggep state "berubah" tiap render -> re-render
  // sia-sia terus-terusan. Di komponen, select `habits`/`habitLogs` mentah
  // terus turunkan sendiri lewat `useMemo` (lihat pola di `(tabs)/index.tsx`).
}

/**
 * Sama pola-nya kayak `useGoalsStore` (Checkpoint 0b) — SQLite source of
 * truth, Zustand cache in-memory write-through. `habitLogs` di-load PENUH ke
 * memory (bukan cuma rentang tanggal tertentu) — buat personal habit tracker,
 * volumenya kecil (puluhan habit x ribuan hari = tetap ringan), dan heatmap
 * history butuh akses ke seluruh log lagi pula.
 */
export const useHabitsStore = create<HabitsState>()((set, get) => ({
  habits: [],
  habitLogs: [],
  hasHydrated: false,

  hydrate: async () => {
    const db = await getDb();
    const [habitRows, logRows] = await Promise.all([
      db.getAllAsync<HabitRow>(
        "SELECT * FROM habits ORDER BY created_at DESC",
      ),
      db.getAllAsync<HabitLogRow>("SELECT * FROM habit_logs"),
    ]);
    set({
      habits: habitRows.map(rowToHabit),
      habitLogs: logRows.map(rowToLog),
      hasHydrated: true,
    });
  },

  addHabit: async (input) => {
    const newHabit: Habit = {
      id: generateId("habit"),
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      frequencyType: input.frequencyType,
      weekdaysMask: input.weekdaysMask,
      reminderTime: input.reminderTime,
      notificationId: null,
      bestStreak: 0,
      createdAt: Date.now(),
      archivedAt: null,
    };

    const db = await getDb();
    await db.runAsync(
      `INSERT INTO habits
        (id, name, icon, color, frequency_type, weekdays_mask, reminder_time, notification_id, best_streak, created_at, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newHabit.id,
        newHabit.name,
        newHabit.icon,
        newHabit.color,
        newHabit.frequencyType,
        newHabit.weekdaysMask,
        newHabit.reminderTime,
        newHabit.notificationId,
        newHabit.bestStreak,
        newHabit.createdAt,
        newHabit.archivedAt,
      ],
    );

    set((state) => ({ habits: [newHabit, ...state.habits] }));
    return newHabit;
  },

  updateHabit: async (id, patch) => {
    const existing = get().habits.find((h) => h.id === id);
    if (!existing) return;

    const updated: Habit = {
      ...existing,
      name: patch.name?.trim() ?? existing.name,
      icon: patch.icon ?? existing.icon,
      color: patch.color ?? existing.color,
      frequencyType: patch.frequencyType ?? existing.frequencyType,
      weekdaysMask: patch.weekdaysMask ?? existing.weekdaysMask,
      reminderTime:
        patch.reminderTime !== undefined
          ? patch.reminderTime
          : existing.reminderTime,
    };

    const db = await getDb();
    await db.runAsync(
      `UPDATE habits SET name = ?, icon = ?, color = ?, frequency_type = ?, weekdays_mask = ?, reminder_time = ?
       WHERE id = ?`,
      [
        updated.name,
        updated.icon,
        updated.color,
        updated.frequencyType,
        updated.weekdaysMask,
        updated.reminderTime,
        id,
      ],
    );

    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? updated : h)),
    }));
  },

  archiveHabit: async (id) => {
    const archivedAt = Date.now();
    const db = await getDb();
    await db.runAsync("UPDATE habits SET archived_at = ? WHERE id = ?", [
      archivedAt,
      id,
    ]);
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, archivedAt } : h,
      ),
    }));
  },

  unarchiveHabit: async (id) => {
    const db = await getDb();
    await db.runAsync("UPDATE habits SET archived_at = NULL WHERE id = ?", [
      id,
    ]);
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, archivedAt: null } : h,
      ),
    }));
  },

  deleteHabitPermanently: async (id) => {
    const db = await getDb();
    // ON DELETE CASCADE di habit_logs.habit_id otomatis ikut hapus histori-nya.
    await db.runAsync("DELETE FROM habits WHERE id = ?", [id]);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      habitLogs: state.habitLogs.filter((l) => l.habitId !== id),
    }));
  },

  setHabitNotificationId: async (id, notificationId) => {
    const db = await getDb();
    await db.runAsync(
      "UPDATE habits SET notification_id = ? WHERE id = ?",
      [notificationId, id],
    );
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, notificationId } : h,
      ),
    }));
  },

  toggleHabitToday: async (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const db = await getDb();
    const todayKey = getLocalDateKey();
    const alreadyDone = get().habitLogs.some(
      (l) => l.habitId === habitId && l.date === todayKey,
    );

    if (alreadyDone) {
      await db.runAsync(
        "DELETE FROM habit_logs WHERE habit_id = ? AND date = ?",
        [habitId, todayKey],
      );
      set((state) => ({
        habitLogs: state.habitLogs.filter(
          (l) => !(l.habitId === habitId && l.date === todayKey),
        ),
      }));
      return;
    }

    const newLog: HabitLog = {
      id: generateId("log"),
      habitId,
      date: todayKey,
      completedAt: Date.now(),
    };

    const updatedLogs = [...get().habitLogs, newLog];
    const completedDateKeys = new Set(
      updatedLogs.filter((l) => l.habitId === habitId).map((l) => l.date),
    );
    const newStreak = calculateCurrentStreak(habit, completedDateKeys);
    const shouldBumpBest = newStreak > habit.bestStreak;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        "INSERT INTO habit_logs (id, habit_id, date, completed_at) VALUES (?, ?, ?, ?)",
        [newLog.id, newLog.habitId, newLog.date, newLog.completedAt],
      );
      if (shouldBumpBest) {
        await db.runAsync("UPDATE habits SET best_streak = ? WHERE id = ?", [
          newStreak,
          habitId,
        ]);
      }
    });

    set((state) => ({
      habitLogs: updatedLogs,
      habits: shouldBumpBest
        ? state.habits.map((h) =>
            h.id === habitId ? { ...h, bestStreak: newStreak } : h,
          )
        : state.habits,
    }));
  },

  getHabitById: (id) => get().habits.find((h) => h.id === id),

  getTodayHabits: () => {
    const todayKey = getLocalDateKey();
    return get().habits.filter(
      (h) => !h.archivedAt && isHabitDueOnDate(h, todayKey),
    );
  },

  isHabitCompletedToday: (habitId) => {
    const todayKey = getLocalDateKey();
    return get().habitLogs.some(
      (l) => l.habitId === habitId && l.date === todayKey,
    );
  },

  getCompletedDateKeys: (habitId) => {
    return new Set(
      get()
        .habitLogs.filter((l) => l.habitId === habitId)
        .map((l) => l.date),
    );
  },

  getCurrentStreak: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return 0;
    return calculateCurrentStreak(habit, get().getCompletedDateKeys(habitId));
  },
}));
