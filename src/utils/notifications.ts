import * as Notifications from 'expo-notifications';

export let isNotificationsAvailable = true;

/**
 * Warna aksen brand (`accentByKey.lavender.deep` di `theme/colors.ts`) —
 * dipakai konsisten di notification icon (lihat `app.json` plugin config)
 * DAN per-notifikasi (`content.color`), biar rendering-nya konsisten di
 * semua versi/skin Android, bukan cuma ngandelin default plugin.
 */
const NOTIFICATION_ACCENT_COLOR = '#A985E0';

/**
 * ⚠️ Grouped notifications (spec asli minta ini): dicek langsung ke
 * `.d.ts` yang ke-bundle — `NotificationContentInput` versi ini GAK
 * punya field `groupKey`/`groupSummary` (API native Android
 * `setGroup`/`setGroupSummary` belum di-expose expo-notifications versi
 * ini). Jadi grouping eksplisit gak bisa diimplementasi sekarang — yang
 * dipakai sebagai gantinya: 3 channel terpisah per-domain (savings/habits/
 * planner), yang bikin Android otomatis ngelompokkin secara visual per-app
 * + per-channel di notification shade (walau bukan grouping penuh dengan
 * summary notification kayak native API).
 */

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
 * berkali-kali). Dipisah per-channel per-domain (savings/habits/planner) —
 * biar user bisa atur suara/getar/visibility masing-masing independen lewat
 * pengaturan notifikasi Android, dan biar "matiin notif tabungan" gak ikut
 * matiin reminder habit/tugas atau sebaliknya.
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

export type ReminderDomain = 'savings' | 'planner';

const REMINDER_COPY: Record<
  ReminderDomain,
  { channelId: string; channelName: string; title: string; body: string }
> = {
  savings: {
    channelId: 'savings',
    channelName: 'Pengingat Menabung',
    title: 'Waktunya menabung! 🐷',
    body: 'Jangan lupa sisihkan sedikit uang buat goal tabunganmu hari ini.',
  },
  planner: {
    channelId: 'planner',
    channelName: 'Pengingat Tugas',
    title: 'Cek tugas hari ini 📝',
    body: 'Buka Today buat lihat apa aja yang masih perlu diselesaikan.',
  },
};

/** Jadwalkan reminder harian buat domain savings ATAU planner, return identifier-nya (atau null kalau gagal) */
export async function scheduleReminder(
  domain: ReminderDomain,
  hour: number,
  minute: number,
): Promise<string | null> {
  if (!isNotificationsAvailable) return null;
  const copy = REMINDER_COPY[domain];
  try {
    await ensureChannel(copy.channelId, copy.channelName);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        sound: 'default',
        color: NOTIFICATION_ACCENT_COLOR,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: copy.channelId,
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
        color: NOTIFICATION_ACCENT_COLOR,
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