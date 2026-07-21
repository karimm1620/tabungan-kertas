import { File } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppAlert } from "../src/components/AppAlert";
import { GlassCard } from "../src/components/GlassCard";
import { TopAppBar } from "../src/components/TopAppBar";
import { useAppAlert } from "../src/hooks/useAppAlert";
import { useGoalsStore } from "../src/store/useGoalsStore";
import { useHabitsStore } from "../src/store/useHabitsStore";
import { useSettingsStore } from "../src/store/useSettingsStore";
import { useTodosStore } from "../src/store/useTodosStore";
import { spacing } from "../src/theme/colors";
import { m3Shape } from "../src/theme/material3/tokens";
import { useTheme } from "../src/theme/useTheme";
import {
  exportBackupToFile,
  restoreFromBackup,
  validateBackupPayload,
} from "../src/utils/backup";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, typography, isDark, material3 } = useTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const [busy, setBusy] = useState<"export" | "import" | null>(null);

  const hydrateGoals = useGoalsStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateHabits = useHabitsStore((s) => s.hydrate);
  const hydrateTodos = useTodosStore((s) => s.hydrate);

  const styles = useMemo(
    () => createStyles(colors, typography, material3),
    [colors, typography, material3],
  );

  const handleExport = async () => {
    setBusy("export");
    try {
      const file = await exportBackupToFile();
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Simpan backup heibi",
        });
      } else {
        showAlert(
          "Backup dibuat",
          `Sharing gak tersedia di device ini, tapi file backup-nya tersimpan di:\n${file.uri}`,
        );
      }
    } catch {
      showAlert("Gagal ekspor", "Terjadi kesalahan waktu bikin file backup. Coba lagi.");
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    let result: DocumentPicker.DocumentPickerResult;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
    } catch {
      showAlert("Gagal buka file", "Terjadi kesalahan waktu buka pemilih file.");
      return;
    }
    if (result.canceled || !result.assets?.length) return;

    setBusy("import");
    let parsed: unknown;
    try {
      const file = new File(result.assets[0].uri);
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      setBusy(null);
      showAlert("Gagal membaca file", "File ini bukan JSON yang valid atau gagal dibuka.");
      return;
    }

    const validation = validateBackupPayload(parsed);
    setBusy(null);
    if (!validation.valid || !validation.payload) {
      showAlert("Backup gak valid", validation.error ?? "File ini gak bisa dipulihkan.");
      return;
    }

    const { data } = validation.payload;
    showAlert(
      "Pulihkan dari backup?",
      `Semua data yang ADA SEKARANG di app ini bakal DIGANTI TOTAL sama isi backup ini — ${data.savingsGoals.length} goal, ${data.habits.length} habit, ${data.todos.length} tugas. Ini gak bisa di-undo.`,
      [
        { label: "Batal", style: "cancel" },
        {
          label: "Pulihkan",
          style: "destructive",
          onPress: async () => {
            setBusy("import");
            try {
              await restoreFromBackup(validation.payload!);
              await Promise.all([
                hydrateGoals(),
                hydrateSettings(),
                hydrateHabits(),
                hydrateTodos(),
              ]);
              showAlert("Berhasil dipulihkan", "Data dari backup udah aktif sekarang.");
            } catch {
              showAlert(
                "Gagal memulihkan",
                "Terjadi kesalahan waktu nulis data backup. Data lama kemungkinan masih utuh — coba lagi.",
              );
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View key={isDark ? "dark" : "light"} style={styles.container}>
      <TopAppBar title="Pengaturan" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Backup & Restore</Text>
        <GlassCard style={styles.card} elevationLevel="level1">
          <Text style={typography.body}>
            Semua data (goal tabungan, transaksi, habit, histori, tugas)
            tersimpan lokal di device ini doang — gak ada cloud, gak ada
            akun. Export backup secara berkala biar data aman kalau ganti
            device atau app-nya ke-uninstall.
          </Text>

          <Pressable
            onPress={handleExport}
            disabled={busy !== null}
            style={[styles.primaryButton, busy === "export" && styles.buttonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Export backup data"
            android_ripple={{ color: colors.glassBorder }}
          >
            {busy === "export" ? (
              <ActivityIndicator color={material3.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Export Backup</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleImport}
            disabled={busy !== null}
            style={[styles.secondaryButton, busy === "import" && styles.buttonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Import backup data dari file"
            android_ripple={{ color: colors.glassBorder }}
          >
            {busy === "import" ? (
              <ActivityIndicator color={material3.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Import Backup</Text>
            )}
          </Pressable>
        </GlassCard>
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
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    sectionTitle: {
      ...typography.caption,
      fontWeight: "700",
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    card: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    primaryButton: {
      marginTop: spacing.sm,
      backgroundColor: material3.primary,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      alignItems: "center",
      overflow: "hidden",
    },
    primaryButtonText: {
      ...typography.subtitle,
      color: material3.onPrimary,
    },
    secondaryButton: {
      backgroundColor: material3.secondaryContainer,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      alignItems: "center",
      overflow: "hidden",
    },
    secondaryButtonText: {
      ...typography.subtitle,
      color: material3.onSecondaryContainer,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
  });
}
