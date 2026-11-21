export const CASE_SCHEMA = `
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'seed',
  name TEXT NOT NULL,
  ward TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  waste_type TEXT NOT NULL,
  reports_count INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'P3',
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  team TEXT,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cleared_at TIMESTAMPTZ,
  verification_day INTEGER NOT NULL DEFAULT 0,
  spillover BOOLEAN NOT NULL DEFAULT false,
  contract_total INTEGER NOT NULL DEFAULT 12000,
  escrow_held INTEGER NOT NULL DEFAULT 7200,
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  reference TEXT,
  description TEXT NOT NULL DEFAULT '',
  escrow_state TEXT NOT NULL DEFAULT 'HELD',
  escrow_released_at TIMESTAMPTZ
);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS escrow_state TEXT NOT NULL DEFAULT 'HELD';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS case_events (
  id BIGSERIAL PRIMARY KEY,
  case_id TEXT NOT NULL,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  actor TEXT NOT NULL DEFAULT 'Duty officer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cases_status_idx ON cases (status);
CREATE INDEX IF NOT EXISTS case_events_case_idx ON case_events (case_id, created_at DESC);
`;
