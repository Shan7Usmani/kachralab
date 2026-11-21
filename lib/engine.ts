export type FactorKey = 'recurrence' | 'hazard' | 'proximity' | 'duration';
export type Factors = Record<FactorKey, number>;
export type CheckpointState = 'clean' | 'failed' | 'pending';
export type HotspotStatus =
  | 'RECEIVED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'CLEARED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'RECURRING'
  | 'ESCALATED'
  | 'UNDER_MONITORING'
  | 'CRITICAL_P1'
  | 'VERIFIED_CLEAN'
  | 'IN_INTERVENTION'
  | 'NEW';
export type EscrowState = 'HELD' | 'RELEASED' | 'WITHHELD';

export interface Contract {
  total: number;
  escrow: EscrowState;
  heldAmount: number;
}

export interface Monitor {
  currentDay: number;
  checkpoints: CheckpointState[];
  spillover: boolean;
}

export interface Hotspot {
  id: string;
  name: string;
  ward: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  wasteType: string;
  reports30d: number;
  factors: Factors;
  status: HotspotStatus;
  monitor: Monitor;
  contract: Contract;
  source?: 'seed' | 'citizen';
  priority?: 'P1' | 'P2' | 'P3';
  team?: string | null;
  dueAt?: string | null;
  reference?: string | null;
  updatedAt?: string;
}

export interface RiskResult {
  parts: Factors;
  raw: number;
  capped: number;
  capApplied: boolean;
  rainMultiplier: number;
}

export interface ClusterResult {
  distanceMeters: number;
  matchedId: string | null;
  action: 'MERGE' | 'NEW_NODE';
  thresholdMeters: number;
}

export interface VisionResult {
  source: string;
  fractions: { label: string; value: number }[];
  massKg: number;
  severity: string;
  dispatch: string;
}

export interface Verdict {
  mode: 'RECURRENCE' | 'SUCCESS' | 'RESET';
  checkpoints: CheckpointState[];
  spillover: boolean;
  status: HotspotStatus;
  escrow: EscrowState;
  heldAmount: number;
  message: string;
}

export interface Report {
  lat: number;
  lng: number;
  matchedId: string | null;
  at: number;
}

export interface AuditEntry {
  id: number;
  at: number;
  action: string;
  detail: string;
}

export interface AppState {
  rain: boolean;
  selectedId: string;
  hotspots: Hotspot[];
  reports: Report[];
  vision: VisionResult | null;
  cluster: ClusterResult | null;
  lastVerdict: Verdict | null;
  audit: AuditEntry[];
}

export const RAIN = { dry: 1, monsoon: 1.35 } as const;
export const PRESET = { lat: 28.5702, lng: 77.2432 } as const;

const EARTH_RADIUS_M = 6371000;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const p1 = toRad(a.lat);
  const p2 = toRad(b.lat);
  const dp = toRad(b.lat - a.lat);
  const dl = toRad(b.lng - a.lng);
  const h =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function clusterReport(
  point: { lat: number; lng: number },
  hotspots: Array<Pick<Hotspot, 'id' | 'lat' | 'lng'>>,
  thresholdMeters = 30
): ClusterResult {
  let matchedId: string | null = null;
  let distance = Infinity;

  for (const h of hotspots) {
    const d = haversineMeters(point, { lat: h.lat, lng: h.lng });
    if (d < distance) {
      distance = d;
      matchedId = h.id;
    }
  }

  if (!Number.isFinite(distance)) distance = 0;
  const match = distance <= thresholdMeters;
  return {
    distanceMeters: Number(distance.toFixed(1)),
    matchedId: match ? matchedId : null,
    action: match ? 'MERGE' : 'NEW_NODE',
    thresholdMeters
  };
}

export function makeCheckpoints(done: number): CheckpointState[] {
  return Array.from({ length: 14 }, (_, i) => (i < done ? 'clean' : 'pending'));
}

const clamp = (value: number, min: number, max: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

export function computeRisk(factors: Factors, rainMultiplier = 1): RiskResult {
  const m = clamp(rainMultiplier, 1, 2);
  const f: Factors = {
    recurrence: clamp(factors.recurrence, 0, 100),
    hazard: clamp(factors.hazard, 0, 100),
    proximity: clamp(factors.proximity, 0, 100),
    duration: clamp(factors.duration, 0, 100)
  };
  const parts: Factors = {
    recurrence: f.recurrence * 0.35,
    hazard: f.hazard * 0.25,
    proximity: f.proximity * 0.25,
    duration: f.duration * 0.15
  };
  const raw =
    (parts.recurrence + parts.hazard + parts.proximity + parts.duration) * m;
  return {
    parts,
    raw: Number(raw.toFixed(2)),
    capped: Math.min(100, Math.round(raw)),
    capApplied: raw > 100,
    rainMultiplier: m
  };
}

export function riskBand(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: 'Critical', tone: 'danger' };
  if (score >= 60) return { label: 'High', tone: 'warn' };
  if (score >= 35) return { label: 'Moderate', tone: 'info' };
  return { label: 'Low', tone: 'ok' };
}

