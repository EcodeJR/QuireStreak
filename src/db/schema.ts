// Database schema and initialization for QuireStreak
// Uses expo-sqlite with clean, UUID-keyed records designed for future sync compatibility.

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('quirestreak.db');
  await initSchema(db);
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS stacks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      sortOrder INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      stackId TEXT NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT '',
      format TEXT NOT NULL CHECK(format IN ('epub','pdf')),
      filePath TEXT NOT NULL,
      coverPath TEXT,
      pageCount INTEGER,
      wordCount INTEGER,
      queuePosition INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','reading','finished')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reading_positions (
      bookId TEXT PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
      cfiOrPage TEXT NOT NULL DEFAULT '',
      percentRead REAL NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reading_sessions (
      id TEXT PRIMARY KEY,
      bookId TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      stackId TEXT NOT NULL,
      date TEXT NOT NULL,
      durationSeconds INTEGER NOT NULL DEFAULT 0,
      startedAt TEXT NOT NULL,
      endedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS streak_days (
      date TEXT PRIMARY KEY,
      totalMinutes REAL NOT NULL DEFAULT 0,
      goalMinutes REAL NOT NULL DEFAULT 60
    );

    CREATE INDEX IF NOT EXISTS idx_books_stack ON books(stackId);
    CREATE INDEX IF NOT EXISTS idx_sessions_book ON reading_sessions(bookId);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON reading_sessions(date);
    CREATE INDEX IF NOT EXISTS idx_streak_date ON streak_days(date);
  `);

  // Seed default settings if not present
  await database.runAsync(
    `INSERT OR IGNORE INTO settings(key, value) VALUES
      ('dailyGoalMinutes', '60'),
      ('minEngagedMinutes', '10'),
      ('readerFontSize', '18'),
      ('readerLineSpacing', '1.6'),
      ('readerTheme', 'paper'),
      ('colorScheme', 'system')
    `,
  );
}
