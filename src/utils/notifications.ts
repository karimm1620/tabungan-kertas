import * as Notifications from 'expo-notifications';

export let isNotificationsAvailable = true;

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  isNotificationsAvailable = false;
  console.warn(
    '[notifications] expo-notifications tidak tersedia di environment ini ' +
      '(kemungkinan Expo Go, tidak didukung sejak SDK 53). ' +
      'Fitur reminder butuh development build. Detail:',
    error
  );
}

async function ensureAndroidChannel() {
  if (!isNotificationsAvailable) return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pengingat Menabung',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch {
    isNotificationsAvailable = false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsAvailable) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  } catch {
    isNotificationsAvailable = false;
    return false;
  }
}

/**
 * Cek status izin SAAT INI tanpa memicu prompt sistem (beda dari
 * requestNotificationPermission yang bisa nampilin dialog OS).
 * Dipakai buat re-check tiap kali ReminderSheet dibuka.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (!isNotificationsAvailable) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    return current.granted;
  } catch {
    return false;
  }
}

/** Jadwalkan reminder harian pada jam:menit tertentu, return identifier-nya (atau null kalau gagal) */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<string | null> {
  if (!isNotificationsAvailable) return null;
  try {
    await ensureAndroidChannel();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Waktunya menabung! 🐷',
        body: 'Jangan lupa sisihkan sedikit uang buat goal tabunganmu hari ini.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch {
    isNotificationsAvailable = false;
    return null;
  }
}

export async function cancelReminder(notificationId: string | null) {
  if (!notificationId || !isNotificationsAvailable) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Aman diabaikan — mungkin id sudah tidak valid
  }
}