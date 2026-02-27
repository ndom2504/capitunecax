-- ============================================================
--  CAPITUNE — Postgres/Neon Schema — Migration 0003
--  Pro profile: services offerts + tarifs par pack
-- ============================================================

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_services text NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_pack_prices text NOT NULL DEFAULT '{}';

COMMIT;
