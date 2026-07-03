import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAccentColors, radius, spacing } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { formatThousands, parseThousands } from '../../src/utils/currency';
import { useGoalsStore } from '../../src/store/useGoalsStore';
import { JarProgress } from '../../src/components/JarProgress';
import { TransactionRow } from '../../src/components/TransactionRow';
import { EmptyState } from '../../src/components/EmptyState';
import { GlassCard } from '../../src/components/GlassCard';

type ActionType = 'deposit' | 'withdraw' | null;

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

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
    [allTransactions, id]
  );

  const [action, setAction] = useState<ActionType>(null);
  const [amountDisplay, setAmountDisplay] = useState('');
  const [note, setNote] = useState('');

  const accent = useMemo(() => getAccentColors(goal?.accent ?? 'mint'), [goal]);

  if (!goal) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <EmptyState emoji="🔍" title="Goal tidak ditemukan" description="Goal ini mungkin sudah dihapus." />
      </View>
    );
  }

  const closeModal = () => {
    setAction(null);
    setAmountDisplay('');
    setNote('');
  };

  const handleConfirm = () => {
    const amount = parseThousands(amountDisplay);
    if (amount <= 0) {
      Alert.alert('Jumlah belum diisi', 'Masukkan nominal yang valid.');
      return;
    }

    if (action === 'deposit') {
      deposit(goal.id, amount, note.trim() || undefined);
      closeModal();
    } else if (action === 'withdraw') {
      const result = withdraw(goal.id, amount, note.trim() || undefined);
      if (!result.ok) {
        Alert.alert('Tidak bisa menarik', result.error ?? 'Terjadi kesalahan.');
        return;
      }
      closeModal();
    }
  };

  const handleDelete = () => {
    Alert.alert('Hapus goal?', `"${goal.name}" beserta seluruh history-nya akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          deleteGoal(goal.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 60 }]}>
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
            onPress={() => setAction('deposit')}
          >
            <Text style={styles.actionButtonText}>+ Nabung</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.withdraw }]}
            onPress={() => setAction('withdraw')}
          >
            <Text style={styles.actionButtonText}>- Tarik</Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Pressable onPress={() => router.push(`/goal/add?id=${goal.id}`)}>
            <Text style={styles.metaLink}>Edit goal</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Text style={[styles.metaLink, { color: colors.danger }]}>Hapus goal</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>History</Text>
        {transactions.length === 0 ? (
          <EmptyState emoji="🌱" title="Belum ada transaksi" description="Mulai nabung untuk lihat progress-nya di sini." />
        ) : (
          transactions.map((tx) => (
            <GlassCard key={tx.id} style={styles.txCard}>
              <TransactionRow transaction={tx} />
            </GlassCard>
          ))
        )}
      </ScrollView>

      <Modal visible={action !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {action === 'deposit' ? 'Nabung ke goal ini' : 'Tarik tabungan'}
            </Text>
            {action === 'withdraw' && (
              <Text style={styles.modalHint}>
                Saldo tersedia: {new Intl.NumberFormat('id-ID').format(goal.currentAmount)}
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
              <Pressable onPress={closeModal} style={[styles.modalButton, styles.modalButtonGhost]}>
                <Text style={styles.modalButtonGhostText}>Batal</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={[
                  styles.modalButton,
                  { backgroundColor: action === 'deposit' ? colors.deposit : colors.withdraw },
                ]}
              >
                <Text style={styles.actionButtonText}>Konfirmasi</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors'], typography: ReturnType<typeof useTheme>['typography']) {
  return StyleSheet.create({
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
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    actionButton: {
      flex: 1,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    actionButtonText: {
      ...typography.subtitle,
      color: colors.textInverse,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.lg,
      marginTop: spacing.lg,
    },
    metaLink: {
      ...typography.caption,
      color: colors.lavenderDeep,
      fontWeight: '600',
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlayScrim,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    modalCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
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
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
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
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.md,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    modalButton: {
      flex: 1,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    modalButtonGhost: {
      backgroundColor: colors.surfaceMuted,
    },
    modalButtonGhostText: {
      ...typography.subtitle,
      color: colors.textPrimary,
    },
  });
}
