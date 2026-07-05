/**
 * Design tokens — palet pastel untuk Saving Tracker.
 * Dipecah jadi lightColors & darkColors supaya bisa dipakai reaktif
 * lewat hook useTheme() (lihat useTheme.ts) yang otomatis ngikutin
 * pengaturan tema device (useColorScheme).
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  glassTintLight: string;
  glassTintLavender: string;
  glassBorder: string;
  deposit: string;
  withdraw: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  danger: string;
  overlayScrim: string;
}

export const lightColors: ThemeColors = {
  background: '#F6F4FB', // lavender putih, latar utama
  surface: '#FFFFFF',
  surfaceMuted: '#FBFAFE',

  glassTintLight: 'rgba(255,255,255,0.55)',
  glassTintLavender: 'rgba(216,199,240,0.35)',
  glassBorder: 'rgba(58,53,80,0.08)',

  deposit: '#6FBFA6', // nabung = tenang, tumbuh
  withdraw: '#EE7FA0', // tarik = perlu perhatian, bukan alarm

  textPrimary: '#332E4A',
  textSecondary: '#8B84A0',
  textInverse: '#FFFFFF',

  danger: '#E8607F',
  overlayScrim: 'rgba(51,46,74,0.35)',
};

export const darkColors: ThemeColors = {
  background: '#17151F', // hitam kebiruan-ungu, bukan hitam pekat
  surface: '#211E2C',
  surfaceMuted: '#2A2636',

  glassTintLight: 'rgba(255,255,255,0.07)',
  glassTintLavender: 'rgba(180,160,220,0.14)',
  glassBorder: 'rgba(255,255,255,0.12)',

  deposit: '#7FD1B8',
  withdraw: '#F294B0',

  textPrimary: '#F4F2FA',
  textSecondary: '#A79FBF',
  textInverse: '#FFFFFF',

  danger: '#FF8FA8',
  overlayScrim: 'rgba(0,0,0,0.6)',
};

export type AccentKey = 'mint' | 'peach' | 'lavender' | 'rose' | 'sky';

export const accentByKey: Record<AccentKey, { base: string; deep: string }> = {
  mint: { base: '#BFE8DA', deep: '#6FBFA6' },
  peach: { base: '#FFD9C2', deep: '#F2A374' },
  lavender: { base: '#D9C9F2', deep: '#A985E0' },
  rose: { base: '#FFCBDA', deep: '#EE7FA0' },
  sky: { base: '#C6E3F7', deep: '#6FAEDE' },
};

/** Warna teks yang dipakai di atas chip/icon-wrap ber-background aksen pastel */
export const textOnAccent = '#332E4A';

const accentKeys = Object.keys(accentByKey) as AccentKey[];

/** Pilih AccentKey berdasarkan hash sederhana dari seed (id/nama) — konsisten tiap render */
export function pickAccentKey(seed: string): AccentKey {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return accentKeys[hash % accentKeys.length];
}

/** Lookup warna {base, deep} dari AccentKey yang tersimpan di data Goal */
export function getAccentColors(key: AccentKey): { base: string; deep: string } {
  return accentByKey[key] ?? accentByKey.mint;
}

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};