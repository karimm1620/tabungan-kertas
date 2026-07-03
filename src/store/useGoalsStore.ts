import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pickAccentKey } from '../theme/colors';
import { generateId } from '../utils/id';
import { deleteGoalImage } from '../utils/imageStorage';
import type { CreateGoalInput, Goal, Transaction } from '../types';

interface GoalsState {
  goals: Goal[];
  transactions: Transaction[];

  // Actions
  addGoal: (input: CreateGoalInput) => Goal;
  updateGoal: (id: string, patch: Partial<CreateGoalInput>) => void;
  deleteGoal: (id: string) => void;
  deposit: (goalId: string, amount: number, note?: string) => void;
  withdraw: (goalId: string, amount: number, note?: string) => { ok: boolean; error?: string };

  // Selectors (dipanggil sebagai fungsi biasa, bukan reactive — pakai hook terpisah kalau perlu reactive)
  getGoalById: (id: string) => Goal | undefined;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      transactions: [],

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

      deleteGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (goal?.imageUri) deleteGoalImage(goal.imageUri);
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          transactions: state.transactions.filter((t) => t.goalId !== id),
        }));
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
    }
  )
);
