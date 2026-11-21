export const CATEGORIES = [
  'Garbage pile',
  'Overflowing bin',
  'Open dumping',
  'Construction debris',
  'Other'
] as const;

export type CitizenCategory = (typeof CATEGORIES)[number];

export const STATUS_FLOW = ['RECEIVED', 'TRIAGED', 'ASSIGNED', 'CLEARED', 'VERIFIED'] as const;

export type CitizenStatus = (typeof STATUS_FLOW)[number];

export const STATUS_LABEL: Record<CitizenStatus, string> = {
  RECEIVED: 'Received',
  TRIAGED: 'Triaged',
  ASSIGNED: 'Assigned',
  CLEARED: 'Cleared',
  VERIFIED: 'Verified'
};

export const STATUS_DESCRIPTION: Record<CitizenStatus, string> = {
  RECEIVED: 'Your report is in the municipal inbox.',
  TRIAGED: 'Staff reviewed it and checked for duplicates.',
  ASSIGNED: 'A field team has been assigned.',
  CLEARED: 'The site has been cleared once.',
  VERIFIED: 'The clean-up held through the verification window.'
};

export interface CitizenReportRow {
  reference: string;
  caseId: string;
  createdAt: string;
  status: CitizenStatus;
  lat: number;
  lng: number;
  category: string;
  description: string;
  reporterName: string | null;
  reporterPhone: string | null;
  distanceM: number;
  action: 'MERGED' | 'NEW';
}

export interface CitizenCase {
  caseId: string;
  reference: string;
  status: CitizenStatus;
  category: string;
  description: string;
  lat: number;
  lng: number;
  createdAt: string;
  count: number;
  action: 'MERGED' | 'NEW';
}

export function isCitizenStatus(value: unknown): value is CitizenStatus {
  return typeof value === 'string' && (STATUS_FLOW as readonly string[]).includes(value);
}

export function isCategory(value: unknown): value is CitizenCategory {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}
