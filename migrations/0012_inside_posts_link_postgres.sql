-- ============================================================
--  CAPITUNE — Postgres Schema — Migration 0012
--  Ajout d'un lien optionnel aux posts Inside
-- ============================================================

ALTER TABLE inside_posts
  ADD COLUMN IF NOT EXISTS link_url text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_inside_posts_link_url ON inside_posts(link_url);
