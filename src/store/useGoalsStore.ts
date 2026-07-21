import { create } from "zustand";
import { getDb } from "../db/client";
import { pickAccentKey } from "../theme/colors";
import type { CreateGoalInput, Goal, Transaction } from "../types";
import { generateId } from "../utils/id";
import { deleteGoalImage } from "../utils/imageStorage";

export const UNDO_WINDOW_MS = 4000;

interface PendingDeletion {
  goal: Goal;
  transactions: Transaction[];
  deletedAt: number;
}

const PENDING_DELETION_SETTINGS_KEY = "pending_goal_deletion";

export interface GoalRow {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  image_uri: string | null;
  emoji: string | null;
  accent: Goal["accent"];
  created_at: number;
}

export interface TxRow {
  id: string;
  goal_id: string;
  type: Transaction["type"];
  amount: number;
  note: string | null;
  created_at: number;
}

export function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    imageUri: row.image_uri ?? undefined,
    emoji: row.emoji ?? undefined,
    accent: row.accent,
    createdAt: row.created_at,
  };
}

export function rowToTx(row: TxRow): Transaction {
  return {
    id: row.id,
    goalId: row.goal_id,
    type: row.type,
    amount: row.amount,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

interface GoalsState {
  goals: Goal[];
  transactions: Transaction[];
  hasHydrated: boolean;
  pendingDeletion: PendingDeletion | null;

  /** Load semua data dari SQLite ke memory. Panggil sekali di bootstrap app. */
  hydrate: () => Promise<void>;
  addGoal: (input: CreateGoalInput) => Promise<Goal>;
  updateGoal: (id: string, patch: Partial<CreateGoalInput>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  commitPendingDeletion: () => Promise<void>;
  deposit: (goalId: string, amount: number, note?: string) => Promise<void>;
  withdraw: (
    goalId: string,
    amount: number,
    note?: string,
  ) => Promise<{ ok: boolean; error?: string }>;

  getGoalById: (id: string) => Goal | undefined;
}

/**
 * Sumber kebenaran data goal/transaksi sekarang SQLite (Checkpoint 0),
 * bukan lagi AsyncStorage via Zustand `persist` middleware. Zustand di sini
 * cuma cache in-memory reaktif buat UI — tiap action nulis ke SQLite DULU,
 * baru update state in-memory (write-through, bukan write-behind), biar gak
 * ada window di mana UI nunjukin data yang belum ke-persist.
 */
export const useGoalsStore = create<GoalsState>()((set, get) => ({
  goals: [],
  transactions: [],
  hasHydrated: false,
  pendingDeletion: null,

  hydrate: async () => {
    const db = await getDb();
    const [goalRows, txRows, pendingRow] = await Promise.all([
      db.getAllAsync<GoalRow>(
        "SELECT * FROM savings_goals ORDER BY created_at DESC",
      ),
      db.getAllAsync<TxRow>(
        "SELECT * FROM savings_tx ORDER BY created_at DESC",
      ),
      db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = ?",
        [PENDING_DELETION_SETTINGS_KEY],
      ),
    ]);

    let pendingDeletion: PendingDeletion | null = null;
    if (pendingRow) {
      try {
        pendingDeletion = JSON.parse(pendingRow.value);
      } catch {
        pendingDeletion = null;
      }
    }

    set({
      goals: goalRows.map(rowToGoal),
      transactions: txRows.map(rowToTx),
      pendingDeletion,
      hasHydrated: true,
    });

    // Kalau app sempat ke-kill pas window undo masih jalan: window udah
    // lewat -> commit permanen sekarang; window masih sisa -> biarkan,
    // UndoSnackbar munculin sisa waktunya sendiri dari `deletedAt`.
    if (pendingDeletion) {
      const elapsed = Date.now() - pendingDeletion.deletedAt;
      if (elapsed >= UNDO_WINDOW_MS) {
        await get().commitPendingDeletion();
      }
    }
  },

  addGoal: async (input) => {
    const id = generateId("goal");
    const newGoal: Goal = {
      id,
      name: input.name.trim(),
      targetAmount: input.targetAmount,
      currentAmount: 0,
      imageUri: input.imageUri,
      emoji: input.imageUri ? undefined : input.emoji || "🎯",
      accent: pickAccentKey(id),
      createdAt: Date.now(),
    };

    const db = await getDb();
    await db.runAsync(
      `INSERT INTO savings_goals
        (id, name, target_amount, current_amount, image_uri, emoji, accent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newGoal.id,
        newGoal.name,
        newGoal.targetAmount,
        newGoal.currentAmount,
        newGoal.imageUri ?? null,
        newGoal.emoji ?? null,
        newGoal.accent,
        newGoal.createdAt,
      ],
    );

    set((state) => ({ goals: [newGoal, ...state.goals] }));
    return newGoal;
  },

  updateGoal: async (id, patch) => {
    const existing = get().goals.find((g) => g.id === id);
    if (!existing) return;

    if (
      patch.imageUri !== undefined &&
      patch.imageUri !== existing.imageUri
    ) {
      deleteGoalImage(existing.imageUri);
    }

    const updated: Goal = {
      ...existing,
      name: patch.name?.trim() ?? existing.name,
      targetAmount: patch.targetAmount ?? existing.targetAmount,
      imageUri:
        patch.imageUri !== undefined ? patch.imageUri : existing.imageUri,
      emoji: patch.imageUri ? undefined : (patch.emoji ?? existing.emoji),
    };

    const db = await getDb();
    await db.runAsync(
      `UPDATE savings_goals SET name = ?, target_amount = ?, image_uri = ?, emoji = ? WHERE id = ?`,
      [
        updated.name,
        updated.targetAmount,
        updated.imageUri ?? null,
        updated.emoji ?? null,
        id,
      ],
    );

    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? updated : g)),
    }));
  },

  deleteGoal: async (id) => {
    // Kalau ada pendingDeletion sebelumnya yang belum ke-commit (jarang —
    // cuma kalau user delete goal kedua sebelum window pertama abis),
    // commit dulu itu biar gambarnya gak nyangkut nunggu 2 window sekaligus.
    if (get().pendingDeletion) {
      await get().commitPendingDeletion();
    }

    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;
    const relatedTransactions = get().transactions.filter(
      (t) => t.goalId === id,
    );

    const db = await getDb();
    // ON DELETE CASCADE di savings_tx.goal_id otomatis ikut hapus transaksinya.
    await db.runAsync("DELETE FROM savings_goals WHERE id = ?", [id]);

    const pendingDeletion: PendingDeletion = {
      goal,
      transactions: relatedTransactions,
      deletedAt: Date.now(),
    };
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [PENDING_DELETION_SETTINGS_KEY, JSON.stringify(pendingDeletion)],
    );

    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
      transactions: state.transactions.filter((t) => t.goalId !== id),
      pendingDeletion,
    }));
  },

  undoDelete: async () => {
    const pending = get().pendingDeletion;
    if (!pending) return;

    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO savings_goals
          (id, name, target_amount, current_amount, image_uri, emoji, accent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pending.goal.id,
          pending.goal.name,
          pending.goal.targetAmount,
          pending.goal.currentAmount,
          pending.goal.imageUri ?? null,
          pending.goal.emoji ?? null,
          pending.goal.accent,
          pending.goal.createdAt,
        ],
      );
      for (const t of pending.transactions) {
        await db.runAsync(
          `INSERT INTO savings_tx (id, goal_id, type, amount, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [t.id, t.goalId, t.type, t.amount, t.note ?? null, t.createdAt],
        );
      }
      await db.runAsync("DELETE FROM settings WHERE key = ?", [
        PENDING_DELETION_SETTINGS_KEY,
      ]);
    });

    set((state) => ({
      goals: [pending.goal, ...state.goals],
      transactions: [...pending.transactions, ...state.transactions],
      pendingDeletion: null,
    }));
  },

  commitPendingDeletion: async () => {
    const pending = get().pendingDeletion;
    if (pending?.goal.imageUri) {
      deleteGoalImage(pending.goal.imageUri);
    }
    const db = await getDb();
    await db.runAsync("DELETE FROM settings WHERE key = ?", [
      PENDING_DELETION_SETTINGS_KEY,
    ]);
    set({ pendingDeletion: null });
  },

  deposit: async (goalId, amount, note) => {
    if (amount <= 0) return;
    const tx: Transaction = {
      id: generateId("tx"),
      goalId,
      type: "deposit",
      amount,
      note,
      createdAt: Date.now(),
    };

    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO savings_tx (id, goal_id, type, amount, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [tx.id, tx.goalId, tx.type, tx.amount, tx.note ?? null, tx.createdAt],
      );
      await db.runAsync(
        "UPDATE savings_goals SET current_amount = current_amount + ? WHERE id = ?",
        [amount, goalId],
      );
    });

    set((state) => ({
      transactions: [tx, ...state.transactions],
      goals: state.goals.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: g.currentAmount + amount }
          : g,
      ),
    }));
  },

  withdraw: async (goalId, amount, note) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return { ok: false, error: "Goal tidak ditemukan" };
    if (amount <= 0)
      return { ok: false, error: "Jumlah harus lebih dari 0" };
    if (amount > goal.currentAmount) {
      return {
        ok: false,
        error: "Jumlah melebihi saldo tabungan goal ini",
      };
    }

    const tx: Transaction = {
      id: generateId("tx"),
      goalId,
      type: "withdrawal",
      amount,
      note,
      createdAt: Date.now(),
    };

    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO savings_tx (id, goal_id, type, amount, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [tx.id, tx.goalId, tx.type, tx.amount, tx.note ?? null, tx.createdAt],
      );
      await db.runAsync(
        "UPDATE savings_goals SET current_amount = current_amount - ? WHERE id = ?",
        [amount, goalId],
      );
    });

    set((state) => ({
      transactions: [tx, ...state.transactions],
      goals: state.goals.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: g.currentAmount - amount }
          : g,
      ),
    }));
    return { ok: true };
  },

  getGoalById: (id) => get().goals.find((g) => g.id === id),
}));
