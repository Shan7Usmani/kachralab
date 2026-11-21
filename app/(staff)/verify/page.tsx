'use client';

import { Badge, Card, Icon, PageHeader, StatusBadge, inr } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function VerifyPage() {
  const { state, dispatch } = useStore();
  const hotspot = state.hotspots.find((h) => h.id === state.selectedId) ?? state.hotspots[0];

  if (!hotspot) {
    return <PageHeader title="Verification" description="No cases in the register." />;
  }

  const day = hotspot.monitor.currentDay;
  const hasFailure = hotspot.monitor.spillover || hotspot.monitor.checkpoints.includes('failed');
  const canRelease = day >= 14 && !hasFailure && hotspot.contract.escrow !== 'RELEASED';
  const escrowTone: 'ok' | 'warn' | 'danger' =
    hotspot.contract.escrow === 'RELEASED' ? 'ok' : hotspot.contract.escrow === 'WITHHELD' ? 'danger' : 'warn';

  return (
    <>
      <PageHeader
        eyebrow="Outcome protocol"
        title="14-day verification"
        description="The final 60% of the contract is released only after 14 consecutive clean days with no spillover inside the 150 m halo."
        actions={
          <select
            className="input"
            style={{ width: 300, maxWidth: '100%' }}
            value={hotspot.id}
            onChange={(event) => dispatch({ type: 'select', id: event.target.value })}
            aria-label="Select a case"
          >
            {state.hotspots.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="split">
        <Card
          title={`${hotspot.id} · ${hotspot.name}`}
          subtitle={hotspot.ward}
          actions={<StatusBadge status={hotspot.status} />}
        >
          <div className="between mb-16">
            <div>
              <div className="stat-label">Monitoring day</div>
              <div className="stat-value">
                {day}
                <span className="muted small"> / 14</span>
              </div>
            </div>
            <Badge tone={day >= 14 ? 'ok' : 'info'}>
              {day >= 14 ? 'Window complete' : `${14 - day} days remaining`}
            </Badge>
          </div>

          <div className="days">
            {Array.from({ length: 14 }, (_, index) => {
              const checkpoint = hotspot.monitor.checkpoints[index] ?? 'pending';
              const today = index === day - 1;
              return (
                <div
                  key={index}
                  className={`day ${checkpoint}${today ? ' today' : ''}`}
                  title={`Day ${index + 1}: ${checkpoint}`}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>

          <p className="small muted mt-16">
            Clean checkpoints are logged day by day. A single failed checkpoint or a spillover flag
            resets the escrow position.
          </p>

          {hotspot.monitor.spillover ? (
            <div className="callout danger mt-16">
              <strong>Spillover detected.</strong> A secondary pile was flagged inside the 150 m halo.
              The window cannot close until the site is cleared and re-verified.
            </div>
          ) : null}

          <div className="divider" />

          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'advance' })}
              disabled={day >= 14 || hasFailure}
            >
              <Icon name="check" />
              Log clean day
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => dispatch({ type: 'verdict', mode: 'recurrence' })}
            >
              Flag recurrence
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'verdict', mode: 'reset' })}
              disabled={!hasFailure}
            >
              Clear flags
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => dispatch({ type: 'verdict', mode: 'success' })}
              disabled={!canRelease}
              title={canRelease ? 'Release the escrow' : 'Requires 14 clean days and no spillover'}
            >
              Release escrow
            </button>
          </div>
          {hasFailure ? (
            <p className="small muted mt-16">
              A failed checkpoint or spillover blocks clean-day logging. Clear the flags before the
              window can continue.
            </p>
          ) : !canRelease && hotspot.contract.escrow !== 'RELEASED' ? (
            <p className="small muted mt-16">
              Release is locked until the monitoring window reaches day 14. Log clean days to advance it.
            </p>
          ) : null}
        </Card>

        <div className="stack">
          <Card title="Escrow position" subtitle="40% paid on day 0, 60% held">
            <div className="split-bar" aria-hidden="true">
              <span
                className="paid"
                style={{
                  width: `${((hotspot.contract.total - hotspot.contract.heldAmount) / hotspot.contract.total) * 100}%`
                }}
              />
              <span
                className="held"
                style={{ width: `${(hotspot.contract.heldAmount / hotspot.contract.total) * 100}%` }}
              />
            </div>

            <div className="ledger">
              <div className="ledger-row">
                <span>Contract value</span>
                <b>{inr(hotspot.contract.total)}</b>
              </div>
              <div className="ledger-row">
                <span>Paid on clearance</span>
                <b>{inr(hotspot.contract.total - hotspot.contract.heldAmount)}</b>
              </div>
              <div className="ledger-row">
                <span>Held in escrow</span>
                <b>{inr(hotspot.contract.heldAmount)}</b>
              </div>
              <div className="ledger-row">
                <span>Status</span>
                <b>
                  <Badge tone={escrowTone}>Escrow {hotspot.contract.escrow.toLowerCase()}</Badge>
                </b>
              </div>
            </div>
          </Card>

          {state.lastVerdict ? (
            <Card title="Last verdict" subtitle={state.lastVerdict.mode}>
              <p className="small">{state.lastVerdict.message}</p>
              <div className="row mt-16">
                <Badge tone={state.lastVerdict.mode === 'SUCCESS' ? 'ok' : state.lastVerdict.mode === 'RECURRENCE' ? 'danger' : 'neutral'}>
                  {state.lastVerdict.mode}
                </Badge>
                <span className="small muted">{state.lastVerdict.heldAmount > 0 ? 'Escrow still held' : 'Escrow settled'}</span>
              </div>
            </Card>
          ) : (
            <Card title="Last verdict">
              <p className="small muted">No verdict has been recorded in this session.</p>
            </Card>
          )}

          <div className="callout">
            <strong>Why this exists.</strong> Reactive clearance pays contractors for the same site every few
            weeks. Tying the majority of the fee to a clean 14-day window changes the incentive.
          </div>
        </div>
      </div>
    </>
  );
}
