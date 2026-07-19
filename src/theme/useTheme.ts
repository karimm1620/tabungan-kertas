import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { financialColors, ThemeColors } from './colors';
import { useMaterial3Palette, mapMaterial3ToThemeColors } from './material3/colors';
import { buildMaterial3Typography, Typography } from './material3/typography';
import type { Material3Scheme } from '@pchmn/expo-material3-theme';

export interface AppTheme {
  colors: ThemeColors;
  typography: Typography;
  isDark: boolean;
  material3: Material3Scheme;
}

/**
 * App ini Android-only — gak ada lagi cabang Platform.OS di sini (lihat
 * ui-registry.md Checkpoint 0). `material3` sekarang SELALU ada, gak
 * optional lagi — komponen yang sebelumnya pakai `material3?.x ?? fallback`
 * bisa disederhanakan jadi `material3.x` langsung.
 */
export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const { scheme: material3Scheme } = useMaterial3Palette(isDark);
  const keep = isDark ? financialColors.dark : financialColors.light;

  const colors = useMemo<ThemeColors>(
    () => mapMaterial3ToThemeColors(material3Scheme, keep, isDark),
    [material3Scheme, keep, isDark],
  );

  const typography = useMemo<Typography>(
    () => buildMaterial3Typography(colors.textPrimary, colors.textSecondary),
    [colors],
  );

  return { colors, typography, isDark, material3: material3Scheme };
}