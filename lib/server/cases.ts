import { computeRisk, createSeedState, type Factors, type Hotspot } from '@/lib/engine';
import type { CitizenReportRow, CitizenStatus } from '@/lib/citizen';
import {
  SLA_HOURS,
  TEAMS,
  isCasePriority,
  isCaseStatus,
  type CaseAction,
  type CaseEvent,
  type CasePriority,
  type CaseRow,
  type CaseStatus
} from '@/lib/case';
import {
  query,
  readJsonCollection,
  storageMode,
  updateCaseStatus,
  writeJsonCollection
} from './db';

const CASES_FILE = 'cases.json';
const EVENTS_FILE = 'case_events.json';

const HAZARD_BY_CATEGORY: Record<string, number> = {
  'Garbage pile': 72,
  'Overflowing bin': 56,
  'Open dumping': 86,
  'Construction debris': 66,
  Other: 50
};

export class CaseActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaseActionError';
  }
}

export interface CaseActionInput {
  action: CaseAction;
  team?: string;
  note?: string;
  priority?: CasePriority;
  actor?: string;
}

interface CaseDbRow {
  id: string;
  source: string;
  name: string;
  ward: string;
  lat: number | string;
  lng: number | string;
  waste_type: string;
  reports_count: number | string;
  priority: string;
  status: string;
  team: string | null;
  due_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  cleared_at: Date | string | null;
  verification_day: number | string;
  spillover: boolean;
  contract_total: number | string;
  escrow_held: number | string;
  factors: unknown;
  reference: string | null;
  description: string | null;
  escrow_state: string | null;
  escrow_released_at: Date | string | null;
}

interface EventDbRow {
  id: number | string;
  case_id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  actor: string;
  created_at: Date | string;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function addHours(date: Date, hours: number): string {
  return new Date(date.getTime() + hours * 3_600_000).toISOString();
}

function priorityFor(score: number): CasePriority {
  if (score >= 80) return 'P1';
  if (score >= 55) return 'P2';
  return 'P3';
}

const PRIORITY_RANK: Record<CasePriority, number> = { P1: 0, P2: 1, P3: 2 };

function maxPriority(a: CasePriority, b: CasePriority): CasePriority {
  return PRIORITY_RANK[a] <= PRIORITY_RANK[b] ? a : b;
}

function parseFactors(value: unknown): Factors {
  let raw: unknown = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = {};
    }
  }
  const obj = (raw ?? {}) as Partial<Factors>;
  return {
    recurrence: Number(obj.recurrence ?? 0),
    hazard: Number(obj.hazard ?? 0),
    proximity: Number(obj.proximity ?? 0),
    duration: Number(obj.duration ?? 0)
  };
}

