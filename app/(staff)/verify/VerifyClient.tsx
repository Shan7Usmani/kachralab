'use client';

import { useCallback, useState } from 'react';
import { Badge, Card, Icon, PageHeader, StatusBadge, inr } from '@/components/ui';
import { type CaseRow, type CaseEvent } from '@/lib/case';

interface VerifyClientProps {
  initialCases: CaseRow[];
  initialCase: CaseRow | null;
  initialEvents: CaseEvent[];
}

export function VerifyClient({ initialCases, initialCase, initialEvents }: VerifyClientProps) {
  const [cases] = useState<CaseRow[]>(initialCases);
  const [hotspot, setHotspot] = useState<CaseRow | null>(initialCase);
  const [events, setEvents] = useState<CaseEvent[]>(initialEvents);
  const [lastVerdict, setLastVerdict] = useState<{ mode: string; message: string; heldAmount: number } | null>(null);
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runAction = useCallback(async (mode: 'recurrence' | 'success' | 'reset' | 'advance') => {
    if (!hotspot) return;
    setBusy(mode);
    setError('');

    let action: string;
    switch (mode) {
      case 'recurrence':
        action = 'recurrence';
        break;
      case 'success':
        action = 'release';
        break;
      case 'reset':
        action = 'clear_flags';
        break;
      case 'advance':
        action = 'verify_day';
        break;
      default:
        return;
    }

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: hotspot.id, action })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'The action could not be applied.');
      }

      setLastVerdict({
        mode: mode.toUpperCase(),
        message: data.message || '',
        heldAmount: data.case?.escrowHeld ?? 0
      });

      // Reload case data
      const detailResponse = await fetch(`/api/cases?id=${encodeURIComponent(hotspot.id)}`, { cache: 'no-store' });
      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        if (detailData.case) setHotspot(detailData.case);
        if (detailData.events) setEvents(detailData.events);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be applied.');
    } finally {
      setBusy('');
    }
  }, [hotspot]);

  const handleSelect = useCallback(async (id: string) => {
    setError('');
    try {
      const response = await fetch(`/api/cases?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.case) setHotspot(data.case);
        if (data.events) setEvents(data.events);
      }
    } catch {
      setError('Could not load the case detail.');
    }
  }, []);

  if (!hotspot) {
    return <PageHeader title="Verification" description="No cases in the register." />;
  }

  const day = hotspot.verificationDay;
  const hasFailure = hotspot.spillover || events.some((e) => e.toStatus === 'RECURRING' && e.fromStatus === 'CLEARED');
  const canRelease = day >= 14 && !hasFailure && hotspot.escrowState !== 'RELEASED';
  const escrowTone: 'ok' | 'warn' | 'danger' =
    hotspot.escrowState === 'RELEASED' ? 'ok' : hotspot.escrowState === 'WITHHELD' ? 'danger' : 'warn';

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
            onChange={(event) => handleSelect(event.target.value)}
            aria-label="Select a case"
          >
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.name}
              </option>
            ))}
          </select>
        }
      />

      {error ? <div className="callout danger mb-16">{error}</div> : null}

      <div className="split">
        <Card
          title={`${hotspot.id} · ${hotspot.name}`}
          subtitle={`${hotspot.ward} · ${hotspot.wasteType}`}
          actions={<StatusBadge status={hotspot.status as any} />}
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
              const checkpoint = index < day ? 'clean' : 'pending';
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

          {hotspot.spillover ? (
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
              onClick={() => runAction('advance')}
              disabled={day >= 14 || hasFailure || busy === 'advance'}
            >
              <Icon name="check" />
              Log clean day
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => runAction('recurrence')}
              disabled={busy === 'recurrence'}
            >
              Flag recurrence
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => runAction('reset')}
              disabled={!hasFailure || busy === 'reset'}
            >
              Clear flags
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => runAction('success')}
              disabled={!canRelease || busy === 'success'}
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
          ) : !canRelease && hotspot.escrowState !== 'RELEASED' ? (
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
                  width: `${((hotspot.contractTotal - hotspot.escrowHeld) / hotspot.contractTotal) * 100}%`
                }}
              />
              <span
                className="held"
                style={{ width: `${(hotspot.escrowHeld / hotspot.contractTotal) * 100}%` }}
              />
            </div>

            <div className="ledger">
              <div className="ledger-row">
                <span>Contract value</span>
                <b>{inr(hotspot.contractTotal)}</b>
              </div>
              <div className="ledger-row">
                <span>Paid on clearance</span>
                <b>{inr(hotspot.contractTotal - hotspot.escrowHeld)}</b>
              </div>
              <div className="ledger-row">
                <span>Held in escrow</span>
                <b>{inr(hotspot.escrowHeld)}</b>
              </div>
              <div className="ledger-row">
                <span>Status</span>
                <b>
                  <Badge tone={escrowTone}>Escrow {hotspot.escrowState.toLowerCase()}</Badge>
                </b>
              </div>
            </div>
          </Card>

          {lastVerdict ? (
            <Card title="Last verdict" subtitle={lastVerdict.mode}>
              <p className="small">{lastVerdict.message}</p>
              <div className="row mt-16">
                <Badge tone={lastVerdict.mode === 'SUCCESS' ? 'ok' : lastVerdict.mode === 'RECURRENCE' ? 'danger' : 'neutral'}>
                  {lastVerdict.mode}
                </Badge>
                <span className="small muted">{lastVerdict.heldAmount > 0 ? 'Escrow still held' : 'Escrow settled'}</span>
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