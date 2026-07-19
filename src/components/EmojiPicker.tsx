import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { accentByKey, radius, spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";

const EMOJI_OPTIONS = [
  "🎯",
  "💰",
  "🏠",
  "🧳",
  "🚗",
  "🎓",
  "💍",
  "📱",
  "💻",
  "🎮",
  "📷",
  "🚲",
  "⌚️",
  "👟",
  "🎸",
  "🏖️",
  "🐶",
  "👶",
  "🎁",
  "⛑️",
  "🛋️",
  "✈️",
  "🌱",
];

interface EmojiPickerProps {
  selected?: string;
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  const { colors, material3 } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: spacing.xs,
          gap: spacing.sm,
        },
        item: {
          width: 48,
          height: 48,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceMuted,
          marginRight: spacing.sm,
          borderWidth: 1.5,
          borderColor: "transparent",
          overflow: "hidden",
        },
        itemActive: {
          borderColor:
            Platform.OS === "android"
              ? (material3?.primary ?? accentByKey.lavender.deep)
              : accentByKey.lavender.deep,
          backgroundColor:
            Platform.OS === "android"
              ? (material3?.secondaryContainer ?? accentByKey.lavender.base)
              : accentByKey.lavender.base,
        },
        emoji: {
          fontSize: 22,
        },
      }),
    [colors, material3],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {EMOJI_OPTIONS.map((emoji) => {
        const isActive = emoji === selected;
        return (
          <Pressable
            key={emoji}
            onPress={() => onSelect(emoji)}
            style={[styles.item, isActive && styles.itemActive]}
            accessibilityRole="button"
            accessibilityLabel={`Pilih ikon ${emoji}`}
            accessibilityState={{ selected: isActive }}
            android_ripple={{ color: colors.glassBorder }}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
