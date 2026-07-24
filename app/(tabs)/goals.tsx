import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Chip } from "../../src/components/Chip";
import { EmptyState } from "../../src/components/EmptyState";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MARGIN,
} from "../../src/components/FloatingTabBar";
import { GlassCard } from "../../src/components/GlassCard";
import { GoalCard } from "../../src/components/GoalCard";
import { useDragReorder } from "../../src/hooks/useDragReorder";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { spacing } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/useTheme";
import type { Goal } from "../../src/types";
import { clampPercent, formatIDR } from "../../src/utils/currency";

type SortOption = "newest" | "closest" | "az";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "newest", label: "Terbaru" },
  { key: "closest", label: "Terdekat" },
  { key: "az", label: "A-Z" },
];

const DEFAULT_ROW_HEIGHT = 112;

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const goals = useGoalsStore((state) => state.goals);
  const reorderGoals = useGoalsStore((state) => state.reorderGoals);

  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);

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
        // TETAP ikutin urutan `sort_order` dari store (hasil drag-reorder
        // manual) — SENGAJA gak di-re-sort berdasarkan createdAt lagi kayak
        // dulu, karena drag-reorder butuh urutan yang keliatan gak dioprek
        // ulang di sini.
        break;
    }

    return list;
  }, [goals, sortOption, showCompletedOnly]);

  // Drag-reorder cuma masuk akal kalau list lagi nunjukin urutan "asli"
  // (bukan hasil re-sort Terdekat/A-Z, bukan lagi difilter Selesai) — di
  // mode lain handle-nya disembunyiin biar gak ambigu urutan mana yang
  // sebenarnya ke-persist.
  const canReorder = sortOption === "newest" && !showCompletedOnly;

  const { order, draggingKey, dragY, getHandlePanResponder } = useDragReorder<Goal>({
    items: displayedGoals,
    keyExtractor: (g) => g.id,
    itemHeight: rowHeight,
    onReorderCommit: (newOrder) => void reorderGoals(newOrder),
  });

  const listToRender = canReorder ? order : displayedGoals;

  const styles = useMemo(
    () => createStyles(colors, typography, insets.bottom),
    [colors, typography, insets.bottom],
  );

  return (
    <View
      key={isDark ? "dark" : "light"}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={draggingKey === null}
      >
        <View style={styles.header}>
          <View>
            <Text style={typography.caption}>Total tabungan</Text>
            <Text style={styles.headerTitle}>Tabungan-ku</Text>
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

        {listToRender.length === 0 ? (
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
        ) : (
          listToRender.map((item) => {
            const isDragging = draggingKey === item.id;
            return (
              <Animated.View
                key={item.id}
                onLayout={(e) => setRowHeight(e.nativeEvent.layout.height)}
                style={[
                  styles.row,
                  isDragging && {
                    transform: [{ translateY: dragY }, { scale: 1.03 }],
                    zIndex: 10,
                    elevation: 8,
                    opacity: 0.96,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <GoalCard
                    goal={item}
                    onPress={() => router.push(`/goal/${item.id}`)}
                  />
                </View>
                {canReorder && (
                  <View
                    {...getHandlePanResponder(item).panHandlers}
                    style={styles.dragHandle}
                    hitSlop={8}
                    accessibilityRole="adjustable"
                    accessibilityLabel={`Geser buat urutan ulang ${item.name}`}
                  >
                    <MaterialCommunityIcons
                      name="drag-vertical"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </View>
                )}
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  insetBottom: number,
) {
  return StyleSheet.create({
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
        insetBottom + FLOATING_TAB_BAR_MARGIN + FLOATING_TAB_BAR_HEIGHT + spacing.lg,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    dragHandle: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
