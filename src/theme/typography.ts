import { Platform } from 'react-native';

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
 * Typography dibuat sebagai FUNGSI (bukan konstanta statis) karena warna
 * teksnya (textPrimary/textSecondary) berubah tergantung light/dark theme.
 * Dipanggil dari dalam useTheme() supaya reaktif ikut tema device.
 */
export function buildTypography(textPrimary: string, textSecondary: string) {
  return {
    display: {
      fontFamily,
      fontSize: 34,
      fontWeight: '700' as const,
      color: textPrimary,
      letterSpacing: -0.5,
    },
    title: {
      fontFamily: fontFamilyMedium,
      fontSize: 22,
      fontWeight: '700' as const,
      color: textPrimary,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontFamily: fontFamilyMedium,
      fontSize: 17,
      fontWeight: '600' as const,
      color: textPrimary,
    },
    body: {
      fontFamily,
      fontSize: 15,
      fontWeight: '400' as const,
      color: textPrimary,
    },
    caption: {
      fontFamily,
      fontSize: 13,
      fontWeight: '400' as const,
      color: textSecondary,
    },
    label: {
      fontFamily: fontFamilyMedium,
      fontSize: 12,
      fontWeight: '600' as const,
      color: textSecondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
    },
    amount: {
      fontFamily: fontFamilyMedium,
      fontSize: 28,
      fontWeight: '700' as const,
      color: textPrimary,
      letterSpacing: -0.5,
    },
  };
}

export type Typography = ReturnType<typeof buildTypography>;