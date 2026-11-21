# KachraLab Full Source Handoff - Part 2 of 2
Continuation of complete source snapshot.

### components/Console.tsx
```tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import RealMap from '@/components/RealMap';
import {
  AppState,
  AuditEntry,
  ClusterResult,
  EscrowState,
  HotspotStatus,
  PRESET,
  RAIN,
  Verdict,
  VisionResult,
  computeRisk,
  createHotspotFromReport,
  createSeedState,
  diagnose,
  haversineMeters,
  normalizeVerdict,
  simulateVision,
  statusLabel,
  statusTone
} from '@/lib/engine';

const STORE_KEY = 'kachralab.next.v1';

type View = 'console' | 'cases' | 'map' | 'simulator' | 'vision';

async function engineCall<T>(
  payload: Record<string, unknown>,
  fallback: () => T
): Promise<T> {
  try {
    const res = await fetch('/api/engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('engine unavailable');
    return (await res.json()) as T;
  } catch {
    return fallback();
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n || 0);

const makeAudit = (action: string, detail: string): AuditEntry => ({
  id: Date.now() + Math.random(),
  at: Date.now(),
  action,
  detail
});

function localCluster(point: { lat: number; lng: number }, hotspots: AppState['hotspots']): ClusterResult {
  let matchedId: string | null = null;
  let distance = Infinity;
  hotspots.forEach((h) => {
    const d = haversineMeters(point, { lat: h.lat, lng: h.lng });
    if (d < distance) {
      distance = d;
      matchedId = h.id;
    }
  });
  return {
    distanceMeters: Number(distance.toFixed(1)),
    matchedId: distance <= 30 ? matchedId : null,
    action: distance <= 30 ? 'MERGE' : 'NEW_NODE',
    thresholdMeters: 30
  };
}

const FILTERS: Array<'ALL' | HotspotStatus> = [
  'ALL',
  'UNDER_MONITORING',
  'CRITICAL_P1',
  'VERIFIED_CLEAN',
  'IN_INTERVENTION',
  'RECURRING'
];

export default function Console({ view = 'console' }: { view?: View }) {
  const [state, setState] = useState<AppState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | HotspotStatus>('ALL');
  const [busy, setBusy] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const demoStartedRef = useRef(false);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (Array.isArray(parsed.hotspots) && parsed.hotspots.length) {
          setState({ ...createSeedState(), ...parsed });
        }
      }
    } catch {
      /* ignore corrupt session */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      /* session memory unavailable */
    }
  }, [state, hydrated]);

  useEffect(() => {
    engineCall<{ ok: boolean }>({ op: 'ping' }, () => ({ ok: false })).then((r) =>
      setApiOnline(Boolean(r && r.ok))
    );
  }, []);

  const selected = useMemo(
    () => state.hotspots.find((h) => h.id === state.selectedId) || state.hotspots[0],
    [state.hotspots, state.selectedId]
  );
  const rainMultiplier = state.rain ? RAIN.monsoon : RAIN.dry;
  const risk = useMemo(() => computeRisk(selected.factors, rainMultiplier), [selected, rainMultiplier]);
  const causes = useMemo(() => diagnose(selected), [selected]);

  const visibleHotspots = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.hotspots.filter((h) => {
      const matchesFilter = filter === 'ALL' || h.status === filter;
      const matchesSearch =
        !q || h.id.toLowerCase().includes(q) || h.name.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [state.hotspots, search, filter]);

  const counters = useMemo(() => {
    const cleanDays = state.hotspots.reduce(
      (sum, h) => sum + h.monitor.checkpoints.filter((c) => c === 'clean').length,
      0
    );
    const held = state.hotspots.reduce((sum, h) => sum + h.contract.heldAmount, 0);
    const recurring = state.hotspots.filter(
      (h) => h.status === 'RECURRING' || h.status === 'UNDER_MONITORING'
    ).length;
    return { cleanDays, held, recurring };
  }, [state.hotspots]);

  function selectHotspot(id: string) {
    setState((s) => ({
      ...s,
      selectedId: id,
      audit: [makeAudit('SELECT', `Opened case ${id}`), ...s.audit].slice(0, 24)
    }));
  }

  function toggleRain() {
    setState((s) => ({
      ...s,
      rain: !s.rain,
      audit: [
        makeAudit('CLIMATE', s.rain ? 'Dry multiplier restored to 1.00x' : 'Monsoon multiplier 1.35x applied'),
        ...s.audit
      ].slice(0, 24)
    }));
  }

  async function performReport(latValue: number, lngValue: number) {
    const snapshot = stateRef.current;
    setBusy(true);
    try {
      const cluster = await engineCall<ClusterResult>(
        { op: 'cluster', lat: latValue, lng: lngValue, hotspots: snapshot.hotspots },
        () => localCluster({ lat: latValue, lng: lngValue }, snapshot.hotspots)
      );
      const vision = await engineCall<VisionResult>({ op: 'vision' }, simulateVision);

      setState((s) => {
        const report = { lat: latValue, lng: lngValue, matchedId: cluster.matchedId, at: Date.now() };
        if (cluster.matchedId) {
          const entry = makeAudit(
            'REPORT MERGED',
            `${cluster.distanceMeters} m from ${cluster.matchedId} - recurrence incremented`
          );
          return {
            ...s,
            hotspots: s.hotspots.map((h) =>
              h.id === cluster.matchedId
                ? {
                    ...h,
                    reports30d: h.reports30d + 1,
                    factors: { ...h.factors, recurrence: Math.min(100, h.factors.recurrence + 1) }
                  }
                : h
            ),
            selectedId: cluster.matchedId,
            cluster,
            vision,
            reports: [report, ...s.reports],
            audit: [entry, ...s.audit].slice(0, 24)
          };
        }

        const nextId = `GZ-${String(60 + s.hotspots.length).padStart(3, '0')}`;
        const created = createHotspotFromReport(nextId, latValue, lngValue, vision);
        const entry = makeAudit('NEW NODE', `${nextId} created outside 30 m cluster`);
        return {
          ...s,
          hotspots: [...s.hotspots, created],
          selectedId: nextId,
          cluster,
          vision,
          reports: [report, ...s.reports],
          audit: [entry, ...s.audit].slice(0, 24)
        };
      });
    } finally {
      setBusy(false);
    }
  }

  function submitReport() {
    const latValue = Number(lat);
    const lngValue = Number(lng);
    if (!Number.isFinite(latValue) || !Number.isFinite(lngValue)) {
      setState((s) => ({
        ...s,
        audit: [makeAudit('INPUT ERROR', 'Coordinates must be numeric'), ...s.audit].slice(0, 24)
      }));
      return;
    }
    void performReport(latValue, lngValue);
  }

  async function runVerdict(mode: 'recurrence' | 'success') {
    const targetId = stateRef.current.selectedId;
    const target = stateRef.current.hotspots.find((h) => h.id === targetId);
    if (!target) return;
    setBusy(true);
    try {
      const verdict = await engineCall<Verdict>(
        { op: 'verdict', mode, hotspot: target },
        () => normalizeVerdict(mode, target)
      );
      setState((s) => ({
        ...s,
        lastVerdict: verdict,
        hotspots: s.hotspots.map((h) =>
          h.id === targetId
            ? {
                ...h,
                status: verdict.status as HotspotStatus,
                monitor: {
                  ...h.monitor,
                  checkpoints: verdict.checkpoints,
                  spillover: verdict.spillover,
                  currentDay: mode === 'success' ? 14 : 5
                },
                contract: {
                  ...h.contract,
                  escrow: verdict.escrow as EscrowState,
                  heldAmount: verdict.heldAmount
                }
              }
            : h
        ),
        audit: [makeAudit(verdict.mode, verdict.message), ...s.audit].slice(0, 24)
      }));
    } finally {
      setBusy(false);
    }
  }

  async function guidedDemo() {
    setDemoRunning(true);
    const announceLocal = (text: string) => {
      const region = document.getElementById('live-region');
      if (region) region.textContent = text;
    };
    const speak = (text: string) => {
      announceLocal(text);
    };
    const spot = (selector: string) => {
      document.querySelectorAll('.spot').forEach((el) => el.classList.remove('spot'));
      const el = document.querySelector(selector);
      if (el) {
        el.classList.add('spot');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    try {
      setState(createSeedState());
      setLat('');
      setLng('');
      await delay(140);
      selectHotspot('GZ-042');
      spot('.case-detail-panel');
      speak('Case G Z 0 4 2 opened. Risk 82. Four days into a fourteen day watch.');
      await delay(620);
      setLat(String(PRESET.lat));
      setLng(String(PRESET.lng));
      spot('.map-panel');
      speak('A citizen report lands fourteen point two metres from the hotspot. It merges instead of opening a new ticket.');
      await delay(460);
      await performReport(PRESET.lat, PRESET.lng);
      await delay(820);
      if (!stateRef.current.rain) toggleRain();
      speak('Monsoon multiplier active. Leachate risk rises and every score recalculates.');
      await delay(760);
      spot('.lower');
      await runVerdict('recurrence');
      speak('Day five dumping. Spillover detected in the one hundred and fifty metre halo. Sixty percent of the payment is forfeited.');
      await delay(1000);
      await runVerdict('success');
      speak('Alternate branch. Fourteen clean days verified. Escrow released. That is the outcome we pay for.');
    } finally {
      setDemoRunning(false);
      document.querySelectorAll('.spot').forEach((el) => el.classList.remove('spot'));
    }
  }

  function resetAll() {
    setState(createSeedState());
    setLat('');
    setLng('');
  }

  useEffect(() => {
    if (view !== 'console' || typeof window === 'undefined' || demoStartedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      demoStartedRef.current = true;
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => { void guidedDemo(); }, 350);
    }
  }, [view]);

  const escrowTone = selected.contract.escrow === 'RELEASED'
    ? 'released'
    : selected.contract.escrow === 'WITHHELD'
      ? 'withheld'
      : '';
  const escrowText = selected.contract.escrow === 'RELEASED'
    ? 'RELEASED'
    : selected.contract.escrow === 'WITHHELD'
      ? 'FORFEITED'
      : `${formatINR(selected.contract.heldAmount)} HELD`;

  return (
    <div className={`app view-${view} ${registerOpen ? 'register-open' : ''}`}>
      <header className="topbar glass">
        <div className="brand">
          <span className="brand-mark">KL</span>
          <span className="brand-copy">
            <strong>KACHRA<span style={{ color: 'var(--amber)' }}>LAB</span></strong>
            <span>LIVE INTERVENTION CONSOLE</span>
          </span>
        </div>

        <nav className="topnav" aria-label="Main actions">
          <Link href="/" className={`navbtn ${view === 'console' ? 'active' : ''}`}>CONSOLE</Link>
          <Link href="/human" className="navbtn">FIELD</Link>
          <Link href="/lab" className="navbtn">PROOF</Link>
          <Link href="/impact" className="navbtn">IMPACT</Link>
          <Link href="/?demo=1" className="navbtn">RUN DEMO</Link>
        </nav>

        <div className="top-actions">
          <span className={`engine-pill ${apiOnline ? 'online' : ''}`}>
            {apiOnline ? 'API ONLINE' : 'LOCAL ENGINE'}
          </span>
          <button
            className={`toggle neu ${state.rain ? 'active' : ''}`}
            aria-pressed={state.rain}
            onClick={toggleRain}
            disabled={demoRunning}
          >
            <span className="knob" />
            {state.rain ? 'MONSOON Â· 1.35Ã—' : 'DRY Â· 1.00Ã—'}
          </button>
          <button className="btn neu" onClick={resetAll}>RESET</button>
        </div>
      </header>

      <section className="stats" aria-label="Live counters">
        <article className="stat glass amber">
          <span className="stat-label">ACTIVE CASES</span>
          <strong className="stat-value">{state.hotspots.length}</strong>
          <span className="stat-sub">Persistent hotspot memory</span>
        </article>
        <article className="stat glass red">
          <span className="stat-label">RECURRING / WATCH</span>
          <strong className="stat-value">{counters.recurring}</strong>
          <span className="stat-sub">Cannot be closed by a photo</span>
        </article>
        <article className="stat glass teal">
          <span className="stat-label">CLEAN DAYS VERIFIED</span>
          <strong className="stat-value">{counters.cleanDays}</strong>
          <span className="stat-sub">Across all monitoring windows</span>
        </article>
        <article className="stat glass blue">
          <span className="stat-label">ESCROW EXPOSURE</span>
          <strong className="stat-value">{formatINR(counters.held)}</strong>
          <span className="stat-sub">Locked pending 14-day outcome</span>
        </article>
      </section>

      <section className="workspace">
        <aside className="panel glass">
          <div className="panel-head">
            <h2>HOTSPOT REGISTER</h2>
            <small>{visibleHotspots.length} SHOWN</small>
          </div>
          <input
            className="search neu"
            placeholder="Search case ID or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? 'ALL' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="case-list">
            {visibleHotspots.map((h) => {
              const hr = computeRisk(h.factors, rainMultiplier);
              return (
                <button
                  key={h.id}
                  className={`case-item ${h.id === selected.id ? 'active' : ''}`}
                  onClick={() => selectHotspot(h.id)}
                >
                  <span className="case-top">
                    <span className="case-id">{h.id}</span>
                    <span className="case-risk">{hr.capped}</span>
                  </span>
                  <span className="case-name">{h.name}</span>
                  <span className="case-meta">
                    {h.reports30d} reports Â· {statusLabel(h.status)}
                  </span>
                </button>
              );
            })}
            {!visibleHotspots.length && (
              <div className="case-meta">NO CASES MATCH THIS FILTER.</div>
            )}
          </div>
        </aside>

        <section className="panel glass map-panel">
          <div className="panel-head">
            <h2>REAL DELHI / HOTSPOT MAP</h2>
            <button className="filter-chip" onClick={() => setRegisterOpen((open) => !open)}>
              {registerOpen ? 'HIDE REGISTER' : 'OPEN REGISTER'}
            </button>
          </div>
          <div className="map-wrap">
            <RealMap
              hotspots={state.hotspots}
              selectedId={selected.id}
              onSelect={selectHotspot}
            />
          </div>
          <div className="map-legend">
            <span><i className="dot amber" />30 m cluster</span>
            <span><i className="dot blue" />150 m halo</span>
            <span><i className="dot red" />Critical</span>
            <span><i className="dot teal" />Verified</span>
          </div>
        </section>

        <aside className="panel glass case-detail-panel">
          <div className="panel-head">
            <h2>CASE FILE / {selected.id}</h2>
            <small>DAY {String(selected.monitor.currentDay).padStart(2, '0')} OF 14</small>
          </div>

          <div className="case-detail">
            <div className="risk-hero">
              <div>
                <span className="stat-label">RISK SCORE</span>
                <span className="risk-number">{risk.capped}</span>
                <span className="risk-raw">raw {risk.raw} Â· M {rainMultiplier.toFixed(2)}</span>
              </div>
              <span className={`badge ${statusTone(selected.status)}`}>{statusLabel(selected.status)}</span>
            </div>

            <div className="detail-row"><span>LOCATION</span><strong>{selected.ward}</strong></div>
            <div className="detail-row"><span>REPORTS / 30D</span><strong>{selected.reports30d}</strong></div>
            <div className="detail-row"><span>WASTE</span><strong>{selected.wasteType}</strong></div>

            <div className="factor-stack">
              {(Object.keys(risk.parts) as Array<keyof typeof risk.parts>).map((key) => {
                const max = { recurrence: 35, hazard: 25, proximity: 25, duration: 15 }[key];
                return (
                  <div className="factor-row" key={key}>
                    <span>{key.slice(0, 4).toUpperCase()} {Math.round((max / 100) * 100)}%</span>
                    <i><b style={{ width: `${Math.min(100, (risk.parts[key] / max) * 100)}%` }} /></i>
                    <span>{risk.parts[key].toFixed(1)}</span>
                  </div>
                );
              })}
            </div>

            <div>
              <span className="stat-label">14-DAY VERIFICATION</span>
              <div className="timeline" style={{ marginTop: 8 }}>
                {selected.monitor.checkpoints.map((c, i) => (
                  <div key={i} className={`tick ${c}`} title={`Day ${i + 1}: ${c}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>

            {selected.monitor.spillover && (
              <div className="spill">150 m SPILLOVER DETECTED Â· SECONDARY ALLEY FLAGGED</div>
            )}

            <div>
              <span className="stat-label">OUTCOME-LINKED SLA / 40 : 60</span>
              <div className="ledger-bar" style={{ marginTop: 8 }}>
                <i className="clear" />
                <i className={`hold ${escrowTone}`} />
              </div>
              <div className="ledger-amounts">
                <span>40% CLEAR<br />{formatINR(selected.contract.total * 0.4)}</span>
                <em className={escrowTone}>60% HOLD<br />{escrowText}</em>
              </div>
            </div>

            <div>
              <span className="stat-label">ROOT-CAUSE HYPOTHESES</span>
              <div className="cause-list" style={{ marginTop: 8 }}>
                {causes.map((c) => (
                  <div className="cause" key={c.title}>
                    <strong>{c.title}</strong>
                    <span>{c.evidence}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="lower">
        <article className="panel glass">
          <div className="panel-head">
            <h2>CITIZEN REPORT + EDGE VISION</h2>
            <small>SIMULATED</small>
          </div>
          <button className="btn neu" onClick={() => { setLat(String(PRESET.lat)); setLng(String(PRESET.lng)); }}>
            PRESET 1 Â· LAJPAT NAGAR MARKET
          </button>
          <div className="form-row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="lat">LATITUDE</label>
              <input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" />
            </div>
            <div className="field">
              <label htmlFor="lng">LONGITUDE</label>
              <input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn neu primary" onClick={submitReport} disabled={busy || demoRunning}>
              SUBMIT REPORT & ANALYSE
            </button>
          </div>
          <div className="cluster-out">
            {state.cluster ? (
              <>
                <strong>{state.cluster.distanceMeters} m</strong> from {state.cluster.matchedId || 'no case'} Â·{' '}
                <span className={state.cluster.action === 'MERGE' ? 'ok' : 'warn'}>{state.cluster.action}</span>
                <br />Reports in store: {state.reports.length}
              </>
            ) : (
              'No report analysed yet. Load the preset or enter coordinates, then submit.'
            )}
          </div>
          {state.vision && (
            <div className="vision-list">
              <div className="vision-meta">
                {state.vision.source} Â· {state.vision.severity} Â· ~{state.vision.massKg} KG
              </div>
              {state.vision.fractions.map((f) => (
                <div className="vision-row" key={f.label}>
                  <span>{f.label}</span>
                  <i><b style={{ width: `${f.value}%` }} /></i>
                  <span>{f.value}%</span>
                </div>
              ))}
              <div className="vision-meta">{state.vision.dispatch}</div>
            </div>
          )}
        </article>

        <article className="panel glass">
          <div className="panel-head">
            <h2>14-DAY VERDICT SIMULATOR</h2>
            <small>{selected.id}</small>
          </div>
          <p style={{ color: 'var(--dim)', fontSize: 11, marginTop: 0 }}>
            Cleanup is not a pass until the site survives 14 days and the 150 m halo stays quiet.
          </p>
          <div className="btn-row">
            <button className="btn neu danger" onClick={() => runVerdict('recurrence')} disabled={busy || demoRunning}>
              SIMULATE RECURRENCE
            </button>
            <button className="btn neu ok" onClick={() => runVerdict('success')} disabled={busy || demoRunning}>
              SIMULATE SUCCESS
            </button>
          </div>
          <div className="verdict-out">
            {state.lastVerdict ? (
              <>
                <strong>{state.lastVerdict.mode}</strong> Â· {state.lastVerdict.message}
                <br />ESCROW:{' '}
                <span className={state.lastVerdict.escrow === 'RELEASED' ? 'ok' : 'warn'}>
                  {state.lastVerdict.escrow}
                </span>
              </>
            ) : (
              'No verdict run. The monitor is live â€” force either outcome to see the ledger react.'
            )}
          </div>
          <div className="map-legend" style={{ marginTop: 14 }}>
            <span>Monsoon multiplier applies to every factor equally.</span>
          </div>
        </article>

        <article className="panel glass audit-panel">
          <div className="panel-head">
            <h2>AUDIT TRAIL</h2>
            <small>LOCAL SESSION</small>
          </div>
          <div className="audit-list">
            {state.audit.map((a) => (
              <div className="audit-item" key={a.id}>
                <strong>{a.action}</strong>
                <span>{a.detail}</span>
                <span className="audit-time">{new Date(a.at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {briefingOpen && (
        <div className="briefing-backdrop" onClick={() => setBriefingOpen(false)}>
          <div className="briefing glass" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head">
              <h2>WHY KACHRALAB EXISTS</h2>
              <button className="btn neu" onClick={() => setBriefingOpen(false)}>CLOSE</button>
            </div>
            <h2>A ticket ends. A case remembers.</h2>
            <p>
              A citizen reports a pile, a truck is dispatched, a photo is uploaded, the ticket closes â€”
              and the same spot refills in three to five days. The budget pays for activity, not outcome.
            </p>
            <div className="briefing-grid">
              <article>
                <h3>LEGACY CIVIC APPS</h3>
                <p>Stateless tickets, blind dispatch, instant closure, zero spillover check.</p>
              </article>
              <article>
                <h3>KACHRALAB</h3>
                <p>30 m hotspot memory, explainable risk, 14-day verification, 150 m halo, 40/60 escrow.</p>
              </article>
              <article>
                <h3>EXPLAINABLE RISK</h3>
                <p>(0.35R + 0.25H + 0.25P + 0.15D) Ã— M<sub>rain</sub>, capped at 100.</p>
              </article>
              <article>
                <h3>DISCLAIMER</h3>
                <p>All data is illustrative. Edge-Vision is rule-based simulation. The map is schematic, not GIS.</p>
              </article>
            </div>
          </div>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {state.lastVerdict ? state.lastVerdict.message : ''}
      </div>
    </div>
  );
}

```
### components/HumanLoop.tsx
```tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  AppState,
  CheckpointState,
  EscrowState,
  HotspotStatus,
  RAIN,
  createHotspotFromReport,
  createSeedState,
  haversineMeters,
  simulateVision,
  statusLabel,
  statusTone
} from '@/lib/engine';

const STORE_KEY = 'kachralab.next.v1';

type HumanTab = 'citizen' | 'inspector' | 'contractor' | 'commissioner';

function loadState(): AppState {
  if (typeof window === 'undefined') return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* ignore */
  }
  return createSeedState();
}

function withAudit(state: AppState, action: string, detail: string): AppState {
  return {
    ...state,
    audit: [
      { id: Date.now() + Math.random(), at: Date.now(), action, detail },
      ...state.audit
    ].slice(0, 24)
  };
}

function demoPhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#16222c';
  ctx.fillRect(0, 0, 320, 180);
  ctx.fillStyle = '#243845';
  ctx.fillRect(30, 60, 60, 120);
  ctx.fillRect(110, 35, 70, 145);
  ctx.fillRect(200, 72, 55, 108);
  ctx.fillStyle = '#6b5a3a';
  ctx.beginPath();
  ctx.moveTo(110, 180);
  ctx.lineTo(138, 132);
  ctx.lineTo(166, 160);
  ctx.lineTo(192, 126);
  ctx.lineTo(224, 180);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2b33d';
  ctx.font = '11px monospace';
  ctx.fillText('SITE PHOTO / DAY VISIT', 18, 22);
  return canvas.toDataURL('image/png');
}

function classify(point: { lat: number; lng: number }, hotspot: AppState['hotspots'][number]) {
  const distance = haversineMeters(point, { lat: hotspot.lat, lng: hotspot.lng });
  if (distance <= 30) return { distance, kind: 'RECURRENCE' as const };
  if (distance <= 150) return { distance, kind: 'SPILLOVER' as const };
  return { distance, kind: 'NEW_NODE' as const };
}

export default function HumanLoop() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<HumanTab>('citizen');
  const [lat, setLat] = useState('28.5702');
  const [lng, setLng] = useState('77.2432');
  const [day, setDay] = useState(7);
  const [photo, setPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState('Choose a role and log an action.');
  const [geoStatus, setGeoStatus] = useState('GPS NOT REQUESTED');

  useEffect(() => {
    setState(loadState());
  }, []);

  const selected = useMemo(
    () => state.hotspots.find((h) => h.id === state.selectedId) || state.hotspots[0],
    [state.hotspots, state.selectedId]
  );

  function commit(next: AppState, text: string) {
    setState(next);
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setMessage(text);
  }

  function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  function fetchLiveLocation() {
    if (!navigator.geolocation) {
      setGeoStatus('GPS UNSUPPORTED');
      setMessage('This browser does not expose geolocation.');
      return;
    }
    setGeoStatus('REQUESTING GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);
        setLat(currentLat.toFixed(6));
        setLng(currentLng.toFixed(6));
        setGeoStatus(`GPS LOCK Â±${accuracy} M`);
        setMessage(`Live location captured: ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)} (Â±${accuracy} m).`);
      },
      (error) => {
        setGeoStatus('GPS DENIED / UNAVAILABLE');
        setMessage(`Location unavailable: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function applyDetection(kind: 'RECURRENCE' | 'SPILLOVER', next: AppState): AppState {
    const hotspots = next.hotspots.map((h) => {
      if (h.id !== selected.id) return h;
      const checkpoints = [...h.monitor.checkpoints] as CheckpointState[];
      if (kind === 'SPILLOVER') {
        checkpoints[Math.min(13, Math.max(0, h.monitor.currentDay))] = 'failed';
        return {
          ...h,
          status: 'RECURRING' as HotspotStatus,
          monitor: { ...h.monitor, spillover: true, checkpoints },
          contract: { ...h.contract, escrow: 'WITHHELD' as EscrowState, heldAmount: 7200 }
        };
      }
      checkpoints[Math.min(13, Math.max(0, h.monitor.currentDay - 1))] = 'failed';
      return {
        ...h,
        reports30d: h.reports30d + 1,
        factors: { ...h.factors, recurrence: Math.min(100, h.factors.recurrence + 1) },
        status: 'RECURRING' as HotspotStatus,
        monitor: { ...h.monitor, checkpoints },
        contract: { ...h.contract, escrow: 'WITHHELD' as EscrowState, heldAmount: 7200 }
      };
    });
    return { ...next, hotspots };
  }

  function submitCitizenReport() {
    const point = { lat: Number(lat), lng: Number(lng) };
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
      setMessage('Enter valid numeric coordinates.');
      return;
    }
    const result = classify(point, selected);
    let next = withAudit(state, 'CITIZEN REPORT', `${result.kind} at ${result.distance.toFixed(1)} m from ${selected.id}`);
    next = { ...next, reports: [{ ...point, matchedId: result.kind === 'NEW_NODE' ? null : selected.id, at: Date.now() }, ...next.reports] };

    if (result.kind === 'NEW_NODE') {
      const vision = simulateVision();
      const id = `GZ-${String(60 + next.hotspots.length).padStart(3, '0')}`;
      const created = createHotspotFromReport(id, point.lat, point.lng, vision);
      next = { ...next, hotspots: [...next.hotspots, created], selectedId: id };
      commit(next, `New hotspot ${id} created outside the 150 m halo.`);
      return;
    }
    next = applyDetection(result.kind, next);
    commit(
      next,
      result.kind === 'SPILLOVER'
        ? `Spillover flagged ${result.distance.toFixed(1)} m from ${selected.id}. 60% withheld.`
        : `Report merged into ${selected.id}. Recurrence incremented.`
    );
  }

  function logInspectorVisit() {
    if (!photo) {
      setMessage('Attach a site photo before logging the verification visit.');
      return;
    }
    const point = { lat: Number(lat), lng: Number(lng) };
    const result = classify(point, selected);
    let next = withAudit(state, 'FIELD VISIT', `Day ${day} pin ${result.distance.toFixed(1)} m from ${selected.id} Â· ${result.kind}`);

    if (result.kind === 'SPILLOVER') {
      next = applyDetection('SPILLOVER', next);
      commit(next, `Day ${day}: spillover confirmed in the 150 m halo. 60% withheld.`);
      return;
    }
    if (result.kind === 'NEW_NODE') {
      commit(next, `Day ${day}: pin is outside the halo. No spillover attributed to ${selected.id}.`);
      return;
    }

    const hotspots = next.hotspots.map((h) => {
      if (h.id !== selected.id) return h;
      const checkpoints = [...h.monitor.checkpoints] as CheckpointState[];
      checkpoints[day - 1] = 'clean';
      const allClean = checkpoints.every((c) => c === 'clean');
      const clean = allClean && !h.monitor.spillover;
      return {
        ...h,
        monitor: { ...h.monitor, currentDay: Math.max(h.monitor.currentDay, day), checkpoints },
        status: (clean ? 'VERIFIED_CLEAN' : h.status) as HotspotStatus,
        contract: clean
          ? { ...h.contract, escrow: 'RELEASED' as EscrowState, heldAmount: 0 }
          : h.contract
      };
    });
    commit({ ...next, hotspots }, `Day ${day} verified clean at ${selected.id}.`);
  }

  function rectify(lever: 'bins' | 'beat' | 'drain') {
    const labels = {
      bins: 'Bins installed at market ring',
      beat: 'Collection beat moved to 06:00',
      drain: 'Storm drain desilted'
    };
    const next = withAudit(state, 'CONTRACTOR ACTION', labels[lever]);
    const hotspots = next.hotspots.map((h) => {
      if (h.id !== selected.id) return h;
      const factors = { ...h.factors };
      if (lever === 'bins') factors.hazard = Math.max(0, factors.hazard - 28);
      if (lever === 'beat') factors.recurrence = Math.max(0, factors.recurrence - 24);
      if (lever === 'drain') factors.proximity = Math.max(0, factors.proximity - 26);
      return { ...h, factors };
    });
    commit({ ...next, hotspots }, `${labels[lever]}. Risk factors updated.`);
  }

  function reviewDecision(decision: 'RELEASE' | 'WITHHOLD') {
    const next = withAudit(state, 'COMMISSIONER', `${decision} hold for ${selected.id}`);
    const hotspots = next.hotspots.map((h) => {
      if (h.id !== selected.id) return h;
      return decision === 'RELEASE'
        ? {
            ...h,
            status: 'VERIFIED_CLEAN' as HotspotStatus,
            contract: { ...h.contract, escrow: 'RELEASED' as EscrowState, heldAmount: 0 }
          }
        : {
            ...h,
            status: 'RECURRING' as HotspotStatus,
            contract: { ...h.contract, escrow: 'WITHHELD' as EscrowState, heldAmount: 7200 }
          };
    });
    commit({ ...next, hotspots }, `Commissioner ${decision.toLowerCase()} the 60% hold for ${selected.id}.`);
  }

  useEffect(() => {
    setLat(String(selected.lat + (tab === 'inspector' ? 0.0001 : 0)));
    setLng(String(selected.lng + (tab === 'inspector' ? 0.0002 : 0)));
  }, [selected.id, tab]);

  const currentRisk = Math.min(100, Math.round(
    (0.35 * selected.factors.recurrence +
      0.25 * selected.factors.hazard +
      0.25 * selected.factors.proximity +
      0.15 * selected.factors.duration) * (state.rain ? RAIN.monsoon : RAIN.dry)
  ));

  return (
    <div className="app human-app">
      <header className="topbar glass">
        <div className="brand">
          <span className="brand-mark">KL</span>
          <span className="brand-copy">
            <strong>KACHRA<span style={{ color: 'var(--amber)' }}>LAB</span></strong>
            <span>HUMAN LOOP / PEOPLE IN THE SYSTEM</span>
          </span>
        </div>
        <nav className="topnav" aria-label="Main actions">
          <Link href="/" className="navbtn">CONSOLE</Link>
          <Link href="/human" className="navbtn active">FIELD</Link>
          <Link href="/lab" className="navbtn">PROOF</Link>
          <Link href="/impact" className="navbtn">IMPACT</Link>
          <Link href="/?demo=1" className="navbtn">RUN DEMO</Link>
        </nav>
      </header>

      <section className="panel glass human-hero">
        <span className="stat-label">THE SENSORS ARE PEOPLE. THE HALO IS THE JUDGE.</span>
        <h1>Every machine flag needs a human action.</h1>
        <p>
          Citizens report, inspectors verify, contractors fix and commissioners decide. Each role writes
          into the same case file the engine reads.
        </p>
      </section>

      <div className="role-tabs human-tabs">
        {([
          ['citizen', 'CITIZEN / REPORT'],
          ['inspector', 'INSPECTOR / VERIFY'],
          ['contractor', 'CONTRACTOR / RECTIFY'],
          ['commissioner', 'COMMISSIONER / DECIDE']
        ] as const).map(([key, label]) => (
          <button key={key} className={`filter-chip ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="human-grid">
        <section className="panel glass human-work">
          <div className="panel-head"><h2>{tab.toUpperCase()} ACTION</h2><small>{selected.id}</small></div>

          {(tab === 'citizen' || tab === 'inspector') && (
            <>
              <div className="form-row">
                <div className="field">
                  <label>LATITUDE</label>
                  <input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" />
                </div>
                <div className="field">
                  <label>LONGITUDE</label>
                  <input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" />
                </div>
              </div>
              <div className="vision-meta" style={{ color: geoStatus.startsWith('GPS LOCK') ? 'var(--teal)' : 'var(--amber)' }}>
                {geoStatus}
              </div>
              <div className="btn-row">
                <button className="btn neu primary" onClick={fetchLiveLocation}>USE MY LIVE LOCATION</button>
                <button className="btn neu" onClick={() => { setLat('28.5702'); setLng('77.2432'); }}>
                  USE GZ-042 CENTROID PIN
                </button>
                <button className="btn neu" onClick={() => { setLat('28.5706'); setLng('77.2435'); }}>
                  USE 50 M SPILLOVER PIN
                </button>
                <button className="btn neu" onClick={() => setPhoto(demoPhoto())}>USE DEMO PHOTO</button>
              </div>
              <label className="upload">
                <span>{photo ? 'PHOTO ATTACHED' : 'ATTACH SITE PHOTO'}</span>
                <input type="file" accept="image/*" onChange={onPhoto} />
              </label>
              {photo && <img className="human-photo" src={photo} alt="Site evidence" />}
              {tab === 'inspector' && (
                <div className="btn-row">
                  {[7, 14].map((d) => (
                    <button key={d} className={`filter-chip ${day === d ? 'active' : ''}`} onClick={() => setDay(d)}>
                      DAY {d} VISIT
                    </button>
                  ))}
                </div>
              )}
              <div className="btn-row">
                <button className="btn neu primary" onClick={tab === 'citizen' ? submitCitizenReport : logInspectorVisit}>
                  {tab === 'citizen' ? 'SUBMIT CITIZEN REPORT' : `LOG DAY ${day} VERIFICATION`}
                </button>
              </div>
              <p className="human-rule">
                0â€“30 m = same case Â· 30â€“150 m = spillover Â· over 150 m = new hotspot.
              </p>
            </>
          )}

          {tab === 'contractor' && (
            <>
              <p className="lab-note">
                Fix the cause, not the pile. Each action changes the live risk factors of {selected.id}.
              </p>
              <div className="btn-row">
                <button className="btn neu" onClick={() => rectify('bins')}>INSTALL BINS</button>
                <button className="btn neu" onClick={() => rectify('beat')}>FIX COLLECTION BEAT</button>
                <button className="btn neu" onClick={() => rectify('drain')}>DESILT DRAIN</button>
              </div>
              <div className="score-compare">
                <div><span>LIVE RISK</span><strong>{currentRisk}</strong></div>
                <div className="btn-row"><button className="btn neu" onClick={() => setState(loadState())}>REFRESH CASE</button></div>
              </div>
            </>
          )}

          {tab === 'commissioner' && (
            <>
              <div className="case-list human-cases">
                {state.hotspots.map((h) => (
                  <button key={h.id} className={`case-item ${h.id === selected.id ? 'active' : ''}`} onClick={() => setState({ ...state, selectedId: h.id })}>
                    <span className="case-top"><span className="case-id">{h.id}</span><span className="case-risk">{h.contract.escrow}</span></span>
                    <span className="case-name">{h.name}</span>
                    <span className="case-meta">{statusLabel(h.status)} Â· {h.contract.heldAmount ? '60% locked' : 'released'}</span>
                  </button>
                ))}
              </div>
              <div className="btn-row">
                <button className="btn neu ok" onClick={() => reviewDecision('RELEASE')}>RELEASE 60% HOLD</button>
                <button className="btn neu danger" onClick={() => reviewDecision('WITHHOLD')}>WITHHOLD 60%</button>
              </div>
            </>
          )}
        </section>

        <aside className="panel glass human-context">
          <div className="panel-head"><h2>CASE CONTEXT</h2><small>LIVE FROM SHARED SESSION</small></div>
          <div className="risk-hero">
            <div>
              <span className="stat-label">RISK SCORE</span>
              <span className="risk-number">{currentRisk}</span>
              <span className="risk-raw">{selected.reports30d} reports Â· {statusLabel(selected.status)}</span>
            </div>
            <span className={`badge ${statusTone(selected.status)}`}>{statusLabel(selected.status)}</span>
          </div>
          <div className="detail-row"><span>WARD</span><strong>{selected.ward}</strong></div>
          <div className="detail-row"><span>SPILLOVER</span><strong>{selected.monitor.spillover ? 'FLAGGED' : 'CLEAR'}</strong></div>
          <div className="detail-row"><span>ESCROW</span><strong>{selected.contract.escrow} Â· {selected.contract.heldAmount}</strong></div>
          <div className="timeline" style={{ marginTop: 14 }}>
            {selected.monitor.checkpoints.map((c, i) => (
              <div key={i} className={`tick ${c}`}>{String(i + 1).padStart(2, '0')}</div>
            ))}
          </div>
          <div className="audit-result ok"><strong>{message}</strong></div>
          <div className="hash-list human-audit">
            {state.audit.slice(0, 8).map((a) => (
              <div key={a.id}><span>{a.action}</span><code>{a.detail.slice(0, 28)}â€¦</code></div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

```
### components/Lab.tsx
```tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { computeRisk, createSeedState, RAIN } from '@/lib/engine';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n || 0);

async function digestHex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function paintSkyline(ctx: CanvasRenderingContext2D, shift: number, tint: string) {
  ctx.fillStyle = tint;
  const buildings = [
    [20, 92, 46, 108],
    [70, 62, 52, 138],
    [128, 104, 40, 96],
    [172, 48, 58, 152],
    [236, 84, 44, 116],
    [284, 68, 30, 132]
  ];
  buildings.forEach(([x, y, w, h], i) => {
    ctx.fillRect(x + shift + (i % 2) * 2, y + (i % 3) * 3, w, h);
  });
}

function paintPile(ctx: CanvasRenderingContext2D, x: number, tint: string) {
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.moveTo(x, 200);
  ctx.lineTo(x + 26, 158);
  ctx.lineTo(x + 52, 178);
  ctx.lineTo(x + 76, 150);
  ctx.lineTo(x + 104, 200);
  ctx.closePath();
  ctx.fill();
}

function syntheticPair(same: boolean): { before: string; after: string } {
  const make = (shift: number, pileX: number, pileTint: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, 320, 200);
    paintSkyline(ctx, shift, same ? '#203342' : '#2a3140');
    paintPile(ctx, pileX, pileTint);
    return canvas.toDataURL('image/png');
  };
  return {
    before: make(0, 108, '#6b5a3a'),
    after: same ? make(0, 124, '#7a6640') : make(34, 132, '#7a6640')
  };
}

interface LedgerEntry {
  id: number;
  action: string;
  detail: string;
  nonce: string;
  hash: string;
}

const ROLE_VIEWS = {
  citizen: {
    title: 'Citizen',
    line: 'I just want the pile gone â€” and proof it stays gone.',
    items: ['Scan the on-site QR', 'Send a photo + pin', 'Track the 14-day watch', 'See the payment hold']
  },
  inspector: {
    title: 'Field Inspector',
    line: 'Give me the likely cause and the next physical action.',
    items: ['Root-cause hypotheses', '30 m cluster history', '150 m spillover alert', 'Dispatch priority']
  },
  contractor: {
    title: 'Contractor',
    line: 'Tell me exactly what unlocks my 60%.',
    items: ['40% cleared on Day 0', '14 clean checkpoints', 'No spillover in 150 m', '60% auto-released']
  },
  commissioner: {
    title: 'Commissioner',
    line: 'Show me outcome, not activity, across every ward.',
    items: ['Ward risk ranking', 'Repeat-cleanup savings', 'Evidence-linked dossier', 'Audit hash chain']
  }
};

type RoleKey = keyof typeof ROLE_VIEWS;

export default function Lab() {
  const seed = useMemo(() => createSeedState(), []);
  const baseFactors = seed.hotspots[0].factors;

  const [levers, setLevers] = useState({ bins: 0, beat: 0, drain: 0 });
  const [monsoon, setMonsoon] = useState(false);
  const [beforeSrc, setBeforeSrc] = useState('');
  const [afterSrc, setAfterSrc] = useState('');
  const [audit, setAudit] = useState<{ confidence: number; verdict: string; avg: number } | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [contractValue, setContractValue] = useState(12000);
  const [wards, setWards] = useState(10);
  const [drop, setDrop] = useState(68);
  const [role, setRole] = useState<RoleKey>('inspector');
  const [intakeSent, setIntakeSent] = useState(false);
  const [group, setGroup] = useState<'model' | 'evidence' | 'business'>('model');

  useEffect(() => {
    const pair = syntheticPair(true);
    setBeforeSrc(pair.before);
    setAfterSrc(pair.after);
    (async () => {
      const hash = await digestHex('GENESIS|KachraLab|v1');
      setEntries([{ id: 1, action: 'GENESIS', detail: 'Evidence ledger initialised', nonce: '0', hash }]);
    })();
  }, []);

  const adjustedFactors = useMemo(
    () => ({
      recurrence: clamp(baseFactors.recurrence - levers.beat * 0.55),
      hazard: clamp(baseFactors.hazard - levers.bins * 0.5 - levers.drain * 0.08),
      proximity: clamp(baseFactors.proximity - levers.drain * 0.55),
      duration: clamp(baseFactors.duration - (levers.beat + levers.bins + levers.drain) / 6)
    }),
    [baseFactors, levers]
  );

  const originalRisk = useMemo(
    () => computeRisk(baseFactors, monsoon ? RAIN.monsoon : RAIN.dry),
    [baseFactors, monsoon]
  );
  const projectedRisk = useMemo(
    () => computeRisk(adjustedFactors, monsoon ? RAIN.monsoon : RAIN.dry),
    [adjustedFactors, monsoon]
  );

  const roi = useMemo(() => {
    const visits = Math.round((drop / 100) * 12 * wards);
    const saved = visits * contractValue * 0.4;
    return { visits, saved };
  }, [drop, wards, contractValue]);

  async function addEntry(action: string, detail: string) {
    const prev = entries[0]?.hash || 'GENESIS';
    const nonce = `${Date.now()}-${Math.random()}`;
    const hash = await digestHex(`${prev}|${action}|${detail}|${nonce}`);
    setEntries((current) => [
      { id: Date.now() + Math.random(), action, detail, nonce, hash },
      ...current
    ].slice(0, 12));
    setVerified(null);
  }

  async function runPhotoAudit() {
    if (!beforeSrc || !afterSrc) return;
    const [a, b] = await Promise.all([loadImage(beforeSrc), loadImage(afterSrc)]);
    const size = 64;
    const sample = (img: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      return ctx.getImageData(0, 0, size, size).data;
    };
    const da = sample(a);
    const db = sample(b);
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      const la = da[i] * 0.299 + da[i + 1] * 0.587 + da[i + 2] * 0.114;
      const lb = db[i] * 0.299 + db[i + 1] * 0.587 + db[i + 2] * 0.114;
      diff += Math.abs(la - lb);
    }
    const avg = diff / (size * size);
    const confidence = clamp(100 - avg * 1.35);
    const verdict = confidence >= 62 ? 'SAME LANDMARK / CLEANUP VALID' : 'SCENE MISMATCH / SPOOF RISK';
    setAudit({ confidence, verdict, avg });
    await addEntry('PHOTO AUDIT', `${verdict} (${confidence}% confidence)`);
  }

  async function verifyChain() {
    let prev = 'GENESIS';
    let ok = true;
    for (const entry of [...entries].reverse()) {
      const expected = await digestHex(`${prev}|${entry.action}|${entry.detail}|${entry.nonce}`);
      if (expected !== entry.hash) {
        ok = false;
        break;
      }
      prev = entry.hash;
    }
    setVerified(ok);
  }

  function exportDossier() {
    const payload = {
      product: 'KachraLab',
      generatedAt: new Date().toISOString(),
      case: 'GZ-042',
      disclaimer: 'Illustrative demonstration. Edge-Vision is rule-based simulation.',
      originalRisk,
      projectedRisk,
      levers,
      factors: adjustedFactors,
      roi,
      photoAudit: audit,
      evidenceLedger: entries
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kachralab-14day-dossier.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const qrCells = Array.from({ length: 49 }, (_, i) => (i * 7 + Math.floor(i / 7)) % 3 === 0);
  const roleView = ROLE_VIEWS[role];

  return (
    <div className="app lab-app">
      <header className="topbar glass">
        <div className="brand">
          <span className="brand-mark">KL</span>
          <span className="brand-copy">
            <strong>KACHRA<span style={{ color: 'var(--amber)' }}>LAB</span></strong>
            <span>INNOVATION LAB / PROOF ENGINES</span>
          </span>
        </div>
        <nav className="topnav" aria-label="Main actions">
          <Link href="/" className="navbtn">CONSOLE</Link>
          <Link href="/human" className="navbtn">FIELD</Link>
          <Link href="/lab" className="navbtn active">PROOF</Link>
          <Link href="/impact" className="navbtn">IMPACT</Link>
          <Link href="/?demo=1" className="navbtn">RUN DEMO</Link>
        </nav>
      </header>

      <section className={`panel glass lab-hero ${monsoon ? 'is-monsoon' : ''}`}>
        <div className="rain-layer" aria-hidden="true" />
        <div className="lab-hero-copy">
          <span className="stat-label">PROOF ENGINES / WHAT IF, WHAT PROOF, WHAT SAVINGS</span>
          <h1>Make the claim testable.</h1>
          <p>
            These are not slides. Move a lever, upload a photo, verify a hash chain and download the
            dossier. Every number below is computed in the browser.
          </p>
          <button className="btn neu primary" onClick={() => setMonsoon((m) => !m)}>
            {monsoon ? 'RESTORE DRY CONDITIONS' : 'TRIGGER MONSOON SURGE Ã—1.35'}
          </button>
        </div>
      </section>

      <div className="role-tabs lab-groups">
        {(['model', 'evidence', 'business'] as const).map((g) => (
          <button key={g} className={`filter-chip ${group === g ? 'active' : ''}`} onClick={() => setGroup(g)}>
            {g.toUpperCase()}
          </button>
        ))}
      </div>
      <div className={`lab-grid show-${group}`}>
        <section className="panel glass lab-card">
          <div className="panel-head"><h2>INTERVENTION WHAT-IF LAB</h2><small>GZ-042</small></div>
          <p className="lab-note">Move an operational lever. Watch risk and the 60% hold react.</p>
          {([
            ['bins', 'ADD BIN CAPACITY'],
            ['beat', 'FIX COLLECTION BEAT'],
            ['drain', 'CLEAN STORM DRAIN']
          ] as const).map(([key, label]) => (
            <div className="lever" key={key}>
              <div className="lever-head"><span>{label}</span><strong>{levers[key]}%</strong></div>
              <input
                type="range"
                min="0"
                max="100"
                value={levers[key]}
                onChange={(e) => setLevers((l) => ({ ...l, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
          <div className="score-compare">
            <div><span>BASELINE</span><strong>{originalRisk.capped}</strong></div>
            <div className="arrow">â†’</div>
            <div className="projected"><span>WITH INTERVENTION</span><strong>{projectedRisk.capped}</strong></div>
            <div className="delta">{projectedRisk.capped - originalRisk.capped}</div>
          </div>
          <button className="btn neu" onClick={() => addEntry('INTERVENTION MODEL', `Risk ${originalRisk.capped} â†’ ${projectedRisk.capped}`)}>
            COMMIT HYPOTHESIS TO LEDGER
          </button>
        </section>

        <section className="panel glass lab-card">
          <div className="panel-head"><h2>PHOTO SPOOF AUDIT</h2><small>CLIENT-SIDE CANVAS</small></div>
          <p className="lab-note">Landmark silhouette is compared to the cleanup photo. No API, no upload.</p>
          <div className="photo-pair">
            <div><span>BEFORE</span>{beforeSrc && <img src={beforeSrc} alt="Before cleanup" />}</div>
            <div><span>AFTER</span>{afterSrc && <img src={afterSrc} alt="After cleanup" />}</div>
          </div>
          <div className="btn-row">
            <button className="btn neu" onClick={() => { const p = syntheticPair(true); setBeforeSrc(p.before); setAfterSrc(p.after); }}>
              SAME LANDMARK PAIR
            </button>
            <button className="btn neu" onClick={() => { const p = syntheticPair(false); setBeforeSrc(p.before); setAfterSrc(p.after); }}>
              SPOOF PAIR
            </button>
            <button className="btn neu primary" onClick={runPhotoAudit}>RUN AUDIT</button>
          </div>
          {audit && (
            <div className={`audit-result ${audit.confidence >= 62 ? 'ok' : 'warn'}`}>
              <strong>{audit.verdict}</strong>
              <span>{audit.confidence}% landmark confidence Â· pixel delta {audit.avg.toFixed(1)}</span>
            </div>
          )}
        </section>

        <section className="panel glass lab-card">
          <div className="panel-head"><h2>EVIDENCE LEDGER</h2><small>SHA-256 HASH CHAIN</small></div>
          <p className="lab-note">Each entry is chained to the previous hash. Tamper with one and verification fails.</p>
          <button className="btn neu" onClick={verifyChain}>VERIFY CHAIN</button>
          {verified !== null && (
            <div className={`audit-result ${verified ? 'ok' : 'warn'}`}>
              <strong>{verified ? 'CHAIN INTACT' : 'CHAIN BROKEN'}</strong>
              <span>{entries.length} entries verified against genesis.</span>
            </div>
          )}
          <div className="hash-list">
            {entries.map((e) => (
              <div key={e.id}><span>{e.action}</span><code>{e.hash.slice(0, 14)}â€¦</code></div>
            ))}
          </div>
        </section>

        <section className="panel glass lab-card">
          <div className="panel-head"><h2>BUDGET ROI SIMULATOR</h2><small>ILLUSTRATIVE</small></div>
          <div className="lever">
            <div className="lever-head"><span>CONTRACT / CLEARANCE</span><strong>{inr(contractValue)}</strong></div>
            <input type="range" min="4000" max="30000" step="1000" value={contractValue} onChange={(e) => setContractValue(Number(e.target.value))} />
          </div>
          <div className="lever">
            <div className="lever-head"><span>WARDS</span><strong>{wards}</strong></div>
            <input type="range" min="1" max="50" value={wards} onChange={(e) => setWards(Number(e.target.value))} />
          </div>
          <div className="lever">
            <div className="lever-head"><span>RECURRENCE DROP</span><strong>{drop}%</strong></div>
            <input type="range" min="0" max="90" value={drop} onChange={(e) => setDrop(Number(e.target.value))} />
          </div>
          <div className="roi-out">
            <strong>{inr(roi.saved)}</strong>
            <span>saved over 6 months Â· {roi.visits} avoided repeat cleanups</span>
          </div>
        </section>

        <section className="panel glass lab-card">
          <div className="panel-head"><h2>ROLE LENS</h2><small>SAME DATA, DIFFERENT DECISION</small></div>
          <div className="role-tabs">
            {(Object.keys(ROLE_VIEWS) as RoleKey[]).map((k) => (
              <button key={k} className={`filter-chip ${role === k ? 'active' : ''}`} onClick={() => setRole(k)}>
                {ROLE_VIEWS[k].title.toUpperCase()}
              </button>
            ))}
          </div>
          <h3 className="role-title">{roleView.title}</h3>
          <p className="lab-note">â€œ{roleView.line}â€</p>
          <ul className="role-list">{roleView.items.map((i) => <li key={i}>{i}</li>)}</ul>
        </section>

        <section className="panel glass lab-card">
          <div className="panel-head"><h2>ZERO-DOWNLOAD INTAKE</h2><small>SIMULATED WHATSAPP + QR</small></div>
          <div className="chat-mock">
            <div className="qr-mock">{qrCells.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</div>
            <div className="chat-bubbles">
              <div className="bubble in">Scan the yellow QR at the site. No app needed.</div>
              <div className="bubble out">ðŸ“ 28.5702, 77.2432 Â· ðŸ“· pile photo</div>
              <div className="bubble in">Case opened. 14-day watch starts after clearance.</div>
            </div>
          </div>
          <button className="btn neu" onClick={() => { setIntakeSent(true); void addEntry('CITIZEN INTAKE', 'Mock WhatsApp report received with photo + pin'); }}>
            {intakeSent ? 'REPORT RECEIVED' : 'SEND DEMO REPORT'}
          </button>
        </section>
      </div>

      <section className="panel glass lab-dossier">
        <div>
          <span className="stat-label">EXPORTABLE PROOF</span>
          <h2>14-day verification dossier</h2>
          <p className="lab-note">Downloads a JSON evidence packet with risk model, intervention levers, photo audit and hash chain.</p>
        </div>
        <button className="btn neu primary" onClick={exportDossier}>DOWNLOAD DOSSIER</button>
      </section>
    </div>
  );
}

```
### components/RealMap.tsx
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { AppState } from '@/lib/engine';

type LeafletNS = typeof import('leaflet');

interface RealMapProps {
  hotspots: AppState['hotspots'];
  selectedId: string;
  onSelect: (id: string) => void;
}

function toneColor(status: string): string {
  if (status === 'VERIFIED_CLEAN') return '#37c9a6';
  if (status === 'CRITICAL_P1' || status === 'RECURRING' || status === 'UNDER_MONITORING') return '#ef5b4c';
  if (status === 'NEW') return '#5a9df0';
  return '#f2b33d';
}

export default function RealMap({ hotspots, selectedId, onSelect }: RealMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletNS | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default as LeafletNS;
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        center: [28.5703, 77.2432],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);
      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !leafletRef.current || !mapRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    if (layerRef.current) map.removeLayer(layerRef.current);

    const group = L.layerGroup();
    const selected = hotspots.find((h) => h.id === selectedId) || hotspots[0];

    hotspots.forEach((h) => {
      const isSelected = h.id === selectedId;
      const color = toneColor(h.status);

      if (isSelected) {
        L.circle([h.lat, h.lng], {
          radius: 150,
          color: h.monitor.spillover ? '#ef5b4c' : '#5a9df0',
          weight: 1.5,
          fillColor: h.monitor.spillover ? '#ef5b4c' : '#5a9df0',
          fillOpacity: 0.08,
          dashArray: '5 6'
        }).addTo(group);

        L.circle([h.lat, h.lng], {
          radius: 30,
          color: '#f2b33d',
          weight: 2,
          fillColor: '#f2b33d',
          fillOpacity: 0.14,
          dashArray: '3 4'
        }).addTo(group);
      }

      const marker = L.circleMarker([h.lat, h.lng], {
        radius: isSelected ? 9 : 7,
        color,
        weight: 2,
        fillColor: isSelected ? '#f2b33d' : '#0b1218',
        fillOpacity: 1
      }).addTo(group);

      marker.bindTooltip(h.id, {
        permanent: isSelected,
        direction: 'top',
        className: 'kl-map-tooltip'
      });
      marker.on('click', () => onSelectRef.current(h.id));
    });

    if (selected && selected.monitor.spillover) {
      const depot = { lat: selected.lat - 0.0014, lng: selected.lng - 0.0022 };
      const spill = { lat: selected.lat + 0.00045, lng: selected.lng + 0.00095 };
      L.polyline(
        [[depot.lat, depot.lng], [selected.lat, selected.lng], [spill.lat, spill.lng]],
        { color: '#ef5b4c', weight: 3, dashArray: '7 6' }
      ).addTo(group);
      L.circleMarker([depot.lat, depot.lng], {
        radius: 6, color: '#f2b33d', fillColor: '#f2b33d', fillOpacity: 1
      }).bindTooltip('DEPOT', { permanent: true, direction: 'bottom' }).addTo(group);
      L.circleMarker([spill.lat, spill.lng], {
        radius: 5, color: '#ef5b4c', fillColor: '#ef5b4c', fillOpacity: 1
      }).bindTooltip('SPILLOVER', { permanent: true, direction: 'top' }).addTo(group);
    }

    group.addTo(map);
    layerRef.current = group;
    if (selected) map.panTo([selected.lat, selected.lng], { animate: true });
    map.invalidateSize();
  }, [ready, hotspots, selectedId]);

  return <div ref={containerRef} className="real-map" aria-label="Real OpenStreetMap hotspot map" />;
}

```
