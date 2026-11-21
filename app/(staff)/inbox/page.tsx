'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Bar, Card, Empty, PageHeader } from '@/components/ui';
import {
  CASE_ACTION_LABEL,
  CASE_STATUS_LABEL,
  PRIORITY_LABEL,
  TEAMS,
  nextCaseActions,
  type CaseAction,
  type CaseEvent,
  type CasePriority,
  type CaseRow,
  type CaseStatus
} from '@/lib/case';

type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

interface CasesPayload {
  configured: boolean;
  mode: string;
  cases: CaseRow[];
  teams?: string[];
  error?: string;
}

interface DetailPayload {
  configured: boolean;
  mode: string;
  case: CaseRow;
  events: CaseEvent[];
  teams?: string[];
}

const STATUS_TONE: Record<CaseStatus, Tone> = {
  RECEIVED: 'info',
  TRIAGED: 'info',
  ASSIGNED: 'warn',
  IN_PROGRESS: 'warn',
  CLEARED: 'info',
  VERIFIED: 'ok',
  CLOSED: 'neutral',
  RECURRING: 'danger',
  ESCALATED: 'danger'
};

const PRIORITY_TONE: Record<CasePriority, Tone> = { P1: 'danger', P2: 'warn', P3: 'info' };

const EVENT_LABEL: Record<string, string> = {
  report_received: 'Report received',
  report_merged: 'Report merged'
};

const FACTORS: Array<[string, keyof CaseRow['factors']]> = [
  ['Recurrence', 'recurrence'],
  ['Hazard', 'hazard'],
  ['Sensitive proximity', 'proximity'],
  ['Persistence', 'duration']
];

