'use client';

import Link from 'next/link';
import { Card, PageHeader, Stat, inr } from '@/components/ui';
import { RAIN, computeRisk } from '@/lib/engine';
import { useStore } from '@/lib/store';

export default function ImpactPage() {
  const { state } = useStore();
  const multiplier = state.rain ? RAIN.monsoon : RAIN.dry;

  const totalReports = state.hotspots.reduce((sum, h) => sum + h.reports30d, 0);
  const verified = state.hotspots.filter((h) => h.status === 'VERIFIED_CLEAN').length;
  const released = state.hotspots.reduce(
    (sum, h) => sum + (h.contract.escrow === 'RELEASED' ? h.contract.total - h.contract.heldAmount : 0),
    0
  );
  const held = state.hotspots.reduce((sum, h) => sum + h.contract.heldAmount, 0);
  const risks = state.hotspots.map((h) => computeRisk(h.factors, multiplier).capped);
  const averageRisk = risks.length ? Math.round(risks.reduce((a, b) => a + b, 0) / risks.length) : 0;
  const maxReports = Math.max(1, ...state.hotspots.map((h) => h.reports30d));

  return (
    <>
      <PageHeader
        eyebrow="Programme outcomes"
        title="Impact"
        description="Computed from the current demo register. This is a demonstration dataset, not measured municipal performance."
        actions={
          <Link className="btn" href="/method">
            Read the method
          </Link>
        }
      />

      <div className="grid grid-4 mb-16">
        <Stat label="Clustered reports" value={totalReports} hint="30-day window, all cases" />
        <Stat label="Verified clean" value={verified} hint={`${state.hotspots.length} cases in register`} tone="ok" />
        <Stat label="Escrow released" value={inr(released)} hint="Paid against verified outcomes" />
        <Stat label="Escrow held" value={inr(held)} hint="Pending the 14-day window" tone="warn" />
      </div>

      <div className="split">
        <Card title="Report volume by case" subtitle="30-day report counts from the seed dataset">
          <div className="chart">
            {state.hotspots.map((hotspot) => {
              const height = Math.max(6, Math.round((hotspot.reports30d / maxReports) * 130));
              const tone = hotspot.status === 'CRITICAL_P1' || hotspot.status === 'RECURRING' ? 'danger' : hotspot.status === 'VERIFIED_CLEAN' ? 'ok' : 'warn';
              return (
                <div className="chart-item" key={hotspot.id}>
                  <span className="chart-value">{hotspot.reports30d}</span>
                  <span className={`chart-bar ${tone}`} style={{ height }} />
                  <span className="chart-label">{hotspot.id}</span>
                </div>
              );
            })}
          </div>
          <div className="divider" />
          <p className="small muted">
            High report counts with a low verified-clean count indicate recurring sites where clearance is
            not holding. Average risk across the register is {averageRisk}/100.
          </p>
        </Card>

        <div className="stack">
          <Card title="Programme signals">
            <div className="ledger">
              <div className="ledger-row">
                <span>Critical cases</span>
                <b>{state.hotspots.filter((h) => h.status === 'CRITICAL_P1').length}</b>
              </div>
              <div className="ledger-row">
                <span>Recurring cases</span>
                <b>{state.hotspots.filter((h) => h.status === 'RECURRING').length}</b>
              </div>
              <div className="ledger-row">
                <span>Average risk</span>
                <b>{averageRisk}/100</b>
              </div>
              <div className="ledger-row">
                <span>Verified share</span>
                <b>{Math.round((verified / Math.max(1, state.hotspots.length)) * 100)}%</b>
              </div>
            </div>
          </Card>

          <div className="callout warn">
            <strong>Illustrative figures.</strong> No field data is ingested in this build. Escrow amounts
            and verification outcomes are simulated for demonstration.
          </div>
        </div>
      </div>
    </>
  );
}
