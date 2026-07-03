/**
 * Design tokens — palet pastel untuk Saving Tracker.
 * Konsep: "jar tabungan" tenang & lembut, dengan aksen kaca (glass)
 * yang menegaskan metafora "melihat isi tabungan lewat kaca".
 *
 * Ada 2 palet: lightColors & darkColors. Aksen (mint/peach/lavender/rose/sky)
 * sengaja SAMA di kedua tema — pastel tetap enak dilihat di background gelap,
 * dan menjaga identitas visual konsisten antara mode terang & gelap.
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;

  glassTintLight: string;
  glassTintAccent: string;
  glassBorder: string;

  mint: string;
  mintDeep: string;
  peach: string;
  peachDeep: string;
  lavender: string;
  lavenderDeep: string;
  rose: string;
  roseDeep: string;
  sky: string;
  skyDeep: string;

  deposit: string;
  withdraw: string;

  textPrimary: string;
  textSecondary: string;
  textInverse: string;

  danger: string;
  overlayScrim: string;
}

export const lightColors: ThemeColors = {
  background: '#F6F4FB',
  surface: '#FFFFFF',
  surfaceMuted: '#FBFAFE',

  glassTintLight: 'rgba(255,255,255,0.6)',
  glassTintAccent: 'rgba(217,201,242,0.35)',
  glassBorder: 'rgba(58,53,80,0.08)',

  mint: '#BFE8DA',
  mintDeep: '#6FBFA6',
  peach: '#FFD9C2',
  peachDeep: '#F2A374',
  lavender: '#D9C9F2',
  lavenderDeep: '#A985E0',
  rose: '#FFCBDA',
  roseDeep: '#EE7FA0',
  sky: '#C6E3F7',
  skyDeep: '#6FAEDE',

  deposit: '#6FBFA6',
  withdraw: '#EE7FA0',

  textPrimary: '#332E4A',
  textSecondary: '#8B84A0',
  textInverse: '#FFFFFF',

  danger: '#E8607F',
  overlayScrim: 'rgba(51,46,74,0.35)',
};

export const darkColors: ThemeColors = {
  background: '#18151F',
  surface: '#231F2E',
  surfaceMuted: '#2A2536',

  glassTintLight: 'rgba(255,255,255,0.08)',
  glassTintAccent: 'rgba(217,201,242,0.10)',
  glassBorder: 'rgba(255,255,255,0.10)',

  mint: '#BFE8DA',
  mintDeep: '#6FBFA6',
  peach: '#FFD9C2',
  peachDeep: '#F2A374',
  lavender: '#D9C9F2',
  lavenderDeep: '#A985E0',
  rose: '#FFCBDA',
  roseDeep: '#EE7FA0',
  sky: '#C6E3F7',
  skyDeep: '#6FAEDE',

  deposit: '#7FD1B8',
  withdraw: '#F591A8',

  textPrimary: '#F1EEF7',
  textSecondary: '#A79FBE',
  textInverse: '#FFFFFF',

  danger: '#F17A9B',
  overlayScrim: 'rgba(0,0,0,0.55)',
};

// --- Aksen per goal — theme-agnostic, sama di light & dark ---

export type AccentKey = 'mint' | 'peach' | 'lavender' | 'rose' | 'sky';

export const accentByKey: Record<AccentKey, { base: string; deep: string }> = {
  mint: { base: lightColors.mint, deep: lightColors.mintDeep },
  peach: { base: lightColors.peach, deep: lightColors.peachDeep },
  lavender: { base: lightColors.lavender, deep: lightColors.lavenderDeep },
  rose: { base: lightColors.rose, deep: lightColors.roseDeep },
  sky: { base: lightColors.sky, deep: lightColors.skyDeep },
};

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
