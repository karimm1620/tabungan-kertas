import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { formatIDR } from '../../src/utils/currency';
import { useGoalsStore } from '../../src/store/useGoalsStore';
import { GoalCard } from '../../src/components/GoalCard';
import { GlassCard } from '../../src/components/GlassCard';
import { EmptyState } from '../../src/components/EmptyState';
import type { Goal } from '../../src/types';

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const goals = useGoalsStore((state) => state.goals);
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const totalSaved = useMemo(() => goals.reduce((sum, g) => sum + g.currentAmount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((sum, g) => sum + g.targetAmount, 0), [goals]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <View>
          <Text style={typography.caption}>Total tabungan</Text>
          <Text style={styles.headerTitle}>Tabungan-ku</Text>
        </View>
        <Pressable
          onPress={() => router.push('/goal/add')}
          style={styles.addButton}
          hitSlop={8}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <GlassCard tintColor={colors.glassTintAccent} style={styles.summaryCard}>
        <Text style={styles.summaryAmount}>{formatIDR(totalSaved)}</Text>
        <Text style={styles.summaryTarget}>
          dari total target {formatIDR(totalTarget)} • {goals.length} goal
        </Text>
      </GlassCard>

      <FlatList<Goal>
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <GoalCard goal={item} onPress={() => router.push(`/goal/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🫙"
            title="Belum ada goal tabungan"
            description="Tap tombol + di pojok atas buat mulai nabung untuk wishlist pertamamu."
          />
        }
      />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors'], typography: ReturnType<typeof useTheme>['typography']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    headerTitle: {
      ...typography.display,
      fontSize: 28,
      marginTop: 2,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.lavenderDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      color: colors.textInverse,
      fontSize: 24,
      fontWeight: '600',
      marginTop: -2,
    },
    summaryCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    summaryAmount: {
      ...typography.display,
    },
    summaryTarget: {
      ...typography.caption,
      marginTop: spacing.xs,
    },
    listContent: {
      paddingBottom: spacing.xxl,
    },
  });
}
