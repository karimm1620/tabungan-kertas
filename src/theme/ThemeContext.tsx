import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ThemeColors } from './colors';
import { createTypography, type Typography } from './typography';

interface ThemeContextValue {
  colors: ThemeColors;
  typography: Typography;
  isDark: boolean;
}

const defaultValue: ThemeContextValue = {
  colors: lightColors,
  typography: createTypography(lightColors),
  isDark: false,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme(); // 'light' | 'dark' | null | undefined
  const isDark = scheme === 'dark';

  const value = useMemo<ThemeContextValue>(() => {
    const colors = isDark ? darkColors : lightColors;
    return { colors, typography: createTypography(colors), isDark };
  }, [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
