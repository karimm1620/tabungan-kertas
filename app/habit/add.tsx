import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppAlert } from "../../src/components/AppAlert";
import { Chip } from "../../src/components/Chip";
import {
  HABIT_COLOR_OPTIONS,
  HabitColorPicker,
} from "../../src/components/HabitColorPicker";
import {
  HABIT_ICON_OPTIONS,
  HabitIconPicker,
  type HabitIconName,
} from "../../src/components/HabitIconPicker";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { spacing, withOpacity } from "../../src/theme/colors";
import { m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import type { HabitFrequencyType } from "../../src/types";
import {
  ALL_WEEKDAYS_MASK,
  isWeekdaySelected,
  toggleWeekdayBit,
} from "../../src/utils/date";

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const TIME_PRESETS = [
  { hour: 6, minute: 0, label: "06.00" },
  { hour: 7, minute: 0, label: "07.00" },
  { hour: 9, minute: 0, label: "09.00" },
  { hour: 12, minute: 0, label: "12.00" },
  { hour: 18, minute: 0, label: "18.00" },
  { hour: 20, minute: 0, label: "20.00" },
  { hour: 21, minute: 0, label: "21.00" },
];

export default function AddHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { colors, typography, isDark, material3 } = useTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();

  const habit = useHabitsStore((s) =>
    id ? s.getHabitById(id) : undefined,
  );
  const addHabit = useHabitsStore((s) => s.addHabit);
  const updateHabit = useHabitsStore((s) => s.updateHabit);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<HabitIconName>(HABIT_ICON_OPTIONS[0]);
  const [color, setColor] = useState<string>(HABIT_COLOR_OPTIONS[0]);
  const [frequencyType, setFrequencyType] =
    useState<HabitFrequencyType>("daily");
  const [weekdaysMask, setWeekdaysMask] = useState<number>(ALL_WEEKDAYS_MASK);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon as HabitIconName);
      setColor(habit.color);
      setFrequencyType(habit.frequencyType);
      setWeekdaysMask(habit.weekdaysMask);
      if (habit.reminderTime) {
        const [h, m] = habit.reminderTime.split(":").map(Number);
        setReminderEnabled(true);
        setReminderHour(h);
        setReminderMinute(m);
      }
    }
  }, [habit]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showAlert("Nama habit kosong", "Kasih nama dulu buat habit-nya.");
      return;
    }
    if (frequencyType === "weekdays" && weekdaysMask === 0) {
      showAlert("Belum pilih hari", "Pilih minimal satu hari buat habit ini.");
      return;
    }

    const reminderTime = reminderEnabled
      ? `${String(reminderHour).padStart(2, "0")}:${String(reminderMinute).padStart(2, "0")}`
      : null;

    const input = {
      name: trimmedName,
      icon,
      color,
      frequencyType,
      weekdaysMask,
      reminderTime,
    };

    if (isEditMode && id) {
      await updateHabit(id, input);
    } else {
      await addHabit(input);
    }
    router.back();
  };

  const styles = useMemo(
    () => createStyles(colors, typography, material3),
    [colors, typography, material3],
  );

  return (
    <KeyboardAvoidingView key={isDark ? "dark" : "light"} style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>Nama Habit</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Misal: Minum air, Baca 20 menit"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Ikon</Text>
        <HabitIconPicker selected={icon} color={color} onSelect={setIcon} />

        <Text style={styles.label}>Warna</Text>
        <HabitColorPicker selected={color} onSelect={setColor} />

        <Text style={styles.label}>Frekuensi</Text>
        <View style={styles.chipRow}>
          <Chip
            label="Setiap hari"
            selected={frequencyType === "daily"}
            onPress={() => setFrequencyType("daily")}
          />
          <Chip
            label="Hari tertentu"
            selected={frequencyType === "weekdays"}
            onPress={() => setFrequencyType("weekdays")}
          />
        </View>

        {frequencyType === "weekdays" && (
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label, index) => {
              const active = isWeekdaySelected(weekdaysMask, index);
              return (
                <Pressable
                  key={label}
                  onPress={() =>
                    setWeekdaysMask((prev) => toggleWeekdayBit(prev, index))
                  }
                  style={[
                    styles.weekdayChip,
                    active && {
                      backgroundColor: material3.secondaryContainer,
                      borderColor: "transparent",
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Hari ${label}`}
                  accessibilityState={{ selected: active }}
                  android_ripple={{ color: colors.glassBorder }}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: active
                          ? material3.onSecondaryContainer
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.reminderHeader}>
          <Text style={[styles.label, { marginTop: 0 }]}>Reminder</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ true: material3.primary }}
            accessibilityLabel="Aktifkan reminder habit ini"
          />
        </View>

        {reminderEnabled && (
          <View style={styles.chipRow}>
            {TIME_PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                selected={
                  reminderHour === preset.hour &&
                  reminderMinute === preset.minute
                }
                onPress={() => {
                  setReminderHour(preset.hour);
                  setReminderMinute(preset.minute);
                }}
              />
            ))}
          </View>
        )}

        <Pressable
          onPress={handleSave}
          style={styles.saveButton}
          accessibilityRole="button"
          accessibilityLabel={
            isEditMode ? "Simpan perubahan habit" : "Buat habit baru"
          }
          android_ripple={{ color: withOpacity(material3.onPrimary, 0.24) }}
        >
          <Text style={styles.saveButtonText}>
            {isEditMode ? "Simpan Perubahan" : "Buat Habit"}
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
    </KeyboardAvoidingView>
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
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    label: {
      ...typography.label,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    input: {
      ...typography.body,
      backgroundColor: colors.surface,
      borderRadius: m3Shape.extraSmall,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    weekdayRow: {
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    weekdayChip: {
      width: 40,
      height: 40,
      borderRadius: m3Shape.full,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    reminderHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.lg,
    },
    saveButton: {
      marginTop: spacing.xl,
      backgroundColor: material3.primary,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      alignItems: "center",
      overflow: "hidden",
    },
    saveButtonText: {
      ...typography.subtitle,
      color: material3.onPrimary,
    },
  });
}
