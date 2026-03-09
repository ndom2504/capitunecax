-- ============================================================
--  CAPITUNE — Postgres/Neon Schema — Migration 0012 (presence)
-- ============================================================

BEGIN;

-- Paramètre utilisateur: apparaître en ligne (Inside)
ALTER TABLE users ADD COLUMN IF NOT EXISTS online_status_enabled boolean NOT NULL DEFAULT true;

-- Présence: dernier “heartbeat” par utilisateur
CREATE TABLE IF NOT EXISTS user_presence (
  user_id      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen_at);

COMMIT;
