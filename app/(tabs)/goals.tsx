import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "../../src/components/EmptyState";
import { Chip } from "../../src/components/Chip";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MARGIN,
} from "../../src/components/FloatingTabBar";
import { GlassCard } from "../../src/components/GlassCard";
import { GoalCard } from "../../src/components/GoalCard";
import { ReminderSheet } from "../../src/components/ReminderSheet";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { radius, spacing } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/useTheme";
import type { Goal } from "../../src/types";
import { clampPercent, formatIDR } from "../../src/utils/currency";

type SortOption = "newest" | "closest" | "az";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "newest", label: "Terbaru" },
  { key: "closest", label: "Terdekat" },
  { key: "az", label: "A-Z" },
];

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const goals = useGoalsStore((state) => state.goals);

  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [reminderSheetOpen, setReminderSheetOpen] = useState(false);

  const totalSaved = useMemo(
    () => goals.reduce((sum, g) => sum + g.currentAmount, 0),
    [goals],
  );
  const totalTarget = useMemo(
    () => goals.reduce((sum, g) => sum + g.targetAmount, 0),
    [goals],
  );

  const displayedGoals = useMemo(() => {
    let list = [...goals];

    if (showCompletedOnly) {
      list = list.filter(
        (g) => clampPercent(g.currentAmount, g.targetAmount) >= 1,
      );
    }

    switch (sortOption) {
      case "closest":
        list.sort(
          (a, b) =>
            clampPercent(b.currentAmount, b.targetAmount) -
            clampPercent(a.currentAmount, a.targetAmount),
        );
        break;
      case "az":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  }, [goals, sortOption, showCompletedOnly]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: spacing.lg,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.md,
        },
        headerTitle: {
          ...typography.display,
          fontSize: 28,
          marginTop: 2,
        },
        headerButtons: {
          flexDirection: "row",
          gap: spacing.sm,
        },
        iconButton: {
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
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
        androidChipRow: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        androidChipDivider: {
          width: 1,
          height: 20,
          backgroundColor: colors.glassBorder,
          marginHorizontal: spacing.xs,
        },
        listContent: {
          paddingBottom:
            insets.bottom +
            FLOATING_TAB_BAR_MARGIN +
            FLOATING_TAB_BAR_HEIGHT +
            spacing.lg,
        },
      }),
    [colors, typography, insets.bottom],
  );

  return (
    <View
      key={isDark ? "dark" : "light"}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={typography.caption}>Total tabungan</Text>
          <Text style={styles.headerTitle}>Tabungan-ku</Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => setReminderSheetOpen(true)}
            style={styles.iconButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Pengaturan pengingat menabung"
            android_ripple={{ color: colors.glassBorder, borderless: false }}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </Pressable>
        </View>
      </View>

      <GlassCard
        tintColor={colors.glassTintLavender}
        elevationLevel="level2"
        style={styles.summaryCard}
      >
        <Text style={styles.summaryAmount}>{formatIDR(totalSaved)}</Text>
        <Text style={styles.summaryTarget}>
          dari total target {formatIDR(totalTarget)} • {goals.length} goal
        </Text>
      </GlassCard>

      {goals.length > 0 && (
        <View style={styles.androidChipRow}>
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.key}
              label={option.label}
              selected={sortOption === option.key}
              onPress={() => setSortOption(option.key)}
              accessibilityLabel={`Urutkan berdasarkan ${option.label}`}
            />
          ))}
          <View style={styles.androidChipDivider} />
          <Chip
            label="Selesai"
            selected={showCompletedOnly}
            onPress={() => setShowCompletedOnly((prev) => !prev)}
            accessibilityLabel="Filter goal yang sudah selesai"
          />
        </View>
      )}

      <FlatList<Goal>
        data={displayedGoals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onPress={() => router.push(`/goal/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji={showCompletedOnly ? "🎉" : "🫙"}
            title={
              showCompletedOnly
                ? "Belum ada goal yang selesai"
                : "Belum ada goal tabungan"
            }
            description={
              showCompletedOnly
                ? "Terus nabung sampai salah satu goal-mu mencapai 100%."
                : "Tap tombol + di kanan bawah buat mulai nabung untuk wishlist pertamamu."
            }
          />
        }
      />

      <ReminderSheet
        visible={reminderSheetOpen}
        onClose={() => setReminderSheetOpen(false)}
      />
    </View>
  );
}