-- ============================================================
--  CAPITUNE — Cloudflare D1 — Migration 0013 (projects metadata)
-- ============================================================

-- Ajoute un titre + un champ metadata JSON (TEXT) pour supporter
-- les projets CAPI (timeline, services, conseiller, etc.).

ALTER TABLE projects ADD COLUMN title TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN metadata TEXT NOT NULL DEFAULT '{}';
