-- ============================================================
--  CAPITUNE — Cloudflare D1 Schema — Migration 0009
--  Inside posts (publications officielles)
-- ============================================================

CREATE TABLE IF NOT EXISTS inside_posts (
  id                TEXT PRIMARY KEY,
  author_user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name       TEXT NOT NULL DEFAULT '',
  author_avatar_key TEXT DEFAULT '',
  title             TEXT NOT NULL DEFAULT '',
  content           TEXT NOT NULL DEFAULT '',
  media_type        TEXT DEFAULT '',
  media_url         TEXT DEFAULT '',
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inside_posts_created_at ON inside_posts(created_at);
