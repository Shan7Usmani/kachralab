# KachraLab

Municipal waste intervention console for the CodeSprint 2026 demo. The app clusters citizen reports
into persistent hotspots, scores risk, and holds 60% of a clearance contract until a site passes a
14-day verification window.

Live demo: <https://kachralab.vercel.app>

All coordinates, report counts, classification output and contract amounts are illustrative seed data.

## Stack

- Next.js 16 (App Router) and React 19
- TypeScript
- Leaflet + OpenStreetMap tiles
- Browser `localStorage` for demo persistence

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

```bash
npm run build
npm run typecheck
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Operations overview: KPIs, priority queue, activity, map |
| `/hotspots` | Case register with status filters and case detail |
| `/map` | Full map with the 30 m cluster radius and 150 m spillover halo |
| `/intake` | Report form with 30 m clustering and rule-based classification |
| `/verify` | 14-day checkpoints, spillover flag and escrow release |
| `/impact` | Programme-level demo metrics |
| `/method` | Pipeline, risk formula, roles and known gaps |

Old paths (`/cases`, `/simulator`, `/vision`, `/lab`, `/human`) redirect to the routes above.

## Architecture

```text
app/                 Route entry points and global styles
components/
  AppShell.tsx       Sidebar, top bar, navigation, reset
  RealMap.tsx        Leaflet map with hotspot geometry
  ui.tsx             Cards, stats, badges, buttons, meters, formatting
lib/
  engine.ts          Pure domain logic: clustering, risk, diagnosis, verdicts, seed data
  store.tsx          Single React store, reducer actions, versioned localStorage
```

- All business rules live in `lib/engine.ts`; pages import it directly. There is no duplicate API
  layer and no second copy of the clustering logic.
- `lib/store.tsx` is the only mutable state boundary. It validates persisted data before hydration
  and falls back to the seed dataset when storage is corrupt.
- Pages are URL-driven. Navigation uses `next/link`; there is no hidden view state.

## Domain rules

- **Clustering:** Haversine distance to the nearest case centroid; a report within 30 m merges,
  otherwise it opens a new case.
- **Risk:** `recurrence × 0.35 + hazard × 0.25 + sensitive proximity × 0.25 + persistence × 0.15`,
  clamped to 0–100 and multiplied by 1.35 during monsoon conditions.
- **Verification:** one clean checkpoint per day for 14 days. Recurrence or spillover keeps the
  escrow withheld. Release is blocked before day 14.
- **Escrow:** 40% paid on clearance, 60% held until verification.

## Known gaps

- Demo state is local to one browser; there is no database, auth or multi-user sync.
- Classification is a fixed rule-based sample, not a trained model.
- Map tiles require a network connection.
- No payment provider is connected; escrow is simulated.
