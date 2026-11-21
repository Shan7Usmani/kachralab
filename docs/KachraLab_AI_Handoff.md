# KachraLab - Complete AI Handoff Document

Copy this whole file into any AI. It describes the product, codebase, architecture, algorithms, UI, deployment, limitations and demo flow.

## 0. Ready-to-use instruction for another AI

"You are taking over the KachraLab hackathon project. Read this document as the complete source of truth. The project is a Next.js 16 + TypeScript app deployed at https://kachralab.vercel.app. Explain, modify, debug or extend it only according to the facts below. Treat the README and pitch deck as historical product context, not as the current build spec. Current implementation details in this document override older files."

## 1. Product in one paragraph

KachraLab converts municipal waste cleanup from activity proof into outcome proof. A citizen report is geotagged. Reports within 30 meters of the same centroid merge into one persistent hotspot case. An explainable risk score ranks the case. Root-cause hypotheses suggest why waste keeps returning. After cleanup, a 14-day verification window monitors recurrence and a 150-meter spillover halo detects displaced dumping. The contractor receives 40% upfront, while 60% is held and released only after 14 clean days are verified.

Tagline: "Don't just clean the hotspot. Learn how to stop it from returning."

Core sentence: "A ticket ends; a case remembers."

## 2. Repository and deployment

Local root: `C:\Users\Takhi\Desktop\Desktop-Organized\Hackathon\CodeSprint`
GitHub: https://github.com/Shan7Usmani/kachralab
Live site: https://kachralab.vercel.app
Vercel project: `shan-usmani-s-projects/kachralab`
Framework: Next.js 16 App Router, TypeScript, React.
No `.env`, API keys, database or external AI account is required.

Scripts in `package.json`:
- `npm run dev` - local development
- `npm run build` - production build and TypeScript check
- `npm run start` - serve production build

