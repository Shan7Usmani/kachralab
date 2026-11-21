'use client';

import Link from 'next/link';
import RealMap from '@/components/RealMap';
import { Card, Icon, PageHeader, Stat, StatusBadge, timeLabel } from '@/components/ui';
import { RAIN, computeRisk } from '@/lib/engine';
import { useStore } from '@/lib/store';

export default function OverviewPage() {
  const { state, dispatch } = useStore();
  const multiplier = state.rain ? RAIN.monsoon : RAIN.dry;

  const ranked = state.hotspots
    .map((hotspot) => ({ hotspot, risk: computeRisk(hotspot.factors, multiplier) }))
    .sort((a, b) => b.risk.capped - a.risk.capped);

  const openCases = state.hotspots.filter((h) => h.status !== 'VERIFIED_CLEAN').length;
  const critical = state.hotspots.filter((h) => h.status === 'CRITICAL_P1').length;
  const monitoring = state.hotspots.filter(
    (h) => h.status === 'UNDER_MONITORING' || h.status === 'IN_INTERVENTION'
  ).length;
  const escrowHeld = state.hotspots.reduce((sum, h) => sum + h.contract.heldAmount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Delhi NCR · demonstration grid"
        title="Operations overview"
        description="Hotspot memory, weighted risk and verification status for the active municipal caseload. All figures are illustrative."
        actions={
          <>
            <Link className="btn btn-primary" href="/intake">
              <Icon name="plus" />
              Log a report
            </Link>
            <Link className="btn" href="/hotspots">
              Case queue
            </Link>
          </>
        }
      />

      <div className="grid grid-4 mb-16">
        <Stat label="Open cases" value={openCases} hint={`${state.hotspots.length} cases in the register`} />
        <Stat
          label="Critical P1"
          value={critical}
          hint="Hazard near sensitive sites"
          tone={critical ? 'danger' : undefined}
        />
        <Stat label="In verification" value={monitoring} hint="Inside the 14-day window" />
        <Stat
          label="Escrow held"
          value={`₹${(escrowHeld / 1000).toFixed(1)}k`}
          hint="Released only after 14 clean days"
        />
      </div>

      <div className="split mb-16">
        <Card
          title="Priority queue"
          subtitle={`Ranked by weighted risk at a ${multiplier.toFixed(2)}× weather multiplier`}
          actions={
            <Link className="btn btn-sm" href="/hotspots">
              View all
            </Link>
          }
          flush
        >
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Location</th>
                <th className="num">Risk</th>
                <th>Status</th>
                <th className="num">Reports</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 5).map(({ hotspot, risk }) => (
                <tr
                  key={hotspot.id}
                  className="clickable"
                  onClick={() => dispatch({ type: 'select', id: hotspot.id })}
                >
                  <td>
                    <span className="case-id">{hotspot.id}</span>
                  </td>
                  <td>
                    <div className="cell-main">{hotspot.name}</div>
                    <div className="cell-sub">{hotspot.ward}</div>
                  </td>
                  <td className="num risk-cell">{risk.capped}</td>
                  <td>
                    <StatusBadge status={hotspot.status} />
                  </td>
                  <td className="num">{hotspot.reports30d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Activity" subtitle="Latest entries in the local ledger" flush>
          <ul className="feed">
            {state.audit.slice(0, 6).map((entry) => (
              <li key={entry.id}>
                <span className="feed-icon">
                  <Icon name={entry.action === 'REPORT' ? 'camera' : entry.action === 'VERDICT' ? 'shield' : 'check'} />
                </span>
                <div>
                  <div className="feed-body">{entry.detail}</div>
                  <div className="feed-meta">
                    {entry.action} · {timeLabel(entry.at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        title="Case map"
        subtitle="OpenStreetMap tiles. The selected case shows its 30 m cluster radius and 150 m spillover halo."
        actions={
          <Link className="btn btn-sm" href="/map">
            Expand map
          </Link>
        }
        flush
      >
        <div className="map-shell" style={{ height: 420 }}>
          <RealMap
            hotspots={state.hotspots}
            selectedId={state.selectedId}
            onSelect={(id) => dispatch({ type: 'select', id })}
          />
        </div>
      </Card>
    </>
  );
}