function formatTime(value: string): string {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function dueLabel(value: string | null, status: CaseStatus): { text: string; tone: Tone } {
  if (!value || status === 'CLOSED' || status === 'VERIFIED') return { text: '—', tone: 'neutral' };
  const diff = new Date(value).getTime() - Date.now();
  const hours = Math.round(Math.abs(diff) / 3_600_000);
  if (diff < 0) return { text: `${hours}h overdue`, tone: 'danger' };
  if (hours <= 24) return { text: `${hours}h left`, tone: 'warn' };
  return { text: `${Math.ceil(hours / 24)}d left`, tone: 'ok' };
}

function actionClass(action: CaseAction): string {
  if (action === 'release' || action === 'triage' || action === 'clear' || action === 'verify_day') {
    return 'btn btn-primary';
  }
  if (action === 'recurrence' || action === 'escalate') return 'btn btn-danger';
  return 'btn';
}

export default function InboxPage() {
  const [payload, setPayload] = useState<CasesPayload | null>(null);
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [team, setTeam] = useState(TEAMS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/cases', { cache: 'no-store' });
      if (!response.ok) throw new Error('load failed');
      const data = (await response.json()) as CasesPayload;
      setPayload(data);
      setSelectedId((current) =>
        current && data.cases.some((item) => item.id === current)
          ? current
          : (data.cases[0]?.id ?? '')
      );
      setError('');
    } catch {
      setError('Could not load the case register.');
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const response = await fetch(`/api/cases?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('detail failed');
    setDetail((await response.json()) as DetailPayload);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const response = await fetch(`/api/cases?id=${encodeURIComponent(selectedId)}`, {
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('detail failed');
        const data = (await response.json()) as DetailPayload;
        if (active) setDetail(data);
      } catch {
        if (active) setError('Could not load the case detail.');
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const run = async (action: CaseAction) => {
    if (!detail) return;
    if (action === 'assign' && !team) {
      setError('Choose a team before assigning.');
      return;
    }
    if (action === 'note' && !note.trim()) {
      setError('Write a note before saving.');
      return;
    }
    setBusy(action);
    setError('');
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: detail.case.id, action, team, note })
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || 'The action could not be applied.');
      setNote('');
      await load();
      await loadDetail(detail.case.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be applied.');
    } finally {
      setBusy('');
    }
  };

  const teams = payload?.teams?.length ? payload.teams : TEAMS;
  const actions = detail ? nextCaseActions(detail.case.status, detail.case.verificationDay) : [];
  const canAssign = actions.includes('assign');
  const selected = detail?.case;

  return (
    <>
      <PageHeader
        eyebrow="Public intake"
        title="Case inbox"
        description="Citizen complaints and seed hotspots share one case register. Every action is logged against the case and mirrored to the public tracking page."
        actions={
          <>
            <Link className="btn" href="/report" target="_blank">
              Open public form
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => void load()}>
              Refresh
            </button>
          </>
        }
      />

      {error ? <div className="callout danger mb-16">{error}</div> : null}

      {payload && !payload.configured ? (
        <div className="callout warn mb-16">
          <strong>Case storage is not configured.</strong> Set <code>DATABASE_URL</code> for this
          project in Vercel, then redeploy. Local development falls back to{' '}
          <code>.data/cases.json</code>.
        </div>
      ) : null}

      <Card
        title="Case queue"
        subtitle={
          payload
            ? `${payload.cases.length} case${payload.cases.length === 1 ? '' : 's'} · ${
                payload.mode === 'postgres' ? 'shared Postgres storage' : 'local demo storage'
              }`
            : 'Loading…'
        }
        flush
      >
        {!payload ? (
          <div className="empty">
            <h3>Loading cases</h3>
            <p>Reading the shared case register.</p>
          </div>
        ) : payload.cases.length === 0 ? (
          <Empty
            title="No cases yet"
            body="Open the public form and submit a report to see it appear here."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Team</th>
                <th className="num">Reports</th>
                <th>SLA</th>
                <th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {payload.cases.map((item) => {
                const due = dueLabel(item.dueAt, item.status);
                return (
                  <tr
                    key={item.id}
                    className={`clickable${item.id === selectedId ? ' selected' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <td>
                      <span className="case-id">{item.id}</span>
                      <span style={{ display: 'block', marginTop: 4 }}>
                        <Badge tone={item.source === 'citizen' ? 'info' : 'neutral'}>
                          {item.source === 'citizen' ? 'Citizen' : 'Seed'}
                        </Badge>
                      </span>
                    </td>
                    <td>
                      <div className="cell-main">{item.name}</div>
                      <div className="cell-sub">{item.ward}</div>
                    </td>
                    <td>
                      <Badge tone={PRIORITY_TONE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge>
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[item.status]}>{CASE_STATUS_LABEL[item.status]}</Badge>
                    </td>
                    <td className="small">{item.team ?? 'Unassigned'}</td>
                    <td className="num">{item.reportsCount}</td>
                    <td>
                      <Badge tone={due.tone}>{due.text}</Badge>
                    </td>
                    <td>
                      {item.reference ? (
                        <Link
                          className="btn btn-sm"
                          href={`/track/${item.reference}`}
                          target="_blank"
                          onClick={(event) => event.stopPropagation()}
                        >
                          View
                        </Link>
                      ) : (
                        <span className="small muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {selected ? (
        <div className="split mt-16">
          <Card
            title={`${selected.id} · ${selected.name}`}
            subtitle={`${selected.ward} · ${selected.wasteType}`}
            actions={<Badge tone={STATUS_TONE[selected.status]}>{CASE_STATUS_LABEL[selected.status]}</Badge>}
          >
            <div className="between mb-16">
              <div>
                <div className="stat-label">Priority</div>
                <div className="stat-value">
                  {selected.priority}
                  <span className="muted small"> · {PRIORITY_LABEL[selected.priority]}</span>
                </div>
              </div>
              <div className="small muted" style={{ maxWidth: 280, textAlign: 'right' }}>
                {selected.team ? `Assigned to ${selected.team}` : 'No team assigned'}
                <br />
                {selected.reportsCount} report{selected.reportsCount === 1 ? '' : 's'} clustered
                {selected.reference ? ` · first ref ${selected.reference}` : ''}
              </div>
            </div>

            {selected.description ? (
              <p className="small muted mb-16">{selected.description}</p>
            ) : null}

            {FACTORS.map(([label, key]) => (
              <div className="meter" key={key}>
                <div className="meter-head">
                  <span>{label}</span>
                  <b>{selected.factors[key]}</b>
                </div>
                <Bar value={selected.factors[key]} />
              </div>
            ))}

            {selected.status === 'CLEARED' || selected.status === 'VERIFIED' ? (
              <>
                <div className="divider" />
                <div className="between mb-16">
                  <strong>Verification window</strong>
                  <span className="small muted">{selected.verificationDay} / 14 clean days</span>
                </div>
                <div className="days">
                  {Array.from({ length: 14 }, (_, index) => {
                    const state = index < selected.verificationDay ? 'clean' : 'pending';
                    return (
                      <div key={index} className={`day ${state}`} title={`Day ${index + 1}: ${state}`}>
                        {index + 1}
                      </div>
                    );
                  })}
                </div>
                {selected.spillover ? (
                  <div className="callout danger mt-16">
                    <strong>Spillover flagged.</strong> A secondary pile was detected inside the 150 m
                    halo, so the escrow stays withheld.
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="divider" />

            <div className="ledger">
              <div className="ledger-row">
                <span>Contract value</span>
                <b>₹{selected.contractTotal.toLocaleString('en-IN')}</b>
              </div>
              <div className="ledger-row">
                <span>Held in escrow</span>
                <b>₹{selected.escrowHeld.toLocaleString('en-IN')}</b>
              </div>
              <div className="ledger-row">
                <span>Escrow state</span>
                <b>
                  <Badge
                    tone={
                      selected.escrowState === 'RELEASED'
                        ? 'ok'
                        : selected.escrowState === 'WITHHELD'
                          ? 'danger'
                          : 'warn'
                    }
                  >
                    {selected.escrowState.toLowerCase()}
                  </Badge>
                </b>
              </div>
            </div>
          </Card>

          <div className="stack">
            <Card title="Next action" subtitle="Every change is appended to the case log">
              {canAssign ? (
                <label className="field">
                  <span className="field-label">Field team</span>
                  <select
                    className="input"
                    value={team}
                    onChange={(event) => setTeam(event.target.value)}
                  >
                    {teams.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="field">
                <span className="field-label">Note</span>
                <input
                  className="input"
                  value={note}
                  maxLength={500}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional context for the case log"
                />
              </label>

              <div className="form-actions">
                {actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className={actionClass(action)}
                    disabled={busy === action}
                    onClick={() => void run(action)}
                  >
                    {CASE_ACTION_LABEL[action]}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn"
                  disabled={busy === 'note' || !note.trim()}
                  onClick={() => void run('note')}
                >
                  Add note
                </button>
              </div>
            </Card>

            <Card title="Case log" subtitle="Newest first">
              {detail && detail.events.length > 0 ? (
                <ul className="diag">
                  {detail.events.map((event) => (
                    <li key={event.id}>
                      <strong>
                        {EVENT_LABEL[event.action] ??
                          CASE_ACTION_LABEL[event.action as CaseAction] ??
                          event.action}
                      </strong>
                      <span>
                        {event.note ? `${event.note} · ` : ''}
                        {event.fromStatus && event.toStatus && event.fromStatus !== event.toStatus
                          ? `${event.fromStatus} → ${event.toStatus} · `
                          : ''}
                        {event.actor} · {formatTime(event.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small muted">No events logged for this case yet.</p>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      <p className="small muted mt-16">
        Status changes here are visible on the public tracking page. Reporter names and phone numbers
        are stored but never shown publicly.
      </p>
    </>
  );
}