Dependencies: `next`, `react`, `react-dom`, `leaflet`.
Dev dependencies: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/leaflet`.

## 3. File map

- `app/layout.tsx` - root layout, imports Leaflet CSS and global CSS, adds fixed honesty footnote.
- `app/page.tsx` - renders `<Console view="console" />`.
- `app/cases/page.tsx`, `map/page.tsx`, `simulator/page.tsx`, `vision/page.tsx` - legacy focused routes rendering Console with different `view`.
- `app/human/page.tsx` - renders `<HumanLoop />`.
- `app/lab/page.tsx` - renders `<Lab />`.
- `app/impact/page.tsx` - static impact/buyers/roadmap page.
- `app/api/engine/route.ts` - single server API route with all engine operations.
- `app/globals.css` - full design system and responsive rules.
- `components/Console.tsx` - main console UI and orchestration.
- `components/RealMap.tsx` - Leaflet + OpenStreetMap real map.
- `components/Lab.tsx` - proof engines and simulations.
- `components/HumanLoop.tsx` - citizen/inspector/contractor/commissioner workflows.
- `lib/engine.ts` - types, seed data and pure algorithms.
- `vercel.json` - forces Vercel to treat project as Next.js.
- `docs/` - generated PDF and HTML knowledge documents.

## 4. Architecture

The app is client-heavy but has a real server API. `lib/engine.ts` contains pure functions. The browser imports them directly for instant fallback. The same functions are exposed through `/api/engine` so the deployed product has a genuine backend route.

State lives in browser LocalStorage under `kachralab.next.v1`. Every page reads and writes the same key, so actions in Human Loop appear in Console after reload/navigation. The API itself is stateless; it does not persist data. Visual language: dark glass morphism panels with neumorphic controls, amber for recurrence, red for critical, teal for verified, blue for monsoon/spillover.

Navigation was simplified to five visible items: CONSOLE, FIELD, PROOF, IMPACT, RUN DEMO. Older routes remain but are hidden from primary nav.

## 5. Data model

Key types in `lib/engine.ts`:

`Factors` = `{ recurrence, hazard, proximity, duration }`, all numbers 0-100.
`HotspotStatus` = `UNDER_MONITORING | CRITICAL_P1 | VERIFIED_CLEAN | IN_INTERVENTION | RECURRING | NEW`.
`EscrowState` = `HELD | RELEASED | WITHHELD`.
`CheckpointState` = `clean | failed | pending`.

`Hotspot` fields: id, name, ward, lat, lng, mapX, mapY, wasteType, reports30d, factors, status, monitor `{currentDay, checkpoints, spillover}`, contract `{total, escrow, heldAmount}`.

`AppState` fields: rain, selectedId, hotspots, reports, vision, cluster, lastVerdict, audit.

Constants: `RAIN = { dry: 1, monsoon: 1.35 }`; `PRESET = { lat: 28.5702, lng: 77.2432 }`.

## 6. Algorithms and rules

`haversineMeters(a,b)` uses Earth radius 6,371,000 m.
Clustering/spillover rule:
- distance <= 30 m: merge into existing case, recurrence increments.
- 30 m < distance <= 150 m during watch: spillover displacement.
- distance > 150 m: create new hotspot.

`computeRisk(factors, rainMultiplier)`:
`raw = (0.35*recurrence + 0.25*hazard + 0.25*proximity + 0.15*duration) * M_rain`.
Returns `parts`, `raw`, `capped` at 100, `capApplied`, `rainMultiplier`.

`normalizeVerdict(mode, hotspot)` returns 14 checkpoints, spillover flag, status and escrow state for recurrence/success/reset. Recurrence fails Day 5, sets RECURRING and WITHHELD. Success fills all 14 clean, sets VERIFIED_CLEAN and RELEASED.

`simulateVision()` returns deterministic 64% LDPE, 24% PET, 12% sludge, ~310 kg, HIGH severity, priority dispatch.

`diagnose(hotspot)` returns three rule-based hypotheses based on waste type.

## 7. Seed data

Five seeded cases:
- GZ-042 Lajpat Nagar, 28.5703276/77.2432, factors 96/85/70/62, score 82, UNDER_MONITORING, Day 4.
- GZ-018 Karol Bagh, 28.6348/77.188, factors 80/94/100/76, score 88, CRITICAL_P1.
- GZ-031 Saket, 28.5245/77.207, factors 20/15/24/10, score 18, VERIFIED_CLEAN, Day 14.
- GZ-009 Connaught Place, 28.6315/77.2167, factors 65/70/55/66, score 64, IN_INTERVENTION.
- GZ-055 Okhla, 28.539/77.279, factors 88/72/62/65, score 74, RECURRING.

GZ-042 preset report is 14.2 m from centroid. Contract total is ₹12,000; 40% clear is ₹4,800; 60% hold is ₹7,200.

## 8. API route

`POST /api/engine` accepts `{ op, ... }`:
- `ping` -> `{ ok:true, service:'kachralab-engine', at }`
- `risk` -> `computeRisk(factors, rain)`
- `cluster` -> nearest hotspot, distance, MERGE/NEW_NODE
- `verdict` -> `normalizeVerdict(mode, hotspot)`
- `vision` -> `simulateVision()`

In `components/Console.tsx`, `engineCall<T>()` posts to this route and falls back to the local pure function if fetch fails. That keeps demo resilience if API is slow or unavailable.

## 9. Console component

`components/Console.tsx` is the main orchestrator. Props: `view = 'console' | 'cases' | 'map' | 'simulator' | 'vision'`.

It hydrates from LocalStorage, computes all risk scores through API/fallback, renders counters, register, real map, case file, simulator, vision panel and audit trail.

Important actions:
- `selectHotspot(id)` changes selected case.
- `toggleRain()` applies 1.35 multiplier.
- `performReport(lat,lng)` clusters report, merges or creates node, runs vision, updates audit.
- `runVerdict('recurrence'|'success')` updates checkpoints/spillover/status/escrow.
- `guidedDemo()` resets state and runs the full visual demo with captions and spotlight, no audio voice.
- `resetAll()` restores seed.

`?demo=1` on `/` auto-runs the guided demo once.

## 10. RealMap component

`components/RealMap.tsx` dynamically imports Leaflet inside `useEffect` to avoid SSR window issues.

It creates an OpenStreetMap tile layer with dark CSS filter. Markers are Leaflet `circleMarker`s at real coordinates. Selected hotspot gets true geodesic circles: radius 150 m halo and radius 30 m cluster ring. Clicking a marker calls `onSelect(id)`.

When `monitor.spillover` is true, it draws a polyline from a nearby depot point to the hotspot and then to an adjacent spillover point, with DEPOT and SPILLOVER labels. It also pans the map to the selected case.

The map requires internet for OSM tiles. There is no static fallback in the current build.

## 11. Lab component

`components/Lab.tsx` is the PROOF page. It is grouped into three tabs:
- MODEL: intervention what-if sliders for bins, collection beat and drain; role lens for citizen/inspector/contractor/commissioner.
- EVIDENCE: Canvas photo spoof audit using downsampled luminance comparison; SHA-256 hash chain with verify.
- BUSINESS: ROI simulator, WhatsApp/QR intake mock, dossier download.

Extra features: monsoon rain animation; `crypto.subtle.digest('SHA-256', ...)` for hash chain; Blob-based JSON dossier export.

Photo spoof audit uses generated demo pairs: same-landmark vs spoofed skyline. It is a rule-based demonstration, not a trained vision model.

## 12. HumanLoop component

`components/HumanLoop.tsx` is the FIELD page. Four tabs:
- Citizen: photo + pin report. Live GPS button uses `navigator.geolocation` with high accuracy. Preset centroid and 50 m spillover pins are provided. It classifies by 30/150 m rules.
- Inspector: Day 7 / Day 14 verification with photo and pin. Clean pin advances checkpoint; halo pin flags spillover and withholds.
- Contractor: installs bins, fixes beat, desilts drain; changes factor values and risk.
- Commissioner: reviews all cases and releases or withholds the 60% hold.

It reads/writes the same LocalStorage key as Console, so human actions affect the main system.

## 13. Styling and responsive behavior

`app/globals.css` defines dark tokens, glass panels (`.glass`), neumorphic controls (`.neu`), status colors, map styling, Leaflet dark filter, fixed global footnote, spotlight class for demo, lab group visibility rules and view-specific layouts.

Mobile fixes added: no horizontal overflow, console workspace single column below 960px, compact topbar below 560px, 2-column stats, 1-column below 380px, shorter map, stacked ledger, full-width forms/photos, smaller footnote. Reduced-motion media query is supported.

Visible nav is intentionally short to reduce complexity. Legacy routes still exist but are not primary nav.

## 14. Main demo flow

1. Open `/` and click RESET.
2. Click RUN DEMO. Console auto-plays: GZ-042 opens at risk 82; citizen report merges at 14.2 m; monsoon multiplier changes scores; Day 5 recurrence fails; spillover flags adjacent alley; ₹7,200 withheld; success branch releases escrow after 14 clean days.
3. Open FIELD: submit citizen pin in halo, log inspector visit, contractor fix, commissioner decision.
4. Open PROOF: move sliders, run spoof audit, verify hash chain, download dossier.
5. Open IMPACT: buyers, market figures, formula and roadmap.

If only three minutes: cold open, RUN DEMO, FIELD.

## 15. Limitations and honesty notes

Say these out loud if asked:
- Data is fictional and illustrative.
- Vision and photo audit are rule-based simulations, not trained AI.
- Escrow is simulated; no ERP/payment integration.
- LocalStorage is editable; hash chain is tamper-evidence, not legal signing.
- No auth, database, real multi-user sync or municipal feed.
- Map tiles need internet.
- GPS accuracy can be ±10-20 m; production should require <15 m accuracy plus QR/photo confirmation. This guard is recommended, not implemented.

Roadmap from deck: Gemini 2.5 Flash Vision, PostgreSQL/PostGIS, FastAPI + Node.js, Next.js/Tailwind/Mapbox GL, Twilio WhatsApp + QR, dashcam auto-scouting, smart-contract escrow, Swachh Survekshan API.

## 16. Git and generated documents

Recent important commits:
- `b48b767` - real OpenStreetMap map with true 30 m/150 m radii.
- `dc6e87e` - human loop roles.
- `1909314` - live GPS capture.
- `17d0605` - simplified navigation and demo mode.
- `055d4d1` - removed voice from guided demo.
- `0d4564d` - mobile layout fixes.

Generated knowledge PDF: `docs/KachraLab_Project_Knowledge.pdf`; HTML source: `docs/KachraLab_Knowledge.html`. Copies also exist on the Windows Desktop.

Current state: built, pushed to GitHub and deployed to Vercel production.

