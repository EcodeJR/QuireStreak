import { getDB } from './schema';
import { generateUUID } from './uuid';

export interface Book {
  id: string;
  stackId: string;
  title: string;
  author: string;
  format: 'epub' | 'pdf';
  filePath: string;
  coverPath: string | null;
  pageCount: number | null;
  wordCount: number | null;
  queuePosition: number;
  status: 'queued' | 'reading' | 'finished';
  createdAt: string;
  updatedAt: string;
}

export interface ReadingPosition {
  bookId: string;
  cfiOrPage: string;
  percentRead: number;
  updatedAt: string;
}

export async function getBooksForStack(stackId: string): Promise<Book[]> {
  const db = await getDB();
  return db.getAllAsync<Book>(
    `SELECT * FROM books WHERE stackId = ? ORDER BY queuePosition ASC`,
    [stackId],
  );
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  return db.getAllAsync<Book>(`SELECT * FROM books ORDER BY stackId, queuePosition ASC`);
}

export async function getBook(id: string): Promise<Book | null> {
  const db = await getDB();
  return db.getFirstAsync<Book>(`SELECT * FROM books WHERE id = ?`, [id]);
}

export async function getActiveBook(stackId: string): Promise<Book | null> {
  const db = await getDB();
  return db.getFirstAsync<Book>(
    `SELECT * FROM books WHERE stackId = ? AND status = 'reading' ORDER BY queuePosition ASC LIMIT 1`,
    [stackId],
  );
}

export interface CreateBookInput {
  stackId: string;
  title: string;
  author: string;
  format: 'epub' | 'pdf';
  filePath: string;
  coverPath?: string;
  pageCount?: number;
  wordCount?: number;
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  const db = await getDB();
  const now = new Date().toISOString();
  const id = generateUUID();

  // Figure out next queue position in this stack
  const maxPos = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(queuePosition), 0) as m FROM books WHERE stackId = ?`,
    [input.stackId],
  );
  const queuePosition = (maxPos?.m ?? 0) + 1;

  // First book in a stack becomes 'reading'
  const existing = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM books WHERE stackId = ?`,
    [input.stackId],
  );
  const status: Book['status'] = (existing?.c ?? 0) === 0 ? 'reading' : 'queued';

  await db.runAsync(
    `INSERT INTO books(id, stackId, title, author, format, filePath, coverPath, pageCount, wordCount, queuePosition, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, input.stackId, input.title, input.author, input.format,
      input.filePath, input.coverPath ?? null,
      input.pageCount ?? null, input.wordCount ?? null,
      queuePosition, status, now, now,
    ],
  );

  // Create initial reading position
  await db.runAsync(
    `INSERT OR IGNORE INTO reading_positions(bookId, cfiOrPage, percentRead, updatedAt) VALUES (?, '', 0, ?)`,
    [id, now],
  );

  return {
    id, stackId: input.stackId, title: input.title, author: input.author,
    format: input.format, filePath: input.filePath, coverPath: input.coverPath ?? null,
    pageCount: input.pageCount ?? null, wordCount: input.wordCount ?? null,
    queuePosition, status, createdAt: now, updatedAt: now,
  };
}

export async function updateBookStatus(id: string, status: Book['status']): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.runAsync(`UPDATE books SET status = ?, updatedAt = ? WHERE id = ?`, [status, now, id]);
}

export async function finishBook(bookId: string, stackId: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  // Mark this book finished
  await db.runAsync(`UPDATE books SET status = 'finished', updatedAt = ? WHERE id = ?`, [now, bookId]);
  // Auto-surface next queued book in the same stack
  const next = await db.getFirstAsync<Book>(
    `SELECT * FROM books WHERE stackId = ? AND status = 'queued' ORDER BY queuePosition ASC LIMIT 1`,
    [stackId],
  );
  if (next) {
    await db.runAsync(`UPDATE books SET status = 'reading', updatedAt = ? WHERE id = ?`, [now, next.id]);
  }
}

export async function updateReadingPosition(bookId: string, cfiOrPage: string, percentRead: number): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO reading_positions(bookId, cfiOrPage, percentRead, updatedAt) VALUES (?, ?, ?, ?)
     ON CONFLICT(bookId) DO UPDATE SET cfiOrPage = excluded.cfiOrPage, percentRead = excluded.percentRead, updatedAt = excluded.updatedAt`,
    [bookId, cfiOrPage, percentRead, now],
  );
}

export async function getReadingPosition(bookId: string): Promise<ReadingPosition | null> {
  const db = await getDB();
  return db.getFirstAsync<ReadingPosition>(
    `SELECT * FROM reading_positions WHERE bookId = ?`, [bookId],
  );
}

export async function reorderBooks(stackId: string, orderedIds: string[]): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        `UPDATE books SET queuePosition = ?, updatedAt = ? WHERE id = ? AND stackId = ?`,
        [i + 1, now, orderedIds[i], stackId],
      );
    }
  });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM books WHERE id = ?`, [id]);
}
