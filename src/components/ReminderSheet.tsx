import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useSettingsStore } from "../store/useSettingsStore";
import { radius, spacing, withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import {
  cancelReminder,
  checkNotificationPermission,
  isNotificationsAvailable,
  requestNotificationPermission,
  scheduleDailyReminder,
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

interface ReminderSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function ReminderSheet({ visible, onClose }: ReminderSheetProps) {
  const { colors, typography } = useTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const reminderEnabled = useSettingsStore((s) => s.reminderEnabled);
  const reminderHour = useSettingsStore((s) => s.reminderHour);
  const reminderMinute = useSettingsStore((s) => s.reminderMinute);
  const reminderNotificationId = useSettingsStore(
    (s) => s.reminderNotificationId,
  );
  const setReminder = useSettingsStore((s) => s.setReminder);

  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
          mass: 0.9,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 400,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible, backdropOpacity, mounted, sheetTranslateY]);

  useEffect(() => {
    if (!visible || !reminderEnabled || !isNotificationsAvailable) return;
    (async () => {
      const granted = await checkNotificationPermission();
      if (!granted) {
        await cancelReminder(reminderNotificationId);
        setReminder(false, reminderHour, reminderMinute, null);
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
    setReminder,
    showAlert,
  ]);

  const handleToggle = async (value: boolean) => {
    if (!isNotificationsAvailable) {
      showAlert(
        "Belum bisa dipakai di Expo Go",
        "Fitur reminder butuh development build — expo-notifications tidak didukung penuh di Expo Go, khususnya di Android sejak SDK 53.",
      );
      return;
    }

    if (!value) {
      setBusy(true);
      await cancelReminder(reminderNotificationId);
      setReminder(false, reminderHour, reminderMinute, null);
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
    const id = await scheduleDailyReminder(reminderHour, reminderMinute);
    if (!id) {
      setBusy(false);
      showAlert(
        "Gagal mengaktifkan reminder",
        "Coba lagi, atau gunakan development build kalau masih gagal.",
      );
      return;
    }
    setReminder(true, reminderHour, reminderMinute, id);
    setBusy(false);
  };

  const handlePickTime = async (hour: number, minute: number) => {
    if (!reminderEnabled || busy || !isNotificationsAvailable) return;
    setBusy(true);
    await cancelReminder(reminderNotificationId);
    const id = await scheduleDailyReminder(hour, minute);
    if (id) {
      setReminder(true, hour, minute, id);
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
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing.lg,
          paddingBottom: spacing.xl,
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
            <View style={styles.grabber} />
            <Text style={styles.title}>Pengingat Menabung</Text>
            <Text style={styles.description}>
              Dapat notifikasi harian biar gak lupa nabung.
            </Text>

            {!isNotificationsAvailable && (
              <Text style={styles.unavailableNotice}>
                ⚠️ Belum bisa dipakai di Expo Go (khususnya Android). Fitur ini
                butuh development build.
              </Text>
            )}

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Aktifkan pengingat harian</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggle}
                disabled={busy || !isNotificationsAvailable}
                trackColor={{ false: colors.glassBorder, true: colors.deposit }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Aktifkan pengingat menabung harian"
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
