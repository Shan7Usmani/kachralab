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
        setGeoStatus(`GPS LOCK ±${accuracy} M`);
        setMessage(`Live location captured: ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)} (±${accuracy} m).`);
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
    let next = withAudit(state, 'FIELD VISIT', `Day ${day} pin ${result.distance.toFixed(1)} m from ${selected.id} · ${result.kind}`);

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
                0–30 m = same case · 30–150 m = spillover · over 150 m = new hotspot.
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
                    <span className="case-meta">{statusLabel(h.status)} · {h.contract.heldAmount ? '60% locked' : 'released'}</span>
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
              <span className="risk-raw">{selected.reports30d} reports · {statusLabel(selected.status)}</span>
            </div>
            <span className={`badge ${statusTone(selected.status)}`}>{statusLabel(selected.status)}</span>
          </div>
          <div className="detail-row"><span>WARD</span><strong>{selected.ward}</strong></div>
          <div className="detail-row"><span>SPILLOVER</span><strong>{selected.monitor.spillover ? 'FLAGGED' : 'CLEAR'}</strong></div>
          <div className="detail-row"><span>ESCROW</span><strong>{selected.contract.escrow} · {selected.contract.heldAmount}</strong></div>
          <div className="timeline" style={{ marginTop: 14 }}>
            {selected.monitor.checkpoints.map((c, i) => (
              <div key={i} className={`tick ${c}`}>{String(i + 1).padStart(2, '0')}</div>
            ))}
          </div>
          <div className="audit-result ok"><strong>{message}</strong></div>
          <div className="hash-list human-audit">
            {state.audit.slice(0, 8).map((a) => (
              <div key={a.id}><span>{a.action}</span><code>{a.detail.slice(0, 28)}…</code></div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
