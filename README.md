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
| `/report` | Public citizen form: location, category, description, reference number |
| `/track` | Public reference lookup |
| `/track/[reference]` | Public complaint status timeline |
| `/` | Staff operations overview: KPIs, priority queue, activity, map |
| `/hotspots` | Case register with status filters and case detail |
| `/map` | Full map with the 30 m cluster radius and 150 m spillover halo |
| `/intake` | Staff report form with 30 m clustering and rule-based classification |
| `/inbox` | Citizen inbox: complaints submitted from the public form |
| `/verify` | 14-day checkpoints, spillover flag and escrow release |
| `/impact` | Programme-level demo metrics |
| `/method` | Pipeline, risk formula, roles and known gaps |

Old paths (`/cases`, `/simulator`, `/vision`, `/lab`, `/human`) redirect to the routes above.

## Architecture

```text
app/
  (public)/          Public report and tracking pages
  (staff)/           Staff console pages behind the shared shell
  api/reports/       Citizen report API (GET, POST, PATCH)
components/
  AppShell.tsx       Sidebar, top bar, navigation, reset
  LocationPicker.tsx Leaflet click-to-place location picker
  RealMap.tsx        Leaflet map with hotspot geometry
  ui.tsx             Cards, stats, badges, buttons, meters, formatting
lib/
  citizen.ts         Shared citizen types, categories and status labels
  engine.ts          Pure domain logic: clustering, risk, diagnosis, verdicts, seed data
  store.tsx          Staff store, reducer actions, versioned localStorage
  server/db.ts       Postgres or local-file storage for citizen reports
  server/reports.ts  Server-side clustering, case grouping and status updates
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

## Citizen intake storage

Public complaints use a shared Postgres store. The Vercel project is connected to Supabase through
the Vercel Marketplace, which sets `POSTGRES_URL` for production, preview and development. The app
accepts `DATABASE_URL`, `POSTGRES_URL` or `POSTGRES_URL_NON_POOLING` in that order. The
`citizen_reports` table is created on first write.

```bash
# Optional local override
DATABASE_URL=postgres://...
```

- Without any connection string, local development uses `.data/reports.json` (gitignored).
- On Vercel, a missing connection string makes the public form return a clear "storage not configured"
  response instead of pretending the report was saved.
- `PGSSL=disable` is only needed for a local Postgres without TLS.

Public submissions are clustered server-side against the five seed hotspots and existing citizen
cases. A report within 30 m merges into the case; anything further opens a `CZ-` case.

## Known gaps

- Staff case actions (verification, escrow) still use the browser-local demo store. Citizen
  complaints are shared through Postgres but are not yet written into that local case register.
- There is no auth or staff account model. The staff console and inbox API are unauthenticated demo
  surfaces; add staff auth before any real deployment.
- Classification is a fixed rule-based sample, not a trained model.
- Map tiles require a network connection.
- No payment provider is connected; escrow is simulated.
