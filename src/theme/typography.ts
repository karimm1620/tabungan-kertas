import { Platform } from 'react-native';
import type { ThemeColors } from './colors';

/**
 * Sengaja pakai system font (San Francisco di iOS, Roboto di Android)
 * dibanding custom font — sesuai brief "UI yang simple", lebih ringan,
 * dan native feel di masing-masing platform.
 */
const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

/**
 * Typography dibuat sebagai factory function (bukan objek statis) karena
 * warnanya harus ikut berubah sesuai tema aktif (light/dark). Dipanggil
 * lewat useTheme() di dalam komponen, bukan di-import langsung.
 */
export function createTypography(colors: ThemeColors) {
  return {
    display: {
      fontFamily,
      fontSize: 34,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    title: {
      fontFamily: fontFamilyMedium,
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontFamily: fontFamilyMedium,
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    body: {
      fontFamily,
      fontSize: 15,
      fontWeight: '400' as const,
      color: colors.textPrimary,
    },
    caption: {
      fontFamily,
      fontSize: 13,
      fontWeight: '400' as const,
      color: colors.textSecondary,
    },
    label: {
      fontFamily: fontFamilyMedium,
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
    },
    amount: {
      fontFamily: fontFamilyMedium,
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
  };
}

export type Typography = ReturnType<typeof createTypography>;
