import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../../src/components/AppAlert";
import { GlassCard } from "../../src/components/GlassCard";
import type { HabitIconName } from "../../src/components/HabitIconPicker";
import { HabitHeatmap } from "../../src/components/HabitHeatmap";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useHabitActions } from "../../src/hooks/useHabitActions";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { spacing } from "../../src/theme/colors";
import { m3ElevationStyle, m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import {
  calculateCompletionRate,
  calculateCurrentStreak,
  getLocalDateKey,
  isWeekdaySelected,
  WEEKDAY_LABELS_SHORT,
} from "../../src/utils/date";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark, material3 } = useTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const { archiveWithCleanup, unarchiveWithReschedule, deletePermanentlyWithCleanup } =
    useHabitActions();

  const habit = useHabitsStore((s) => s.getHabitById(id));
  const habitLogs = useHabitsStore((s) => s.habitLogs);
  const toggleHabitToday = useHabitsStore((s) => s.toggleHabitToday);

  const completedDateKeys = useMemo(() => {
    if (!habit) return new Set<string>();
    return new Set(
      habitLogs.filter((l) => l.habitId === habit.id).map((l) => l.date),
    );
  }, [habitLogs, habit]);

  const styles = useMemo(
    () => createStyles(colors, typography, material3),
    [colors, typography, material3],
  );

  if (!habit) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={typography.body}>Habit gak ditemukan.</Text>
      </View>
    );
  }

  const currentStreak = calculateCurrentStreak(habit, completedDateKeys);
  const completionRate = calculateCompletionRate(habit, completedDateKeys);
  const doneToday = completedDateKeys.has(getLocalDateKey());

  const frequencyLabel =
    habit.frequencyType === "daily"
      ? "Setiap hari"
      : WEEKDAY_LABELS_SHORT.filter((_, i) =>
          isWeekdaySelected(habit.weekdaysMask, i),
        ).join(", ") || "Belum ada hari dipilih";

  const handleToggleToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void toggleHabitToday(habit.id);
  };

  const handleToggleArchive = () => {
    if (habit.archivedAt) {
      void unarchiveWithReschedule(habit);
      return;
    }
    showAlert(
      "Arsipkan habit?",
      `"${habit.name}" gak akan muncul lagi di Today, tapi histori dan streak-nya tetap tersimpan. Bisa diaktifkan lagi kapan saja.`,
      [
        { label: "Batal", style: "cancel" },
        {
          label: "Arsipkan",
          onPress: async () => {
            await archiveWithCleanup(habit);
            router.back();
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    showAlert(
      "Hapus permanen?",
      `Semua histori "${habit.name}" akan hilang selamanya — ini gak bisa di-undo. Kalau cuma mau berhenti tanpa kehilangan histori, pakai "Arsipkan" aja.`,
      [
        { label: "Batal", style: "cancel" },
        {
          label: "Hapus",
          style: "destructive",
          onPress: async () => {
            await deletePermanentlyWithCleanup(habit);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View key={isDark ? "dark" : "light"} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60 },
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={[styles.iconCircle, { backgroundColor: `${habit.color}33` }]}
          >
            <MaterialCommunityIcons
              name={habit.icon as HabitIconName}
              size={26}
              color={habit.color}
            />
          </View>
        </View>

        <Text style={styles.title}>{habit.name}</Text>
        <Text style={typography.caption}>
          {frequencyLabel}
          {habit.reminderTime ? ` · ${habit.reminderTime}` : ""}
        </Text>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} elevationLevel="level1">
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} elevationLevel="level1">
            <Text style={styles.statValue}>{habit.bestStreak}</Text>
            <Text style={styles.statLabel}>best streak</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} elevationLevel="level1">
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>30 hari terakhir</Text>
          </GlassCard>
        </View>

        <View style={styles.metaRow}>
          <Pressable
            onPress={() => router.push(`/habit/add?id=${habit.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Edit habit ini"
          >
            <Text style={[styles.metaLink, { color: colors.textSecondary }]}>
              Edit habit
            </Text>
          </Pressable>
          <Pressable
            onPress={handleToggleArchive}
            accessibilityRole="button"
            accessibilityLabel={
              habit.archivedAt ? "Batalkan arsip habit ini" : "Arsipkan habit ini"
            }
          >
            <Text style={[styles.metaLink, { color: colors.textSecondary }]}>
              {habit.archivedAt ? "Batalkan arsip" : "Arsipkan"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Hapus habit ini permanen"
          >
            <Text style={[styles.metaLink, { color: colors.danger }]}>
              Hapus permanen
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>History</Text>
        <GlassCard style={styles.heatmapCard} elevationLevel="level1">
          <HabitHeatmap habit={habit} completedDateKeys={completedDateKeys} />
        </GlassCard>

        <Pressable
          onPress={handleToggleToday}
          style={[
            styles.markButton,
            {
              backgroundColor: doneToday
                ? material3.secondaryContainer
                : habit.color,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            doneToday
              ? `Tandai ${habit.name} belum selesai hari ini`
              : `Tandai ${habit.name} sudah selesai hari ini`
          }
          android_ripple={{ color: colors.glassBorder }}
        >
          <Text
            style={[
              styles.markButtonText,
              {
                color: doneToday
                  ? material3.onSecondaryContainer
                  : material3.onPrimary,
              },
            ]}
          >
            {doneToday ? "✓ Sudah selesai hari ini" : "Tandai selesai hari ini"}
          </Text>
        </Pressable>
      </ScrollView>

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  material3: ReturnType<typeof useTheme>["material3"],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    headerRow: {
      flexDirection: "row",
      marginBottom: spacing.sm,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: m3Shape.full,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...typography.display,
      fontSize: 24,
      marginTop: spacing.sm,
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    statValue: {
      ...typography.title,
    },
    statLabel: {
      ...typography.caption,
      marginTop: 2,
      textAlign: "center",
    },
    metaRow: {
      flexDirection: "row",
      gap: spacing.lg,
      marginTop: spacing.lg,
    },
    metaLink: {
      ...typography.caption,
      fontWeight: "600",
    },
    sectionTitle: {
      ...typography.caption,
      fontWeight: "700",
      textTransform: "uppercase",
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    heatmapCard: {
      padding: spacing.md,
    },
    markButton: {
      marginTop: spacing.xl,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      alignItems: "center",
      overflow: "hidden",
      ...m3ElevationStyle("level1"),
    },
    markButtonText: {
      ...typography.subtitle,
    },
  });
}
