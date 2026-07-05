import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useMemo } from "react";
import { Platform, StyleSheet, View, ViewProps } from "react-native";
import { radius } from "../theme/colors";
import { useTheme } from "../theme/useTheme";

interface GlassCardProps extends ViewProps {
  /** Tint pastel opsional untuk membedakan card (default: colors.glassTintLight dari tema aktif) */
  tintColor?: string;
  radiusSize?: number;
}

/**
 * GlassCard — elemen signature aplikasi ini.
 * iOS 26+   -> native Liquid Glass (expo-glass-effect)
 * iOS <26   -> native BlurView (UIVisualEffectView), tint ikut light/dark
 * Android   -> semi-transparent tinted view (blur asli di Android butuh
 *              BlurTargetView + ref per-screen dan punya known issues di
 *              dalam Modal, jadi sengaja tidak dipakai demi stabilitas)
 */
export function GlassCard({
  style,
  tintColor,
  radiusSize = radius.lg,
  children,
  ...rest
}: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const useNativeGlass = Platform.OS === "ios" && isLiquidGlassAvailable();
  const resolvedTint = tintColor ?? colors.glassTintLight;

  const baseStyle = useMemo(
    () => [
      styles.base,
      {
        borderRadius: radiusSize,
        backgroundColor: resolvedTint,
        borderColor: colors.glassBorder,
      },
      style,
    ],
    [style, resolvedTint, radiusSize, colors.glassBorder],
  );

  if (useNativeGlass) {
    return (
      <GlassView style={baseStyle} glassEffectStyle="regular" {...rest}>
        {children}
      </GlassView>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={55}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.base,
          { borderRadius: radiusSize, borderColor: colors.glassBorder },
          style,
        ]}
        {...rest}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: resolvedTint, borderRadius: radiusSize },
          ]}
        />
        {children}
      </BlurView>
    );
  }

  // Android & fallback lain
  return (
    <View style={baseStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    borderWidth: 1,
  },
});
