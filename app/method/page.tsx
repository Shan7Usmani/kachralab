'use client';

import { Card, PageHeader } from '@/components/ui';

const STEPS = [
  { title: 'Report', body: 'A citizen or inspector submits coordinates, a waste stream and field notes.' },
  { title: 'Cluster', body: 'Haversine distance is checked against every case. Within 30 m the report merges.' },
  { title: 'Score', body: 'Four weighted factors produce a 0-100 risk score, multiplied in monsoon conditions.' },
  { title: 'Verify', body: 'Clearance opens a 14-day window with a 150 m spillover halo around the site.' },
  { title: 'Settle', body: '60% of the contract stays in escrow until 14 consecutive clean days are logged.' }
];

const FACTORS = [
  { factor: 'Recurrence', weight: '35%', signal: 'Report frequency inside the cluster radius' },
  { factor: 'Hazard', weight: '25%', signal: 'Waste toxicity and handling risk' },
  { factor: 'Sensitive proximity', weight: '25%', signal: 'Distance to hospitals, schools, drains, markets' },
  { factor: 'Persistence', weight: '15%', signal: 'Days the site has stayed active' }
];

export default function MethodPage() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="Method and limitations"
        description="A short, explicit account of the rules behind the demo so reviewers can separate implemented logic from the production roadmap."
      />

      <Card title="Intervention pipeline" subtitle="Five steps from report to settlement" className="mb-16">
        <div className="steps">
          {STEPS.map((step, index) => (
            <div className="step" key={step.title}>
              <div className="step-num">STEP {index + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="split">
        <Card title="Risk formula" subtitle="Weighted factors, clamped to 0-100, then scaled by weather" flush>
          <table className="table">
            <thead>
              <tr>
                <th>Factor</th>
                <th>Weight</th>
                <th>Signal used in the demo</th>
              </tr>
            </thead>
            <tbody>
              {FACTORS.map((row) => (
                <tr key={row.factor}>
                  <td className="cell-main">{row.factor}</td>
                  <td className="num">{row.weight}</td>
                  <td className="small">{row.signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-foot">
            <span>
              Raw score = Σ(factor × weight) × weather multiplier. Monsoon multiplier is 1.35×; the
              dry-season value is 1.00×.
            </span>
          </div>
        </Card>

        <div className="stack">
          <Card title="Verification rules">
            <ul className="diag">
              <li>
                <strong>Day 0 clearance</strong>
                <span>40% of the contract is paid when the site is cleared.</span>
              </li>
              <li>
                <strong>14-day window</strong>
                <span>One clean checkpoint per day. Any failure or spillover keeps the escrow withheld.</span>
              </li>
              <li>
                <strong>150 m halo</strong>
                <span>Waste pushed into an adjacent alley still counts against the case.</span>
              </li>
            </ul>
          </Card>

          <div className="callout warn">
            <strong>What is simulated.</strong> Coordinates, report counts, vision output and contract
            amounts are seed data. There is no trained classifier, no payment integration and no municipal
            API connection.
          </div>
        </div>
      </div>

      <Card title="Roles in the workflow" subtitle="Who acts at each stage" className="mt-16">
        <div className="grid grid-4">
          <div>
            <h3 className="card-title">Citizen</h3>
            <p className="small muted">Submits a report and sees whether it merged into an existing case.</p>
          </div>
          <div>
            <h3 className="card-title">Field inspector</h3>
            <p className="small muted">Verifies the site, records waste composition and logs daily checkpoints.</p>
          </div>
          <div>
            <h3 className="card-title">Contractor</h3>
            <p className="small muted">Clears the site and receives the escrow only after the clean window closes.</p>
          </div>
          <div>
            <h3 className="card-title">Commissioner</h3>
            <p className="small muted">Reviews the case queue, risk ranking and programme-level outcomes.</p>
          </div>
        </div>
      </Card>

      <Card title="Known gaps" subtitle="Deliberately stated rather than hidden" className="mt-16">
        <ul className="diag">
          <li>
            <strong>Storage</strong>
            <span>State lives in browser localStorage. There is no database, auth or multi-user sync.</span>
          </li>
          <li>
            <strong>Classification</strong>
            <span>The vision panel returns a fixed rule-based result. It is not a trained model.</span>
          </li>
          <li>
            <strong>Map dependency</strong>
            <span>Base tiles come from OpenStreetMap and need a network connection. Case geometry is local.</span>
          </li>
          <li>
            <strong>Scale</strong>
            <span>Five seed cases and 100 retained reports are enough for a demo, not for a ward-level rollout.</span>
          </li>
        </ul>
      </Card>
    </>
  );
}
