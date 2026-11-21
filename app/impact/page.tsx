import Link from 'next/link';

export const metadata = { title: 'Impact | KachraLab' };

export default function ImpactPage() {
  return (
    <div className="app">
      <header className="topbar glass">
        <div className="brand">
          <span className="brand-mark">KL</span>
          <span className="brand-copy">
            <strong>KACHRA<span style={{ color: 'var(--amber)' }}>LAB</span></strong>
            <span>IMPACT / BUYERS / ROADMAP</span>
          </span>
        </div>
        <nav className="topnav" aria-label="Main actions">
          <Link href="/" className="navbtn">CONSOLE</Link>
          <Link href="/cases" className="navbtn">CASES</Link>
          <Link href="/map" className="navbtn">MAP</Link>
          <Link href="/simulator" className="navbtn">SIMULATOR</Link>
          <Link href="/vision" className="navbtn">VISION</Link>
          <Link href="/lab" className="navbtn">LAB</Link>
          <Link href="/human" className="navbtn">HUMAN</Link>
          <Link href="/impact" className="navbtn active">IMPACT</Link>
        </nav>
      </header>

      <section className="panel glass impact-hero">
        <span className="stat-label">BUYERS NEED PROOF · OPERATORS NEED NEXT ACTIONS</span>
        <h1>Fewer repeat cleanups. Better route and asset decisions. Evidence-linked accountability.</h1>
        <p>
          KachraLab replaces the question &quot;did a truck get dispatched?&quot; with &quot;did the hotspot
          stay clean for 14 days, and did waste move into the 150 m halo?&quot; That shift is what makes
          the budget defensible.
        </p>
      </section>

      <section className="impact-grid">
        <article className="panel glass impact-stat amber">
          <strong>4,800+</strong>
          <span>URBAN LOCAL BODIES IN INDIA</span>
        </article>
        <article className="panel glass impact-stat teal">
          <strong>68%</strong>
          <span>PROJECTED DROP IN HOTSPOT RECURRENCE</span>
        </article>
        <article className="panel glass impact-stat blue">
          <strong>₹1.4L</strong>
          <span>SAVED PER WARD EVERY 6 MONTHS</span>
        </article>
        <article className="panel glass impact-stat red">
          <strong>70%</strong>
          <span>SANITATION BUDGET LOST TO REPEAT CLEANUPS</span>
        </article>
      </section>

      <section className="panel glass">
        <div className="panel-head">
          <h2>BUYER SEGMENTS</h2>
          <small>ILLUSTRATIVE MARKET MAP</small>
        </div>
        <div className="impact-cards">
          <article>
            <span>PRIMARY B2G</span>
            <h3>Municipal corporations</h3>
            <p>Eliminates chronic GVPs for Swachh Survekshan points.</p>
          </article>
          <article>
            <span>CAMPUS & TOWNSHIP B2B</span>
            <h3>Universities & RWAs</h3>
            <p>Audits private housekeeping SLAs across large campuses.</p>
          </article>
          <article>
            <span>INDUSTRIAL INFRASTRUCTURE</span>
            <h3>SEZs & smart cities</h3>
            <p>Prevents night C&D dumping and monsoon drain blockages.</p>
          </article>
        </div>
      </section>

      <section className="panel glass" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>THE GOVERNING RULE</h2>
          <small>EXPLAINABLE, NOT INFERRED</small>
        </div>
        <div className="impact-formula">
          Risk = ( 0.35·Recurrence + 0.25·Hazard + 0.25·Proximity + 0.15·Duration ) × M<sub>rain</sub>
        </div>
        <p className="disclaimer">
          30 m Haversine clustering creates the case. 150 m spillover catches displacement. 40% is paid
          on clearance; 60% is released only after 14 verified clean days.
        </p>
      </section>

      <section className="panel glass impact-roadmap" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>PRODUCTION ROADMAP</h2>
          <small>FUTURE STATE</small>
        </div>
        <div className="impact-cards">
          <article><span>PHASE 01</span><h3>Dashcam auto-scouting</h3><p>Edge-AI cameras on municipal trucks for passive daily detection.</p></article>
          <article><span>PHASE 02</span><h3>Smart-contract escrow</h3><p>40/60 payout automated through municipal ERP triggers.</p></article>
          <article><span>PHASE 03</span><h3>Swachh Survekshan API</h3><p>One-click export of verified 14-day eradication dossiers.</p></article>
        </div>
      </section>

      <p className="disclaimer" style={{ marginTop: 18 }}>
        Illustrative demonstration. Market figures are pitch claims; 68% is projected. Edge-Vision is a
        rule-based simulation. The schematic map is not a GIS survey. Production architecture is roadmap,
        not deployed here.
      </p>
    </div>
  );
}
