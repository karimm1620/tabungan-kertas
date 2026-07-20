import type { AccentKey } from '../theme/colors';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  imageUri?: string;
  emoji?: string;
  accent: AccentKey;
  createdAt: number;
}

export type TransactionType = 'deposit' | 'withdrawal';

export interface Transaction {
  id: string;
  goalId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  createdAt: number;
}

export interface CreateGoalInput {
  name: string;
  targetAmount: number;
  imageUri?: string;
  emoji?: string;
}

export type HabitFrequencyType = 'daily' | 'weekdays';

/**
 * Bitmask hari (Senin=bit0 ... Minggu=bit6, jam 12 malam waktu lokal device
 * yang jadi acuan, bukan UTC). `127` = semua hari (0b1111111). Cuma relevan
 * kalau `frequencyType === 'weekdays'` — kalau 'daily', field ini diabaikan
 * tapi tetap disimpan (default 127) buat konsistensi kalau user ganti mode.
 */
export type WeekdaysMask = number;

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequencyType: HabitFrequencyType;
  weekdaysMask: WeekdaysMask;
  /** Format "HH:mm" 24 jam, null = gak ada reminder */
  reminderTime: string | null;
  /** ID notifikasi terjadwal yang aktif (dari expo-notifications), null = gak ada yang lagi jalan */
  notificationId: string | null;
  bestStreak: number;
  createdAt: number;
  archivedAt: number | null;
}

export interface HabitLog {
  id: string;
  habitId: string;
  /** Format "YYYY-MM-DD", waktu lokal device */
  date: string;
  completedAt: number;
}

export interface CreateHabitInput {
  name: string;
  icon: string;
  color: string;
  frequencyType: HabitFrequencyType;
  weekdaysMask: WeekdaysMask;
  reminderTime: string | null;
}

export interface Todo {
  id: string;
  title: string;
  /** Format "YYYY-MM-DD", waktu lokal device */
  date: string;
  completedAt: number | null;
  createdAt: number;
}

export interface CreateTodoInput {
  title: string;
  date: string;
}

