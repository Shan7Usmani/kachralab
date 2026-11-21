# 🏛️ KACHRALAB &mdash; Municipal Waste Intervention Intelligence Platform

> **"Don't just clean the hotspot. Learn how to stop it from returning."**

* **Product:** KACHRALAB
* **Platform:** Independent Municipal Waste Intervention Intelligence
* **Coverage Area:** Delhi NCR (Illustrative Demonstration Grid)
* **Tech Stack:** HTML5, CSS3 (Modern Dark Command Center System), Vanilla JavaScript (ES6+), LocalStorage, Inline SVG.
* **Dependencies:** None. Zero external frameworks, CDNs, databases, or cloud APIs. Runs 100% offline directly in Google Chrome.

---

## 🌟 Product Overview

Traditional municipal waste management relies on **reactive, complaint-driven clearance**. A citizen complains, a sanitation truck is dispatched, the garbage is cleared, and within 3 to 5 days, **the hotspot refills**. This creates a cycle where contractors are repeatedly compensated for surface cleanups while the underlying root cause persists unaddressed.

**KachraLab** transforms municipal sanitation into an **outcome-linked intervention intelligence platform** through five core capabilities:

1. **Haversine 30-Metre Spatial Memory:** Clusters citizen reports within a 30-metre geodesic radius into persistent geographic hotspots rather than treating each complaint as an isolated one-off ticket.
2. **Explainable Risk Engine:** Computes risk via a multi-factor formula combining recurrence frequency, waste toxicity/hazard, environmental vulnerability, persistence duration, and a meteorological monsoon multiplier ($M_{\text{rain}}$).
3. **Root Cause Diagnostics:** Generates rule-based, explainable systemic hypotheses (e.g., morning vegetable wholesale timing mismatches, containerization deficits, midnight renovation dumping) to guide field inspectors.
4. **14-Day Verification Protocol:** Replaces the illusion of "clean today" with a mandatory 14-day outcome monitoring window, complete with a **150-metre spillover displacement radar** to prevent waste from merely being swept into adjacent alleys.
5. **Outcome-Linked 40/60 SLA Model:** Disburses 40% upfront upon initial Day 0 clearance and locks 60% in an escrow hold, released strictly upon 14 consecutive clean days.

---

## 🚀 Quick Start (Running the Application)

1. **Direct Browser Execution:**
   - Double-click `index.html` (or right-click $\rightarrow$ *Open with Google Chrome*).
   - Alternatively, open your browser and navigate to:
     ```
     file:///c:/Users/Asus/OneDrive/Desktop/KC%20LAB%202/index.html
     ```
2. **Offline Support:** The entire platform uses embedded SVG vector graphics, system fonts, and pure JavaScript. No internet connection or local web server is required.

---

## 📍 Delhi NCR Illustrative Demo Locations

All locations, reports, statistics, and coordinates in this application represent **illustrative demonstration data**:

| Hotspot ID | Location & Ward | Primary Waste Type | Reports (30d) | Risk Score | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GZ-042** | **Lajpat Nagar Central Market Ring Road** (Ward 58 - South Delhi) | Organic & Single-Use Plastic | **12 reports** | **82 / 100** | **Recurring** (Active 14-Day Monitoring) |
| **GZ-018** | **Karol Bagh Pusa Road Junction** (Ward 42 - Central Delhi) | Construction & Demolition (C&D) | 7 reports | **88 / 100** | **Critical P1** (Hospital corridor) |
| **GZ-031** | **Saket Press Enclave Community Center** (Ward 71 - South Delhi) | Mixed Municipal & Dry Leaves | 4 reports | **18 / 100** | **Verified Clean** (Day 14 complete) |
| **GZ-009** | **Connaught Place Outer Circle Block B** (Ward 19 - New Delhi) | Food Packaging & Cups | 5 reports | **64 / 100** | **In Intervention** (Active squad dispatch) |
| **GZ-055** | **Okhla Phase III / Govindpuri Crossing** (Ward 83 - South-East) | Industrial Packaging & Silt | 8 reports | **74 / 100** | **Recurring** (Night dumping) |

---

## 📐 Algorithmic Specifications

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

## 🎯 Interactive Demonstration Guide

### Workflow 1: 14-Day Verification & Recurrence Simulator
1. Navigate to the **"14-Day Verification & Simulator"** tab.
2. Hotspot **GZ-042 (Lajpat Nagar Central Market)** is monitored at **Day 4 of 14** ($\text{Risk} = 82/100$).
3. Click the prominent button:
   $$\mathbf{[ \text{SIMULATE RECURRENCE (DAY 5 DUMPING)} ]}$$
4. **Observe the Systemic Reaction:**
   - Day 5 node in the 14-day timeline flips to bright red **FAILED / RECURRED**.
   - 150m Spillover Displacement Radar alerts to secondary dumping in an adjacent alley.
   - Hotspot status immediately switches to **RECURRING**.
   - The 60% SLA Hold ($\text{₹}7,200$) is marked **WITHHELD / FORFEITED** in the contract ledger.
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

## 🗂️ File Structure

```
KachraLab/
├── index.html        # Clean, modern municipal command center interface
├── styles.css        # Professional dark navy & charcoal design system
├── app.js            # Core algorithms (Haversine, Risk Engine, Simulator)
└── README.md         # Product documentation and user guide
```

---

## 🛡️ Transparency Disclaimers

1. **Illustrative Demo Data:** All locations, ward names, coordinates, and operational statistics are fictional illustrative examples created to demonstrate KachraLab's capabilities.
2. **AI Vision Simulation:** The Edge-Vision module is a rule-based demonstration simulation illustrating how edge computer vision models would classify waste fractions.
3. **Schematic Map:** The vector map is an operational schematic grid designed to visualize 30m Haversine clustering and 150m perimeter displacement, not a live GIS survey.
