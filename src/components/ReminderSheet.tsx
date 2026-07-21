import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useAppAlert } from "../hooks/useAppAlert";
import { useSheetMotion } from "../hooks/useSheetMotion";
import { type ReminderDomain, useSettingsStore } from "../store/useSettingsStore";
import { radius, spacing, withOpacity } from "../theme/colors";
import { m3ElevationStyle, m3Shape } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";
import {
  cancelReminder,
  checkNotificationPermission,
  isNotificationsAvailable,
  requestNotificationPermission,
  scheduleReminder,
} from "../utils/notifications";
import { AppAlert } from "./AppAlert";

const TIME_PRESETS = [
  { hour: 7, minute: 0, label: "07.00" },
  { hour: 9, minute: 0, label: "09.00" },
  { hour: 12, minute: 0, label: "12.00" },
  { hour: 18, minute: 0, label: "18.00" },
  { hour: 20, minute: 0, label: "20.00" },
  { hour: 21, minute: 0, label: "21.00" },
];

const DOMAIN_COPY: Record<ReminderDomain, { title: string; description: string; toggleLabel: string }> = {
  savings: {
    title: "Pengingat Menabung",
    description: "Dapat notifikasi harian biar gak lupa nabung.",
    toggleLabel: "Aktifkan pengingat harian",
  },
  planner: {
    title: "Pengingat Tugas",
    description: "Dapat notifikasi harian buat cek tugas hari ini yang belum selesai.",
    toggleLabel: "Aktifkan pengingat harian",
  },
};

interface ReminderSheetProps {
  visible: boolean;
  onClose: () => void;
  domain: ReminderDomain;
}

