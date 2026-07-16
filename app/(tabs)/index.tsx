import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "../../src/components/EmptyState";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MARGIN,
} from "../../src/components/FloatingTabBar";
import { GlassCard } from "../../src/components/GlassCard";
import { GoalCard } from "../../src/components/GoalCard";
import { ReminderSheet } from "../../src/components/ReminderSheet";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { accentByKey, radius, spacing } from "../../src/theme/colors";
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
        },
        addButton: {
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: accentByKey.lavender.deep,
          alignItems: "center",
          justifyContent: "center",
        },
        addButtonText: {
          color: colors.textInverse,
          fontSize: 24,
          fontWeight: "600",
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
        controlsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        segmentedControl: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceMuted,
          padding: 3,
        },
        segment: {
          flex: 1,
          height: "100%",
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
        },
        segmentActive: {
          backgroundColor: accentByKey.lavender.base,
        },
        segmentText: {
          ...typography.caption,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        segmentTextActive: {
          color: colors.textPrimary,
        },
        filterChip: {
          height: 40,
          paddingHorizontal: spacing.md,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
          borderColor: "transparent",
        },
        filterChipActive: {
          borderColor: accentByKey.lavender.deep,
          backgroundColor: accentByKey.lavender.base,
        },
        filterChipText: {
          ...typography.caption,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        filterChipTextActive: {
          color: colors.textPrimary,
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
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/goal/add")}
            style={styles.addButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Tambah goal tabungan baru"
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <GlassCard
        tintColor={colors.glassTintLavender}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryAmount}>{formatIDR(totalSaved)}</Text>
        <Text style={styles.summaryTarget}>
          dari total target {formatIDR(totalTarget)} • {goals.length} goal
        </Text>
      </GlassCard>

      {goals.length > 0 && (
        <View style={styles.controlsRow}>
          <View style={styles.segmentedControl}>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortOption === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setSortOption(option.key)}
                  style={[styles.segment, isActive && styles.segmentActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Urutkan berdasarkan ${option.label}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      isActive && styles.segmentTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => setShowCompletedOnly((prev) => !prev)}
            style={[
              styles.filterChip,
              showCompletedOnly && styles.filterChipActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Filter goal yang sudah selesai"
            accessibilityState={{ selected: showCompletedOnly }}
          >
            <Text
              style={[
                styles.filterChipText,
                showCompletedOnly && styles.filterChipTextActive,
              ]}
              numberOfLines={1}
            >
              Selesai
            </Text>
          </Pressable>
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
                : "Tap tombol + di pojok atas buat mulai nabung untuk wishlist pertamamu."
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
