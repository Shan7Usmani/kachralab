import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-brand">
          <span className="brand-mark">NS</span>
          <span>NagarSeva</span>
        </div>
        <nav className="landing-nav">
          <Link href="/report" className="btn btn-primary">
            Report a Problem
          </Link>
          <Link href="/track" className="btn">
            Track Report
          </Link>
          <Link href="/login" className="btn">
            Staff Login
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1>Municipal Waste Operations,<br /> Measured by Outcomes</h1>
            <p className="hero-subtitle">
              NagarSeva transforms waste management from activity-based reporting to outcome-linked contracts.
              A citizen report creates a persistent case. Staff track it through triage, clearance, and a
              14-day verification window. Contractors are paid 40% on clearance, 60% only after the site
              stays clean for two weeks.
            </p>
            <div className="hero-actions">
              <Link href="/report" className="btn btn-primary btn-lg">
                Report Waste Now
              </Link>
              <Link href="/track" className="btn btn-lg">
                Check Status
              </Link>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">30 m</span>
              <span className="stat-label">Spatial Clustering</span>
            </div>
            <div className="stat">
              <span className="stat-value">14 Days</span>
              <span className="stat-label">Verification Window</span>
            </div>
            <div className="stat">
              <span className="stat-value">40/60</span>
              <span className="stat-label">Escrow Split</span>
            </div>
            <div className="stat">
              <span className="stat-value">150 m</span>
              <span className="stat-label">Spillover Halo</span>
            </div>
          </div>
        </section>

        <section className="features">
          <h2>How It Works</h2>
          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-icon">1</div>
              <h3>Citizen Reports</h3>
              <p>
                Residents submit geotagged complaints with photos, category, and description via a simple
                public form. No login required. They receive a reference number (e.g., <code>NS-2026-ABC123</code>)
                to track progress.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">2</div>
              <h3>30 m Clustering</h3>
              <p>
                Reports within 30 meters of an existing case centroid merge automatically — no duplicate
                tickets for the same hotspot. New locations open a persistent case (CZ-xxxx) with a risk score
                based on recurrence, hazard type, sensitive proximity, and persistence.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">3</div>
              <h3>Staff Console</h3>
              <p>
                Municipal staff see a unified case register at <code>/inbox</code>. Actions: triage (set priority/SLA),
                assign team, start work, mark cleared, log daily clean checkpoints, flag recurrence,
                release escrow. Every action is timestamped and logged.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">4</div>
              <h3>14-Day Verification</h3>
              <p>
                After clearance, a 14-day monitoring window begins. Staff log one clean checkpoint per day.
                A 150 m spillover halo detects displaced dumping. Any recurrence or spillover resets the
                window and withholds the 60% escrow.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">5</div>
              <h3>Outcome-Linked Payment</h3>
              <p>
                40% paid on clearance. 60% held in escrow until 14 consecutive clean days with no spillover.
                Only then is the full contract released. This aligns contractor incentives with sustained
                cleanliness, not just one-time clearance.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">6</div>
              <h3>Public Tracking</h3>
              <p>
                Citizens track their report at <code>/track/[reference]</code> — a public timeline showing
                Received → Triaged → Assigned → Cleared → Verified. Names and phone numbers are never
                displayed publicly.
              </p>
            </article>
          </div>
        </section>

        <section className="architecture">
          <h2>Architecture</h2>
          <div className="arch-grid">
            <div className="arch-item">
              <h3>Frontend</h3>
              <ul>
                <li>Next.js 16 (App Router) + React 19</li>
                <li>TypeScript throughout</li>
                <li>Tailwind-like utility CSS</li>
                <li>Leaflet + OpenStreetMap for maps</li>
              </ul>
            </div>
            <div className="arch-item">
              <h3>Backend</h3>
              <ul>
                <li>Server-side API routes (Node.js runtime)</li>
                <li>Postgres (Supabase via Vercel Marketplace)</li>
                <li>File fallback for local development</li>
                <li>No external AI/ML dependencies</li>
              </ul>
            </div>
            <div className="arch-item">
              <h3>Domain Logic</h3>
              <ul>
                <li>Pure functions in <code>lib/engine.ts</code></li>
                <li>Haversine clustering (30 m)</li>
                <li>Risk formula: 0.35×recurrence + 0.25×hazard + 0.25×proximity + 0.15×persistence</li>
                <li>Monsoon multiplier: 1.35×</li>
              </ul>
            </div>
            <div className="arch-item">
              <h3>Data Flow</h3>
              <ul>
                <li>Public form → <code>/api/reports</code> → citizen_reports table</li>
                <li>Auto-sync → cases table (shared register)</li>
                <li>Staff actions → <code>/api/cases</code> → case_events log</li>
                <li>Status changes mirrored back to citizen_reports</li>
                <li>Tracking page reads fresh from citizen_reports</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="routes">
          <h2>Key Routes</h2>
          <table className="routes-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Audience</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>/report</code></td>
                <td>Public</td>
                <td>Submit a waste complaint</td>
              </tr>
              <tr>
                <td><code>/track</code></td>
                <td>Public</td>
                <td>Lookup by reference number</td>
              </tr>
              <tr>
                <td><code>/track/[reference]</code></td>
                <td>Public</td>
                <td>View status timeline</td>
              </tr>
              <tr>
                <td><code>/inbox</code></td>
                <td>Staff</td>
                <td>Unified case register with actions</td>
              </tr>
              <tr>
                <td><code>/hotspots</code></td>
                <td>Staff</td>
                <td>Case register with risk scores</td>
              </tr>
              <tr>
                <td><code>/verify</code></td>
                <td>Staff</td>
                <td>14-day monitoring & escrow release</td>
              </tr>
              <tr>
                <td><code>/map</code></td>
                <td>Staff</td>
                <td>Full map with clusters & halos</td>
              </tr>
              <tr>
                <td><code>/impact</code></td>
                <td>Staff</td>
                <td>Programme-level metrics</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="cta">
          <h2>Ready to Report?</h2>
          <p>Submit a waste problem in the Delhi NCR demo grid and track it through to verification.</p>
          <Link href="/report" className="btn btn-primary btn-lg">
            Report Waste Now
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <p>NagarSeva · CodeSprint 2026 Demo · Illustrative data only</p>
        <p className="small">No auth, no payments, no external AI — runs on Vercel with Supabase Postgres</p>
      </footer>
    </div>
  );
}