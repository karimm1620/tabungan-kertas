import React, { useMemo } from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { radius } from "../theme/colors";
import { m3ElevationStyle, M3ElevationKey } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";

interface GlassCardProps extends ViewProps {
  /** Tint pastel opsional untuk membedakan card (default: colors.glassTintLight dari tema aktif) */
  tintColor?: string;
  radiusSize?: number;
  /** Level elevation M3 (default: level1). */
  elevationLevel?: M3ElevationKey;
}

/**
 * GlassCard — satu-satunya komponen "surface" di app ini. M3 elevated
 * surface asli: warna tonal dinamis (Material You) + native elevation
 * shadow, TANPA border/translucent-hack (itu peninggalan gaya iOS Liquid
 * Glass — dihapus di Checkpoint 0, lihat ui-registry.md).
 */
export function GlassCard({
  style,
  tintColor,
  radiusSize = radius.lg,
  elevationLevel = "level1",
  children,
  ...rest
}: GlassCardProps) {
  const { colors } = useTheme();
  const resolvedTint = tintColor ?? colors.glassTintLight;

  const androidStyle = useMemo(
    () => [
      styles.base,
      m3ElevationStyle(elevationLevel),
      {
        borderRadius: radiusSize,
        backgroundColor: resolvedTint,
      },
      style,
    ],
    [style, resolvedTint, radiusSize, elevationLevel],
  );

  return (
    <View style={androidStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});