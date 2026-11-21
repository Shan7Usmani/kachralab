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
    line: 'I just want the pile gone — and proof it stays gone.',
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
          <Link href="/cases" className="navbtn">CASES</Link>
          <Link href="/map" className="navbtn">MAP</Link>
          <Link href="/simulator" className="navbtn">SIMULATOR</Link>
          <Link href="/vision" className="navbtn">VISION</Link>
          <Link href="/lab" className="navbtn active">LAB</Link>
          <Link href="/impact" className="navbtn">IMPACT</Link>
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
            {monsoon ? 'RESTORE DRY CONDITIONS' : 'TRIGGER MONSOON SURGE ×1.35'}
          </button>
        </div>
      </section>

      <div className="lab-grid">
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
            <div className="arrow">→</div>
            <div className="projected"><span>WITH INTERVENTION</span><strong>{projectedRisk.capped}</strong></div>
            <div className="delta">{projectedRisk.capped - originalRisk.capped}</div>
          </div>
          <button className="btn neu" onClick={() => addEntry('INTERVENTION MODEL', `Risk ${originalRisk.capped} → ${projectedRisk.capped}`)}>
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
              <span>{audit.confidence}% landmark confidence · pixel delta {audit.avg.toFixed(1)}</span>
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
              <div key={e.id}><span>{e.action}</span><code>{e.hash.slice(0, 14)}…</code></div>
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
            <span>saved over 6 months · {roi.visits} avoided repeat cleanups</span>
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
          <p className="lab-note">“{roleView.line}”</p>
          <ul className="role-list">{roleView.items.map((i) => <li key={i}>{i}</li>)}</ul>
        </section>

        <section className="panel glass lab-card">
          <div className="panel-head"><h2>ZERO-DOWNLOAD INTAKE</h2><small>SIMULATED WHATSAPP + QR</small></div>
          <div className="chat-mock">
            <div className="qr-mock">{qrCells.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</div>
            <div className="chat-bubbles">
              <div className="bubble in">Scan the yellow QR at the site. No app needed.</div>
              <div className="bubble out">📍 28.5702, 77.2432 · 📷 pile photo</div>
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
