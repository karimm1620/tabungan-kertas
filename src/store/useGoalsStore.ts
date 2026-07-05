import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pickAccentKey } from '../theme/colors';
import { generateId } from '../utils/id';
import { deleteGoalImage } from '../utils/imageStorage';
import type { CreateGoalInput, Goal, Transaction } from '../types';

interface PendingDeletion {
  goal: Goal;
  transactions: Transaction[];
}

interface GoalsState {
  goals: Goal[];
  transactions: Transaction[];
  /** true setelah data selesai di-load dari AsyncStorage saat app start */
  hasHydrated: boolean;
  /** Goal yang baru dihapus tapi masih dalam jendela waktu "undo" */
  pendingDeletion: PendingDeletion | null;

  // Actions
  addGoal: (input: CreateGoalInput) => Goal;
  updateGoal: (id: string, patch: Partial<CreateGoalInput>) => void;
  deleteGoal: (id: string) => void;
  undoDelete: () => void;
  commitPendingDeletion: () => void;
  deposit: (goalId: string, amount: number, note?: string) => void;
  withdraw: (goalId: string, amount: number, note?: string) => { ok: boolean; error?: string };
  setHasHydrated: (value: boolean) => void;

  // Selectors (dipanggil sebagai fungsi biasa, bukan reactive — pakai hook terpisah kalau perlu reactive)
  getGoalById: (id: string) => Goal | undefined;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      transactions: [],
      hasHydrated: false,
      pendingDeletion: null,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      addGoal: (input) => {
        const id = generateId('goal');
        const newGoal: Goal = {
          id,
          name: input.name.trim(),
          targetAmount: input.targetAmount,
          currentAmount: 0,
          imageUri: input.imageUri,
          emoji: input.imageUri ? undefined : input.emoji || '🎯',
          accent: pickAccentKey(id),
          createdAt: Date.now(),
        };
        set((state) => ({ goals: [newGoal, ...state.goals] }));
        return newGoal;
      },

      updateGoal: (id, patch) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== id) return g;
            // Kalau ganti gambar, hapus gambar lama supaya tidak jadi sampah file
            if (patch.imageUri !== undefined && patch.imageUri !== g.imageUri) {
              deleteGoalImage(g.imageUri);
            }
            return {
              ...g,
              name: patch.name?.trim() ?? g.name,
              targetAmount: patch.targetAmount ?? g.targetAmount,
              imageUri: patch.imageUri !== undefined ? patch.imageUri : g.imageUri,
              emoji: patch.imageUri ? undefined : patch.emoji ?? g.emoji,
            };
          }),
        }));
      },

      // Soft-delete: goal langsung hilang dari list, tapi datanya (+ history-nya)
      // disimpan sementara di `pendingDeletion` supaya bisa di-undo. Gambar file-nya
      // BELUM dihapus di sini — baru benar-benar dihapus lewat commitPendingDeletion()
      deleteGoal: (id) => {
        const existingPending = get().pendingDeletion;
        if (existingPending?.goal.imageUri) {
          deleteGoalImage(existingPending.goal.imageUri);
        }

        const goal = get().goals.find((g) => g.id === id);
        if (!goal) return;
        const relatedTransactions = get().transactions.filter((t) => t.goalId === id);

        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          transactions: state.transactions.filter((t) => t.goalId !== id),
          pendingDeletion: { goal, transactions: relatedTransactions },
        }));
      },

      undoDelete: () => {
        const pending = get().pendingDeletion;
        if (!pending) return;
        set((state) => ({
          goals: [pending.goal, ...state.goals],
          transactions: [...pending.transactions, ...state.transactions],
          pendingDeletion: null,
        }));
      },

      commitPendingDeletion: () => {
        const pending = get().pendingDeletion;
        if (pending?.goal.imageUri) {
          deleteGoalImage(pending.goal.imageUri);
        }
        set({ pendingDeletion: null });
      },

      deposit: (goalId, amount, note) => {
        if (amount <= 0) return;
        const tx: Transaction = {
          id: generateId('tx'),
          goalId,
          type: 'deposit',
          amount,
          note,
          createdAt: Date.now(),
        };
        set((state) => ({
          transactions: [tx, ...state.transactions],
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
          ),
        }));
      },

      withdraw: (goalId, amount, note) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal) return { ok: false, error: 'Goal tidak ditemukan' };
        if (amount <= 0) return { ok: false, error: 'Jumlah harus lebih dari 0' };
        if (amount > goal.currentAmount) {
          return { ok: false, error: 'Jumlah melebihi saldo tabungan goal ini' };
        }

        const tx: Transaction = {
          id: generateId('tx'),
          goalId,
          type: 'withdrawal',
          amount,
          note,
          createdAt: Date.now(),
        };
        set((state) => ({
          transactions: [tx, ...state.transactions],
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, currentAmount: g.currentAmount - amount } : g
          ),
        }));
        return { ok: true };
      },

      getGoalById: (id) => get().goals.find((g) => g.id === id),
    }),
    {
      name: 'saving-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ goals: state.goals, transactions: state.transactions }),
      onRehydrateStorage: () => (state) => {
        // Dipanggil otomatis begitu AsyncStorage selesai di-load ke memori.
        // Root layout nunggu flag ini true sebelum nyembunyiin splash screen.
        state?.setHasHydrated(true);
      },
    }
  )
);