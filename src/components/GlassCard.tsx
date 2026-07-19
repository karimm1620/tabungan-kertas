import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useMemo } from "react";
import { Platform, StyleSheet, View, ViewProps } from "react-native";
import { radius } from "../theme/colors";
import { m3ElevationStyle, M3ElevationKey } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";

interface GlassCardProps extends ViewProps {
  /** Tint pastel opsional untuk membedakan card (default: colors.glassTintLight dari tema aktif) */
  tintColor?: string;
  radiusSize?: number;
  /** Android only — level elevation M3 (default: level1). Diabaikan di iOS. */
  elevationLevel?: M3ElevationKey;
}

/**
 * GlassCard — elemen signature aplikasi ini, tapi arti "signature"-nya beda
 * per platform (lihat ui-registry.md bagian Platform Architecture):
 * iOS 26+   -> native Liquid Glass (expo-glass-effect)
 * iOS <26   -> native BlurView (UIVisualEffectView), tint ikut light/dark
 * Android   -> M3 elevated surface asli: warna tonal dinamis + native
 *              elevation shadow, TANPA border/translucent-hack. (Blur asli
 *              di Android butuh BlurTargetView + ref per-screen dan punya
 *              known issues di dalam Modal — makanya Android sengaja gak
 *              coba niru "glass", tapi malah full commit ke bahasa M3
 *              sendiri: elevation, bukan blur.)
 */
export function GlassCard({
  style,
  tintColor,
  radiusSize = radius.lg,
  elevationLevel = "level1",
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

  /**
   * Android TIDAK pakai border+translucent (itu hack buat menyiasati gak
   * adanya blur asli). M3 surface yang "naik" ditandai lewat ELEVATION asli
   * (shadow native), bukan outline — outlined card itu varian M3 yang beda,
   * dipakai sengaja kalau nanti dibutuhkan, bukan default.
   */
  const androidStyle = useMemo(
    () => [
      styles.androidBase,
      m3ElevationStyle(elevationLevel),
      {
        borderRadius: radiusSize,
        backgroundColor: resolvedTint,
      },
      style,
    ],
    [style, resolvedTint, radiusSize, elevationLevel],
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

  if (Platform.OS === "android") {
    return (
      <View style={androidStyle} {...rest}>
        {children}
      </View>
    );
  }

  // Fallback platform lain (web, dsb) — pakai gaya lama (border+translucent)
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
  androidBase: {
    overflow: "hidden",
  },
});