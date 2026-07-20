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

/**
 * Bikin notification channel Android kalau belum ada (aman dipanggil
 * berkali-kali). Dipisah per-channel per-domain (savings vs habits) — biar
 * user bisa atur suara/getar/visibility masing-masing independen lewat
 * pengaturan notifikasi Android, dan biar "matiin notif tabungan" gak ikut
 * matiin reminder habit atau sebaliknya.
 */
async function ensureChannel(channelId: string, name: string) {
  if (!isNotificationsAvailable) return;
  try {
    await Notifications.setNotificationChannelAsync(channelId, {
      name,
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
    await ensureChannel('savings', 'Pengingat Menabung');
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Waktunya menabung! 🐷',
        body: 'Jangan lupa sisihkan sedikit uang buat goal tabunganmu hari ini.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: 'savings',
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

/**
 * Jadwalkan reminder harian buat SATU habit spesifik (nama habit muncul di
 * body notifikasi). Return identifier-nya (atau null kalau gagal) — WAJIB
 * disimpan (lewat `useHabitsStore.setHabitNotificationId`) supaya bisa
 * di-cancel lagi nanti (edit waktu, matiin reminder, archive, atau hapus).
 */
export async function scheduleHabitReminder(
  habitName: string,
  hour: number,
  minute: number,
): Promise<string | null> {
  if (!isNotificationsAvailable) return null;
  try {
    await ensureChannel('habits', 'Pengingat Habit');
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Waktunya "${habitName}" 💪`,
        body: 'Tap buat langsung tandai selesai di Today.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: 'habits',
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