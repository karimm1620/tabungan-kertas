import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  reminderNotificationId: string | null;
  setReminder: (enabled: boolean, hour: number, minute: number, notificationId: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      reminderEnabled: false,
      reminderHour: 20,
      reminderMinute: 0,
      reminderNotificationId: null,
      setReminder: (enabled, hour, minute, notificationId) =>
        set({
          reminderEnabled: enabled,
          reminderHour: hour,
          reminderMinute: minute,
          reminderNotificationId: notificationId,
        }),
    }),
    {
      name: 'saving-tracker-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);