-- ============================================================
--  CAPITUNE — Cloudflare D1 Schema — Migration 0003
--  Pro profile: services offerts + tarifs par pack
-- ============================================================

-- Ajout de colonnes (SQLite/D1)
ALTER TABLE users ADD COLUMN pro_services TEXT DEFAULT '[]';
ALTER TABLE users ADD COLUMN pro_pack_prices TEXT DEFAULT '{}';
