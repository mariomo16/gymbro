import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

type Db = InstanceType<typeof DatabaseSync>;
type SqlValue = string | number | bigint | null | Uint8Array;

const g = globalThis as unknown as { __gymbroDb?: Db };

function openDb(): Db {
  const dataDir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "gymbro.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  initSchema(db);
  return db;
}

export function getDb(): Db {
  if (!g.__gymbroDb) g.__gymbroDb = openDb();
  return g.__gymbroDb;
}

function plain<T>(row: T): T {
  if (row === null || typeof row !== "object") return row;
  return Object.fromEntries(Object.entries(row)) as T;
}

export function all<T>(sql: string, ...params: SqlValue[]): T[] {
  return (
    getDb()
      .prepare(sql)
      .all(...params) as T[]
  ).map(plain);
}

export function get<T>(sql: string, ...params: SqlValue[]): T | undefined {
  const row = getDb()
    .prepare(sql)
    .get(...params) as T | undefined;
  return row === undefined ? undefined : plain(row);
}

export function run(
  sql: string,
  ...params: SqlValue[]
): { changes: number; lastInsertRowid: number } {
  const r = getDb()
    .prepare(sql)
    .run(...params);
  return {
    changes: Number(r.changes),
    lastInsertRowid: Number(r.lastInsertRowid),
  };
}

export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const out = fn();
    db.exec("COMMIT");
    return out;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function initSchema(db: Db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS muscle_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      muscle_group_id INTEGER NOT NULL REFERENCES muscle_groups(id),
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE (user_id, name)
    );

    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routine_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
      UNIQUE (routine_id, weekday)
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_day_id INTEGER NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      position INTEGER NOT NULL,
      target_sets INTEGER
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      routine_day_id INTEGER REFERENCES routine_days(id) ON DELETE SET NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      duration_seconds INTEGER
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      position INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS body_weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      UNIQUE (user_id, date)
    );
  `);

  const count = db.prepare("SELECT COUNT(*) AS n FROM muscle_groups").get() as {
    n: number;
  };
  if (!Number(count.n)) {
    const insert = db.prepare(
      "INSERT OR IGNORE INTO muscle_groups (name) VALUES (?)",
    );
    for (const name of [
      "Pecho",
      "Espalda",
      "Hombros",
      "Bíceps",
      "Tríceps",
      "Antebrazo",
      "Cuádriceps",
      "Femoral",
      "Glúteos",
      "Gemelos",
      "Abdomen",
      "Cardio",
    ]) {
      insert.run(name);
    }
  }
}