export function simulateVision(): VisionResult {
  return {
    source: 'RULE-BASED SIMULATION',
    fractions: [
      { label: 'LDPE polybags', value: 64 },
      { label: 'PET bottles', value: 24 },
      { label: 'Organic sludge', value: 12 }
    ],
    massKg: 310,
    severity: 'High',
    dispatch: 'Priority 1 dispatch'
  };
}

export function normalizeVerdict(
  mode: 'recurrence' | 'success' | 'reset',
  hotspot: Hotspot
): Verdict {
  const day = clamp(hotspot.monitor?.currentDay ?? 0, 0, 14);
  const checkpoints = makeCheckpoints(day);
  const heldAmount =
    hotspot.contract?.heldAmount ?? Math.round((hotspot.contract?.total ?? 12000) * 0.6);

  if (mode === 'recurrence') {
    const failedDay = Math.min(13, day);
    checkpoints[failedDay] = 'failed';
    return {
      mode: 'RECURRENCE',
      checkpoints,
      spillover: true,
      status: 'RECURRING',
      escrow: 'WITHHELD',
      heldAmount,
      message: `Recurrence detected on day ${failedDay + 1}. A secondary pile sits inside the 150 m halo, so the escrow stays withheld.`
    };
  }

  if (mode === 'success') {
    for (let i = 0; i < 14; i += 1) checkpoints[i] = 'clean';
    return {
      mode: 'SUCCESS',
      checkpoints,
      spillover: false,
      status: 'VERIFIED_CLEAN',
      escrow: 'RELEASED',
      heldAmount: 0,
      message: '14 consecutive clean days verified with no spillover. Escrow released to the contractor.'
    };
  }

  return {
    mode: 'RESET',
    checkpoints,
    spillover: false,
    status: hotspot.status,
    escrow: hotspot.contract.escrow,
    heldAmount: hotspot.contract.heldAmount,
    message: 'Spillover flag and failed checkpoints cleared. The escrow position is unchanged.'
  };
}

export function diagnose(hotspot: Hotspot): { title: string; evidence: string }[] {
  const t = (hotspot.wasteType || '').toLowerCase();
  if (t.includes('organic')) {
    return [
      { title: 'Morning wholesale timing mismatch', evidence: '12 reports cluster between 06:00 and 09:00; collection beat arrives after stalls close.' },
      { title: 'Containerization deficit', evidence: 'No covered bulk bin inside the market ring; vegetable slurry enters storm drains.' },
      { title: 'Night-time plastic dumping', evidence: 'LDPE fraction dominates the simulated vision pass at 64%.' }
    ];
  }
  if (t.includes('construction')) {
    return [
      { title: 'Midnight renovation dumping', evidence: 'C&D debris appears on a hospital corridor with no permit trail.' },
      { title: 'Missing material recovery point', evidence: 'No aggregate holding bay within 150 m of the junction.' },
      { title: 'Contractor route leakage', evidence: 'Debris type matches nearby demolition waste streams.' }
    ];
  }
  if (t.includes('industrial')) {
    return [
      { title: 'Industrial night dumping', evidence: 'Packaging and silt fractions peak between 23:00 and 04:00.' },
      { title: 'Drain silt overflow', evidence: 'Monsoon multiplier raises leachate transmission into the stormwater line.' },
      { title: 'Unsegregated contractor haul', evidence: 'Industrial packaging appears without a manifest trail.' }
    ];
  }
  if (t.includes('food')) {
    return [
      { title: 'Bin capacity deficit', evidence: 'Food stalls outnumber collection points on the outer circle.' },
      { title: 'Peak-hour sweep gap', evidence: 'Cups and packaging accumulate before the evening round.' },
      { title: 'Informal disposal', evidence: 'Single-use packaging is visible in the adjacent drain.' }
    ];
  }
  return [
    { title: 'Seasonal leaf-litter accumulation', evidence: 'Dry leaves dominate the mixed municipal fraction in this ward.' },
    { title: 'Missed sweep window', evidence: 'Reports rise after the second weekly collection slot.' },
    { title: 'Low-severity but persistent site', evidence: 'Risk stays low at 18, yet recurrence history keeps the case open.' }
  ];
}

