import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import type { CitizenReportRow, CitizenStatus } from '@/lib/citizen';

export type StorageMode = 'postgres' | 'file' | 'unavailable';

export const storageMode: StorageMode = process.env.DATABASE_URL
  ? 'postgres'
  : process.env.VERCEL
    ? 'unavailable'
    : 'file';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      ssl: process.env.PGSSL === 'disable' ? undefined : { rejectUnauthorized: false }
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await getPool().query(`
        CREATE TABLE IF NOT EXISTS citizen_reports (
          reference TEXT PRIMARY KEY,
          case_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          status TEXT NOT NULL DEFAULT 'RECEIVED',
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          reporter_name TEXT,
          reporter_phone TEXT,
          distance_m DOUBLE PRECISION NOT NULL DEFAULT 0,
          action TEXT NOT NULL
        )
      `);
      await getPool().query(
        'CREATE INDEX IF NOT EXISTS citizen_reports_case_idx ON citizen_reports (case_id)'
      );
    })();
  }
  return schemaReady;
}

interface DbRow {
  reference: string;
  case_id: string;
  created_at: Date | string;
  status: string;
  lat: number | string;
  lng: number | string;
  category: string;
  description: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  distance_m: number | string;
  action: string;
}

function mapRow(row: DbRow): CitizenReportRow {
  return {
    reference: row.reference,
    caseId: row.case_id,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status as CitizenStatus,
    lat: Number(row.lat),
    lng: Number(row.lng),
    category: row.category,
    description: row.description,
    reporterName: row.reporter_name,
    reporterPhone: row.reporter_phone,
    distanceM: Number(row.distance_m),
    action: row.action === 'MERGED' ? 'MERGED' : 'NEW'
  };
}

let fileLock: Promise<unknown> = Promise.resolve();

function withFileLock<T>(work: () => Promise<T>): Promise<T> {
  const run = fileLock.then(work, work);
  fileLock = run.catch(() => undefined);
  return run;
}

async function readFileRows(): Promise<CitizenReportRow[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CitizenReportRow[]) : [];
  } catch {
    return [];
  }
}

export async function listRows(): Promise<CitizenReportRow[]> {
  if (storageMode === 'unavailable') return [];

  if (storageMode === 'file') {
    const rows = await readFileRows();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  await ensureSchema();
  const result = await getPool().query<DbRow>(
    'SELECT * FROM citizen_reports ORDER BY created_at DESC LIMIT 500'
  );
  return result.rows.map(mapRow);
}

export async function insertRow(row: CitizenReportRow): Promise<void> {
  if (storageMode === 'unavailable') throw new Error('storage_unavailable');

  if (storageMode === 'file') {
    await withFileLock(async () => {
      const rows = await readFileRows();
      rows.unshift(row);
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify(rows, null, 2), 'utf8');
    });
    return;
  }

  await ensureSchema();
  await getPool().query(
    `INSERT INTO citizen_reports
      (reference, case_id, created_at, status, lat, lng, category, description,
       reporter_name, reporter_phone, distance_m, action)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      row.reference,
      row.caseId,
      row.createdAt,
      row.status,
      row.lat,
      row.lng,
      row.category,
      row.description,
      row.reporterName,
      row.reporterPhone,
      row.distanceM,
      row.action
    ]
  );
}

export async function updateCaseStatus(caseId: string, status: CitizenStatus): Promise<void> {
  if (storageMode === 'unavailable') throw new Error('storage_unavailable');

  if (storageMode === 'file') {
    await withFileLock(async () => {
      const rows = await readFileRows();
      const next = rows.map((row) => (row.caseId === caseId ? { ...row, status } : row));
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), 'utf8');
    });
    return;
  }

  await ensureSchema();
  await getPool().query('UPDATE citizen_reports SET status = $1 WHERE case_id = $2', [
    status,
    caseId
  ]);
}
