# KachraLab Full Source Handoff - Part 1 of 2
Complete source snapshot. Continue with Part 2.

### package.json
```json
{
  "name": "kachralab-next",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "leaflet": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/leaflet": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "typescript": "latest"
  }
}

```
### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}

```
### next.config.mjs
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default nextConfig;

```
### vercel.json
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}

```
### .gitignore
```text
node_modules/
.next/
.vercel/
.DS_Store
*.log

.vercel

```
### README.md
```text
# ðŸ›ï¸ KACHRALAB &mdash; Municipal Waste Intervention Intelligence Platform

> **"Don't just clean the hotspot. Learn how to stop it from returning."**

* **Product:** KACHRALAB
* **Platform:** Independent Municipal Waste Intervention Intelligence
* **Coverage Area:** Delhi NCR (Illustrative Demonstration Grid)
* **Tech Stack:** HTML5, CSS3 (Modern Dark Command Center System), Vanilla JavaScript (ES6+), LocalStorage, Inline SVG.
* **Dependencies:** None. Zero external frameworks, CDNs, databases, or cloud APIs. Runs 100% offline directly in Google Chrome.

---

## ðŸŒŸ Product Overview

Traditional municipal waste management relies on **reactive, complaint-driven clearance**. A citizen complains, a sanitation truck is dispatched, the garbage is cleared, and within 3 to 5 days, **the hotspot refills**. This creates a cycle where contractors are repeatedly compensated for surface cleanups while the underlying root cause persists unaddressed.

**KachraLab** transforms municipal sanitation into an **outcome-linked intervention intelligence platform** through five core capabilities:

1. **Haversine 30-Metre Spatial Memory:** Clusters citizen reports within a 30-metre geodesic radius into persistent geographic hotspots rather than treating each complaint as an isolated one-off ticket.
2. **Explainable Risk Engine:** Computes risk via a multi-factor formula combining recurrence frequency, waste toxicity/hazard, environmental vulnerability, persistence duration, and a meteorological monsoon multiplier ($M_{\text{rain}}$).
3. **Root Cause Diagnostics:** Generates rule-based, explainable systemic hypotheses (e.g., morning vegetable wholesale timing mismatches, containerization deficits, midnight renovation dumping) to guide field inspectors.
4. **14-Day Verification Protocol:** Replaces the illusion of "clean today" with a mandatory 14-day outcome monitoring window, complete with a **150-metre spillover displacement radar** to prevent waste from merely being swept into adjacent alleys.
5. **Outcome-Linked 40/60 SLA Model:** Disburses 40% upfront upon initial Day 0 clearance and locks 60% in an escrow hold, released strictly upon 14 consecutive clean days.

---

## ðŸš€ Quick Start (Running the Application)

1. **Direct Browser Execution:**
   - Double-click `index.html` (or right-click $\rightarrow$ *Open with Google Chrome*).
   - Alternatively, open your browser and navigate to:
     ```
     file:///c:/Users/Asus/OneDrive/Desktop/KC%20LAB%202/index.html
     ```
2. **Offline Support:** The entire platform uses embedded SVG vector graphics, system fonts, and pure JavaScript. No internet connection or local web server is required.

---

## ðŸ“ Delhi NCR Illustrative Demo Locations

All locations, reports, statistics, and coordinates in this application represent **illustrative demonstration data**:

| Hotspot ID | Location & Ward | Primary Waste Type | Reports (30d) | Risk Score | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GZ-042** | **Lajpat Nagar Central Market Ring Road** (Ward 58 - South Delhi) | Organic & Single-Use Plastic | **12 reports** | **82 / 100** | **Recurring** (Active 14-Day Monitoring) |
| **GZ-018** | **Karol Bagh Pusa Road Junction** (Ward 42 - Central Delhi) | Construction & Demolition (C&D) | 7 reports | **88 / 100** | **Critical P1** (Hospital corridor) |
| **GZ-031** | **Saket Press Enclave Community Center** (Ward 71 - South Delhi) | Mixed Municipal & Dry Leaves | 4 reports | **18 / 100** | **Verified Clean** (Day 14 complete) |
| **GZ-009** | **Connaught Place Outer Circle Block B** (Ward 19 - New Delhi) | Food Packaging & Cups | 5 reports | **64 / 100** | **In Intervention** (Active squad dispatch) |
| **GZ-055** | **Okhla Phase III / Govindpuri Crossing** (Ward 83 - South-East) | Industrial Packaging & Silt | 8 reports | **74 / 100** | **Recurring** (Night dumping) |

---

## ðŸ“ Algorithmic Specifications

### 1. Spatial Memory (Haversine Distance Formula)
When a citizen report is submitted, KachraLab evaluates the great-circle distance $d$ between the report coordinates $(\phi_2, \lambda_2)$ and all existing hotspot centroids $(\phi_1, \lambda_1)$:

$$d = 2r \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$

* Where $r = 6,371,000 \text{ m}$ (mean Earth radius).
* **Clustering Rule:**
  * If $d \le 30 \text{ m}$: Merged into the existing hotspot cluster. Recurrence counter increments and risk recalculates.
  * If $d > 30 \text{ m}$: A new independent spatial hotspot node is initialized.

### 2. Explainable Risk Engine Formula
Hotspots are ranked using the official governing risk equation:

$$\text{Risk} = \left( 0.35 \times \text{Recurrence} + 0.25 \times \text{Hazard} + 0.25 \times \text{Proximity} + 0.15 \times \text{Duration} \right) \times M_{\text{rain}}$$

* **Factor Normalization $[0 - 100]$:**
  * **Recurrence ($35\%$):** Normalizes complaint frequency in the rolling 30-day window ($\ge 10 \text{ reports} = 90 - 100$).
  * **Hazard ($25\%$):** Evaluates pathogenic and leachate contamination potential (e.g., single-use plastics + organic slurry $= 80 - 90$).
  * **Proximity ($25\%$):** Measures spatial vulnerability to open stormwater canals (e.g. Barapullah corridor), hospitals, and educational facilities.
  * **Duration ($15\%$):** Quantifies persistence days without systemic resolution.
  * **Meteorological Multiplier ($M_{\text{rain}}$):** $1.00\times$ under dry conditions; escalates to $1.35\times$ during monsoon alerts due to water-table leachate transmission risks.
  * **Boundary Condition:** Final display score is strictly capped at $100$.

---

## ðŸŽ¯ Interactive Demonstration Guide

### Workflow 1: 14-Day Verification & Recurrence Simulator
1. Navigate to the **"14-Day Verification & Simulator"** tab.
2. Hotspot **GZ-042 (Lajpat Nagar Central Market)** is monitored at **Day 4 of 14** ($\text{Risk} = 82/100$).
3. Click the prominent button:
   $$\mathbf{[ \text{SIMULATE RECURRENCE (DAY 5 DUMPING)} ]}$$
4. **Observe the Systemic Reaction:**
   - Day 5 node in the 14-day timeline flips to bright red **FAILED / RECURRED**.
   - 150m Spillover Displacement Radar alerts to secondary dumping in an adjacent alley.
   - Hotspot status immediately switches to **RECURRING**.
   - The 60% SLA Hold ($\text{â‚¹}7,200$) is marked **WITHHELD / FORFEITED** in the contract ledger.
