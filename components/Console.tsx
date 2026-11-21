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
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.98;
        utterance.pitch = 0.96;
        window.speechSynthesis.speak(utterance);
      }
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
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }

  function resetAll() {
    setState(createSeedState());
    setLat('');
    setLng('');
  }

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
    <div className={`app view-${view}`}>
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
          <Link href="/cases" className={`navbtn ${view === 'cases' ? 'active' : ''}`}>CASES</Link>
          <Link href="/map" className={`navbtn ${view === 'map' ? 'active' : ''}`}>MAP</Link>
          <Link href="/simulator" className={`navbtn ${view === 'simulator' ? 'active' : ''}`}>SIMULATOR</Link>
          <Link href="/vision" className={`navbtn ${view === 'vision' ? 'active' : ''}`}>VISION</Link>
          <Link href="/lab" className="navbtn">LAB</Link>
          <Link href="/human" className="navbtn">HUMAN</Link>
          <Link href="/impact" className="navbtn">IMPACT</Link>
          <button className="navbtn" onClick={() => setBriefingOpen(true)}>WHY</button>
          <button className="navbtn" onClick={resetAll}>RESET</button>
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
            {state.rain ? 'MONSOON · 1.35×' : 'DRY · 1.00×'}
          </button>
          <button className="btn neu" onClick={guidedDemo} disabled={demoRunning || busy}>
            {demoRunning ? 'RUNNING...' : 'SHOW THE SYSTEM WORK'}
          </button>
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
                    {h.reports30d} reports · {statusLabel(h.status)}
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
            <small>OPENSTREETMAP · TRUE 30 M / 150 M RADII</small>
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
                <span className="risk-raw">raw {risk.raw} · M {rainMultiplier.toFixed(2)}</span>
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
              <div className="spill">150 m SPILLOVER DETECTED · SECONDARY ALLEY FLAGGED</div>
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
            PRESET 1 · LAJPAT NAGAR MARKET
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
                <strong>{state.cluster.distanceMeters} m</strong> from {state.cluster.matchedId || 'no case'} ·{' '}
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
                {state.vision.source} · {state.vision.severity} · ~{state.vision.massKg} KG
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
                <strong>{state.lastVerdict.mode}</strong> · {state.lastVerdict.message}
                <br />ESCROW:{' '}
                <span className={state.lastVerdict.escrow === 'RELEASED' ? 'ok' : 'warn'}>
                  {state.lastVerdict.escrow}
                </span>
              </>
            ) : (
              'No verdict run. The monitor is live — force either outcome to see the ledger react.'
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
              A citizen reports a pile, a truck is dispatched, a photo is uploaded, the ticket closes —
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
                <p>(0.35R + 0.25H + 0.25P + 0.15D) × M<sub>rain</sub>, capped at 100.</p>
              </article>
              <article>
                <h3>DISCLAIMER</h3>
                <p>All data is illustrative. Edge-Vision is rule-based simulation. The map is schematic, not GIS.</p>
              </article>
            </div>
            <button className="btn neu primary" onClick={() => { setBriefingOpen(false); void guidedDemo(); }}>
              SHOW THE SYSTEM WORK
            </button>
          </div>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {state.lastVerdict ? state.lastVerdict.message : ''}
      </div>
    </div>
  );
}
