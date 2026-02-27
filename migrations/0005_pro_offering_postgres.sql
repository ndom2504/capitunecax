-- ============================================================
--  CAPITUNE — Postgres/Neon Schema — Migration 0005
--  Pro offering: packs -> services, profil pro (diplôme/compétences/exp), géoloc (lat/lng)
-- ============================================================

BEGIN;

-- JSON (TEXT) : { [packId]: string[] }
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_pack_services text NOT NULL DEFAULT '{}';

-- Profil pro (public)
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_diploma text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_competences text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_experience_years integer;

-- Géolocalisation (optionnelle)
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lat double precision;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lng double precision;

COMMIT;
