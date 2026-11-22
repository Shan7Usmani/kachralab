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
            <span className="hero-badge">CodeSprint 2026 · Municipal Waste Intelligence</span>
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
            <div className="hero-trust">
              <span className="trust-item">No login required</span>
              <span className="trust-divider" aria-hidden="true">·</span>
              <span className="trust-item">Real-time tracking</span>
              <span className="trust-divider" aria-hidden="true">·</span>
              <span className="trust-item">Outcome-linked payments</span>
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

        <section className="why">
          <div className="why-content">
            <h2>Why NagarSeva?</h2>
            <p className="why-lead">
              Traditional systems pay contractors when a truck is dispatched or a photo is uploaded.
              NagarSeva pays when the hotspot <strong>stays clean for 14 days</strong> and waste doesn't
              simply move 150 m down the road.
            </p>
            <div className="why-grid">
              <article className="why-card">
                <div className="why-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <h3>Persistent Memory</h3>
                <p>Every hotspot remembers its history — recurrence, clearance dates, verification streaks. No more starting from zero each complaint.</p>
              </article>
              <article className="why-card">
                <div className="why-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                </div>
                <h3>Explainable Risk</h3>
                <p>Transparent 0–100 score: 35% recurrence, 25% hazard, 25% proximity, 15% persistence. Monsoon multiplier (1.35×) applied automatically.</p>
              </article>
              <article className="why-card">
                <div className="why-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <h3>Verified Outcomes</h3>
                <p>14 clean checkpoints + 150 m spillover detection. Escrow releases only when both pass. Contractor incentive = sustained cleanliness.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="features-header">
            <h2>How It Works</h2>
            <p>Six steps from citizen report to verified outcome</p>
          </div>
          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-number">01</div>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h3>Citizen Reports</h3>
              <p>
                Residents submit geotagged complaints with category and description via a simple
                public form. No login required. They receive a reference number (e.g., <code>NS-2026-ABC123</code>)
                to track progress.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-number">02</div>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21" y1="12" x2="17" y2="12"></line><line x1="7" y1="12" x2="3" y2="12"></line><line x1="12" y1="21" x2="12" y2="17"></line><line x1="12" y1="7" x2="12" y2="3"></line></svg>
              </div>
              <h3>30 m Clustering</h3>
              <p>
                Reports within 30 meters of an existing case centroid merge automatically — no duplicate
                tickets for the same hotspot. New locations open a persistent case (CZ-xxxx) with a risk score
                based on recurrence, hazard type, sensitive proximity, and persistence.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-number">03</div>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3>Staff Console</h3>
              <p>
                Municipal staff see a unified case register at <code>/inbox</code>. Actions: triage (set priority/SLA),
                assign team, start work, mark cleared, log daily clean checkpoints, flag recurrence,
                release escrow. Every action is timestamped and logged.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-number">04</div>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <h3>14-Day Verification</h3>
              <p>
                After clearance, a 14-day monitoring window begins. Staff log one clean checkpoint per day.
                A 150 m spillover halo detects displaced dumping. Any recurrence or spillover resets the
                window and withholds the 60% escrow.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-number">05</div>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <h3>Outcome-Linked Payment</h3>
              <p>
                40% paid on clearance. 60% held in escrow until 14 consecutive clean days with no spillover.
                Only then is the full contract released. This aligns contractor incentives with sustained
                cleanliness, not just one-time clearance.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-number">06</div>
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
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
          <div className="arch-header">
            <h2>Architecture</h2>
            <p>Built for transparency, reliability, and zero external dependencies</p>
          </div>
          <div className="arch-grid">
            <div className="arch-item">
              <div className="arch-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path></svg>
              </div>
              <h3>Frontend</h3>
              <ul>
                <li>Next.js 16 (App Router) + React 19</li>
                <li>TypeScript throughout</li>
                <li>Custom utility CSS (no Tailwind)</li>
                <li>Leaflet + OpenStreetMap</li>
              </ul>
            </div>
            <div className="arch-item">
              <div className="arch-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
              </div>
              <h3>Backend</h3>
              <ul>
                <li>Server-side API routes (Node.js runtime)</li>
                <li>Postgres (Supabase via Vercel Marketplace)</li>
                <li>File fallback for local development</li>
                <li>No external AI/ML dependencies</li>
              </ul>
            </div>
            <div className="arch-item">
              <div className="arch-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
              <h3>Domain Logic</h3>
              <ul>
                <li>Pure functions in <code>lib/engine.ts</code></li>
                <li>Haversine clustering (30 m)</li>
                <li>Risk: 0.35×recurrence + 0.25×hazard + 0.25×proximity + 0.15×persistence</li>
                <li>Monsoon multiplier: 1.35×</li>
              </ul>
            </div>
            <div className="arch-item">
              <div className="arch-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
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

        <section className="demo-preview">
          <div className="demo-content">
            <h2>See It in Action</h2>
            <p className="demo-lead">Try the demo flows — no setup required</p>
            <div className="demo-cards">
              <Link href="/report" className="demo-card">
                <div className="demo-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <h3>Report a Problem</h3>
                <p>Submit a waste complaint with location, category, and description. Get a reference number instantly.</p>
                <span className="demo-link">Try it →</span>
              </Link>
              <Link href="/track" className="demo-card">
                <div className="demo-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <h3>Track a Report</h3>
                <p>Enter a reference number to see the public timeline — Received through Verified.</p>
                <span className="demo-link">Try it →</span>
              </Link>
              <Link href="/login" className="demo-card">
                <div className="demo-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <h3>Staff Console</h3>
                <p>Sign in (dev mode: any password) to access the unified case inbox at <code>/inbox</code>.</p>
                <span className="demo-link">Try it →</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="routes">
          <div className="routes-header">
            <h2>Key Routes</h2>
            <p>Every route serves a specific role in the waste intervention cycle</p>
          </div>
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
              <tr>
                <td><code>/method</code></td>
                <td>Staff</td>
                <td>Pipeline, risk formula, known gaps</td>
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
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="brand-mark">NS</span>
            <span>NagarSeva</span>
            <p>Municipal waste intelligence for CodeSprint 2026</p>
          </div>
          <nav className="footer-nav">
            <h4>Public</h4>
            <ul>
              <li><Link href="/report">Report Waste</Link></li>
              <li><Link href="/track">Track Report</Link></li>
            </ul>
          </nav>
          <nav className="footer-nav">
            <h4>Staff</h4>
            <ul>
              <li><Link href="/login">Sign In</Link></li>
              <li><Link href="/inbox">Case Inbox</Link></li>
              <li><Link href="/verify">Verification</Link></li>
              <li><Link href="/impact">Impact</Link></li>
            </ul>
          </nav>
          <nav className="footer-nav">
            <h4>Resources</h4>
            <ul>
              <li><Link href="/method">Methodology</Link></li>
              <li><Link href="/map">Live Map</Link></li>
              <li><Link href="/hotspots">Hotspots</Link></li>
            </ul>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>NagarSeva · CodeSprint 2026 Demo · Illustrative data only</p>
          <p className="small">No auth, no payments, no external AI — runs on Vercel with Supabase Postgres</p>
        </div>
      </footer>
    </div>
  );
}