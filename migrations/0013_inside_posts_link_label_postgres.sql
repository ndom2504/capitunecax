-- ============================================================
--  CAPITUNE — Postgres/Neon Schema — Migration 0013
--  Ajout d'un label personnalisé pour le bouton d'action
-- ============================================================

ALTER TABLE inside_posts
  ADD COLUMN IF NOT EXISTS link_label text NOT NULL DEFAULT 'Ouvrir le lien';

CREATE INDEX IF NOT EXISTS idx_inside_posts_link_label ON inside_posts(link_label);
