-- ============================================================
--  CAPITUNE — Postgres/Neon Schema — Migration 0009
--  Inside posts (publications officielles)
-- ============================================================

CREATE TABLE IF NOT EXISTS inside_posts (
  id                uuid PRIMARY KEY,
  author_user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name       TEXT NOT NULL DEFAULT '',
  author_avatar_key TEXT DEFAULT '',
  title             TEXT NOT NULL DEFAULT '',
  content           TEXT NOT NULL DEFAULT '',
  media_type        TEXT DEFAULT '',
  media_url         TEXT DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inside_posts_created_at ON inside_posts(created_at);
