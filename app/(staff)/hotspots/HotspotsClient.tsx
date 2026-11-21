'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Badge, Bar, Card, Empty, Icon, PageHeader, StatusBadge, inr } from '@/components/ui';
import { RAIN, computeRisk, diagnose } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { type CaseRow } from '@/lib/case';

const FILTERS = [
  { key: 'ALL', label: 'All cases' },
  { key: 'CRITICAL_P1', label: 'Critical' },
  { key: 'UNDER_MONITORING', label: 'Monitoring' },
  { key: 'IN_INTERVENTION', label: 'In intervention' },
  { key: 'RECURRING', label: 'Recurring' },
  { key: 'VERIFIED_CLEAN', label: 'Verified' }
];

const FACTORS = [
  { key: 'recurrence', label: 'Recurrence', weight: 35 },
  { key: 'hazard', label: 'Hazard', weight: 25 },
  { key: 'proximity', label: 'Sensitive proximity', weight: 25 },
  { key: 'duration', label: 'Persistence', weight: 15 }
] as const;

interface HotspotsClientProps {
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
    mapX: 120 + ((caseRow.lng - 77.15) / 0.16) * 560,
    mapY: 480 - ((caseRow.lat - 28.5) / 0.16) * 420,
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

export function HotspotsClient({ initialCases }: HotspotsClientProps) {
  const { state, dispatch } = useStore();
  const [cases, setCases] = useState<CaseRow[]>(initialCases);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const multiplier = state.rain ? RAIN.monsoon : RAIN.dry;

  const loadCases = useCallback(async () => {
    const response = await fetch('/api/cases', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (data.cases) {
        setCases(data.cases);
      }
    }
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cases
      .map((caseRow) => ({ caseRow, hotspot: caseToHotspot(caseRow), risk: computeRisk(caseToHotspot(caseRow).factors, multiplier) }))
      .filter(({ hotspot }) => filter === 'ALL' || hotspot.status === filter)
      .filter(
        ({ hotspot }) =>
          !needle || `${hotspot.id} ${hotspot.name} ${hotspot.ward}`.toLowerCase().includes(needle)
      )
      .sort((a, b) => b.risk.capped - a.risk.capped);
  }, [cases, filter, query, multiplier]);

  const selected = rows.find(({ caseRow }) => caseRow.id === selectedId) ?? rows[0];
  const selectedHotspot = selected?.hotspot;
  const selectedRisk = selectedHotspot ? computeRisk(selectedHotspot.factors, multiplier) : null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleAction = useCallback(async (caseId: string) => {
    await loadCases();
  }, [loadCases]);

  return (
    <>
      <PageHeader
        eyebrow="Case register"
        title="Hotspots"
        description="One row per persistent location. Reports within 30 m merge into the same case instead of opening a new ticket."
        actions={
          <Link className="btn btn-primary" href="/intake">
            <Icon name="plus" />
            New report
          </Link>
        }
      />

      <Card flush>
        <div className="toolbar">
          <div className="chips">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`chip${filter === item.key ? ' active' : ''}`}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            className="input search"
            type="search"
            placeholder="Search id, location or ward"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search cases"
          />
        </div>

        {rows.length === 0 ? (
          <Empty title="No cases match" body="Adjust the filter or search term." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Location</th>
                <th>Waste stream</th>
                <th className="num">Risk</th>
                <th>Status</th>
                <th className="num">Reports</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ caseRow, hotspot, risk }) => (
                <tr
                  key={caseRow.id}
                  className={`clickable${caseRow.id === selectedId ? ' selected' : ''}`}
                  onClick={() => handleSelect(caseRow.id)}
                >
                  <td>
                    <span className="case-id">{caseRow.id}</span>
                    <span style={{ display: 'block', marginTop: 4 }}>
                      <Badge tone={caseRow.source === 'citizen' ? 'info' : 'neutral'}>
                        {caseRow.source === 'citizen' ? 'Citizen' : 'Seed'}
                      </Badge>
                    </span>
                  </td>
                  <td>
                    <div className="cell-main">{hotspot.name}</div>
                    <div className="cell-sub">{hotspot.ward}</div>
                  </td>
                  <td className="small">{hotspot.wasteType}</td>
                  <td className="num risk-cell">{risk.capped}</td>
                  <td>
                    <StatusBadge status={hotspot.status} />
                  </td>
                  <td className="num">{hotspot.reports30d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {selectedHotspot && selectedRisk ? (
        <div className="split mt-16">
          <Card
            title={`${selectedHotspot.id} · ${selectedHotspot.name}`}
            subtitle={selectedHotspot.ward}
            actions={<StatusBadge status={selectedHotspot.status} />}
          >
            <div className="between mb-16">
              <div>
                <div className="stat-label">Risk score</div>
                <div className="stat-value">
                  {selectedRisk.capped}
                  <span className="muted small"> / 100</span>
                </div>
              </div>
              <div className="small muted" style={{ maxWidth: 300 }}>
                Weighted factors with a {selectedRisk.rainMultiplier.toFixed(2)}× weather multiplier.
                {selectedRisk.capApplied ? ' The raw score was capped at 100.' : ''}
              </div>
            </div>

            {FACTORS.map((factor) => (
              <div className="meter" key={factor.key}>
                <div className="meter-head">
                  <span>
                    {factor.label} · {factor.weight}%
                  </span>
                  <b>{selectedHotspot.factors[factor.key]}</b>
                </div>
                <Bar value={selectedHotspot.factors[factor.key]} />
              </div>
            ))}

            <div className="divider" />

            <h3 className="card-title" style={{ marginBottom: 10 }}>
              Root-cause hypotheses
            </h3>
            <ul className="diag">
              {diagnose(selectedHotspot).map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.evidence}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="stack">
            <Card title="Contract" subtitle="40% on clearance, 60% held against 14 clean days">
              <div className="ledger">
                <div className="ledger-row">
                  <span>Total value</span>
                  <b>{inr(selectedHotspot.contract.total)}</b>
                </div>
                <div className="ledger-row">
                  <span>Paid on day 0</span>
                  <b>{inr(selectedHotspot.contract.total - selectedHotspot.contract.heldAmount)}</b>
                </div>
                <div className="ledger-row">
                  <span>Held in escrow</span>
                  <b>{inr(selectedHotspot.contract.heldAmount)}</b>
                </div>
              </div>
              <div className="row mt-16">
                <Badge tone={selectedHotspot.contract.escrow === 'RELEASED' ? 'ok' : selectedHotspot.contract.escrow === 'WITHHELD' ? 'danger' : 'warn'}>
                  Escrow {selectedHotspot.contract.escrow.toLowerCase()}
                </Badge>
              </div>
              <Link className="btn btn-primary mt-16" href="/verify">
                Open verification
              </Link>
            </Card>

            <Card title="Case facts">
              <div className="ledger">
                <div className="ledger-row">
                  <span>Waste stream</span>
                  <b>{selectedHotspot.wasteType}</b>
                </div>
                <div className="ledger-row">
                  <span>Reports (30 days)</span>
                  <b>{selectedHotspot.reports30d}</b>
                </div>
                <div className="ledger-row">
                  <span>Monitoring day</span>
                  <b>{selectedHotspot.monitor.currentDay} / 14</b>
                </div>
                <div className="ledger-row">
                  <span>Spillover</span>
                  <b>{selectedHotspot.monitor.spillover ? 'Detected' : 'None'}</b>
                </div>
                <div className="ledger-row">
                  <span>Priority</span>
                  <b>{selectedHotspot.priority}</b>
                </div>
                <div className="ledger-row">
                  <span>Team</span>
                  <b>{selectedHotspot.team ?? 'Unassigned'}</b>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}