import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { m3Shape } from "../theme/material3/tokens";
import { buildM3FullTypeScale } from "../theme/material3/typography";
import { useTheme } from "../theme/useTheme";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function Chip({ label, selected, onPress, accessibilityLabel }: ChipProps) {
  const { colors, material3 } = useTheme();
  const labelStyle = useMemo(
    () => buildM3FullTypeScale(colors.textPrimary, colors.textSecondary).labelLarge,
    [colors.textPrimary, colors.textSecondary],
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      android_ripple={{ color: material3?.onSecondaryContainer }}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? (material3?.secondaryContainer ?? colors.glassTintLavender)
            : "transparent",
          borderColor: selected ? "transparent" : (material3?.outline ?? colors.glassBorder),
        },
      ]}
    >
      <Text
        style={[
          labelStyle,
          {
            textTransform: "none",
            color: selected
              ? (material3?.onSecondaryContainer ?? colors.textPrimary)
              : colors.textSecondary,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: 11,
    borderRadius: m3Shape.small,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});