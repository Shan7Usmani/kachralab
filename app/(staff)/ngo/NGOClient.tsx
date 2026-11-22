'use client';

import { useCallback, useMemo, useState } from 'react';
import { Badge, Bar, Card, Empty, Icon, PageHeader, StatusBadge, inr, Stat } from '@/components/ui';
import { RAIN, computeRisk, diagnose } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { type CaseRow, type CaseEvent } from '@/lib/case';

const NGO_NAME = 'Safai Saathi Foundation';
const NGO_WARD = 'Ward 58';

const FACTORS = [
  { key: 'recurrence', label: 'Recurrence', weight: 35 },
  { key: 'hazard', label: 'Hazard', weight: 25 },
  { key: 'proximity', label: 'Sensitive proximity', weight: 25 },
  { key: 'duration', label: 'Persistence', weight: 15 }
] as const;

const SEED_VOLUNTEERS = [
  { id: 'vol-1', name: 'Asha', ward: 'Ward 58', reportsSubmitted: 12, verificationsDone: 8, lastActive: '2026-11-20T10:30:00Z' },
  { id: 'vol-2', name: 'Ravi', ward: 'Ward 42', reportsSubmitted: 7, verificationsDone: 5, lastActive: '2026-11-19T14:15:00Z' },
  { id: 'vol-3', name: 'Meena', ward: 'Ward 83', reportsSubmitted: 15, verificationsDone: 11, lastActive: '2026-11-21T09:00:00Z' }
];

interface NGOClientProps {
  initialCases: CaseRow[];
}

function caseToHotspot(caseRow: CaseRow) {
  const statusMap: Record<string, 'NEW' | 'TRIAGED' | 'ASSIGNED' | 'IN_INTERVENTION' | 'UNDER_MONITORING' | 'VERIFIED_CLEAN' | 'RECURRING' | 'CRITICAL_P1'> = {
    RECEIVED: 'NEW',
    TRIAGED: 'TRIAGED',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_INTERVENTION',
    CLEARED: 'UNDER_MONITORING',
    VERIFIED: 'VERIFIED_CLEAN',
    CLOSED: 'VERIFIED_CLEAN',
    RECURRING: 'RECURRING',
    ESCALATED: 'CRITICAL_P1'
  };

  return {
    id: caseRow.id,
    name: caseRow.name,
    ward: caseRow.ward,
    lat: caseRow.lat,
    lng: caseRow.lng,
    wasteType: caseRow.wasteType,
    reports30d: caseRow.reportsCount,
    factors: caseRow.factors,
    status: statusMap[caseRow.status] ?? 'NEW',
    monitor: {
      currentDay: caseRow.verificationDay,
      checkpoints: Array.from({ length: 14 }, (_, i) => (i < caseRow.verificationDay ? 'clean' : 'pending')) as ('clean' | 'pending')[],
      spillover: caseRow.spillover
    },
    contract: {
      total: caseRow.contractTotal,
      escrow: caseRow.escrowState,
      heldAmount: caseRow.escrowHeld
    },
    source: caseRow.source,
    priority: caseRow.priority,
    team: caseRow.team,
    dueAt: caseRow.dueAt,
    reference: caseRow.reference,
    updatedAt: caseRow.updatedAt
  };
}

