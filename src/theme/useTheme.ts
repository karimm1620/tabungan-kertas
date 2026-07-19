import { Platform, useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { lightColors, darkColors, ThemeColors } from './colors';
import { buildTypography, Typography } from './typography';
import { useMaterial3Palette, mapMaterial3ToThemeColors } from './material3/colors';
import { buildMaterial3Typography } from './material3/typography';
import type { Material3Scheme } from '@pchmn/expo-material3-theme';

export interface AppTheme {
  colors: ThemeColors;
  typography: Typography;
  isDark: boolean;
  material3?: Material3Scheme;
}

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const isAndroid = Platform.OS === 'android';

  const { scheme: material3Scheme } = useMaterial3Palette(isDark);

  const baseColors = isDark ? darkColors : lightColors;

  const colors = useMemo<ThemeColors>(() => {
    if (!isAndroid) return baseColors;
    return mapMaterial3ToThemeColors(
      material3Scheme,
      { deposit: baseColors.deposit, withdraw: baseColors.withdraw },
      isDark,
    );
  }, [isAndroid, baseColors, material3Scheme, isDark]);

  const typography = useMemo<Typography>(() => {
    if (isAndroid) {
      return buildMaterial3Typography(colors.textPrimary, colors.textSecondary);
    }
    return buildTypography(colors.textPrimary, colors.textSecondary);
  }, [isAndroid, colors]);

  return {
    colors,
    typography,
    isDark,
    material3: isAndroid ? material3Scheme : undefined,
  };
}