-- ============================================================
--  CAPITUNE — Postgres/Neon — Migration 0014 (propositions tarifaires)
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS project_quotes (
  id              uuid PRIMARY KEY,
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pro_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency        text NOT NULL DEFAULT 'CAD',
  total           numeric NOT NULL DEFAULT 0,
  breakdown       text NOT NULL DEFAULT '[]',
  estimated_delay text NOT NULL DEFAULT '',
  note            text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'sent',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_project ON project_quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client  ON project_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_pro     ON project_quotes(pro_id);

COMMIT;