export function NGOClient({ initialCases }: NGOClientProps) {
  const { state, dispatch } = useStore();
  const [cases, setCases] = useState<CaseRow[]>(initialCases);
  const [selectedId, setSelectedId] = useState<string>('');
  const [detail, setDetail] = useState<{ case: CaseRow; events: CaseEvent[] } | null>(null);
  const [activePanel, setActivePanel] = useState<'cases' | 'file' | 'volunteers' | 'report'>('cases');
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState<string>('');
  const multiplier = state.rain ? RAIN.monsoon : RAIN.dry;

  const loadDetail = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/cases?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.case) setDetail({ case: data.case, events: data.events || [] });
      }
    } catch {
      setError('Could not load case detail.');
    }
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setActivePanel('file');
    loadDetail(id);
  }, [loadDetail]);

  const runVerification = useCallback(async (day: 7 | 14) => {
    if (!detail) return;
    setBusy(`verify_${day}`);
    setError('');
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: detail.case.id, action: 'verify_day', note: `NGO verification day ${day}` })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Verification failed');
      loadDetail(detail.case.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Verification failed');
    } finally {
      setBusy('');
    }
  }, [detail, loadDetail]);

  const exportDossier = useCallback(async () => {
    if (!detail) return;
    setBusy('export');
    try {
      const response = await fetch(`/api/cases?id=${encodeURIComponent(detail.case.id)}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const dossier = {
          org: NGO_NAME,
          ward: NGO_WARD,
          generatedAt: new Date().toISOString(),
          case: data.case,
          events: data.events,
          auditHash: await hashChain(data.events)
        };
        downloadJSON(`${detail.case.id}-dossier.json`, dossier);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Export failed');
    } finally {
      setBusy('');
    }
  }, [detail]);

  const generateFunderReport = useCallback(async () => {
    setBusy('funder');
    try {
      const orgCases = cases;
      const report = {
        org: NGO_NAME,
        ward: NGO_WARD,
        generatedAt: new Date().toISOString(),
        dateRange: {
          from: orgCases.length ? Math.min(...orgCases.map(c => new Date(c.createdAt).getTime())) : Date.now(),
          to: Date.now()
        },
        summary: {
          casesHandled: orgCases.length,
          cleanDaysVerified: orgCases.reduce((sum, c) => sum + c.verificationDay, 0),
          spilloverFlagsCaught: orgCases.filter(c => c.spillover).length,
          escrowAtStake: orgCases.reduce((sum, c) => sum + c.escrowHeld, 0)
        },
        cases: orgCases.map(c => ({
          id: c.id,
          name: c.name,
          ward: c.ward,
          status: c.status,
          verificationDay: c.verificationDay,
          spillover: c.spillover,
          riskDry: computeRisk(c.factors, RAIN.dry).capped,
          riskMonsoon: computeRisk(c.factors, RAIN.monsoon).capped
        })),
        auditHash: await hashChain(
          orgCases.flatMap(c => c.id)
        )
      };
      downloadJSON(`${NGO_NAME.replace(/\s+/g, '-')}-funder-report.json`, report);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Report generation failed');
    } finally {
      setBusy('');
    }
  }, [cases]);

  const assignVolunteer = useCallback(async (volunteerId: string, caseId: string) => {
    setBusy(`assign_${volunteerId}`);
    try {
      const vol = SEED_VOLUNTEERS.find(v => v.id === volunteerId);
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, action: 'note', note: `Volunteer ${vol?.name} assigned to case` })
      });
      if (!response.ok) throw new Error('Assignment failed');
      loadDetail(caseId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Assignment failed');
    } finally {
      setBusy('');
    }
  }, [loadDetail]);

  const loadCases = useCallback(async () => {
    const response = await fetch('/api/cases', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (data.cases) {
        setCases(data.cases.filter((c: CaseRow) => c.assignedTo === NGO_NAME));
      }
    }
  }, []);

  const stats = useMemo(() => {
    const activeCases = cases.filter(c => !['CLOSED', 'VERIFIED'].includes(c.status)).length;
    const cleanDaysVerified = cases.reduce((sum, c) => sum + c.verificationDay, 0);
    const escrowAtStake = cases.reduce((sum, c) => sum + c.escrowHeld, 0);
    return { activeCases, cleanDaysVerified, volunteers: SEED_VOLUNTEERS.length, escrowAtStake };
  }, [cases]);

  const rows = useMemo(() => {
    return cases
      .map((caseRow) => ({ caseRow, hotspot: caseToHotspot(caseRow), risk: computeRisk(caseToHotspot(caseRow).factors, multiplier) }))
      .sort((a, b) => b.risk.capped - a.risk.capped);
  }, [cases, multiplier]);

  const selected = rows.find(({ caseRow }) => caseRow.id === selectedId);
  const selectedHotspot = selected?.hotspot;
  const selectedRisk = selectedHotspot ? computeRisk(selectedHotspot.factors, multiplier) : null;

  if (cases.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="NGO Dashboard"
          title={NGO_NAME}
          description={`Scoped to ${NGO_WARD} — no cases assigned yet`}
          actions={<Badge tone="info">NGO VIEW · ${NGO_WARD} · 0 cases assigned</Badge>}
        />
        <Empty title="No cases assigned" body="Cases assigned to this NGO will appear here." />
      </>
    );
  }

  return (
    <>
      {/* Panel 1: Org Header + Scope Banner */}
      <PageHeader
        eyebrow="NGO Dashboard"
        title={NGO_NAME}
        description={`${NGO_WARD} · ${cases.length} case${cases.length === 1 ? '' : 's'} assigned`}
        actions={
          <span style={{ fontSize: 11 }}>
            <Badge tone="info">NGO VIEW · {NGO_WARD} · {cases.length} cases assigned</Badge>
          </span>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <Stat label="My active cases" value={stats.activeCases} />
        <Stat label="My clean days verified" value={stats.cleanDaysVerified} />
        <Stat label="My volunteers" value={stats.volunteers} />
        <Stat label="Escrow at stake" value={inr(stats.escrowAtStake)} />
      </div>

      <div className="grid grid-4" style={{ gap: 16 }}>
        {/* Panel 2: My Cases (Scoped Register) */}
        <Card title="My Cases" subtitle={`${cases.length} case${cases.length === 1 ? '' : 's'} assigned to ${NGO_NAME}`} className="panel-cases">
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <input
              className="input search"
              type="search"
              placeholder="Search case ID, location, ward"
              onChange={(e) => setSelectedId('')} // placeholder for filter
              aria-label="Search cases"
              style={{ width: '100%' }}
            />
          </div>
          {rows.length === 0 ? (
            <Empty title="No cases" body="No cases match the current filter." />
          ) : (
            <div className="case-list-ngo">
              {rows.map(({ caseRow, hotspot, risk }) => (
                <button
                  key={caseRow.id}
                  className={`case-row${caseRow.id === selectedId ? ' selected' : ''}`}
                  onClick={() => handleSelect(caseRow.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 0, background: 'none', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span className="case-id" style={{ minWidth: 80 }}>{caseRow.id}</span>
                    <span style={{ fontSize: 11 }}>
                      <Badge tone={risk.capped >= 80 ? 'danger' : risk.capped >= 55 ? 'warn' : 'ok'}>Risk {risk.capped}</Badge>
                    </span>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div className="cell-main">{hotspot.name}</div>
                      <div className="cell-sub">{hotspot.ward} · {hotspot.wasteType}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <VerificationDot day={hotspot.monitor.currentDay} spillover={hotspot.monitor.spillover} />
                      <span className="small muted">Day {hotspot.monitor.currentDay}/14</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Panel 3: Case File (Read + Verify) + Panel 4: My Volunteers + Panel 5: Proof/Funder Report */}
        {selectedHotspot && selectedRisk && detail ? (
          <div className="stack" style={{ flex: 1, minWidth: 0 }}>
            {/* Case File */}
            <Card title={`${selectedHotspot.id} · ${selectedHotspot.name}`} subtitle={`${selectedHotspot.ward} · ${selectedHotspot.wasteType}`} actions={<StatusBadge status={selectedHotspot.status as any} />} className="panel-file">
              <div className="between mb-16">
                <div>
                  <div className="stat-label">Risk Score</div>
                  <div className="stat-value">{selectedRisk.capped}<span className="muted small"> / 100</span></div>
                </div>
                <Badge tone={selectedRisk.capped >= 80 ? 'danger' : selectedRisk.capped >= 55 ? 'warn' : 'ok'}>
                  {selectedRisk.rainMultiplier.toFixed(2)}× multiplier
                </Badge>
              </div>

              {FACTORS.map((factor) => (
                <div className="meter" key={factor.key}>
                  <div className="meter-head">
                    <span>{factor.label} · {factor.weight}%</span>
                    <b>{selectedHotspot.factors[factor.key]}</b>
                  </div>
                  <Bar value={selectedHotspot.factors[factor.key]} />
                </div>
              ))}

              <div className="divider" />

              <h3 className="card-title" style={{ marginBottom: 10 }}>14-Day Verification Timeline</h3>
              <div className="days">
                {Array.from({ length: 14 }, (_, index) => {
                  const checkpoint = index < selectedHotspot.monitor.currentDay ? 'clean' : 'pending';
                  const today = index === selectedHotspot.monitor.currentDay - 1;
                  return (
                    <div key={index} className={`day ${checkpoint}${today ? ' today' : ''}`} title={`Day ${index + 1}: ${checkpoint}`}>
                      {index + 1}
                    </div>
                  );
                })}
              </div>

              {selectedHotspot.monitor.spillover ? (
                <div className="callout danger mt-16">
                  <strong>Spillover detected.</strong> A secondary pile was flagged inside the 150 m halo.
                </div>
              ) : null}

              <div className="divider" />

              <h3 className="card-title" style={{ marginBottom: 10 }}>Escrow Ledger</h3>
              <div className="ledger">
                <div className="ledger-row"><span>Contract value</span><b>{inr(selectedHotspot.contract.total)}</b></div>
                <div className="ledger-row"><span>Paid on clearance</span><b>{inr(selectedHotspot.contract.total - selectedHotspot.contract.heldAmount)}</b></div>
                <div className="ledger-row"><span>Held in escrow</span><b>{inr(selectedHotspot.contract.heldAmount)}</b></div>
                <div className="ledger-row">
                  <span>Status</span>
                  <b><Badge tone={selectedHotspot.contract.escrow === 'RELEASED' ? 'ok' : selectedHotspot.contract.escrow === 'WITHHELD' ? 'danger' : 'warn'}>
                    Escrow {selectedHotspot.contract.escrow.toLowerCase()}
                  </Badge></b>
                </div>
              </div>

              <div className="divider" />

              {/* NGO Actions: Log Day 7, Log Day 14, Export Dossier, Flag for HQ */}
              <div className="form-actions" style={{ marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
                {selectedHotspot.monitor.currentDay < 7 && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => runVerification(7)}
                    disabled={busy === 'verify_7'}
                  >
                    <Icon name="check" /> Log Day 7 Verification
                  </button>
                )}
                {selectedHotspot.monitor.currentDay >= 7 && selectedHotspot.monitor.currentDay < 14 && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => runVerification(14)}
                    disabled={busy === 'verify_14'}
                  >
                    <Icon name="check" /> Log Day 14 Verification
                  </button>
                )}
                <button
                  type="button"
                  className="btn"
                  onClick={exportDossier}
                  disabled={busy === 'export'}
                >
                  <Icon name="book" /> Export Case Dossier
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (detail) {
                      fetch('/api/cases', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ caseId: detail.case.id, action: 'note', note: 'FLAG FOR HQ REVIEW: NGO requests escrow review' })
                      }).then(() => loadDetail(detail.case.id));
                    }
                  }}
                >
                  <Icon name="arrow" /> Flag for HQ Review
                </button>
              </div>
            </Card>

            {/* My Volunteers */}
            <Card title="My Volunteers" subtitle={`${SEED_VOLUNTEERS.length} volunteers · assign to cases`} className="panel-volunteers">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {SEED_VOLUNTEERS.map((vol) => (
                  <div key={vol.id} className="volunteer-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                      {vol.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{vol.name}</div>
                      <div className="small muted">{vol.ward} · {vol.reportsSubmitted} reports · {vol.verificationsDone} verifications · Last active {new Date(vol.lastActive).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    {selectedId ? (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => assignVolunteer(vol.id, selectedId)}
                        disabled={busy === `assign_${vol.id}`}
                      >
                        Assign to {selectedId}
                      </button>
                    ) : (
                      <span className="small muted">Select a case first</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Proof / Funder Report */}
            <Card title="Proof / Funder Report" subtitle="Generate donor-grade evidence package" className="panel-report">
              <div className="callout" style={{ marginBottom: 16 }}>
                <strong>This is the NGO's product.</strong> A hash-chained audit trail of all cases, clean days verified,
                spillover flags caught, and before/after risk scores. Download and share with funders.
              </div>
              <div className="ledger" style={{ marginBottom: 16 }}>
                <div className="ledger-row"><span>Cases handled</span><b>{stats.activeCases}</b></div>
                <div className="ledger-row"><span>Clean days verified</span><b>{stats.cleanDaysVerified}</b></div>
                <div className="ledger-row"><span>Spillover flags caught</span><b>{cases.filter(c => c.spillover).length}</b></div>
                <div className="ledger-row"><span>Escrow at stake</span><b>{inr(stats.escrowAtStake)}</b></div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={generateFunderReport}
                disabled={busy === 'funder'}
              >
                <Icon name="chart" /> Generate Funder Report (JSON)
              </button>
            </Card>
          </div>
        ) : (
          <Card title="Select a case" subtitle="Click a case from the register to view details, log verifications, and manage volunteers." className="panel-empty">
            <Empty title="No case selected" body="Click a case from My Cases to view the case file, volunteers, and funder report." />
          </Card>
        )}
      </div>

      {error && <div className="callout danger" style={{ marginTop: 16 }}>{error}</div>}
    </>
  );
}

function VerificationDot({ day, spillover }: { day: number; spillover: boolean }) {
  if (spillover) return <span className="verification-dot failed" title="Spillover flagged" />;
  if (day >= 14) return <span className="verification-dot verified" title="Verified" />;
  if (day > 0) return <span className="verification-dot in-progress" title={`Day ${day} in progress`} />;
  return <span className="verification-dot pending" title="Pending" />;
}

async function hashChain(events: unknown[]): Promise<string> {
  let hash = 'GENESIS';
  for (const event of events) {
    const data = `${hash}|${JSON.stringify(event)}|${Date.now()}`;
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    hash = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return hash.slice(0, 16);
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}