export function statusLabel(status: HotspotStatus): string {
  const map: Record<HotspotStatus, string> = {
    RECEIVED: 'Received',
    TRIAGED: 'Triaged',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In progress',
    CLEARED: 'Cleared',
    VERIFIED: 'Verified',
    CLOSED: 'Closed',
    RECURRING: 'Recurring',
    ESCALATED: 'Escalated',
    UNDER_MONITORING: 'Under monitoring',
    CRITICAL_P1: 'Critical P1',
    VERIFIED_CLEAN: 'Verified clean',
    IN_INTERVENTION: 'In intervention',
    NEW: 'New hotspot'
  };
  return map[status] || status;
}

export function statusTone(status: HotspotStatus): string {
  if (status === 'CRITICAL_P1' || status === 'RECURRING' || status === 'ESCALATED') return 'danger';
  if (status === 'VERIFIED_CLEAN' || status === 'VERIFIED') return 'ok';
  if (status === 'CLOSED') return 'neutral';
  if (status === 'RECEIVED' || status === 'TRIAGED' || status === 'NEW') return 'info';
  return 'warn';
}

export function createSeedState(): AppState {
  const hotspot = (
    id: string,
    name: string,
    ward: string,
    lat: number,
    lng: number,
    mapX: number,
    mapY: number,
    wasteType: string,
    reports30d: number,
    factors: Factors,
    status: HotspotStatus,
    currentDay: number
  ): Hotspot => ({
    id,
    name,
    ward,
    lat,
    lng,
    mapX,
    mapY,
    wasteType,
    reports30d,
    factors,
    status,
    monitor: { currentDay, checkpoints: makeCheckpoints(currentDay), spillover: false },
    contract: {
      total: 12000,
      escrow: status === 'VERIFIED_CLEAN' ? 'RELEASED' : 'HELD',
      heldAmount: status === 'VERIFIED_CLEAN' ? 0 : 7200
    }
  });

  return {
    rain: false,
    selectedId: 'GZ-042',
    hotspots: [
      hotspot('GZ-042', 'Lajpat Nagar Central Market Ring Road', 'Ward 58 · South Delhi', 28.5703276, 77.2432, 420, 330, 'Organic + Single-Use Plastic', 12, { recurrence: 96, hazard: 85, proximity: 70, duration: 62 }, 'UNDER_MONITORING', 4),
      hotspot('GZ-018', 'Karol Bagh Pusa Road Junction', 'Ward 42 · Central Delhi', 28.6348, 77.188, 300, 215, 'Construction & Demolition (C&D)', 7, { recurrence: 80, hazard: 94, proximity: 100, duration: 76 }, 'CRITICAL_P1', 0),
      hotspot('GZ-031', 'Saket Press Enclave Community Center', 'Ward 71 · South Delhi', 28.5245, 77.207, 510, 420, 'Mixed Municipal & Dry Leaves', 4, { recurrence: 20, hazard: 15, proximity: 24, duration: 10 }, 'VERIFIED_CLEAN', 14),
      hotspot('GZ-009', 'Connaught Place Outer Circle Block B', 'Ward 19 · New Delhi', 28.6315, 77.2167, 370, 275, 'Food Packaging & Cups', 5, { recurrence: 65, hazard: 70, proximity: 55, duration: 66 }, 'IN_INTERVENTION', 2),
      hotspot('GZ-055', 'Okhla Phase III / Govindpuri Crossing', 'Ward 83 · South-East Delhi', 28.539, 77.279, 625, 470, 'Industrial Packaging & Silt', 8, { recurrence: 88, hazard: 72, proximity: 62, duration: 65 }, 'RECURRING', 1)
    ],
    reports: [],
    vision: null,
    cluster: null,
    lastVerdict: null,
    audit: [
      { id: 1, at: 0, action: 'SYSTEM', detail: 'Seed dataset loaded: 5 active cases.' }
    ]
  };
}

export function createHotspotFromReport(
  id: string,
  lat: number,
  lng: number,
  wasteType: string
): Hotspot {
  return {
    id,
    name: `New Hotspot ${id}`,
    ward: 'Unassigned ward · field report',
    lat,
    lng,
    mapX: 120 + ((lng - 77.15) / 0.16) * 560,
    mapY: 480 - ((lat - 28.5) / 0.16) * 420,
    wasteType: wasteType || 'Mixed waste',
    reports30d: 1,
    factors: { recurrence: 30, hazard: 70, proximity: 40, duration: 10 },
    status: 'NEW',
    monitor: { currentDay: 0, checkpoints: makeCheckpoints(0), spillover: false },
    contract: { total: 12000, escrow: 'HELD', heldAmount: 7200 }
  };
}
