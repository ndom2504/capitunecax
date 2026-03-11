-- ============================================================
--  CAPITUNE — Cloudflare D1 — Migration 0014 (propositions tarifaires)
-- ============================================================

-- Une proposition tarifaire est émise par un conseiller/pro pour un projet.
-- Elle sert de base à l'accord (acceptation) avant démarrage.

CREATE TABLE IF NOT EXISTS project_quotes (
  id             TEXT PRIMARY KEY,
  project_id     TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pro_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency       TEXT NOT NULL DEFAULT 'CAD',
  total          REAL NOT NULL DEFAULT 0,
  breakdown      TEXT NOT NULL DEFAULT '[]', -- JSON array
  estimated_delay TEXT NOT NULL DEFAULT '',
  note           TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'sent', -- sent | accepted | declined
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quotes_project ON project_quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client  ON project_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_pro     ON project_quotes(pro_id);
