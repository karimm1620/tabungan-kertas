import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { spacing } from "../theme/colors";
import { m3Shape } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";

/**
 * Palet warna khusus habit — SENGAJA beda dari `accentByKey` (pastel, dipakai
 * goal tabungan). Habit butuh warna lebih vivid/saturated karena dipakai
 * juga buat mewarnai cell heatmap konsistensi (`habit/[id].tsx`) — pastel
 * gampang gak keliatan bedanya pas cell-nya kecil.
 */
export const HABIT_COLOR_OPTIONS = [
  "#EF5350", // merah
  "#FF9800", // oranye
  "#FBC02D", // kuning
  "#66BB6A", // hijau
  "#26A69A", // teal
  "#29B6F6", // biru muda
  "#5C6BC0", // indigo
  "#AB47BC", // ungu
  "#EC407A", // pink
  "#8D6E63", // coklat
];

interface HabitColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

export function HabitColorPicker({
  selected,
  onSelect,
}: HabitColorPickerProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          paddingVertical: spacing.xs,
        },
        swatch: {
          width: 36,
          height: 36,
          borderRadius: m3Shape.full,
          borderWidth: 3,
          borderColor: "transparent",
        },
        swatchActive: {
          borderColor: colors.textPrimary,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      {HABIT_COLOR_OPTIONS.map((color) => {
        const isActive = color === selected;
        return (
          <Pressable
            key={color}
            onPress={() => onSelect(color)}
            style={[
              styles.swatch,
              { backgroundColor: color },
              isActive && styles.swatchActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Pilih warna ${color}`}
            accessibilityState={{ selected: isActive }}
            hitSlop={4}
          />
        );
      })}
    </View>
  );
}