function mapCase(row: CaseDbRow): CaseRow {
  const escrowState =
    row.escrow_state === 'RELEASED' || row.escrow_state === 'WITHHELD' ? row.escrow_state : 'HELD';
  return {
    id: row.id,
    source: row.source === 'citizen' ? 'citizen' : 'seed',
    name: row.name,
    ward: row.ward,
    lat: Number(row.lat),
    lng: Number(row.lng),
    wasteType: row.waste_type,
    reportsCount: Number(row.reports_count),
    priority: isCasePriority(row.priority) ? row.priority : 'P3',
    status: isCaseStatus(row.status) ? row.status : 'RECEIVED',
    team: row.team,
    dueAt: toIso(row.due_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
    clearedAt: toIso(row.cleared_at),
    verificationDay: Number(row.verification_day ?? 0),
    spillover: Boolean(row.spillover),
    contractTotal: Number(row.contract_total),
    escrowHeld: Number(row.escrow_held),
    factors: parseFactors(row.factors),
    reference: row.reference,
    description: row.description ?? '',
    escrowState,
    escrowReleasedAt: toIso(row.escrow_released_at)
  };
}

function mapEvent(row: EventDbRow): CaseEvent {
  return {
    id: Number(row.id),
    caseId: row.case_id,
    action: row.action,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    note: row.note,
    actor: row.actor,
    createdAt: toIso(row.created_at) ?? new Date().toISOString()
  };
}

function seedStatus(status: Hotspot['status']): CaseStatus {
  switch (status) {
    case 'UNDER_MONITORING':
      return 'CLEARED';
    case 'CRITICAL_P1':
      return 'TRIAGED';
    case 'VERIFIED_CLEAN':
      return 'VERIFIED';
    case 'IN_INTERVENTION':
      return 'ASSIGNED';
    case 'RECURRING':
      return 'RECURRING';
    case 'NEW':
      return 'RECEIVED';
    default:
      return 'RECEIVED';
  }
}

function seedToCase(hotspot: Hotspot): CaseRow {
  const status = seedStatus(hotspot.status);
  const priority = priorityFor(computeRisk(hotspot.factors, 1).capped);
  const createdAt = new Date(Date.now() - 72 * 3_600_000).toISOString();
  const team =
    status === 'ASSIGNED'
      ? TEAMS[0]
      : status === 'IN_PROGRESS' || status === 'CLEARED'
        ? TEAMS[1]
        : status === 'RECURRING'
          ? TEAMS[3]
          : null;
  const closed = status === 'CLOSED' || status === 'VERIFIED';

  return {
    id: hotspot.id,
    source: 'seed',
    name: hotspot.name,
    ward: hotspot.ward,
    lat: hotspot.lat,
    lng: hotspot.lng,
    wasteType: hotspot.wasteType,
    reportsCount: hotspot.reports30d,
    priority,
    status,
    team,
    dueAt: closed ? null : addHours(new Date(), SLA_HOURS[priority]),
    createdAt,
    updatedAt: createdAt,
    clearedAt: status === 'CLEARED' || status === 'VERIFIED' ? createdAt : null,
    verificationDay: hotspot.monitor.currentDay,
    spillover: hotspot.monitor.spillover,
    contractTotal: hotspot.contract.total,
    escrowHeld: hotspot.contract.heldAmount,
    factors: hotspot.factors,
    reference: null,
    description: '',
    escrowState: hotspot.contract.escrow,
    escrowReleasedAt: hotspot.contract.escrow === 'RELEASED' ? createdAt : null
  };
}

const CASE_COLUMNS = [
  'id',
  'source',
  'name',
  'ward',
  'lat',
  'lng',
  'waste_type',
  'reports_count',
  'priority',
  'status',
  'team',
  'due_at',
  'created_at',
  'updated_at',
  'cleared_at',
  'verification_day',
  'spillover',
  'contract_total',
  'escrow_held',
  'factors',
  'reference',
  'description',
  'escrow_state',
  'escrow_released_at'
];

function caseValues(item: CaseRow): unknown[] {
  return [
    item.id,
    item.source,
    item.name,
    item.ward,
    item.lat,
    item.lng,
    item.wasteType,
    item.reportsCount,
    item.priority,
    item.status,
    item.team,
    item.dueAt,
    item.createdAt,
    item.updatedAt,
    item.clearedAt,
    item.verificationDay,
    item.spillover,
    item.contractTotal,
    item.escrowHeld,
    JSON.stringify(item.factors),
    item.reference,
    item.description,
    item.escrowState,
    item.escrowReleasedAt
  ];
}

async function insertCase(item: CaseRow): Promise<void> {
  if (storageMode === 'file') {
    const rows = await readJsonCollection<CaseRow>(CASES_FILE);
    if (!rows.some((row) => row.id === item.id)) {
      await writeJsonCollection(CASES_FILE, [...rows, item]);
    }
    return;
  }

  await query(
    `INSERT INTO cases (${CASE_COLUMNS.join(', ')})
     VALUES (${CASE_COLUMNS.map((_, index) => `$${index + 1}`).join(', ')})
     ON CONFLICT (id) DO NOTHING`,
    caseValues(item)
  );
}

async function writeCase(item: CaseRow): Promise<CaseRow> {
  if (storageMode === 'file') {
    const rows = await readJsonCollection<CaseRow>(CASES_FILE);
    const index = rows.findIndex((row) => row.id === item.id);
    if (index === -1) rows.push(item);
    else rows[index] = item;
    await writeJsonCollection(CASES_FILE, rows);
    return item;
  }

  const rows = await query<CaseDbRow>(
    `UPDATE cases SET
       status = $2, priority = $3, team = $4, due_at = $5, cleared_at = $6,
       verification_day = $7, spillover = $8, escrow_held = $9, escrow_state = $10,
       escrow_released_at = $11, reports_count = $12, factors = $13, description = $14,
       updated_at = $15
     WHERE id = $1
     RETURNING *`,
    [
      item.id,
      item.status,
      item.priority,
      item.team,
      item.dueAt,
      item.clearedAt,
      item.verificationDay,
      item.spillover,
      item.escrowHeld,
      item.escrowState,
      item.escrowReleasedAt,
      item.reportsCount,
      JSON.stringify(item.factors),
      item.description,
      item.updatedAt
    ]
  );
  if (!rows[0]) throw new Error('case_not_found');
  return mapCase(rows[0]);
}

async function appendEvent(
  caseId: string,
  action: string,
  fromStatus: string | null,
  toStatus: string | null,
  note: string | null,
  actor: string
): Promise<void> {
  if (storageMode === 'file') {
    const events = await readJsonCollection<CaseEvent>(EVENTS_FILE);
    const id = events.reduce((max, event) => Math.max(max, event.id), 0) + 1;
    events.push({
      id,
      caseId,
      action,
      fromStatus,
      toStatus,
      note,
      actor,
      createdAt: new Date().toISOString()
    });
    await writeJsonCollection(EVENTS_FILE, events);
    return;
  }

  await query(
    `INSERT INTO case_events (case_id, action, from_status, to_status, note, actor)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [caseId, action, fromStatus, toStatus, note, actor]
  );
}

let seedPromise: Promise<void> | null = null;

async function seedCases(): Promise<void> {
  const seeds = createSeedState().hotspots.map(seedToCase);
  for (const item of seeds) {
    await insertCase(item);
  }
}

export async function ensureSeedCases(): Promise<void> {
  if (storageMode === 'unavailable') return;
  if (!seedPromise) {
    seedPromise = seedCases().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

function sortCases(a: CaseRow, b: CaseRow): number {
  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (byPriority !== 0) return byPriority;
  if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
  if (a.dueAt) return -1;
  if (b.dueAt) return 1;
  return b.createdAt.localeCompare(a.createdAt);
}

export async function listCases(): Promise<CaseRow[]> {
  if (storageMode === 'unavailable') return [];
  await ensureSeedCases();

  if (storageMode === 'file') {
    const rows = await readJsonCollection<CaseRow>(CASES_FILE);
    return rows.sort(sortCases);
  }

  const rows = await query<CaseDbRow>(
    `SELECT * FROM cases
     ORDER BY CASE priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
              due_at ASC NULLS LAST,
              created_at DESC
     LIMIT 200`
  );
  return rows.map(mapCase);
}

export async function getCase(id: string): Promise<CaseRow | null> {
  if (storageMode === 'unavailable') return null;
  await ensureSeedCases();

  if (storageMode === 'file') {
    const rows = await readJsonCollection<CaseRow>(CASES_FILE);
    return rows.find((row) => row.id === id) ?? null;
  }

  const rows = await query<CaseDbRow>('SELECT * FROM cases WHERE id = $1', [id]);
  return rows[0] ? mapCase(rows[0]) : null;
}

export async function listCaseEvents(caseId: string): Promise<CaseEvent[]> {
  if (storageMode === 'unavailable') return [];

  if (storageMode === 'file') {
    const events = await readJsonCollection<CaseEvent>(EVENTS_FILE);
    return events
      .filter((event) => event.caseId === caseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
      .slice(0, 50);
  }

  const rows = await query<EventDbRow>(
    `SELECT * FROM case_events
     WHERE case_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 50`,
    [caseId]
  );
  return rows.map(mapEvent);
}

function mapCitizenStatus(status: CaseStatus): CitizenStatus {
  switch (status) {
    case 'RECEIVED':
      return 'RECEIVED';
    case 'TRIAGED':
      return 'TRIAGED';
    case 'ASSIGNED':
    case 'IN_PROGRESS':
    case 'ESCALATED':
    case 'RECURRING':
      return 'ASSIGNED';
    case 'CLEARED':
      return 'CLEARED';
    case 'VERIFIED':
    case 'CLOSED':
      return 'VERIFIED';
    default:
      return 'RECEIVED';
  }
}

async function syncCitizenStatus(item: CaseRow): Promise<void> {
  try {
    await updateCaseStatus(item.id, mapCitizenStatus(item.status));
  } catch (error) {
    console.error('citizen status sync failed', error);
  }
}

function defaultNote(action: CaseAction, item: CaseRow, team: string): string {
  switch (action) {
    case 'triage':
      return `Triaged as ${item.priority} · ${SLA_HOURS[item.priority]}h SLA`;
    case 'assign':
      return `Assigned to ${team}`;
    case 'start':
      return 'Field work started';
    case 'clear':
      return 'Site cleared; verification window opened';
    case 'verify_day':
      return `Clean day ${item.verificationDay}/14`;
    case 'recurrence':
      return 'Recurrence reported; escrow withheld';
    case 'release':
      return '14 clean days verified; escrow released';
    case 'escalate':
      return 'Escalated to P1';
    case 'clear_flags':
      return 'Flags cleared; case resumed';
    case 'close':
      return 'Case closed';
    case 'note':
      return '';
    default:
      return '';
  }
}

export async function applyCaseAction(caseId: string, input: CaseActionInput): Promise<CaseRow> {
  const current = await getCase(caseId);
  if (!current) throw new CaseActionError('Case not found.');

  const action = input.action;
  const from = current.status;
  const now = new Date();
  const nowIso = now.toISOString();
  const note = (input.note ?? '').trim();
  let next: CaseStatus = from;
  let team = current.team;
  let priority = current.priority;
  let dueAt = current.dueAt;
  let clearedAt = current.clearedAt;
  let verificationDay = current.verificationDay;
  let spillover = current.spillover;
  let escrowHeld = current.escrowHeld;
  let escrowState = current.escrowState;
  let escrowReleasedAt = current.escrowReleasedAt;

  switch (action) {
    case 'triage': {
      if (from !== 'RECEIVED' && from !== 'ESCALATED') {
        throw new CaseActionError('Only received or escalated cases can be triaged.');
      }
      if (input.priority) priority = input.priority;
      next = 'TRIAGED';
      dueAt = addHours(now, SLA_HOURS[priority]);
      break;
    }
    case 'assign': {
      if (!['RECEIVED', 'TRIAGED', 'ESCALATED', 'ASSIGNED'].includes(from)) {
        throw new CaseActionError('This case cannot be assigned in its current state.');
      }
      if (!input.team?.trim()) throw new CaseActionError('Choose a team before assigning.');
      team = input.team.trim();
      next = 'ASSIGNED';
      break;
    }
    case 'start': {
      if (from !== 'ASSIGNED') throw new CaseActionError('Assign the case before starting work.');
      next = 'IN_PROGRESS';
      break;
    }
    case 'clear': {
      if (from !== 'ASSIGNED' && from !== 'IN_PROGRESS') {
        throw new CaseActionError('Only assigned or in-progress cases can be cleared.');
      }
      next = 'CLEARED';
      clearedAt = nowIso;
      verificationDay = 0;
      escrowState = 'HELD';
      dueAt = addHours(now, SLA_HOURS[priority]);
      break;
    }
    case 'verify_day': {
      if (from !== 'CLEARED') throw new CaseActionError('Clear the site before logging clean days.');
      if (verificationDay >= 14) throw new CaseActionError('The 14-day window is already complete.');
      verificationDay += 1;
      if (verificationDay >= 14) next = 'VERIFIED';
      break;
    }
    case 'recurrence': {
      next = 'RECURRING';
      spillover = true;
      escrowState = 'WITHHELD';
      escrowHeld = Math.round(current.contractTotal * 0.6);
      escrowReleasedAt = null;
      clearedAt = null;
      verificationDay = 0;
      dueAt = addHours(now, SLA_HOURS[priority]);
      break;
    }
    case 'release': {
      if (verificationDay < 14) {
        throw new CaseActionError('Release is locked until 14 clean days are verified.');
      }
      if (spillover) throw new CaseActionError('A spillover flag blocks escrow release.');
      if (escrowState === 'RELEASED') throw new CaseActionError('Escrow is already released.');
      next = 'CLOSED';
      escrowState = 'RELEASED';
      escrowHeld = 0;
      escrowReleasedAt = nowIso;
      dueAt = null;
      break;
    }
    case 'escalate': {
      if (from === 'CLOSED') throw new CaseActionError('Closed cases cannot be escalated.');
      next = 'ESCALATED';
      priority = 'P1';
      dueAt = addHours(now, SLA_HOURS.P1);
      break;
    }
    case 'close': {
      if (from !== 'VERIFIED') throw new CaseActionError('Only verified cases can be closed.');
      next = 'CLOSED';
      dueAt = null;
      break;
    }
    case 'clear_flags': {
      if (from !== 'RECURRING' && from !== 'ESCALATED') {
        throw new CaseActionError('There are no flags to clear on this case.');
      }
      spillover = false;
      escrowState = 'HELD';
      escrowReleasedAt = null;
      verificationDay = 0;
      clearedAt = null;
      next = team ? 'IN_PROGRESS' : 'TRIAGED';
      dueAt = addHours(now, SLA_HOURS[priority]);
      break;
    }
    case 'note': {
      if (!note) throw new CaseActionError('Write a note before saving.');
      break;
    }
    default:
      throw new CaseActionError('Unknown case action.');
  }

  const updated: CaseRow = {
    ...current,
    status: next,
    team,
    priority,
    dueAt,
    clearedAt,
    verificationDay,
    spillover,
    escrowHeld,
    escrowState,
    escrowReleasedAt,
    updatedAt: nowIso
  };

  const saved = await writeCase(updated);
  await appendEvent(
    caseId,
    action,
    from,
    next,
    note || defaultNote(action, saved, team ?? ''),
    input.actor?.trim() || 'Duty officer'
  );
  await syncCitizenStatus(saved);
  return saved;
}

export async function syncCaseFromReport(report: CitizenReportRow): Promise<void> {
  if (storageMode === 'unavailable') return;
  await ensureSeedCases();

  const existing = await getCase(report.caseId);
  if (existing) {
    const factors: Factors = {
      ...existing.factors,
      recurrence: Math.min(100, existing.factors.recurrence + 8)
    };
    const reopened = ['CLEARED', 'VERIFIED', 'CLOSED'].includes(existing.status);
    const nextStatus: CaseStatus = reopened ? 'RECURRING' : existing.status;
    const priority = maxPriority(existing.priority, priorityFor(computeRisk(factors, 1).capped));
    const updated: CaseRow = {
      ...existing,
      factors,
      reportsCount: existing.reportsCount + 1,
      priority,
      status: nextStatus,
      dueAt:
        nextStatus === 'CLOSED' || nextStatus === 'VERIFIED'
          ? null
          : addHours(new Date(), SLA_HOURS[priority]),
      clearedAt: reopened ? null : existing.clearedAt,
      verificationDay: reopened ? 0 : existing.verificationDay,
      spillover: reopened ? true : existing.spillover,
      escrowHeld: reopened ? Math.round(existing.contractTotal * 0.6) : existing.escrowHeld,
      escrowState: reopened ? 'WITHHELD' : existing.escrowState,
      escrowReleasedAt: reopened ? null : existing.escrowReleasedAt,
      description: report.description,
      updatedAt: new Date().toISOString()
    };
    const saved = await writeCase(updated);
    await appendEvent(
      report.caseId,
      'report_merged',
      existing.status,
      nextStatus,
      `${report.reference} merged · ${report.distanceM.toFixed(0)} m from centroid`,
      'Public intake'
    );
    await syncCitizenStatus(saved);
    return;
  }

  const factors: Factors = {
    recurrence: 20,
    hazard: HAZARD_BY_CATEGORY[report.category] ?? 50,
    proximity: 60,
    duration: 25
  };
  const priority = priorityFor(computeRisk(factors, 1).capped);
  const now = new Date().toISOString();
  const created: CaseRow = {
    id: report.caseId,
    source: 'citizen',
    name: `New ${report.category.toLowerCase()} site`,
    ward: 'Field report',
    lat: report.lat,
    lng: report.lng,
    wasteType: report.category,
    reportsCount: 1,
    priority,
    status: 'RECEIVED',
    team: null,
    dueAt: addHours(new Date(), SLA_HOURS[priority]),
    createdAt: now,
    updatedAt: now,
    clearedAt: null,
    verificationDay: 0,
    spillover: false,
    contractTotal: 12000,
    escrowHeld: 7200,
    factors,
    reference: report.reference,
    description: report.description,
    escrowState: 'HELD',
    escrowReleasedAt: null
  };

  await insertCase(created);
  await appendEvent(
    created.id,
    'report_received',
    null,
    'RECEIVED',
    `${report.reference} opened the case`,
    'Public intake'
  );
  await syncCitizenStatus(created);
}
