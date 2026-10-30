import { getDB } from './schema';
import { generateUUID } from './uuid';

export interface Stack {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isActive: number;
  sortOrder: number;
}

export async function getStacks(): Promise<Stack[]> {
  const db = await getDB();
  return db.getAllAsync<Stack>(
    `SELECT * FROM stacks ORDER BY isActive DESC, sortOrder ASC, name ASC`,
  );
}

export async function createStack(name: string): Promise<Stack> {
  const db = await getDB();
  const now = new Date().toISOString();
  const id = generateUUID();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    `SELECT COALESCE(MAX(sortOrder), 0) as m FROM stacks`,
  );
  const sortOrder = (maxOrder?.m ?? 0) + 1;
  await db.runAsync(
    `INSERT INTO stacks(id, name, createdAt, updatedAt, isActive, sortOrder)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [id, name, now, now, sortOrder],
  );
  return { id, name, createdAt: now, updatedAt: now, isActive: 1, sortOrder };
}

export async function updateStack(id: string, patch: Partial<Pick<Stack, 'name' | 'isActive' | 'sortOrder'>>): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const fields = Object.keys(patch).map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(patch), now, id];
  await db.runAsync(`UPDATE stacks SET ${fields}, updatedAt = ? WHERE id = ?`, values);
}

export async function deleteStack(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM stacks WHERE id = ?`, [id]);
}
