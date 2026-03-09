-- ============================================================
--  CAPITUNE — Cloudflare D1 Schema — Migration 0012 (presence)
-- ============================================================

-- Paramètre utilisateur: apparaître en ligne (Inside)
ALTER TABLE users ADD COLUMN online_status_enabled INTEGER NOT NULL DEFAULT 1;

-- Présence: dernier “heartbeat” par utilisateur
CREATE TABLE IF NOT EXISTS user_presence (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen_at);
