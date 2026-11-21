import type { Factors, HotspotStatus } from './engine';

export type CaseStatus = Extract<
  HotspotStatus,
  | 'RECEIVED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'CLEARED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'RECURRING'
  | 'ESCALATED'
>;

export type CasePriority = 'P1' | 'P2' | 'P3';

export interface CaseRow {
  id: string;
  source: 'seed' | 'citizen';
  name: string;
  ward: string;
  lat: number;
  lng: number;
  wasteType: string;
  reportsCount: number;
  priority: CasePriority;
  status: CaseStatus;
  team: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  clearedAt: string | null;
  verificationDay: number;
  spillover: boolean;
  contractTotal: number;
  escrowHeld: number;
  factors: Factors;
  reference: string | null;
  description: string;
  escrowState: 'HELD' | 'RELEASED' | 'WITHHELD';
  escrowReleasedAt: string | null;
}

export interface CaseEvent {
  id: number;
  caseId: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  actor: string;
  createdAt: string;
}

export type CaseAction =
  | 'triage'
  | 'assign'
  | 'start'
  | 'clear'
  | 'verify_day'
  | 'recurrence'
  | 'release'
  | 'escalate'
  | 'note'
  | 'close'
  | 'clear_flags';

export const TEAMS = [
  'Zone A sanitation',
  'Zone B contractor',
  'C&D unit',
  'Night sweep crew'
];

export const SLA_HOURS: Record<CasePriority, number> = { P1: 24, P2: 72, P3: 168 };

export const PRIORITY_LABEL: Record<CasePriority, string> = {
  P1: 'P1 · 24h',
  P2: 'P2 · 72h',
  P3: 'P3 · 7 days'
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  RECEIVED: 'Received',
  TRIAGED: 'Triaged',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  CLEARED: 'Cleared',
  VERIFIED: 'Verified',
  CLOSED: 'Closed',
  RECURRING: 'Recurring',
  ESCALATED: 'Escalated'
};

export function isCaseStatus(value: unknown): value is CaseStatus {
  return typeof value === 'string' && value in CASE_STATUS_LABEL;
}

export function isCasePriority(value: unknown): value is CasePriority {
  return value === 'P1' || value === 'P2' || value === 'P3';
}

export const CASE_ACTION_LABEL: Record<CaseAction, string> = {
  triage: 'Triage',
  assign: 'Assign team',
  start: 'Start work',
  clear: 'Mark cleared',
  verify_day: 'Log clean day',
  recurrence: 'Flag recurrence',
  release: 'Release escrow',
  escalate: 'Escalate',
  note: 'Add note',
  close: 'Close case',
  clear_flags: 'Clear flags'
};

export function nextCaseActions(status: CaseStatus, verificationDay: number): CaseAction[] {
  switch (status) {
    case 'RECEIVED':
      return ['triage', 'escalate'];
    case 'TRIAGED':
      return ['assign', 'escalate'];
    case 'ASSIGNED':
      return ['start', 'clear', 'escalate'];
    case 'IN_PROGRESS':
      return ['clear', 'escalate'];
    case 'CLEARED':
      return verificationDay >= 14
        ? ['release', 'recurrence']
        : ['verify_day', 'recurrence', 'escalate'];
    case 'VERIFIED':
      return ['release', 'recurrence'];
    case 'RECURRING':
      return ['clear_flags', 'escalate'];
    case 'ESCALATED':
      return ['triage', 'assign', 'clear_flags'];
    case 'CLOSED':
      return ['recurrence'];
    default:
      return [];
  }
}
