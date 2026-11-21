import { randomBytes } from 'node:crypto';
import { clusterReport, createSeedState } from '@/lib/engine';
import type { CitizenCase, CitizenReportRow, CitizenStatus } from '@/lib/citizen';
import { insertRow, listRows, updateCaseStatus } from './db';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function code(length: number): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export interface NewReportInput {
  lat: number;
  lng: number;
  category: string;
  description: string;
  reporterName?: string | null;
  reporterPhone?: string | null;
}

export async function createReport(input: NewReportInput): Promise<CitizenReportRow> {
  const rows = await listRows();

  const centroids = new Map<string, { id: string; lat: number; lng: number; count: number }>();
  for (const row of rows) {
    const current = centroids.get(row.caseId);
    if (current) {
      current.lat += row.lat;
      current.lng += row.lng;
      current.count += 1;
    } else {
      centroids.set(row.caseId, { id: row.caseId, lat: row.lat, lng: row.lng, count: 1 });
    }
  }

  const candidates = [
    ...createSeedState().hotspots.map((h) => ({ id: h.id, lat: h.lat, lng: h.lng })),
    ...[...centroids.values()].map((c) => ({
      id: c.id,
      lat: c.lat / c.count,
      lng: c.lng / c.count
    }))
  ];

  const cluster = clusterReport({ lat: input.lat, lng: input.lng }, candidates, 30);
  const caseId = cluster.matchedId ?? `CZ-${code(4)}`;
  const reference = `KL-${new Date().getFullYear()}-${code(6)}`;

  const row: CitizenReportRow = {
    reference,
    caseId,
    createdAt: new Date().toISOString(),
    status: 'RECEIVED',
    lat: input.lat,
    lng: input.lng,
    category: input.category,
    description: input.description,
    reporterName: input.reporterName || null,
    reporterPhone: input.reporterPhone || null,
    distanceM: cluster.distanceMeters,
    action: cluster.matchedId ? 'MERGED' : 'NEW'
  };

  await insertRow(row);
  return row;
}

export async function listCitizenCases(): Promise<CitizenCase[]> {
  const rows = await listRows();
  const cases = new Map<string, CitizenCase>();

  for (const row of rows) {
    const existing = cases.get(row.caseId);
    if (existing) {
      existing.count += 1;
      continue;
    }
    cases.set(row.caseId, {
      caseId: row.caseId,
      reference: row.reference,
      status: row.status,
      category: row.category,
      description: row.description,
      lat: row.lat,
      lng: row.lng,
      createdAt: row.createdAt,
      count: 1,
      action: row.action
    });
  }

  return [...cases.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReport(reference: string): Promise<CitizenReportRow | null> {
  const rows = await listRows();
  return rows.find((row) => row.reference === reference) ?? null;
}

export async function setCaseStatus(caseId: string, status: CitizenStatus): Promise<void> {
  await updateCaseStatus(caseId, status);
}
