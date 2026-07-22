import { useHabitsStore } from "../store/useHabitsStore";
import type { Habit } from "../types";
import {
  cancelReminder,
  isNotificationsAvailable,
  requestNotificationPermission,
  scheduleHabitReminder,
} from "../utils/notifications";

/**
 * Orkestrasi archive/unarchive/delete-permanen SEKALIAN cleanup notifikasi
 * terkait — diekstrak dari `habit/[id].tsx` biar bisa dipakai bareng swipe
 * action (`SwipeableRow` di Today screen) tanpa duplikasi logic. Store
 * (`useHabitsStore`) tetap dumb, cuma persist data — orkestrasi side-effect
 * notifikasi tetap di layer ini (hook UI), konsisten sama keputusan arsitektur
 * yang udah ada dari Checkpoint 1.
 */
export function useHabitActions() {
  const archiveHabit = useHabitsStore((s) => s.archiveHabit);
  const unarchiveHabit = useHabitsStore((s) => s.unarchiveHabit);
  const deleteHabitPermanently = useHabitsStore((s) => s.deleteHabitPermanently);
  const setHabitNotificationId = useHabitsStore((s) => s.setHabitNotificationId);

  const archiveWithCleanup = async (habit: Habit) => {
    if (habit.notificationId) {
      await cancelReminder(habit.notificationId);
      await setHabitNotificationId(habit.id, null);
    }
    await archiveHabit(habit.id);
  };

  const unarchiveWithReschedule = async (habit: Habit) => {
    await unarchiveHabit(habit.id);
    if (habit.reminderTime && isNotificationsAvailable) {
      const granted = await requestNotificationPermission();
      if (granted) {
        const [h, m] = habit.reminderTime.split(":").map(Number);
        const newId = await scheduleHabitReminder(habit.name, h, m);
        if (newId) await setHabitNotificationId(habit.id, newId);
      }
    }
  };

  const deletePermanentlyWithCleanup = async (habit: Habit) => {
    if (habit.notificationId) {
      await cancelReminder(habit.notificationId);
    }
    await deleteHabitPermanently(habit.id);
  };

  return { archiveWithCleanup, unarchiveWithReschedule, deletePermanentlyWithCleanup };
}
