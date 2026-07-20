import * as SQLite from "expo-sqlite";
import { CREATE_TABLES_SQL } from "./schema";

/**
 * Nama file DB sengaja generic ("app.db", bukan "tabungan.db") — rename app
 * ke "heibi" nanti (lihat PROJECT_CONTEXT.md) gak perlu migrasi file DB.
 */
const DB_NAME = "app.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Singleton koneksi database — dibuka sekali per lifecycle app. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

let initPromise: Promise<void> | null = null;

/**
 * Bikin semua tabel kalau belum ada (`CREATE TABLE IF NOT EXISTS`, aman
 * dipanggil berkali-kali). WAJIB di-await sebelum query lain jalan — panggil
 * ini paling awal di bootstrap `app/_layout.tsx`.
 */
export function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDb();
      await db.execAsync(CREATE_TABLES_SQL);
    })();
  }
  return initPromise;
}
