import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { radius, spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";

export type HabitIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

/**
 * ~24 ikon habit-relevant, dikurasi manual dan diverifikasi SATU-SATU ada di
 * glyph map MaterialCommunityIcons yang ke-bundle (bukan ditebak dari
 * ingatan) — cakupan: kesehatan & fitness, mindfulness, belajar/produktif,
 * kreatif/hobi, lifestyle. SENGAJA gak ada free-form icon search — tap-to-
 * pick doang dari grid ini, biar konsisten visual antar habit.
 */
export const HABIT_ICON_OPTIONS: HabitIconName[] = [
  "water",
  "pill",
  "run",
  "dumbbell",
  "meditation",
  "sleep",
  "food-apple",
  "book-open-page-variant",
  "walk",
  "yoga",
  "toothbrush",
  "shower",
  "coffee",
  "pencil",
  "laptop",
  "guitar-acoustic",
  "palette",
  "piggy-bank",
  "translate",
  "brain",
  "heart-pulse",
  "smoking-off",
  "leaf",
  "spa",
];

interface HabitIconPickerProps {
  selected: string;
  /** Warna habit yang lagi dipilih — dipakai buat tint ikon yang aktif. */
  color: string;
  onSelect: (icon: HabitIconName) => void;
}

export function HabitIconPicker({
  selected,
  color,
  onSelect,
}: HabitIconPickerProps) {
  const { colors, material3 } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          paddingVertical: spacing.xs,
        },
        item: {
          width: 48,
          height: 48,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1.5,
          borderColor: "transparent",
          overflow: "hidden",
        },
        itemActive: {
          borderColor: material3.primary,
        },
      }),
    [colors, material3],
  );

  return (
    <View style={styles.container}>
      {HABIT_ICON_OPTIONS.map((icon) => {
        const isActive = icon === selected;
        return (
          <Pressable
            key={icon}
            onPress={() => onSelect(icon)}
            style={[
              styles.item,
              isActive && [styles.itemActive, { backgroundColor: `${color}26` }],
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Pilih ikon ${icon}`}
            accessibilityState={{ selected: isActive }}
            android_ripple={{ color: colors.glassBorder }}
          >
            <MaterialCommunityIcons
              name={icon}
              size={22}
              color={isActive ? color : colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
