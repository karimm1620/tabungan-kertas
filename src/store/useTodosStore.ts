import { create } from "zustand";
import { getDb } from "../db/client";
import type { CreateTodoInput, Todo } from "../types";
import { getLocalDateKey } from "../utils/date";
import { generateId } from "../utils/id";

interface TodoRow {
  id: string;
  title: string;
  date: string;
  completed_at: number | null;
  created_at: number;
}

function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

interface TodosState {
  todos: Todo[];
  hasHydrated: boolean;

  hydrate: () => Promise<void>;
  addTodo: (input: CreateTodoInput) => Promise<Todo>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;

  getTodosForDate: (dateKey: string) => Todo[];
  getTodayTodos: () => Todo[];
  // ⚠️ Sama kayak di `useHabitsStore` — 2 method di atas itu HELPER IMPERATIF,
  // JANGAN dipakai sebagai reactive selector. Di komponen, select `todos`
  // mentah terus filter sendiri lewat `useMemo`.
}

/**
 * Todos itu ephemeral (gak ada nilai historis jangka panjang kayak habit
 * streak) — makanya `deleteTodo` di sini HARD delete langsung, gak ada
 * archive/soft-delete kayak `useHabitsStore`.
 */
export const useTodosStore = create<TodosState>()((set, get) => ({
  todos: [],
  hasHydrated: false,

  hydrate: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<TodoRow>(
      "SELECT * FROM todos ORDER BY created_at DESC",
    );
    set({ todos: rows.map(rowToTodo), hasHydrated: true });
  },

  addTodo: async (input) => {
    const newTodo: Todo = {
      id: generateId("todo"),
      title: input.title.trim(),
      date: input.date,
      completedAt: null,
      createdAt: Date.now(),
    };

    const db = await getDb();
    await db.runAsync(
      "INSERT INTO todos (id, title, date, completed_at, created_at) VALUES (?, ?, ?, ?, ?)",
      [
        newTodo.id,
        newTodo.title,
        newTodo.date,
        newTodo.completedAt,
        newTodo.createdAt,
      ],
    );

    set((state) => ({ todos: [newTodo, ...state.todos] }));
    return newTodo;
  },

  toggleTodo: async (id) => {
    const existing = get().todos.find((t) => t.id === id);
    if (!existing) return;
    const completedAt = existing.completedAt ? null : Date.now();

    const db = await getDb();
    await db.runAsync("UPDATE todos SET completed_at = ? WHERE id = ?", [
      completedAt,
      id,
    ]);

    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, completedAt } : t)),
    }));
  },

  deleteTodo: async (id) => {
    const db = await getDb();
    await db.runAsync("DELETE FROM todos WHERE id = ?", [id]);
    set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }));
  },

  getTodosForDate: (dateKey) =>
    get().todos.filter((t) => t.date === dateKey),

  getTodayTodos: () => get().todos.filter((t) => t.date === getLocalDateKey()),
}));
