import Link from 'next/link';

import { Badge, Card } from '@/components/ui';
import { STATUS_DESCRIPTION, STATUS_FLOW, STATUS_LABEL } from '@/lib/citizen';
import { storageMode } from '@/lib/server/db';
import { getReport } from '@/lib/server/reports';

export const dynamic = 'force-dynamic';

export default async function TrackReportPage({
  params
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  if (storageMode === 'unavailable') {
    return (
      <>
        <div className="public-hero">
          <div className="eyebrow">Complaint tracking</div>
          <h1>Tracking is not configured</h1>
          <p>This deployment does not have a complaint database connected yet.</p>
        </div>
        <Link className="btn" href="/report">
          Back to reporting
        </Link>
      </>
    );
  }

  const report = await getReport(reference.toUpperCase());

  if (!report) {
    return (
      <>
        <div className="public-hero">
          <div className="eyebrow">Complaint tracking</div>
          <h1>Report not found</h1>
          <p>
            No complaint matches <span className="mono">{reference}</span>. Check the reference number
            and try again.
          </p>
        </div>
        <div className="row">
          <Link className="btn btn-primary" href="/track">
            Try another reference
          </Link>
          <Link className="btn" href="/report">
            Report a problem
          </Link>
        </div>
      </>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(report.status);

  return (
    <>
      <div className="public-hero">
        <div className="eyebrow">Complaint tracking</div>
        <h1>{report.reference}</h1>
        <p>
          Case {report.caseId} · submitted {new Date(report.createdAt).toLocaleString('en-IN')}
        </p>
      </div>

      <div className="split-even">
        <Card title="Status" subtitle={STATUS_LABEL[report.status]}>
          <ul className="timeline">
            {STATUS_FLOW.map((status, index) => (
              <li
                key={status}
                className={index < currentIndex ? 'done' : index === currentIndex ? 'current' : ''}
              >
                <span className="dot" aria-hidden="true" />
                <div>
                  <div className="label">{STATUS_LABEL[status]}</div>
                  <div className="desc">{STATUS_DESCRIPTION[status]}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="stack">
          <Card title="Report details">
            <div className="ledger">
              <div className="ledger-row">
                <span>Problem</span>
                <b>{report.category}</b>
              </div>
              <div className="ledger-row">
                <span>Case</span>
                <b className="mono">{report.caseId}</b>
              </div>
              <div className="ledger-row">
                <span>Location</span>
                <b className="mono">
                  {report.lat.toFixed(3)}, {report.lng.toFixed(3)}
                </b>
              </div>
              <div className="ledger-row">
                <span>Submitted</span>
                <b>{new Date(report.createdAt).toLocaleDateString('en-IN')}</b>
              </div>
            </div>
            <p className="small muted mt-16">{report.description}</p>
          </Card>

          <div className="callout">
            <strong>Privacy.</strong> Your name and phone number are not shown on this page. Only the
            case reference, category and approximate location are visible.
          </div>

          <Link className="btn" href="/report">
            Report another problem
          </Link>
        </div>
      </div>
    </>
  );
}
