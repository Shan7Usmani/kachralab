'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode
} from 'react';
import {
  AppState,
  AuditEntry,
  Hotspot,
  clusterReport,
  createHotspotFromReport,
  createSeedState,
  makeCheckpoints,
  normalizeVerdict,
  simulateVision
} from './engine';

const STORAGE_KEY = 'kachralab.state.v2';

let auditSeq = 0;

const auditEntry = (action: string, detail: string): AuditEntry => ({
  id: Date.now() + auditSeq++,
  at: Date.now(),
  action,
  detail
});

const withAudit = (state: AppState, action: string, detail: string): AuditEntry[] =>
  [auditEntry(action, detail), ...state.audit].slice(0, 40);

export type StoreAction =
  | { type: 'hydrate'; state: AppState }
  | { type: 'rain'; value: boolean }
  | { type: 'select'; id: string }
  | { type: 'vision' }
  | {
      type: 'report';
      lat: number;
      lng: number;
      wasteType: string;
      role: string;
      notes: string;
    }
  | { type: 'advance' }
  | { type: 'verdict'; mode: 'recurrence' | 'success' | 'reset' }
  | { type: 'reset' };

function nextId(hotspots: Hotspot[]): string {
  const numbers = hotspots
    .map((h) => Number.parseInt(h.id.replace(/\D/g, ''), 10))
    .filter((n) => Number.isFinite(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `GZ-${String(next).padStart(3, '0')}`;
}

function updateSelected(
  state: AppState,
  update: (hotspot: Hotspot) => Hotspot
): Hotspot[] {
  return state.hotspots.map((h) => (h.id === state.selectedId ? update(h) : h));
}

function reducer(state: AppState, action: StoreAction): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'rain':
      return { ...state, rain: action.value };

    case 'select':
      return { ...state, selectedId: action.id };

    case 'vision': {
      const vision = simulateVision();
      return {
        ...state,
        vision,
        audit: withAudit(state, 'VISION', 'Sample classification pass completed on a field image.')
      };
    }

    case 'report': {
      const point = { lat: action.lat, lng: action.lng };
      const cluster = clusterReport(point, state.hotspots);
      const at = Date.now();
      const report = { ...point, matchedId: cluster.matchedId, at };

      let hotspots = state.hotspots;
      let selectedId = state.selectedId;

      let reopened = false;

      if (cluster.matchedId) {
        const target = state.hotspots.find((h) => h.id === cluster.matchedId);
        reopened = target?.status === 'VERIFIED_CLEAN';

        hotspots = state.hotspots.map((h) =>
          h.id === cluster.matchedId
            ? {
                ...h,
                reports30d: h.reports30d + 1,
                factors: {
                  ...h.factors,
                  recurrence: Math.min(100, h.factors.recurrence + 2)
                },
                status: reopened ? 'RECURRING' : h.status,
                monitor: reopened
                  ? { currentDay: 0, checkpoints: makeCheckpoints(0), spillover: false }
                  : h.monitor
              }
            : h
        );
        selectedId = cluster.matchedId;
      } else {
        const id = nextId(state.hotspots);
        hotspots = [createHotspotFromReport(id, point.lat, point.lng, action.wasteType), ...state.hotspots];
        selectedId = id;
      }

      const detail = cluster.matchedId
        ? `${action.role} report merged into ${cluster.matchedId} (${cluster.distanceMeters} m away).${
            reopened ? ' The verified case reopened as recurring.' : ''
          }`
        : `${action.role} report opened a new hotspot.`;

      return {
        ...state,
        hotspots,
        selectedId,
        reports: [report, ...state.reports].slice(0, 100),
        cluster,
        audit: withAudit(state, 'REPORT', detail)
      };
    }

    case 'advance': {
      const hotspot = state.hotspots.find((h) => h.id === state.selectedId);
      if (!hotspot || hotspot.monitor.currentDay >= 14) return state;
      if (hotspot.monitor.spillover || hotspot.monitor.checkpoints.includes('failed')) return state;

      const day = hotspot.monitor.currentDay + 1;
      const checkpoints = makeCheckpoints(day);

      return {
        ...state,
        hotspots: updateSelected(state, (h) => ({
          ...h,
          status: h.status === 'NEW' ? 'IN_INTERVENTION' : h.status,
          monitor: { ...h.monitor, currentDay: day, checkpoints, spillover: false }
        })),
        audit: withAudit(state, 'VERIFY', `Day ${day} logged clean for ${hotspot.id}.`)
      };
    }

    case 'verdict': {
      const hotspot = state.hotspots.find((h) => h.id === state.selectedId);
      if (!hotspot) return state;

      if (
        action.mode === 'success' &&
        (hotspot.monitor.currentDay < 14 || hotspot.monitor.spillover)
      ) {
        return state;
      }

      const verdict = normalizeVerdict(action.mode, hotspot);

      return {
        ...state,
        hotspots: updateSelected(state, (h) => ({
          ...h,
          status: verdict.status,
          monitor: {
            ...h.monitor,
            checkpoints: verdict.checkpoints,
            spillover: verdict.spillover
          },
          contract: {
            ...h.contract,
            escrow: verdict.escrow,
            heldAmount: verdict.heldAmount
          }
        })),
        lastVerdict: verdict,
        audit: withAudit(state, 'VERDICT', verdict.message)
      };
    }

    case 'reset':
      return createSeedState();

    default:
      return state;
  }
}

function isPersistedState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const state = value as AppState;
  return (
    Array.isArray(state.hotspots) &&
    state.hotspots.length > 0 &&
    state.hotspots.every(
      (h) => h && typeof h.id === 'string' && Array.isArray(h.monitor?.checkpoints)
    ) &&
    Array.isArray(state.audit) &&
    Array.isArray(state.reports) &&
    typeof state.selectedId === 'string' &&
    typeof state.rain === 'boolean'
  );
}

interface StoreValue {
  state: AppState;
  dispatch: Dispatch<StoreAction>;
  hydrated: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createSeedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isPersistedState(parsed)) dispatch({ type: 'hydrate', state: parsed });
      }
    } catch {
      // Corrupt or unavailable storage falls back to the seed dataset.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persistence is optional; the app keeps working in memory.
    }
  }, [state, hydrated]);

  const value = useMemo(() => ({ state, dispatch, hydrated }), [state, hydrated]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}
