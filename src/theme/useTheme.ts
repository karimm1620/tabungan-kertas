import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { lightColors, darkColors, ThemeColors } from './colors';
import { buildTypography, Typography } from './typography';

export interface AppTheme {
  colors: ThemeColors;
  typography: Typography;
  isDark: boolean;
}

/**
 * Hook tema utama app ini. `useColorScheme()` dari react-native otomatis
 * subscribe ke perubahan Appearance OS — jadi kalau device pindah ke
 * dark/light mode, semua komponen yang pakai hook ini re-render otomatis
 * tanpa perlu restart app.
 */
export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const typography = useMemo(
    () => buildTypography(colors.textPrimary, colors.textSecondary),
    [colors]
  );

  return { colors, typography, isDark };
}