export function ReminderSheet({ visible, onClose, domain }: ReminderSheetProps) {
  const { colors, typography } = useTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const reminder = useSettingsStore((s) =>
    domain === "savings" ? s.savingsReminder : s.plannerReminder,
  );
  const setReminder = useSettingsStore((s) => s.setReminder);
  const copy = DOMAIN_COPY[domain];

  const { enabled: reminderEnabled, hour: reminderHour, minute: reminderMinute, notificationId: reminderNotificationId } = reminder;

  const [busy, setBusy] = useState(false);
  const { mounted, backdropOpacity, sheetTranslateY, dragHandlers } = useSheetMotion({
    visible,
    onDismiss: onClose,
  });

  useEffect(() => {
    if (!visible || !reminderEnabled || !isNotificationsAvailable) return;
    (async () => {
      const granted = await checkNotificationPermission();
      if (!granted) {
        await cancelReminder(reminderNotificationId);
        await setReminder(domain, false, reminderHour, reminderMinute, null);
        showAlert(
          "Reminder dinonaktifkan",
          "Izin notifikasi buat aplikasi ini kelihatannya udah gak aktif lagi. Aktifkan lagi kalau mau pakai reminder.",
        );
      }
    })();
  }, [
    visible,
    reminderEnabled,
    reminderHour,
    reminderMinute,
    reminderNotificationId,
    domain,
    setReminder,
    showAlert,
  ]);

  const handleToggle = async (value: boolean) => {
    if (!isNotificationsAvailable) {
      showAlert(
        "Belum bisa dipakai di Expo Go",
        "Fitur reminder butuh development build — expo-notifications tidak didukung penuh di Expo Go sejak SDK 53.",
      );
      return;
    }

    if (!value) {
      setBusy(true);
      await cancelReminder(reminderNotificationId);
      await setReminder(domain, false, reminderHour, reminderMinute, null);
      setBusy(false);
      return;
    }

    setBusy(true);
    const granted = await requestNotificationPermission();
    if (!granted) {
      setBusy(false);
      showAlert(
        "Izin notifikasi diperlukan",
        "Aktifkan izin notifikasi buat aplikasi ini di pengaturan device supaya pengingat bisa muncul.",
        [
          { label: "Nanti", style: "cancel" },
          { label: "Buka Pengaturan", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    await cancelReminder(reminderNotificationId);
    const id = await scheduleReminder(domain, reminderHour, reminderMinute);
    if (!id) {
      setBusy(false);
      showAlert(
        "Gagal mengaktifkan reminder",
        "Coba lagi, atau gunakan development build kalau masih gagal.",
      );
      return;
    }
    await setReminder(domain, true, reminderHour, reminderMinute, id);
    setBusy(false);
  };

  const handlePickTime = async (hour: number, minute: number) => {
    if (!reminderEnabled || busy || !isNotificationsAvailable) return;
    setBusy(true);
    await cancelReminder(reminderNotificationId);
    const id = await scheduleReminder(domain, hour, minute);
    if (id) {
      await setReminder(domain, true, hour, minute, id);
    }
    setBusy(false);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: { flex: 1, backgroundColor: colors.overlayScrim },
        sheetWrapper: { position: "absolute", left: 0, right: 0, bottom: 0 },
        sheetCard: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: m3Shape.extraLarge,
          borderTopRightRadius: m3Shape.extraLarge,
          padding: spacing.lg,
          paddingBottom: spacing.xl,
          ...m3ElevationStyle("level1"),
        },
        grabber: {
          width: 40,
          height: 5,
          borderRadius: radius.pill,
          backgroundColor: colors.glassBorder,
          alignSelf: "center",
          marginBottom: spacing.md,
        },
        title: { ...typography.subtitle, marginBottom: spacing.xs },
        description: { ...typography.caption, marginBottom: spacing.md },
        unavailableNotice: {
          ...typography.caption,
          color: colors.danger,
          backgroundColor: withOpacity(colors.danger, 0.1),
          padding: spacing.sm,
          borderRadius: radius.md,
          marginBottom: spacing.md,
        },
        toggleRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.sm,
        },
        toggleLabel: { ...typography.body, flex: 1, marginRight: spacing.md },
        timeGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          marginTop: spacing.md,
        },
        timeChip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1.5,
          borderColor: "transparent",
        },
        timeChipActive: {
          borderColor: colors.deposit,
          backgroundColor: withOpacity(colors.deposit, 0.15),
        },
        timeChipText: {
          ...typography.caption,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        timeChipTextActive: { color: colors.textPrimary },
        closeButton: {
          marginTop: spacing.lg,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          alignItems: "center",
          backgroundColor: colors.surfaceMuted,
        },
        closeButtonText: { ...typography.subtitle, color: colors.textPrimary },
      }),
    [colors, typography],
  );

  return (
    <>
      <Modal
        visible={mounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <View style={styles.sheetWrapper} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheetCard,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <View
              style={styles.grabber}
              hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
              {...dragHandlers}
            />
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.description}>{copy.description}</Text>

            {!isNotificationsAvailable && (
              <Text style={styles.unavailableNotice}>
                ⚠️ Belum bisa dipakai di Expo Go. Fitur ini
                butuh development build.
              </Text>
            )}

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{copy.toggleLabel}</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggle}
                disabled={busy || !isNotificationsAvailable}
                trackColor={{ false: colors.glassBorder, true: colors.deposit }}
                thumbColor="#FFFFFF"
                accessibilityLabel={copy.toggleLabel}
                accessibilityRole="switch"
              />
            </View>

            {reminderEnabled && (
              <View style={styles.timeGrid}>
                {TIME_PRESETS.map((preset) => {
                  const isActive =
                    reminderHour === preset.hour &&
                    reminderMinute === preset.minute;
                  return (
                    <Pressable
                      key={preset.label}
                      onPress={() => handlePickTime(preset.hour, preset.minute)}
                      disabled={busy}
                      style={[
                        styles.timeChip,
                        isActive && styles.timeChipActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Jadwalkan reminder jam ${preset.label}`}
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          isActive && styles.timeChipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Tutup pengaturan reminder"
            >
              <Text style={styles.closeButtonText}>Tutup</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

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
