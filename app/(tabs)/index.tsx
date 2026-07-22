import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../../src/components/AppAlert";
import { CelebrationOverlay } from "../../src/components/CelebrationOverlay";
import { EmptyState } from "../../src/components/EmptyState";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MARGIN,
} from "../../src/components/FloatingTabBar";
import { GlassCard } from "../../src/components/GlassCard";
import { ProgressBar } from "../../src/components/ProgressBar";
import { SwipeableRow } from "../../src/components/SwipeableRow";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useHabitActions } from "../../src/hooks/useHabitActions";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { useTodosStore } from "../../src/store/useTodosStore";
import { spacing } from "../../src/theme/colors";
import { m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import type { Habit } from "../../src/types";
import {
  calculateCurrentStreak,
  formatIndonesianDate,
  getLocalDateKey,
  isHabitDueOnDate,
} from "../../src/utils/date";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, material3, isDark } = useTheme();

  // Selalu select STATE MENTAH dari store (referensi stabil), turunkan
  // sendiri lewat useMemo di bawah — JANGAN panggil method getXxx() store
  // sebagai selector (lihat catatan di useHabitsStore.ts / useTodosStore.ts).
  const habits = useHabitsStore((s) => s.habits);
  const habitLogs = useHabitsStore((s) => s.habitLogs);
  const toggleHabitToday = useHabitsStore((s) => s.toggleHabitToday);

  const todos = useTodosStore((s) => s.todos);
  const toggleTodo = useTodosStore((s) => s.toggleTodo);
  const addTodo = useTodosStore((s) => s.addTodo);
  const deleteTodo = useTodosStore((s) => s.deleteTodo);

  const [newTodoTitle, setNewTodoTitle] = useState("");

  const todayKey = getLocalDateKey();

  const todayHabits = useMemo(
    () => habits.filter((h) => !h.archivedAt && isHabitDueOnDate(h, todayKey)),
    [habits, todayKey],
  );

  const completedHabitIdsToday = useMemo(() => {
    const set = new Set<string>();
    for (const log of habitLogs) {
      if (log.date === todayKey) set.add(log.habitId);
    }
    return set;
  }, [habitLogs, todayKey]);

  const streakByHabitId = useMemo(() => {
    const map = new Map<string, number>();
    for (const habit of todayHabits) {
      const completedDates = new Set(
        habitLogs.filter((l) => l.habitId === habit.id).map((l) => l.date),
      );
      map.set(habit.id, calculateCurrentStreak(habit, completedDates));
    }
    return map;
  }, [todayHabits, habitLogs]);

  const todayTodos = useMemo(
    () => todos.filter((t) => t.date === todayKey),
    [todos, todayKey],
  );

  const habitsDoneCount = todayHabits.filter((h) =>
    completedHabitIdsToday.has(h.id),
  ).length;
  const todosDoneCount = todayTodos.filter((t) => t.completedAt).length;
  const totalCount = todayHabits.length + todayTodos.length;
  const doneCount = habitsDoneCount + todosDoneCount;
  const allDone = totalCount > 0 && doneCount === totalCount;

  // Celebration cuma trigger pas TRANSISI ke "semua selesai" (edge-triggered),
  // bukan tiap kali render lagi dalam kondisi udah semua selesai — dan gak
  // nyala pas mount pertama kali walau kebetulan semua udah selesai dari
  // sesi sebelumnya. Lihat CelebrationOverlay.tsx buat alasan desainnya.
  const [showCelebration, setShowCelebration] = useState(false);
  const prevAllDoneRef = useRef(allDone);
  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      setShowCelebration(true);
    }
    prevAllDoneRef.current = allDone;
  }, [allDone]);

  const handleToggleHabit = (habitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void toggleHabitToday(habitId);
  };

  const handleToggleTodo = (todoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void toggleTodo(todoId);
  };

  const handleSubmitTodo = () => {
    const title = newTodoTitle.trim();
    if (!title) return;
    void addTodo({ title, date: todayKey });
    setNewTodoTitle("");
  };

  const styles = useMemo(
    () => createStyles(colors, typography, insets.top),
    [colors, typography, insets.top],
  );

  const hasNothing = todayHabits.length === 0 && todayTodos.length === 0;

  return (
    <View key={isDark ? "dark" : "light"} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={typography.caption}>{formatIndonesianDate()}</Text>
        <Text style={styles.headerTitle}>Today</Text>

        {totalCount > 0 && (
          <GlassCard
            tintColor={colors.glassTintLavender}
            elevationLevel="level2"
            style={styles.progressCard}
          >
            <Text style={styles.progressText}>
              {doneCount} dari {totalCount} selesai
            </Text>
            <View style={{ marginTop: spacing.sm }}>
              <ProgressBar
                percent={totalCount > 0 ? doneCount / totalCount : 0}
                accentColor={material3.primary}
              />
            </View>
          </GlassCard>
        )}

        {hasNothing ? (
          <EmptyState
            emoji="🌱"
            title="Belum ada apa-apa hari ini"
            description="Tap tombol + di kanan bawah buat mulai bikin habit pertamamu."
          />
        ) : (
          <>
            {todayHabits.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Habits</Text>
                {todayHabits.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    done={completedHabitIdsToday.has(habit.id)}
                    streak={streakByHabitId.get(habit.id) ?? 0}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                    onToggle={() => handleToggleHabit(habit.id)}
                  />
                ))}
              </>
            )}

            <Text style={styles.sectionTitle}>Tugas hari ini</Text>
            {todayTodos.map((todo) => (
              <TodoRow
                key={todo.id}
                title={todo.title}
                done={!!todo.completedAt}
                onToggle={() => handleToggleTodo(todo.id)}
                onDelete={() => void deleteTodo(todo.id)}
              />
            ))}

            <View style={styles.addTodoRow}>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                +
              </Text>
              <TextInput
                value={newTodoTitle}
                onChangeText={setNewTodoTitle}
                placeholder="Tambah tugas..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  typography.body,
                  styles.addTodoInput,
                  { color: colors.textPrimary },
                ]}
                returnKeyType="done"
                onSubmitEditing={handleSubmitTodo}
                blurOnSubmit={false}
              />
            </View>
          </>
        )}
      </ScrollView>

      <CelebrationOverlay
        visible={showCelebration}
        onDismiss={() => setShowCelebration(false)}
      />
    </View>
  );
}

