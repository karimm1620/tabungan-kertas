import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
}

export function EmptyState({ emoji, title, description }: EmptyStateProps) {
  const { typography } = useTheme();
  const styles = useMemo(() => createStyles(typography), [typography]);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

function createStyles(typography: ReturnType<typeof useTheme>['typography']) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
    },
    emoji: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.subtitle,
      textAlign: 'center',
    },
    description: {
      ...typography.caption,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });
}
