'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bar, Badge, Card, Empty, Icon, PageHeader, StatusBadge, inr } from '@/components/ui';
import { RAIN, computeRisk, diagnose } from '@/lib/engine';
import { useStore } from '@/lib/store';

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

export default function HotspotsPage() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const multiplier = state.rain ? RAIN.monsoon : RAIN.dry;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.hotspots
      .map((hotspot) => ({ hotspot, risk: computeRisk(hotspot.factors, multiplier) }))
      .filter(({ hotspot }) => filter === 'ALL' || hotspot.status === filter)
      .filter(
        ({ hotspot }) =>
          !needle || `${hotspot.id} ${hotspot.name} ${hotspot.ward}`.toLowerCase().includes(needle)
      )
      .sort((a, b) => b.risk.capped - a.risk.capped);
  }, [state.hotspots, filter, query, multiplier]);

  const selected = state.hotspots.find((h) => h.id === state.selectedId) ?? rows[0]?.hotspot;
  const selectedRisk = selected ? computeRisk(selected.factors, multiplier) : null;

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
              {rows.map(({ hotspot, risk }) => (
                <tr
                  key={hotspot.id}
                  className={`clickable${hotspot.id === selected?.id ? ' selected' : ''}`}
                  onClick={() => dispatch({ type: 'select', id: hotspot.id })}
                >
                  <td>
                    <span className="case-id">{hotspot.id}</span>
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

      {selected && selectedRisk ? (
        <div className="split mt-16">
          <Card
            title={`${selected.id} · ${selected.name}`}
            subtitle={selected.ward}
            actions={<StatusBadge status={selected.status} />}
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
                  <b>{selected.factors[factor.key]}</b>
                </div>
                <Bar value={selected.factors[factor.key]} />
              </div>
            ))}

            <div className="divider" />

            <h3 className="card-title" style={{ marginBottom: 10 }}>
              Root-cause hypotheses
            </h3>
            <ul className="diag">
              {diagnose(selected).map((item) => (
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
                  <b>{inr(selected.contract.total)}</b>
                </div>
                <div className="ledger-row">
                  <span>Paid on day 0</span>
                  <b>{inr(selected.contract.total - selected.contract.heldAmount)}</b>
                </div>
                <div className="ledger-row">
                  <span>Held in escrow</span>
                  <b>{inr(selected.contract.heldAmount)}</b>
                </div>
              </div>
              <div className="row mt-16">
                <Badge tone={selected.contract.escrow === 'RELEASED' ? 'ok' : selected.contract.escrow === 'WITHHELD' ? 'danger' : 'warn'}>
                  Escrow {selected.contract.escrow.toLowerCase()}
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
                  <b>{selected.wasteType}</b>
                </div>
                <div className="ledger-row">
                  <span>Reports (30 days)</span>
                  <b>{selected.reports30d}</b>
                </div>
                <div className="ledger-row">
                  <span>Monitoring day</span>
                  <b>{selected.monitor.currentDay} / 14</b>
                </div>
                <div className="ledger-row">
                  <span>Spillover</span>
                  <b>{selected.monitor.spillover ? 'Detected' : 'None'}</b>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