interface HabitRowProps {
  habit: Habit;
  done: boolean;
  streak: number;
  onPress: () => void;
  onToggle: () => void;
}

function HabitRow({ habit, done, streak, onPress, onToggle }: HabitRowProps) {
  const router = useRouter();
  const { colors, typography, material3 } = useTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const { archiveWithCleanup, deletePermanentlyWithCleanup } = useHabitActions();
  const styles = useMemo(() => createStyles(colors, typography, 0), [colors, typography]);

  const handleDelete = () => {
    showAlert(
      "Hapus permanen?",
      `Semua histori "${habit.name}" akan hilang selamanya — ini gak bisa di-undo. Kalau cuma mau berhenti tanpa kehilangan histori, swipe lagi terus pilih Arsip aja.`,
      [
        { label: "Batal", style: "cancel" },
        {
          label: "Hapus",
          style: "destructive",
          onPress: () => void deletePermanentlyWithCleanup(habit),
        },
      ],
    );
  };

  return (
    <>
      <SwipeableRow
        quickAction={{
          label: "Arsip",
          icon: "archive-outline",
          color: habit.color,
          onPress: () => void archiveWithCleanup(habit),
        }}
        menuActions={[
          {
            label: "Edit",
            icon: "pencil-outline",
            color: colors.textSecondary,
            onPress: () => router.push(`/habit/add?id=${habit.id}`),
          },
          {
            label: "Arsip",
            icon: "archive-outline",
            color: habit.color,
            onPress: () => void archiveWithCleanup(habit),
          },
          {
            label: "Hapus",
            icon: "delete-outline",
            color: colors.danger,
            onPress: handleDelete,
          },
        ]}
      >
        <Pressable
          onPress={onPress}
          style={[styles.row, { backgroundColor: colors.background }]}
          android_ripple={{ color: colors.glassBorder }}
        >
          <View style={[styles.iconCircle, { backgroundColor: `${habit.color}33` }]}>
            <MaterialCommunityIcons
              name={habit.icon as IconName}
              size={20}
              color={habit.color}
            />
          </View>
          <View style={styles.rowFlexText}>
            <Text
              style={[typography.body, done && styles.doneText]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            <Text style={typography.caption}>
              {streak > 0 ? `${streak} hari beruntun` : "Belum ada streak"}
              {habit.reminderTime ? ` · ${habit.reminderTime}` : ""}
            </Text>
          </View>
          <Pressable
            onPress={onToggle}
            hitSlop={10}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            accessibilityLabel={`Tandai ${habit.name} ${done ? "belum selesai" : "sudah selesai"}`}
            style={[
              styles.checkbox,
              done && {
                backgroundColor: material3.primary,
                borderColor: material3.primary,
              },
            ]}
          >
            {done && (
              <Text style={{ color: material3.onPrimary, fontSize: 14 }}>✓</Text>
            )}
          </Pressable>
        </Pressable>
      </SwipeableRow>

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </>
  );
}

interface TodoRowProps {
  title: string;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function TodoRow({ title, done, onToggle, onDelete }: TodoRowProps) {
  const { colors, typography, material3 } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, 0), [colors, typography]);

  return (
    <SwipeableRow
      quickAction={{ label: "Hapus", icon: "delete-outline", color: colors.danger, onPress: onDelete }}
      menuActions={[
        { label: "Hapus", icon: "delete-outline", color: colors.danger, onPress: onDelete },
      ]}
    >
      <View style={[styles.row, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={onToggle}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={`Tandai tugas ${title} ${done ? "belum selesai" : "sudah selesai"}`}
          style={[
            styles.checkbox,
            done && { backgroundColor: material3.primary, borderColor: material3.primary },
          ]}
        >
          {done && <Text style={{ color: material3.onPrimary, fontSize: 14 }}>✓</Text>}
        </Pressable>
        <Text
          style={[typography.body, styles.rowFlexText, done && styles.doneText]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    </SwipeableRow>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  paddingTop: number,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
    },
    scrollContent: {
      paddingTop: paddingTop + spacing.md,
      paddingBottom:
        FLOATING_TAB_BAR_MARGIN + FLOATING_TAB_BAR_HEIGHT + spacing.xl,
    },
    headerTitle: {
      ...typography.display,
      fontSize: 28,
      marginTop: 2,
      marginBottom: spacing.md,
    },
    progressCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    progressText: {
      ...typography.subtitle,
    },
    sectionTitle: {
      ...typography.caption,
      fontWeight: "700",
      textTransform: "uppercase",
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: m3Shape.small,
    },
    rowFlexText: {
      flex: 1,
    },
    doneText: {
      textDecorationLine: "line-through",
      color: colors.textSecondary,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: m3Shape.full,
      alignItems: "center",
      justifyContent: "center",
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: m3Shape.extraSmall,
      borderWidth: 2,
      borderColor: colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    addTodoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    addTodoInput: {
      flex: 1,
      paddingVertical: spacing.xs,
    },
  });
}