5. Click **"SIMULATE SUCCESS (ALL 14 DAYS CLEAN)"** to observe the inverse branch: all 14 checkpoints turn green, status becomes **VERIFIED CLEAN**, and the 60% performance escrow is released.

### Workflow 2: Citizen Grievance Intake & Simulated Edge-Vision AI
1. Switch to the **"Citizen Reporting & AI Vision"** tab.
2. Click **"Preset 1: Lajpat Nagar Market (Plastic/Veg)"** to auto-populate Delhi coordinates ($28.5702^\circ\text{ N}, 77.2432^\circ\text{ E}$).
3. Click **"Submit Report & Execute AI Waste Analysis"**.
4. Observe:
   - **Haversine 30m Clustering:** The engine computes that the report is within $14.2\text{ m}$ of **GZ-042**, automatically merging the grievance and incrementing the recurrence count.
   - **Edge-Vision Simulation:** Displays multispectral fraction breakdown (64% LDPE polybags, 24% PET, 12% sludge), severity rating, estimated volume (~$310\text{ kg}$), and priority dispatch recommendation.

### Workflow 3: Delhi NCR Schematic Map & Meteorological Simulation
1. Switch to the **"Command Dashboard"** tab.
2. Inspect the schematic vector map showing Central Delhi, South Delhi, the Yamuna River corridor, Ring Road, and Okhla.
3. Click hotspot markers (**GZ-042**, **GZ-018**, **GZ-031**) to view their 30m cluster circles and 150m spillover zones.
4. Click the top **"Dry (M_rain: 1.0x)"** toggle to test the $1.35\times$ monsoon rain multiplier and watch risk scores dynamically update.

---

## ðŸ—‚ï¸ File Structure

```
KachraLab/
â”œâ”€â”€ index.html        # Clean, modern municipal command center interface
â”œâ”€â”€ styles.css        # Professional dark navy & charcoal design system
â”œâ”€â”€ app.js            # Core algorithms (Haversine, Risk Engine, Simulator)
â””â”€â”€ README.md         # Product documentation and user guide
```

---

## ðŸ›¡ï¸ Transparency Disclaimers

1. **Illustrative Demo Data:** All locations, ward names, coordinates, and operational statistics are fictional illustrative examples created to demonstrate KachraLab's capabilities.
2. **AI Vision Simulation:** The Edge-Vision module is a rule-based demonstration simulation illustrating how edge computer vision models would classify waste fractions.
3. **Schematic Map:** The vector map is an operational schematic grid designed to visualize 30m Haversine clustering and 150m perimeter displacement, not a live GIS survey.

