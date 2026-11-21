'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import {
  STATUS_FLOW,
  STATUS_LABEL,
  type CitizenCase,
  type CitizenStatus
} from '@/lib/citizen';

interface InboxPayload {
  configured: boolean;
  mode: string;
  cases: CitizenCase[];
  error?: string;
}

export default function InboxPage() {
  const [payload, setPayload] = useState<InboxPayload | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/reports', { cache: 'no-store' });
      if (!response.ok) throw new Error('load failed');
      setPayload((await response.json()) as InboxPayload);
      setError('');
    } catch {
      setError('Could not load the citizen inbox.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (caseId: string, status: CitizenStatus) => {
    setBusy(caseId);
    try {
      const response = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, status })
      });
      if (!response.ok) throw new Error('update failed');
      await load();
    } catch {
      setError('Could not update the status.');
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Public intake"
        title="Citizen inbox"
        description="Complaints submitted from the public report page. Each one is clustered against existing cases and becomes visible here immediately."
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
          <strong>Complaint storage is not configured.</strong> Set <code>DATABASE_URL</code> for this
          project in Vercel, then redeploy. Local development falls back to{' '}
          <code>.data/reports.json</code>.
        </div>
      ) : null}

      <Card
        title="Submitted complaints"
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
            <h3>Loading complaints</h3>
            <p>Reading the citizen inbox.</p>
          </div>
        ) : payload.cases.length === 0 ? (
          <Empty
            title="No citizen complaints yet"
            body="Open the public form and submit a report to see it appear here."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Problem</th>
                <th>Location</th>
                <th className="num">Reports</th>
                <th>Received</th>
                <th>Status</th>
                <th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {payload.cases.map((item) => (
                <tr key={item.caseId}>
                  <td>
                    <span className="case-id">{item.caseId}</span>
                    <span style={{ display: 'block', marginTop: 4 }}>
                      <Badge tone={item.action === 'MERGED' ? 'info' : 'warn'}>
                        {item.action === 'MERGED' ? 'Merged' : 'New'}
                      </Badge>
                    </span>
                  </td>
                  <td>
                    <div className="cell-main">{item.category}</div>
                    <div className="cell-sub">{item.description}</div>
                  </td>
                  <td className="mono small">
                    {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </td>
                  <td className="num">{item.count}</td>
                  <td className="small">
                    {new Date(item.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <select
                      className="input"
                      style={{ height: 30, width: 130 }}
                      value={item.status}
                      disabled={busy === item.caseId}
                      onChange={(event) =>
                        void updateStatus(item.caseId, event.target.value as CitizenStatus)
                      }
                      aria-label={`Status for ${item.caseId}`}
                    >
                      {STATUS_FLOW.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Link className="btn btn-sm" href={`/track/${item.reference}`} target="_blank">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="small muted mt-16">
        Status changes here are visible on the public tracking page. Reporter names and phone numbers
        are stored but never shown publicly.
      </p>
    </>
  );
}
