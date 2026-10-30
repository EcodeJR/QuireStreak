import { getDB } from './schema';
import { generateUUID } from './uuid';

export interface ReadingSession {
  id: string;
  bookId: string;
  stackId: string;
  date: string; // YYYY-MM-DD
  durationSeconds: number;
  startedAt: string;
  endedAt: string | null;
}

export interface StreakDay {
  date: string;       // YYYY-MM-DD
  totalMinutes: number;
  goalMinutes: number;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Start a new reading session, returning its id. */
export async function startSession(bookId: string, stackId: string): Promise<string> {
  const db = await getDB();
  const id = generateUUID();
  const now = new Date().toISOString();
  const date = now.slice(0, 10);
  await db.runAsync(
    `INSERT INTO reading_sessions(id, bookId, stackId, date, durationSeconds, startedAt, endedAt)
     VALUES (?, ?, ?, ?, 0, ?, NULL)`,
    [id, bookId, stackId, date, now],
  );
  return id;
}

/** End a session and update the streak day. Returns true if the day goal was just met. */
export async function endSession(sessionId: string, durationSeconds: number): Promise<boolean> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE reading_sessions SET durationSeconds = ?, endedAt = ? WHERE id = ?`,
    [durationSeconds, now, sessionId],
  );

  const date = todayISO();
  // Aggregate all sessions for today
  const agg = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(durationSeconds), 0) as total FROM reading_sessions WHERE date = ?`,
    [date],
  );
  const totalMinutes = (agg?.total ?? 0) / 60;

  const goal = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'dailyGoalMinutes'`,
  );
  const goalMinutes = parseFloat(goal?.value ?? '60');
  const prevWasMet = await db.getFirstAsync<{ tm: number }>(
    `SELECT totalMinutes as tm FROM streak_days WHERE date = ?`, [date],
  );
  const prevMetGoal = (prevWasMet?.tm ?? 0) >= goalMinutes;

  await db.runAsync(
    `INSERT INTO streak_days(date, totalMinutes, goalMinutes) VALUES(?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET totalMinutes = excluded.totalMinutes, goalMinutes = excluded.goalMinutes`,
    [date, totalMinutes, goalMinutes],
  );

  const nowMetGoal = totalMinutes >= goalMinutes;
  return nowMetGoal && !prevMetGoal; // true = newly crossed goal today
}

/** Get streak days for the last N weeks (default 13 = 91 days ~ heatmap). */
export async function getStreakDays(weeks = 13): Promise<StreakDay[]> {
  const db = await getDB();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  const from = cutoff.toISOString().slice(0, 10);
  return db.getAllAsync<StreakDay>(
    `SELECT date, totalMinutes, goalMinutes FROM streak_days WHERE date >= ? ORDER BY date ASC`,
    [from],
  );
}

/** Current streak: consecutive days with at least minEngagedMinutes. */
export async function getCurrentStreak(): Promise<number> {
  const db = await getDB();
  const minRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'minEngagedMinutes'`,
  );
  const min = parseFloat(minRow?.value ?? '10');

  const days = await db.getAllAsync<{ date: string }>(
    `SELECT date FROM streak_days WHERE totalMinutes >= ? ORDER BY date DESC`,
    [min],
  );

  if (!days.length) return 0;
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const { date } of days) {
    const d = new Date(date + 'T00:00:00');
    const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

export async function getLongestStreak(): Promise<number> {
  const db = await getDB();
  const minRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'minEngagedMinutes'`,
  );
  const min = parseFloat(minRow?.value ?? '10');
  const days = await db.getAllAsync<{ date: string }>(
    `SELECT date FROM streak_days WHERE totalMinutes >= ? ORDER BY date ASC`,
    [min],
  );

  let best = 0, current = 0;
  let prev: Date | null = null;
  for (const { date } of days) {
    const d = new Date(date + 'T00:00:00');
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) {
        current++;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }
    if (current > best) best = current;
    prev = d;
  }
  return best;
}

export async function getMonthlyDaysRead(): Promise<number> {
  const db = await getDB();
  const minRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'minEngagedMinutes'`,
  );
  const min = parseFloat(minRow?.value ?? '10');
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM streak_days WHERE date >= ? AND totalMinutes >= ?`,
    [from, min],
  );
  return row?.c ?? 0;
}

export async function getBooksFinishedThisYear(): Promise<number> {
  const db = await getDB();
  const year = new Date().getFullYear();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM reading_sessions
     WHERE date >= ? AND date <= ?
     GROUP BY bookId
     HAVING SUM(durationSeconds) > 0`,
    [from, to],
  );
  return row?.c ?? 0;
}

export async function getTodayMinutes(): Promise<number> {
  const db = await getDB();
  const date = todayISO();
  const row = await db.getFirstAsync<{ tm: number }>(
    `SELECT totalMinutes as tm FROM streak_days WHERE date = ?`, [date],
  );
  return row?.tm ?? 0;
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}
