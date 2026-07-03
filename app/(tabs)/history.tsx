import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { useGoalsStore } from '../../src/store/useGoalsStore';
import { GlassCard } from '../../src/components/GlassCard';
import { TransactionRow } from '../../src/components/TransactionRow';
import { EmptyState } from '../../src/components/EmptyState';
import type { Transaction } from '../../src/types';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const transactions = useGoalsStore((state) => state.transactions);
  const goals = useGoalsStore((state) => state.goals);
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.createdAt - a.createdAt),
    [transactions]
  );

  const goalNameById = useMemo(() => {
    const map: Record<string, string> = {};
    goals.forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [goals]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.headerTitle}>History</Text>
      <Text style={typography.caption}>Semua transaksi dari seluruh goal-mu</Text>

      <FlatList<Transaction>
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <GlassCard style={styles.rowCard}>
            <TransactionRow transaction={item} goalName={goalNameById[item.goalId] ?? 'Goal terhapus'} />
          </GlassCard>
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="📭"
            title="Belum ada transaksi"
            description="Riwayat menabung & menarik tabungan bakal muncul di sini."
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
    headerTitle: {
      ...typography.display,
      fontSize: 28,
      marginTop: 2,
    },
    listContent: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    rowCard: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
  });
}
