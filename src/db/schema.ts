/**
 * Schema SQLite — fondasi Checkpoint 0 (migrasi dari AsyncStorage) sekaligus
 * checkpoint-checkpoint berikutnya (habit tracker, daily planner). Semua
 * tabel dibuat sekalian di sini walau `habits`/`habit_logs`/`todos` baru
 * benar-benar dipakai mulai Checkpoint 1 — biar gak ada migration schema
 * kedua nanti pas fitur itu mulai dibangun.
 *
 * `current_streak` SENGAJA gak disimpan sebagai kolom di `habits` — dihitung
 * on-the-fly dari `habit_logs` (query consecutive dates mundur dari hari
 * ini), biar gak ada resiko data drift antara nilai tersimpan vs kenyataan.
 * `best_streak` di-cache karena itu historical max, aman di-update sekali
 * pas ke-detect streak baru lebih tinggi, gak perlu dihitung ulang tiap render.
 */
/**
 * Versi schema saat ini + daftar migration incremental. `initDatabase()` di
 * `client.ts` jalanin migration yang versinya > `PRAGMA user_version`
 * tersimpan, urut, lalu update PRAGMA-nya. Dipakai buat nambah kolom ke
 * tabel yang UDAH ADA di device orang (CREATE TABLE IF NOT EXISTS di bawah
 * cuma ngaruh ke instalasi baru — DB yang udah ke-create sebelumnya gak
 * ikut ke-update strukturnya otomatis).
 */
export const SCHEMA_VERSION = 2;

export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    // v2 — notification_id per habit (Checkpoint 1: reminder habit).
    version: 2,
    sql: `ALTER TABLE habits ADD COLUMN notification_id TEXT;`,
  },
];

// ⚠️ KONVENSI PENTING: base schema di bawah ini merepresentasikan shape
// versi 1 (SCHEMA_VERSION awal project ini) — JANGAN diedit retroaktif tiap
// ada kolom baru. Semua perubahan struktur SETELAH ini WAJIB lewat
// `MIGRATIONS` di atas (nambah entry baru), bukan nyunting CREATE TABLE di
// sini. Kalau kolom baru ditambahin di DUA tempat (base schema + migration),
// instalasi baru bakal kena error "duplicate column" pas migration jalan,
// karena migration selalu dieksekusi abis CREATE_TABLES_SQL tanpa peduli
// apakah kolomnya udah ada duluan atau belum.
export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0,
  image_uri TEXT,
  emoji TEXT,
  accent TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS savings_tx (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount REAL NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_savings_tx_goal_id ON savings_tx(goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_tx_created_at ON savings_tx(created_at DESC);

-- Fondasi Checkpoint 1 (habit tracker) — belum dipakai store manapun sekarang.
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekdays')),
  weekdays_mask INTEGER NOT NULL DEFAULT 127,
  reminder_time TEXT,
  best_streak INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  archived_at INTEGER
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  habit_id TEXT NOT NULL,
  date TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE (habit_id, date)
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);

-- Fondasi Checkpoint 1 (daily planner) — belum dipakai store manapun sekarang.
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);

-- Key-value generic: reminder settings, migration flag, pending-deletion
-- snapshot, dan setting-setting lain di checkpoint depan (notif prefs,
-- widget prefs, onboarding_complete, dll).
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;
