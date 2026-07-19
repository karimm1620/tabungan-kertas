import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../../src/components/AppAlert";
import { EmptyState } from "../../src/components/EmptyState";
import { GlassCard } from "../../src/components/GlassCard";
import { JarProgress } from "../../src/components/JarProgress";
import { TransactionRow } from "../../src/components/TransactionRow";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useSheetMotion } from "../../src/hooks/useSheetMotion";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import {
  getAccentColors,
  radius,
  spacing,
  withOpacity,
} from "../../src/theme/colors";
import { m3ElevationStyle, m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import { formatThousands, parseThousands } from "../../src/utils/currency";

type ActionType = "deposit" | "withdraw" | null;

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();

  const goal = useGoalsStore((state) => state.getGoalById(id));
  const allTransactions = useGoalsStore((state) => state.transactions);
  const deposit = useGoalsStore((state) => state.deposit);
  const withdraw = useGoalsStore((state) => state.withdraw);
  const deleteGoal = useGoalsStore((state) => state.deleteGoal);

  const transactions = useMemo(
    () =>
      allTransactions
        .filter((t) => t.goalId === id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [allTransactions, id],
  );

  const [action, setAction] = useState<ActionType>(null);
  const [amountDisplay, setAmountDisplay] = useState("");
  const [note, setNote] = useState("");

  const closeSheet = () => {
    setAction(null);
    setAmountDisplay("");
    setNote("");
  };

  const {
    mounted: sheetMounted,
    backdropOpacity,
    sheetTranslateY,
    dragHandlers,
  } = useSheetMotion({ visible: action !== null, onDismiss: closeSheet });
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      Animated.timing(keyboardOffset, {
        toValue: e.endCoordinates.height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  const accent = useMemo(() => getAccentColors(goal?.accent ?? "mint"), [goal]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
        },
        goalName: {
          ...typography.title,
          textAlign: "center",
          marginBottom: spacing.md,
        },
        actionRow: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.lg,
        },
        actionButton: {
          flex: 1,
          borderRadius: m3Shape.full,
          paddingVertical: spacing.md,
          alignItems: "center",
          overflow: "hidden",
        },
        actionButtonText: {
          ...typography.subtitle,
          color: colors.textInverse,
        },
        metaRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing.lg,
          marginTop: spacing.lg,
        },
        metaLink: {
          ...typography.caption,
          fontWeight: "600",
        },
        sectionTitle: {
          ...typography.subtitle,
          marginTop: spacing.xl,
          marginBottom: spacing.sm,
        },
        txCard: {
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
        },
        backdrop: {
          flex: 1,
          backgroundColor: colors.overlayScrim,
        },
        sheetWrapper: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        },
        sheetCard: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: m3Shape.extraLarge,
          borderTopRightRadius: m3Shape.extraLarge,
          padding: spacing.lg,
          paddingBottom: spacing.lg + insets.bottom,
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
        modalTitle: {
          ...typography.subtitle,
          marginBottom: spacing.xs,
        },
        modalHint: {
          ...typography.caption,
          marginBottom: spacing.sm,
        },
        currencyInputWrap: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surfaceMuted,
          borderRadius: m3Shape.extraSmall,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          paddingHorizontal: spacing.md,
          marginTop: spacing.sm,
        },
        currencyPrefix: {
          ...typography.subtitle,
          color: colors.textSecondary,
          marginRight: spacing.xs,
        },
        currencyInput: {
          ...typography.amount,
          flex: 1,
          paddingVertical: spacing.md,
        },
        noteInput: {
          ...typography.body,
          backgroundColor: colors.surfaceMuted,
          borderRadius: m3Shape.extraSmall,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginTop: spacing.md,
        },
        modalActions: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.lg,
        },
        modalButton: {
          flex: 1,
          borderRadius: m3Shape.full,
          paddingVertical: spacing.md,
          alignItems: "center",
          overflow: "hidden",
        },
        modalButtonGhost: {
          backgroundColor: colors.surfaceMuted,
        },
        modalButtonGhostText: {
          ...typography.subtitle,
          color: colors.textPrimary,
        },
      }),
    [colors, typography, insets.bottom],
  );

  if (!goal) {
    return (
      <View
        key={isDark ? "dark" : "light"}
        style={[styles.container, { paddingTop: insets.top + spacing.xl }]}
      >
        <EmptyState
          emoji="🔍"
          title="Goal tidak ditemukan"
          description="Goal ini mungkin sudah dihapus."
        />
      </View>
    );
  }

  const handleConfirm = () => {
    const amount = parseThousands(amountDisplay);
    if (amount <= 0) {
      showAlert("Jumlah belum diisi", "Masukkan nominal yang valid.");
      return;
    }

    if (action === "deposit") {
      deposit(goal.id, amount, note.trim() || undefined);
      closeSheet();
    } else if (action === "withdraw") {
      const result = withdraw(goal.id, amount, note.trim() || undefined);
      if (!result.ok) {
        showAlert("Tidak bisa menarik", result.error ?? "Terjadi kesalahan.");
        return;
      }
      closeSheet();
    }
  };

  const handleDelete = () => {
    showAlert(
      "Hapus goal?",
      `"${goal.name}" akan dihapus. Kamu masih bisa "Undo" beberapa detik setelah ini.`,
      [
        { label: "Batal", style: "cancel" },
        {
          label: "Hapus",
          style: "destructive",
          onPress: () => {
            deleteGoal(goal.id);
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
        <Text style={styles.goalName}>{goal.name}</Text>

        <JarProgress
          currentAmount={goal.currentAmount}
          targetAmount={goal.targetAmount}
          accentBase={accent.base}
          accentDeep={accent.deep}
        />

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.deposit }]}
            onPress={() => setAction("deposit")}
            accessibilityRole="button"
            accessibilityLabel="Nabung ke goal ini"
            android_ripple={{ color: withOpacity(colors.textInverse, 0.24) }}
          >
            <Text style={styles.actionButtonText}>+ Nabung</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.withdraw }]}
            onPress={() => setAction("withdraw")}
            accessibilityRole="button"
            accessibilityLabel="Tarik tabungan dari goal ini"
            android_ripple={{ color: withOpacity(colors.textInverse, 0.24) }}
          >
            <Text style={styles.actionButtonText}>- Tarik</Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Pressable
            onPress={() => router.push(`/goal/add?id=${goal.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Edit goal ini"
          >
            <Text style={[styles.metaLink, { color: colors.textSecondary }]}>
              Edit goal
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Hapus goal ini"
          >
            <Text style={[styles.metaLink, { color: colors.danger }]}>
              Hapus goal
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>History</Text>
        {transactions.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="Belum ada transaksi"
            description="Mulai nabung untuk lihat progress-nya di sini."
          />
        ) : (
          transactions.map((tx) => (
            <GlassCard key={tx.id} tintColor={colors.surface} style={styles.txCard}>
              <TransactionRow transaction={tx} />
            </GlassCard>
          ))
        )}
      </ScrollView>

      <Modal
        visible={sheetMounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>

        <View style={styles.sheetWrapper} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheetCard,
              {
                transform: [
                  { translateY: sheetTranslateY },
                  { translateY: Animated.multiply(keyboardOffset, -1) },
                ],
              },
            ]}
          >
            <View
              style={styles.grabber}
              hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
              {...dragHandlers}
            />
            <Text style={styles.modalTitle}>
              {action === "deposit" ? "Nabung ke goal ini" : "Tarik tabungan"}
            </Text>
            {action === "withdraw" && (
              <Text style={styles.modalHint}>
                Saldo tersedia:{" "}
                {new Intl.NumberFormat("id-ID").format(goal.currentAmount)}
              </Text>
            )}

            <View style={styles.currencyInputWrap}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                value={amountDisplay}
                onChangeText={(text) => setAmountDisplay(formatThousands(text))}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                style={styles.currencyInput}
                autoFocus
              />
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Catatan (opsional)"
              placeholderTextColor={colors.textSecondary}
              style={styles.noteInput}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeSheet}
                style={[styles.modalButton, styles.modalButtonGhost]}
                accessibilityRole="button"
                accessibilityLabel="Batalkan"
                android_ripple={{ color: colors.glassBorder }}
              >
                <Text style={styles.modalButtonGhostText}>Batal</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      action === "deposit" ? colors.deposit : colors.withdraw,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Konfirmasi transaksi"
                android_ripple={{ color: withOpacity(colors.textInverse, 0.24) }}
              >
                <Text style={styles.actionButtonText}>Konfirmasi</Text>
              </Pressable>
            </View>
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
    </View>
  );
}