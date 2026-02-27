-- ============================================================
--  CAPITUNE — Cloudflare D1 — Migration 0002 (assignations)
-- ============================================================

-- Un pro/admin ne voit que les clients qui lui sont assignés.
-- Chaque client peut être assigné à un seul pro à la fois.

CREATE TABLE IF NOT EXISTS client_assignments (
  client_id  TEXT PRIMARY KEY,
  pro_id     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_client_assignments_pro ON client_assignments(pro_id);
