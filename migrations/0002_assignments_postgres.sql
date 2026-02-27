-- ============================================================
--  CAPITUNE — Postgres/Neon — Migration 0002 (assignations)
-- ============================================================

BEGIN;

-- Un pro/admin ne voit que les clients qui lui sont assignés.
-- Chaque client peut être assigné à un seul pro à la fois.

CREATE TABLE IF NOT EXISTS client_assignments (
  client_id  uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pro_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_assignments_pro ON client_assignments(pro_id);

COMMIT;