```
### next-env.d.ts
```tsx
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";
import "./.next/types/root-params.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```
### app/layout.tsx
```tsx
import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'KachraLab | Live Intervention Console',
  description:
    'Outcome-linked municipal waste intervention intelligence. Hotspot memory, explainable risk, 14-day verification and split escrow.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="global-footnote">
          Illustrative data Â· rule-based vision Â· simulated escrow Â· production stack on roadmap
        </div>
      </body>
    </html>
  );
}

```
### app/page.tsx
```tsx
import Console from '@/components/Console';

export default function Page() {
  return <Console />;
}

```
### app/globals.css
```css
:root {
  --ink: #080d12;
  --ink-2: #0d151c;
  --glass: rgba(18, 28, 36, 0.62);
  --glass-strong: rgba(22, 33, 42, 0.82);
  --stroke: rgba(255, 255, 255, 0.09);
  --stroke-soft: rgba(255, 255, 255, 0.05);
  --text: #edf3f1;
  --dim: #9fb0b0;
  --mute: #6d8083;
  --amber: #f2b33d;
  --red: #ef5b4c;
  --teal: #37c9a6;
  --blue: #5a9df0;
  --purple: #a98bff;
  --shadow-dark: rgba(0, 0, 0, 0.55);
  --shadow-light: rgba(255, 255, 255, 0.045);
  --ease: cubic-bezier(.2, .7, .2, 1);
}

* { box-sizing: border-box; }

html, body { margin: 0; min-height: 100%; }

body {
  background:
    radial-gradient(circle at 12% 0%, rgba(90, 157, 240, 0.16), transparent 34%),
    radial-gradient(circle at 88% 8%, rgba(242, 179, 61, 0.12), transparent 30%),
    radial-gradient(circle at 50% 100%, rgba(55, 201, 166, 0.10), transparent 42%),
    linear-gradient(160deg, #0a1117 0%, #070b10 55%, #0b1218 100%);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

button, input { font: inherit; }
button { color: inherit; }
::selection { background: var(--amber); color: var(--ink); }

:focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; }

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

.hidden { display: none !important; }

.glass {
  background: var(--glass);
  border: 1px solid var(--stroke);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 18px 46px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(18px) saturate(130%);
  -webkit-backdrop-filter: blur(18px) saturate(130%);
}

.neu {
  background: linear-gradient(145deg, rgba(27, 40, 49, 0.9), rgba(13, 21, 28, 0.9));
  border: 1px solid var(--stroke-soft);
  box-shadow: 7px 7px 16px var(--shadow-dark), -7px -7px 16px var(--shadow-light);
}

.app {
  max-width: 1720px;
  margin: 0 auto;
  padding: 0 24px 40px;
}

.topbar {
  position: sticky;
  top: 12px;
  z-index: 40;
  margin: 12px 0 18px;
  border-radius: 18px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand { display: flex; align-items: center; gap: 12px; min-width: 220px; }
.brand-mark {
  width: 40px; height: 40px;
  display: grid; place-items: center;
  border-radius: 12px;
  font: 800 13px ui-monospace, Consolas, monospace;
  color: var(--ink);
  background: linear-gradient(145deg, var(--amber), #ffd27a);
  box-shadow: 5px 5px 12px rgba(0,0,0,.45), -3px -3px 10px rgba(255,255,255,.08);
}
.brand-copy strong { display: block; letter-spacing: .14em; font-size: 13px; }
.brand-copy span { display: block; color: var(--mute); font: 9px ui-monospace, Consolas, monospace; letter-spacing: .14em; }

.topnav { display: flex; gap: 8px; flex: 1; }
.navbtn {
  border: 0;
  background: transparent;
  color: var(--dim);
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  font: 10px ui-monospace, Consolas, monospace;
  letter-spacing: .1em;
  transition: .18s var(--ease);
}
.navbtn:hover, .navbtn.active { color: var(--text); background: rgba(255,255,255,.06); }
.navbtn.active { box-shadow: inset 0 0 0 1px rgba(242,179,61,.35); }

.top-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.engine-pill {
  font: 9px ui-monospace, Consolas, monospace;
  letter-spacing: .1em;
  color: var(--mute);
  border: 1px solid var(--stroke);
  padding: 7px 10px;
  border-radius: 999px;
}
.engine-pill.online { color: var(--teal); border-color: rgba(55,201,166,.4); }

.toggle {
  border-radius: 999px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  font: 10px ui-monospace, Consolas, monospace;
  letter-spacing: .08em;
  color: var(--dim);
}
.toggle .knob {
  width: 30px; height: 16px;
  border-radius: 999px;
  background: rgba(0,0,0,.4);
  border: 1px solid var(--stroke);
  position: relative;
}
.toggle .knob::after {
  content: "";
  position: absolute; top: 2px; left: 2px;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--amber);
  transition: transform .22s var(--ease), background .22s var(--ease);
}
.toggle.active { color: var(--blue); box-shadow: 7px 7px 16px var(--shadow-dark), -7px -7px 16px rgba(90,157,240,.10); }
.toggle.active .knob::after { transform: translateX(14px); background: var(--blue); }

.btn {
  border-radius: 10px;
  padding: 10px 13px;
  cursor: pointer;
  font: 10px ui-monospace, Consolas, monospace;
  letter-spacing: .08em;
  color: var(--dim);
  transition: .16s var(--ease);
}
.btn:hover { color: var(--text); transform: translateY(-1px); }
.btn:active { transform: translateY(0); }
.btn.primary { color: var(--ink); background: linear-gradient(145deg, var(--amber), #ffd27a); border-color: transparent; font-weight: 800; }
.btn.danger { color: #ffb5ac; border-color: rgba(239,91,76,.35); }
.btn.ok { color: #a9f2dd; border-color: rgba(55,201,166,.35); }
.btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }

.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.stat { border-radius: 16px; padding: 16px 18px; position: relative; overflow: hidden; }
.stat::after {
  content: "";
  position: absolute; right: -20px; top: -26px;
  width: 90px; height: 90px; border-radius: 50%;
  background: radial-gradient(circle, rgba(242,179,61,.18), transparent 70%);
}
.stat-label { color: var(--mute); font: 9px ui-monospace, Consolas, monospace; letter-spacing: .14em; }
.stat-value { display: block; font: 800 30px/1.15 ui-monospace, Consolas, monospace; margin: 7px 0 3px; }
.stat-sub { color: var(--dim); font-size: 11px; }
.stat.teal .stat-value { color: var(--teal); }
.stat.amber .stat-value { color: var(--amber); }
.stat.blue .stat-value { color: var(--blue); }
.stat.red .stat-value { color: var(--red); }

.workspace {
  display: grid;
  grid-template-columns: 270px minmax(420px, 1fr) 340px;
  gap: 16px;
  align-items: stretch;
}

.panel { border-radius: 18px; padding: 16px; min-width: 0; }
.panel-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 14px; }
.panel-head h2 { margin: 0; font: 700 11px ui-monospace, Consolas, monospace; letter-spacing: .14em; }
.panel-head small { color: var(--mute); font: 9px ui-monospace, Consolas, monospace; letter-spacing: .08em; }

.search {
  width: 100%;
  border-radius: 10px;
  padding: 9px 11px;
  color: var(--text);
  border: 1px solid var(--stroke-soft);
  background: rgba(0,0,0,.25);
  outline: none;
}
.search::placeholder { color: var(--mute); }
.filter-row { display: flex; gap: 5px; flex-wrap: wrap; margin: 10px 0 12px; }
.filter-chip {
  border: 1px solid var(--stroke-soft);
  background: transparent;
  color: var(--mute);
  border-radius: 999px;
  padding: 5px 8px;
  cursor: pointer;
  font: 8px ui-monospace, Consolas, monospace;
  letter-spacing: .08em;
}
.filter-chip.active { color: var(--ink); background: var(--amber); border-color: var(--amber); font-weight: 800; }

.case-list { display: grid; gap: 8px; max-height: 560px; overflow-y: auto; padding-right: 4px; }
.case-item {
  text-align: left;
  width: 100%;
  border-radius: 12px;
  padding: 11px;
  cursor: pointer;
  border: 1px solid var(--stroke-soft);
  background: rgba(255,255,255,.025);
  transition: .16s var(--ease);
}
.case-item:hover { background: rgba(255,255,255,.055); transform: translateX(2px); }
.case-item.active {
  border-color: rgba(242,179,61,.45);
  background: rgba(242,179,61,.08);
  box-shadow: inset 3px 0 0 var(--amber);
}
.case-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.case-id { font: 800 11px ui-monospace, Consolas, monospace; color: var(--amber); }
.case-risk { font: 800 15px ui-monospace, Consolas, monospace; }
.case-name { font-size: 11px; color: var(--text); margin: 5px 0 3px; line-height: 1.35; }
.case-meta { color: var(--mute); font: 9px ui-monospace, Consolas, monospace; }

.map-panel { display: flex; flex-direction: column; }
.map-wrap {
  flex: 1;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(4, 9, 13, 0.55);
  border: 1px solid var(--stroke-soft);
  min-height: 430px;
}
.schematic { width: 100%; height: 100%; display: block; }
.map-grid path { fill: none; stroke: rgba(255,255,255,.045); stroke-width: 1; }
.river { fill: none; stroke: var(--blue); stroke-width: 3; opacity: .5; }
.road { fill: none; stroke: var(--amber); stroke-width: 1.5; stroke-dasharray: 9 8; opacity: .5; }
.map-label { fill: var(--mute); font: 9px ui-monospace, Consolas, monospace; letter-spacing: .12em; }
.halo150 { fill: rgba(90,157,240,.06); stroke: var(--blue); stroke-width: 1.2; stroke-dasharray: 5 6; transition: stroke .2s var(--ease); }
.ring30 { fill: rgba(242,179,61,.08); stroke: var(--amber); stroke-width: 1.5; stroke-dasharray: 3 4; }
.radar-sweep { stroke: var(--blue); stroke-width: 1.2; transform-origin: 0 0; animation: sweep 2.6s linear infinite; }
@keyframes sweep { to { transform: rotate(360deg); } }
.marker { cursor: pointer; }
.marker circle { fill: #0b1218; stroke: var(--amber); stroke-width: 2; transition: .18s var(--ease); }
.marker text { fill: var(--dim); font: 700 10px ui-monospace, Consolas, monospace; pointer-events: none; }
.marker:hover circle { fill: rgba(242,179,61,.25); }
.marker.active circle { fill: var(--amber); filter: drop-shadow(0 0 7px rgba(242,179,61,.6)); }
.marker.active text { fill: var(--text); }
.marker.danger circle { stroke: var(--red); }
.marker.ok circle { stroke: var(--teal); }
.marker.info circle { stroke: var(--blue); }
.map-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; color: var(--mute); font: 9px ui-monospace, Consolas, monospace; }
.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; }
.dot.amber { background: var(--amber); } .dot.blue { background: var(--blue); } .dot.red { background: var(--red); } .dot.teal { background: var(--teal); }

.case-detail { display: flex; flex-direction: column; gap: 14px; }
.risk-hero { display: flex; justify-content: space-between; align-items: flex-start; }
.risk-number { font: 800 54px/1 ui-monospace, Consolas, monospace; color: var(--amber); }
.risk-raw { display: block; color: var(--mute); font: 9px ui-monospace, Consolas, monospace; margin-top: 5px; }
.badge { border-radius: 999px; padding: 6px 9px; font: 8px ui-monospace, Consolas, monospace; letter-spacing: .08em; border: 1px solid var(--stroke); color: var(--dim); text-align: right; max-width: 140px; }
.badge.danger { color: #ffb5ac; border-color: rgba(239,91,76,.4); }
.badge.ok { color: #a9f2dd; border-color: rgba(55,201,166,.4); }
.badge.warn { color: #ffd88f; border-color: rgba(242,179,61,.4); }
.badge.info { color: #bcd8ff; border-color: rgba(90,157,240,.4); }
.detail-row { display: flex; justify-content: space-between; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--stroke-soft); font-size: 11px; }
.detail-row span { color: var(--mute); }
.detail-row strong { text-align: right; }
.factor-stack { display: grid; gap: 8px; }
.factor-row { display: grid; grid-template-columns: 88px 1fr 34px; gap: 8px; align-items: center; font: 9px ui-monospace, Consolas, monospace; color: var(--dim); }
.factor-row i { display: block; height: 5px; border-radius: 999px; background: rgba(255,255,255,.07); overflow: hidden; }
.factor-row i b { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--amber), #ffd27a); transition: width .3s var(--ease); }
.factor-row span:last-child { color: var(--text); text-align: right; }
.timeline { display: grid; grid-template-columns: repeat(14, 1fr); gap: 3px; }
.tick { height: 32px; border-radius: 5px; border: 1px solid var(--stroke-soft); background: rgba(0,0,0,.25); display: grid; place-items: center; font: 8px ui-monospace, Consolas, monospace; color: var(--mute); }
.tick.clean { background: rgba(55,201,166,.14); border-color: rgba(55,201,166,.45); color: #a9f2dd; }
.tick.failed { background: rgba(239,91,76,.18); border-color: rgba(239,91,76,.55); color: #ffb5ac; animation: stamp .3s var(--ease); }
.tick.pending { border-style: dashed; }
@keyframes stamp { from { transform: scale(1.12); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.spill { border-radius: 10px; padding: 9px 10px; font: 9px ui-monospace, Consolas, monospace; letter-spacing: .08em; color: #ffb5ac; background: rgba(239,91,76,.1); border: 1px solid rgba(239,91,76,.4); }
.ledger-bar { display: flex; height: 9px; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,.06); }
.ledger-bar i { display: block; height: 100%; }
.ledger-bar .clear { width: 40%; background: var(--teal); }
.ledger-bar .hold { width: 60%; background: var(--amber); transition: background .25s var(--ease); }
.ledger-bar .hold.released { background: var(--teal); }
.ledger-bar .hold.withheld { background: var(--red); }
.ledger-amounts { display: flex; justify-content: space-between; margin-top: 7px; font: 9px ui-monospace, Consolas, monospace; color: var(--dim); }
.ledger-amounts em { font-style: normal; color: var(--amber); text-align: right; }
.ledger-amounts em.released { color: var(--teal); }
.ledger-amounts em.withheld { color: var(--red); text-decoration: line-through; }
.cause-list { display: grid; gap: 7px; }
.cause { border-left: 2px solid var(--amber); padding: 7px 9px; background: rgba(255,255,255,.025); border-radius: 0 8px 8px 0; }
.cause strong { display: block; font-size: 10px; }
.cause span { display: block; color: var(--mute); font-size: 9px; margin-top: 3px; line-height: 1.4; }

.lower { display: grid; grid-template-columns: 1.05fr 1fr .8fr; gap: 16px; margin-top: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.field label { display: block; color: var(--mute); font: 9px ui-monospace, Consolas, monospace; letter-spacing: .1em; margin-bottom: 5px; }
.field input { width: 100%; border-radius: 10px; border: 1px solid var(--stroke-soft); background: rgba(0,0,0,.28); color: var(--text); padding: 10px; font: 11px ui-monospace, Consolas, monospace; outline: none; }
.field input:focus { border-color: var(--amber); }
.btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
.cluster-out, .verdict-out { border-radius: 10px; padding: 10px; background: rgba(0,0,0,.25); border: 1px solid var(--stroke-soft); font: 10px/1.55 ui-monospace, Consolas, monospace; color: var(--dim); min-height: 42px; margin-top: 10px; }
.cluster-out strong { color: var(--text); }
.cluster-out .ok, .verdict-out .ok { color: var(--teal); }
.cluster-out .warn, .verdict-out .warn { color: var(--red); }
.vision-list { display: grid; gap: 7px; margin-top: 12px; }
.vision-row { display: grid; grid-template-columns: 92px 1fr 34px; gap: 8px; align-items: center; font: 9px ui-monospace, Consolas, monospace; color: var(--dim); }
.vision-row i { height: 5px; border-radius: 999px; background: rgba(255,255,255,.07); overflow: hidden; }
.vision-row i b { display: block; height: 100%; background: linear-gradient(90deg, var(--blue), var(--purple)); }
.vision-row span:last-child { text-align: right; color: var(--text); }
.vision-meta { color: var(--amber); font: 9px ui-monospace, Consolas, monospace; letter-spacing: .08em; margin-top: 8px; }
.audit-list { display: grid; gap: 6px; max-height: 240px; overflow-y: auto; padding-right: 4px; }
.audit-item { padding: 8px 9px; border-radius: 9px; background: rgba(255,255,255,.025); border: 1px solid var(--stroke-soft); }
.audit-item strong { display: block; font: 9px ui-monospace, Consolas, monospace; color: var(--amber); letter-spacing: .08em; }
.audit-item span { display: block; color: var(--dim); font-size: 10px; margin-top: 3px; }
.audit-time { color: var(--mute); font: 8px ui-monospace, Consolas, monospace; }

.briefing-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(3, 7, 10, .72);
  backdrop-filter: blur(6px);
  display: grid; place-items: center;
  padding: 24px;
}
.briefing { border-radius: 20px; max-width: 760px; width: 100%; padding: 26px; background: var(--glass-strong); }
.briefing h2 { margin: 0 0 8px; font-size: 26px; }
.briefing p { color: var(--dim); }
.briefing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
.briefing-grid article { border-radius: 12px; padding: 14px; background: rgba(255,255,255,.03); border: 1px solid var(--stroke-soft); }
.briefing-grid h3 { margin: 0 0 6px; font-size: 13px; }
.briefing-grid p { margin: 0; font-size: 11px; }

@media (max-width: 1300px) {
  .workspace { grid-template-columns: 240px minmax(380px, 1fr); }
  .case-detail-panel { grid-column: 1 / -1; }
  .lower { grid-template-columns: 1fr 1fr; }
  .audit-panel { grid-column: 1 / -1; }
}

@media (max-width: 960px) {
  .topbar { flex-wrap: wrap; }
  .topnav { order: 3; width: 100%; overflow-x: auto; }
  .stats { grid-template-columns: 1fr 1fr; }
  .workspace, .lower { grid-template-columns: 1fr; }
  .case-detail-panel, .audit-panel { grid-column: auto; }
  .case-list { max-height: 260px; }
  .briefing-grid { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .app { padding: 0 10px 28px; }
  .stats { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .risk-number { font-size: 42px; }
  .top-actions { width: 100%; justify-content: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}

/* Readability pass - slightly larger type across the console */
body { font-size: 16px; }

.stat-label,
.panel-head small,
.case-meta,
.vision-meta,
.audit-time,
.engine-pill,
.brand-copy span,
.risk-raw,
.ledger-amounts,
.audit-time { font-size: 10px; }

.panel-head h2,
.brand-copy strong,
.navbtn,
.btn,
.toggle,
.filter-chip,
.badge,
.spill,
.cluster-out,
.verdict-out,
.audit-item span,
.search,
.field input { font-size: 11px; }

.case-name,
.detail-row,
.stat-sub,
.briefing-grid p,
.audit-item span { font-size: 12px; }

.cause strong,
.vision-row,
.factor-row,
.cause span { font-size: 10px; }

.tick { font-size: 9px; }
.risk-number { font-size: 58px; }
.stat-value { font-size: 32px; }
.map-label { font-size: 10px; }

/* Multi-page navigation and focused views */
.navbtn { text-decoration: none; display: inline-block; white-space: nowrap; }
.view-cases .lower,
.view-map .lower { display: none; }
.view-simulator .workspace,
.view-vision .workspace { display: none; }
.view-vision .stats { display: none; }
.view-simulator .stats { grid-template-columns: repeat(2, 1fr); }
.view-cases .map-panel { display: none; }
.view-cases .workspace { grid-template-columns: 300px minmax(360px, 1fr); }
.view-map .case-list { max-height: 620px; }
.view-map .map-panel { min-height: 640px; }

.impact-hero { border-radius: 18px; padding: 34px; margin-bottom: 16px; }
.impact-hero h1 { font-size: clamp(26px, 3.4vw, 44px); line-height: 1.15; margin: 14px 0 12px; max-width: 22ch; }
.impact-hero p { color: var(--dim); max-width: 78ch; font-size: 14px; }
.impact-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.impact-stat { border-radius: 16px; padding: 22px; }
.impact-stat strong { display: block; font: 800 38px ui-monospace, Consolas, monospace; }
.impact-stat span { display: block; color: var(--dim); font: 10px ui-monospace, Consolas, monospace; letter-spacing: .1em; margin-top: 10px; }
.impact-stat.amber strong { color: var(--amber); }
.impact-stat.teal strong { color: var(--teal); }
.impact-stat.blue strong { color: var(--blue); }
.impact-stat.red strong { color: var(--red); }
.impact-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.impact-cards article { border-radius: 12px; padding: 16px; background: rgba(255,255,255,.03); border: 1px solid var(--stroke-soft); }
.impact-cards article > span { color: var(--amber); font: 9px ui-monospace, Consolas, monospace; letter-spacing: .12em; }
.impact-cards h3 { margin: 9px 0 6px; font-size: 15px; }
.impact-cards p { margin: 0; color: var(--dim); font-size: 12px; }
.impact-formula { font: 700 18px ui-monospace, Consolas, monospace; color: var(--text); margin: 14px 0; }
.impact-formula sub { color: var(--amber); }

@media (max-width: 1000px) {
  .impact-grid { grid-template-columns: repeat(2, 1fr); }
  .impact-cards { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .impact-grid { grid-template-columns: 1fr; }
  .view-cases .workspace { grid-template-columns: 1fr; }
}

/* Innovation Lab */
.spot { outline: 2px solid var(--amber) !important; box-shadow: 0 0 0 6px rgba(242,179,61,.12) !important; }
.lab-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 34px; margin-bottom: 16px; }
.lab-hero-copy { position: relative; z-index: 2; }
.lab-hero h1 { font-size: clamp(28px, 4vw, 48px); margin: 12px 0 8px; }
.lab-hero p { color: var(--dim); max-width: 76ch; margin: 0 0 18px; }
.rain-layer {
  position: absolute; inset: -40px;
  background: repeating-linear-gradient(105deg, transparent 0 18px, rgba(90,157,240,.18) 19px 20px);
  opacity: .12;
  transition: opacity .3s var(--ease);
  animation: rainfall 1.1s linear infinite;
  pointer-events: none;
}
.lab-hero.is-monsoon .rain-layer { opacity: .75; }
@keyframes rainfall { to { transform: translateY(20px); } }
.lab-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.lab-card { border-radius: 18px; }
.lab-note { color: var(--dim); font-size: 11px; margin: 0 0 14px; }
.lever { margin-bottom: 14px; }
.lever-head { display: flex; justify-content: space-between; font: 10px ui-monospace, Consolas, monospace; color: var(--dim); margin-bottom: 6px; }
.lever-head strong { color: var(--amber); }
.lever input[type="range"] { width: 100%; accent-color: var(--amber); }
.score-compare { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 12px; background: rgba(0,0,0,.25); border: 1px solid var(--stroke-soft); margin: 12px 0; }
.score-compare div { display: grid; gap: 4px; }
.score-compare span { font: 9px ui-monospace, Consolas, monospace; color: var(--mute); }
.score-compare strong { font: 800 30px ui-monospace, Consolas, monospace; }
.score-compare .projected strong { color: var(--teal); }
.score-compare .arrow { color: var(--mute); font-size: 20px; }
.score-compare .delta { margin-left: auto; color: var(--teal); font: 800 18px ui-monospace, Consolas, monospace; }
.photo-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.photo-pair > div { border-radius: 10px; overflow: hidden; background: rgba(0,0,0,.3); border: 1px solid var(--stroke-soft); }
.photo-pair span { display: block; padding: 6px 8px; font: 9px ui-monospace, Consolas, monospace; color: var(--mute); }
.photo-pair img { display: block; width: 100%; height: auto; }
.audit-result { border-radius: 10px; padding: 10px 12px; margin-top: 10px; border: 1px solid var(--stroke-soft); background: rgba(255,255,255,.03); }
.audit-result strong { display: block; font: 800 11px ui-monospace, Consolas, monospace; }
.audit-result span { display: block; color: var(--dim); font-size: 10px; margin-top: 4px; }
.audit-result.ok { border-color: rgba(55,201,166,.4); color: var(--teal); }
.audit-result.warn { border-color: rgba(239,91,76,.4); color: var(--red); }
.hash-list { display: grid; gap: 4px; margin-top: 12px; max-height: 160px; overflow-y: auto; }
.hash-list > div { display: flex; justify-content: space-between; gap: 10px; font: 9px ui-monospace, Consolas, monospace; padding: 6px 8px; border-radius: 7px; background: rgba(255,255,255,.025); }
.hash-list span { color: var(--dim); }
.hash-list code { color: var(--amber); }
.roi-out { border-radius: 12px; padding: 16px; background: rgba(55,201,166,.08); border: 1px solid rgba(55,201,166,.3); }
.roi-out strong { display: block; font: 800 32px ui-monospace, Consolas, monospace; color: var(--teal); }
.roi-out span { color: var(--dim); font-size: 11px; }
.role-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.role-title { font-size: 20px; margin: 0 0 4px; }
.role-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 7px; }
.role-list li { padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,.03); border-left: 2px solid var(--amber); font-size: 11px; color: var(--dim); }
.chat-mock { display: grid; grid-template-columns: 92px 1fr; gap: 12px; margin-bottom: 12px; }
.qr-mock { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; padding: 8px; background: #f4ecd8; border-radius: 8px; }
.qr-mock i { aspect-ratio: 1; background: transparent; }
.qr-mock i.on { background: #101820; }
.chat-bubbles { display: grid; gap: 6px; align-content: start; }
.bubble { padding: 8px 10px; border-radius: 10px; font-size: 10px; }
.bubble.in { background: rgba(255,255,255,.06); color: var(--dim); }
.bubble.out { background: rgba(55,201,166,.14); color: #a9f2dd; justify-self: end; }
.lab-dossier { border-radius: 18px; margin-top: 16px; padding: 22px; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.lab-dossier h2 { margin: 6px 0 4px; font-size: 22px; }

@media (max-width: 1100px) {
  .lab-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .lab-dossier { flex-direction: column; align-items: flex-start; }
  .chat-mock { grid-template-columns: 1fr; }
}

/* Dispatch route overlay */
.dispatch path { fill: none; stroke: var(--red); stroke-width: 2; stroke-dasharray: 6 5; animation: routeflow .8s linear infinite; }
.dispatch circle { fill: var(--amber); }
.dispatch text { fill: var(--red); font: 700 9px ui-monospace, Consolas, monospace; letter-spacing: .08em; }
@keyframes routeflow { to { stroke-dashoffset: -11; } }

/* Real map (Leaflet + OpenStreetMap) */
.real-map { width: 100%; height: 100%; min-height: 430px; background: #0b1218; }
.leaflet-container { background: #0b1218; font-family: ui-monospace, Consolas, monospace; }
.leaflet-tile-pane { filter: grayscale(.72) brightness(.72) contrast(1.18) hue-rotate(175deg); }
.leaflet-control-zoom a { background: rgba(18,28,36,.9) !important; color: var(--text) !important; border-color: var(--stroke) !important; }
.leaflet-control-zoom a:hover { background: rgba(242,179,61,.18) !important; color: var(--amber) !important; }
.leaflet-control-attribution { background: rgba(8,13,18,.78) !important; color: var(--mute) !important; font-size: 8px !important; }
.leaflet-control-attribution a { color: var(--amber) !important; }
.kl-map-tooltip {
  background: rgba(11,18,24,.92) !important;
  border: 1px solid var(--stroke) !important;
  color: var(--text) !important;
  font: 700 10px ui-monospace, Consolas, monospace !important;
  letter-spacing: .08em;
  box-shadow: 4px 4px 12px rgba(0,0,0,.45) !important;
}
.kl-map-tooltip::before { border-top-color: var(--stroke) !important; }

/* Human loop */
.human-hero { border-radius: 18px; padding: 28px 32px; margin: 16px 0; }
.human-hero h1 { font-size: clamp(26px, 3.4vw, 42px); margin: 10px 0 8px; }
.human-hero p { color: var(--dim); max-width: 78ch; }
.human-tabs { margin-bottom: 16px; }
.human-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr); gap: 16px; }
.human-work, .human-context { border-radius: 18px; }
.human-context { align-self: start; }
.upload { display: block; border: 1px dashed var(--stroke); border-radius: 10px; padding: 12px; margin: 10px 0; color: var(--dim); font: 10px ui-monospace, Consolas, monospace; letter-spacing: .08em; cursor: pointer; }
.upload input { display: none; }
.human-photo { width: 100%; max-height: 190px; object-fit: cover; border-radius: 10px; border: 1px solid var(--stroke-soft); }
.human-rule { color: var(--amber); font: 10px ui-monospace, Consolas, monospace; letter-spacing: .06em; margin-top: 12px; }
.human-cases { max-height: 260px; }
.human-audit { margin-top: 14px; }
.human-audit code { color: var(--dim); }

@media (max-width: 980px) {
  .human-grid { grid-template-columns: 1fr; }
}

/* Simplification pass */
body { padding-bottom: 34px; }
.global-footnote {
  position: fixed;
  left: 50%; bottom: 8px;
  transform: translateX(-50%);
  z-index: 60;
  max-width: calc(100vw - 20px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  background: rgba(11,18,24,.88);
  border: 1px solid var(--stroke);
  border-radius: 999px;
  padding: 6px 12px;
  color: var(--mute);
  font: 9px ui-monospace, Consolas, monospace;
  letter-spacing: .06em;
  backdrop-filter: blur(8px);
}
.view-console .workspace { grid-template-columns: minmax(420px, 1fr) 340px; }
.view-console .workspace > .panel:first-child { display: none; }
.view-console.register-open .workspace { grid-template-columns: 270px minmax(420px, 1fr) 340px; }
.view-console.register-open .workspace > .panel:first-child { display: block; }
.lab-groups { margin-bottom: 12px; }
.lab-grid.show-model .lab-card:not(:nth-child(1)):not(:nth-child(5)),
.lab-grid.show-evidence .lab-card:not(:nth-child(2)):not(:nth-child(3)),
.lab-grid.show-business .lab-card:not(:nth-child(4)):not(:nth-child(6)) { display: none; }

@media (max-width: 640px) {
  .global-footnote { font-size: 8px; }
}

@media (max-width: 960px) {
  html, body { overflow-x: hidden; }
  .view-console .workspace,
  .view-console.register-open .workspace { grid-template-columns: 1fr; }
  .view-console .case-detail-panel { grid-column: auto; }
  .view-console .workspace > .panel:first-child { display: block; }
  .map-wrap, .real-map { min-height: 360px; }
}

@media (max-width: 560px) {
  .app { padding: 0 8px 28px; }
  .topbar { top: 6px; margin: 6px 0 12px; padding: 10px 12px; gap: 10px; }
  .brand { min-width: 0; }
  .brand-mark { width: 34px; height: 34px; }
  .brand-copy strong { font-size: 11px; }
  .brand-copy span { font-size: 8px; }
  .navbtn { padding: 8px 9px; font-size: 9px; }
  .engine-pill { display: none; }
  .toggle { padding: 7px 9px; font-size: 9px; }
  .btn { padding: 9px 10px; font-size: 9px; }
  .stats { grid-template-columns: 1fr 1fr; gap: 8px; }
  .stat { padding: 12px; }
  .stat-value { font-size: 24px; }
  .panel { padding: 12px; }
  .panel-head { flex-wrap: wrap; }
  .risk-number { font-size: 38px; }
  .tick { height: 28px; font-size: 7px; }
  .timeline { gap: 2px; }
  .ledger-amounts { flex-direction: column; gap: 6px; }
  .ledger-amounts em { text-align: left; }
  .photo-pair, .form-row { grid-template-columns: 1fr; }
  .filter-chip { padding: 5px 7px; font-size: 9px; }
  .role-tabs { gap: 4px; }
  .lab-hero, .human-hero, .impact-hero { padding: 20px; }
  .lab-dossier { padding: 16px; }
  .human-photo { max-height: 150px; }
  .score-compare { gap: 8px; padding: 10px; }
  .score-compare strong { font-size: 22px; }
  .global-footnote { font-size: 7px; padding: 4px 8px; }
}
@media (max-width: 380px) {
  .stats { grid-template-columns: 1fr; }
  .brand-copy span { display: none; }
}

```
### app/api/engine/route.ts
```tsx
import { NextResponse } from 'next/server';
import {
  computeRisk,
  createSeedState,
  haversineMeters,
  normalizeVerdict,
  simulateVision
} from '@/lib/engine';

export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  switch (body.op) {
    case 'ping':
      return NextResponse.json({ ok: true, service: 'kachralab-engine', at: Date.now() });

    case 'risk':
      return NextResponse.json(computeRisk(body.factors, body.rain ?? 1));

    case 'cluster': {
      const point = { lat: Number(body.lat), lng: Number(body.lng) };
      const hotspots = Array.isArray(body.hotspots) ? body.hotspots : createSeedState().hotspots;
      let matchedId: string | null = null;
      let distance = Infinity;
      hotspots.forEach((h: any) => {
        const d = haversineMeters(point, { lat: Number(h.lat), lng: Number(h.lng) });
        if (d < distance) {
          distance = d;
          matchedId = h.id;
        }
      });
      const matched = distance <= 30 ? matchedId : null;
      return NextResponse.json({
        distanceMeters: Number(distance.toFixed(1)),
        matchedId: matched,
        action: matched ? 'MERGE' : 'NEW_NODE',
        thresholdMeters: 30
      });
    }

    case 'verdict':
      return NextResponse.json(normalizeVerdict(body.mode, body.hotspot));

    case 'vision':
      return NextResponse.json(simulateVision());

    default:
      return NextResponse.json({ error: 'Unknown operation' }, { status: 400 });
  }
}

```
### app/cases/page.tsx
```tsx
import Console from '@/components/Console';

export const metadata = { title: 'Cases | KachraLab' };

export default function CasesPage() {
  return <Console view="cases" />;
}

```
### app/human/page.tsx
```tsx
import HumanLoop from '@/components/HumanLoop';

export const metadata = { title: 'Human Loop | KachraLab' };

export default function HumanPage() {
  return <HumanLoop />;
}

```
### app/impact/page.tsx
```tsx
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
          <Link href="/human" className="navbtn">FIELD</Link>
          <Link href="/lab" className="navbtn">PROOF</Link>
          <Link href="/impact" className="navbtn active">IMPACT</Link>
          <Link href="/?demo=1" className="navbtn">RUN DEMO</Link>
        </nav>
      </header>

      <section className="panel glass impact-hero">
        <span className="stat-label">BUYERS NEED PROOF Â· OPERATORS NEED NEXT ACTIONS</span>
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
          <strong>â‚¹1.4L</strong>
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
          Risk = ( 0.35Â·Recurrence + 0.25Â·Hazard + 0.25Â·Proximity + 0.15Â·Duration ) Ã— M<sub>rain</sub>
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

```
### app/lab/page.tsx
```tsx
import Lab from '@/components/Lab';

export const metadata = { title: 'Innovation Lab | KachraLab' };

export default function LabPage() {
  return <Lab />;
}

```
### app/map/page.tsx
```tsx
import Console from '@/components/Console';

export const metadata = { title: 'Map | KachraLab' };

export default function MapPage() {
  return <Console view="map" />;
}

```
### app/simulator/page.tsx
```tsx
import Console from '@/components/Console';

export const metadata = { title: 'Simulator | KachraLab' };

export default function SimulatorPage() {
  return <Console view="simulator" />;
}

```
### app/vision/page.tsx
```tsx
import Console from '@/components/Console';

export const metadata = { title: 'Vision | KachraLab' };

export default function VisionPage() {
  return <Console view="vision" />;
}

```
### lib/engine.ts
```tsx
export type FactorKey = 'recurrence' | 'hazard' | 'proximity' | 'duration';
export type Factors = Record<FactorKey, number>;
export type CheckpointState = 'clean' | 'failed' | 'pending';
export type HotspotStatus =
  | 'UNDER_MONITORING'
  | 'CRITICAL_P1'
  | 'VERIFIED_CLEAN'
  | 'IN_INTERVENTION'
  | 'RECURRING'
  | 'NEW';
export type EscrowState = 'HELD' | 'RELEASED' | 'WITHHELD';

export interface Contract {
  total: number;
  escrow: EscrowState;
  heldAmount: number;
}

export interface Monitor {
  currentDay: number;
  checkpoints: CheckpointState[];
  spillover: boolean;
}

export interface Hotspot {
  id: string;
  name: string;
  ward: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  wasteType: string;
  reports30d: number;
  factors: Factors;
  status: HotspotStatus;
  monitor: Monitor;
  contract: Contract;
}

export interface RiskResult {
  parts: Factors;
  raw: number;
  capped: number;
  capApplied: boolean;
  rainMultiplier: number;
}

export interface ClusterResult {
  distanceMeters: number;
  matchedId: string | null;
  action: 'MERGE' | 'NEW_NODE';
  thresholdMeters: number;
}

export interface VisionResult {
  source: string;
  fractions: { label: string; value: number }[];
  massKg: number;
  severity: string;
  dispatch: string;
}

export interface Verdict {
  mode: 'RECURRENCE' | 'SUCCESS' | 'RESET';
  checkpoints: CheckpointState[];
  spillover: boolean;
  status: HotspotStatus;
  escrow: EscrowState;
  heldAmount: number;
  message: string;
}

export interface Report {
  lat: number;
  lng: number;
  matchedId: string | null;
  at: number;
}

export interface AuditEntry {
  id: number;
  at: number;
  action: string;
  detail: string;
}

export interface AppState {
  rain: boolean;
  selectedId: string;
  hotspots: Hotspot[];
  reports: Report[];
  vision: VisionResult | null;
  cluster: ClusterResult | null;
  lastVerdict: Verdict | null;
  audit: AuditEntry[];
}

export const RAIN = { dry: 1, monsoon: 1.35 } as const;
export const PRESET = { lat: 28.5702, lng: 77.2432 } as const;

const EARTH_RADIUS_M = 6371000;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const p1 = toRad(a.lat);
  const p2 = toRad(b.lat);
  const dp = toRad(b.lat - a.lat);
  const dl = toRad(b.lng - a.lng);
  const h =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function makeCheckpoints(done: number): CheckpointState[] {
  return Array.from({ length: 14 }, (_, i) => (i < done ? 'clean' : 'pending'));
}

export function computeRisk(factors: Factors, rainMultiplier = 1): RiskResult {
  const m = Number.isFinite(rainMultiplier) ? rainMultiplier : 1;
  const parts: Factors = {
    recurrence: (Number(factors.recurrence) || 0) * 0.35,
    hazard: (Number(factors.hazard) || 0) * 0.25,
    proximity: (Number(factors.proximity) || 0) * 0.25,
    duration: (Number(factors.duration) || 0) * 0.15
  };
  const raw =
    (parts.recurrence + parts.hazard + parts.proximity + parts.duration) * m;
  return {
    parts,
    raw: Number(raw.toFixed(2)),
    capped: Math.min(100, Math.round(raw)),
    capApplied: raw > 100,
    rainMultiplier: m
  };
}

export function simulateVision(): VisionResult {
  return {
    source: 'RULE-BASED SIMULATION',
    fractions: [
      { label: 'LDPE polybags', value: 64 },
      { label: 'PET bottles', value: 24 },
      { label: 'Organic sludge', value: 12 }
    ],
    massKg: 310,
    severity: 'HIGH',
    dispatch: 'PRIORITY 1 - DISPATCH SQUAD'
  };
}

export function normalizeVerdict(
  mode: 'recurrence' | 'success' | 'reset',
  hotspot: Hotspot
): Verdict {
  const day = hotspot.monitor?.currentDay || 4;
  const checkpoints = makeCheckpoints(day);

  if (mode === 'recurrence') {
    checkpoints[4] = 'failed';
    return {
      mode: 'RECURRENCE',
      checkpoints,
      spillover: true,
      status: 'RECURRING',
      escrow: 'WITHHELD',
      heldAmount: 7200,
      message: 'Day 5 dumping detected. Secondary pile flagged inside the 150 m halo.'
    };
  }

  if (mode === 'success') {
    for (let i = 0; i < 14; i += 1) checkpoints[i] = 'clean';
    return {
      mode: 'SUCCESS',
      checkpoints,
      spillover: false,
      status: 'VERIFIED_CLEAN',
      escrow: 'RELEASED',
      heldAmount: 0,
      message: '14 consecutive clean days verified. Escrow released to contractor.'
    };
  }

  return {
    mode: 'RESET',
    checkpoints,
    spillover: false,
    status: hotspot.status || 'UNDER_MONITORING',
    escrow: 'HELD',
    heldAmount: 7200,
    message: 'Monitoring window restored to seed state.'
  };
}

export function diagnose(hotspot: Hotspot): { title: string; evidence: string }[] {
  const t = (hotspot.wasteType || '').toLowerCase();
  if (t.includes('organic')) {
    return [
      { title: 'Morning wholesale timing mismatch', evidence: '12 reports cluster between 06:00 and 09:00; collection beat arrives after stalls close.' },
      { title: 'Containerization deficit', evidence: 'No covered bulk bin inside the market ring; vegetable slurry enters storm drains.' },
      { title: 'Night-time plastic dumping', evidence: 'LDPE fraction dominates the simulated vision pass at 64%.' }
    ];
  }
  if (t.includes('construction')) {
    return [
      { title: 'Midnight renovation dumping', evidence: 'C&D debris appears on a hospital corridor with no permit trail.' },
      { title: 'Missing material recovery point', evidence: 'No aggregate holding bay within 150 m of the junction.' },
      { title: 'Contractor route leakage', evidence: 'Debris type matches nearby demolition waste streams.' }
    ];
  }
  if (t.includes('industrial')) {
    return [
      { title: 'Industrial night dumping', evidence: 'Packaging and silt fractions peak between 23:00 and 04:00.' },
      { title: 'Drain silt overflow', evidence: 'Monsoon multiplier raises leachate transmission into the stormwater line.' },
      { title: 'Unsegregated contractor haul', evidence: 'Industrial packaging appears without a manifest trail.' }
    ];
  }
  if (t.includes('food')) {
    return [
      { title: 'Bin capacity deficit', evidence: 'Food stalls outnumber collection points on the outer circle.' },
      { title: 'Peak-hour sweep gap', evidence: 'Cups and packaging accumulate before the evening round.' },
      { title: 'Informal disposal', evidence: 'Single-use packaging is visible in the adjacent drain.' }
    ];
  }
  return [
    { title: 'Seasonal leaf-litter accumulation', evidence: 'Dry leaves dominate the mixed municipal fraction in this ward.' },
    { title: 'Missed sweep window', evidence: 'Reports rise after the second weekly collection slot.' },
    { title: 'Low-severity but persistent site', evidence: 'Risk stays low at 18, yet recurrence history keeps the case open.' }
  ];
}

export function statusLabel(status: HotspotStatus): string {
  const map: Record<HotspotStatus, string> = {
    UNDER_MONITORING: 'RECURRING / 14-DAY WATCH',
    CRITICAL_P1: 'CRITICAL P1',
    VERIFIED_CLEAN: 'VERIFIED CLEAN',
    IN_INTERVENTION: 'IN INTERVENTION',
    RECURRING: 'RECURRING',
    NEW: 'NEW HOTSPOT'
  };
  return map[status] || status;
}

export function statusTone(status: HotspotStatus): string {
  if (status === 'CRITICAL_P1' || status === 'RECURRING') return 'danger';
  if (status === 'VERIFIED_CLEAN') return 'ok';
  if (status === 'NEW') return 'info';
  return 'warn';
}

export function createSeedState(): AppState {
  const hotspot = (
    id: string,
    name: string,
    ward: string,
    lat: number,
    lng: number,
    mapX: number,
    mapY: number,
    wasteType: string,
    reports30d: number,
    factors: Factors,
    status: HotspotStatus,
    currentDay: number
  ): Hotspot => ({
    id,
    name,
    ward,
    lat,
    lng,
    mapX,
    mapY,
    wasteType,
    reports30d,
    factors,
    status,
    monitor: { currentDay, checkpoints: makeCheckpoints(currentDay), spillover: false },
    contract: {
      total: 12000,
      escrow: status === 'VERIFIED_CLEAN' ? 'RELEASED' : 'HELD',
      heldAmount: status === 'VERIFIED_CLEAN' ? 0 : 7200
    }
  });

  return {
    rain: false,
    selectedId: 'GZ-042',
    hotspots: [
      hotspot('GZ-042', 'Lajpat Nagar Central Market Ring Road', 'Ward 58 Â· South Delhi', 28.5703276, 77.2432, 420, 330, 'Organic + Single-Use Plastic', 12, { recurrence: 96, hazard: 85, proximity: 70, duration: 62 }, 'UNDER_MONITORING', 4),
      hotspot('GZ-018', 'Karol Bagh Pusa Road Junction', 'Ward 42 Â· Central Delhi', 28.6348, 77.188, 300, 215, 'Construction & Demolition (C&D)', 7, { recurrence: 80, hazard: 94, proximity: 100, duration: 76 }, 'CRITICAL_P1', 0),
      hotspot('GZ-031', 'Saket Press Enclave Community Center', 'Ward 71 Â· South Delhi', 28.5245, 77.207, 510, 420, 'Mixed Municipal & Dry Leaves', 4, { recurrence: 20, hazard: 15, proximity: 24, duration: 10 }, 'VERIFIED_CLEAN', 14),
      hotspot('GZ-009', 'Connaught Place Outer Circle Block B', 'Ward 19 Â· New Delhi', 28.6315, 77.2167, 370, 275, 'Food Packaging & Cups', 5, { recurrence: 65, hazard: 70, proximity: 55, duration: 66 }, 'IN_INTERVENTION', 2),
      hotspot('GZ-055', 'Okhla Phase III / Govindpuri Crossing', 'Ward 83 Â· South-East Delhi', 28.539, 77.279, 625, 470, 'Industrial Packaging & Silt', 8, { recurrence: 88, hazard: 72, proximity: 62, duration: 65 }, 'RECURRING', 1)
    ],
    reports: [],
    vision: null,
    cluster: null,
    lastVerdict: null,
    audit: [
      { id: 1, at: Date.now(), action: 'SYSTEM', detail: 'Seed ledger loaded. 5 hotspot cases active.' }
    ]
  };
}

export function createHotspotFromReport(
  id: string,
  lat: number,
  lng: number,
  vision: VisionResult
): Hotspot {
  return {
    id,
    name: `New Hotspot ${id}`,
    ward: 'Unassigned ward Â· field report',
    lat,
    lng,
    mapX: 120 + ((lng - 77.15) / 0.16) * 560,
    mapY: 480 - ((lat - 28.5) / 0.16) * 420,
    wasteType: vision.fractions[0]?.label || 'Mixed waste',
    reports30d: 1,
    factors: { recurrence: 30, hazard: 70, proximity: 40, duration: 10 },
    status: 'NEW',
    monitor: { currentDay: 0, checkpoints: makeCheckpoints(0), spillover: false },
    contract: { total: 12000, escrow: 'HELD', heldAmount: 7200 }
  };
}

```
