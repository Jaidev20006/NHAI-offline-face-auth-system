/**
 * Database
 *
 * Manages all local SQLite storage via @op-engineering/op-sqlite (JSI, fastest binding).
 *
 * Tables:
 *   employees        — enrolled personnel with encrypted face embeddings
 *   attendance_logs  — timestamped attendance records
 *   sync_queue       — records awaiting upload to AWS
 */

import { open, DB } from '@op-engineering/op-sqlite';
import { DB_NAME } from '../constants';
import { encryptEmbedding, decryptEmbedding } from '../utils/Encryption';
import { embeddingToBase64, base64ToEmbedding } from '../utils/CosineSimilarity';

export interface Employee {
  id: string;
  name: string;
  employeeCode: string;
  embedding: Float32Array;
  enrolledAt: number;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: number;
  location?: string;
  synced: boolean;
}

let _db: DB | null = null;

async function getDb(): Promise<DB> {
  if (_db) return _db;
  _db = open({ name: DB_NAME });
  await migrate(_db);
  return _db;
}

async function migrate(db: DB): Promise<void> {
  await db.executeAsync(`
    CREATE TABLE IF NOT EXISTS employees (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      employee_code  TEXT NOT NULL UNIQUE,
      embedding_cipher TEXT NOT NULL,
      embedding_iv   TEXT NOT NULL,
      enrolled_at    INTEGER NOT NULL
    );
  `);

  await db.executeAsync(`
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id            TEXT PRIMARY KEY,
      employee_id   TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      timestamp     INTEGER NOT NULL,
      location      TEXT,
      synced        INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  await db.executeAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id          TEXT PRIMARY KEY,
      table_name  TEXT NOT NULL,
      record_id   TEXT NOT NULL,
      payload     TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL
    );
  `);

  // Indices for common queries
  await db.executeAsync(`CREATE INDEX IF NOT EXISTS idx_attendance_ts ON attendance_logs(timestamp DESC);`);
  await db.executeAsync(`CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at ASC);`);
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function enrollEmployee(employee: Employee): Promise<void> {
  const db = await getDb();
  const b64 = embeddingToBase64(employee.embedding);
  const { cipher, iv } = await encryptEmbedding(b64);

  await db.executeAsync(
    `INSERT OR REPLACE INTO employees
      (id, name, employee_code, embedding_cipher, embedding_iv, enrolled_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [employee.id, employee.name, employee.employeeCode, cipher, iv, employee.enrolledAt]
  );
}

export async function getAllEmployees(): Promise<Employee[]> {
  const db = await getDb();
  const result = await db.executeAsync('SELECT * FROM employees');
  const rows = result.rows?._array ?? [];
  const employees: Employee[] = [];

  for (const row of rows) {
    const b64 = await decryptEmbedding(row.embedding_cipher, row.embedding_iv);
    employees.push({
      id: row.id,
      name: row.name,
      employeeCode: row.employee_code,
      embedding: base64ToEmbedding(b64),
      enrolledAt: row.enrolled_at,
    });
  }
  return employees;
}

export async function deleteEmployee(id: string): Promise<void> {
  const db = await getDb();
  await db.executeAsync('DELETE FROM employees WHERE id = ?', [id]);
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function logAttendance(log: Omit<AttendanceLog, 'synced'>): Promise<void> {
  const db = await getDb();

  await db.executeAsync(
    `INSERT INTO attendance_logs (id, employee_id, employee_name, timestamp, location, synced)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [log.id, log.employeeId, log.employeeName, log.timestamp, log.location ?? null]
  );

  // Add to sync queue
  const payload = JSON.stringify({
    id: log.id,
    employeeId: log.employeeId,
    employeeName: log.employeeName,
    timestamp: log.timestamp,
    location: log.location,
  });
  await db.executeAsync(
    `INSERT INTO sync_queue (id, table_name, record_id, payload, retry_count, created_at)
     VALUES (?, 'attendance_logs', ?, ?, 0, ?)`,
    [log.id + '_sync', log.id, payload, Date.now()]
  );
}

export async function getRecentAttendance(limit = 50): Promise<AttendanceLog[]> {
  const db = await getDb();
  const result = await db.executeAsync(
    'SELECT * FROM attendance_logs ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
  return (result.rows?._array ?? []).map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    timestamp: row.timestamp,
    location: row.location,
    synced: row.synced === 1,
  }));
}

// ─── Sync queue ───────────────────────────────────────────────────────────────

export interface SyncQueueItem {
  id: string;
  tableName: string;
  recordId: string;
  payload: string;
  retryCount: number;
}

export async function getPendingSyncItems(limit = 50): Promise<SyncQueueItem[]> {
  const db = await getDb();
  const result = await db.executeAsync(
    'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT ?',
    [limit]
  );
  return (result.rows?._array ?? []).map((row: any) => ({
    id: row.id,
    tableName: row.table_name,
    recordId: row.record_id,
    payload: row.payload,
    retryCount: row.retry_count,
  }));
}

export async function markSyncSuccess(syncId: string, recordId: string): Promise<void> {
  const db = await getDb();
  await db.executeAsync('DELETE FROM sync_queue WHERE id = ?', [syncId]);
  await db.executeAsync(
    'UPDATE attendance_logs SET synced = 1 WHERE id = ?',
    [recordId]
  );
}

export async function incrementRetryCount(syncId: string): Promise<void> {
  const db = await getDb();
  await db.executeAsync(
    'UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?',
    [syncId]
  );
}

export async function removeFailedSyncItems(maxRetries: number): Promise<void> {
  const db = await getDb();
  await db.executeAsync(
    'DELETE FROM sync_queue WHERE retry_count >= ?',
    [maxRetries]
  );
}

export async function getPendingSyncCount(): Promise<number> {
  const db = await getDb();
  const result = await db.executeAsync('SELECT COUNT(*) as count FROM sync_queue');
  return result.rows?._array[0]?.count ?? 0;
}
