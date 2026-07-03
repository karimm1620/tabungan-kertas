import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { radius, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

const EMOJI_OPTIONS = [
  '🎯', '💰', '🏠', '🚗', '✈️', '🎓', '💍', '📱',
  '💻', '🎮', '📷', '🚲', '⌚️', '👟', '🎸', '🏖️',
  '🐶', '👶', '🎁', '⛑️', '🛋️', '🧳', '🚀', '🌱',
];

interface EmojiPickerProps {
  selected?: string;
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {EMOJI_OPTIONS.map((emoji) => {
        const isActive = emoji === selected;
        return (
          <Pressable
            key={emoji}
            onPress={() => onSelect(emoji)}
            style={[styles.item, isActive && styles.itemActive]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      paddingVertical: spacing.xs,
      gap: spacing.sm,
    },
    item: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
      marginRight: spacing.sm,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    itemActive: {
      borderColor: colors.lavenderDeep,
      backgroundColor: colors.lavender,
    },
    emoji: {
      fontSize: 22,
    },
  });
}
