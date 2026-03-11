-- ============================================================
--  CAPITUNE — Postgres/Neon — Migration 0013 (projects metadata)
-- ============================================================

BEGIN;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata text NOT NULL DEFAULT '{}';

COMMIT;
