-- ============================================================
--  CAPITUNE — Cloudflare D1 Schema — Migration 0005
--  Pro offering: packs -> services, profil pro (diplôme/compétences/exp), géoloc (lat/lng)
-- ============================================================

-- JSON (TEXT) : { [packId]: string[] }
ALTER TABLE users ADD COLUMN pro_pack_services TEXT DEFAULT '{}';

-- Profil pro (public)
ALTER TABLE users ADD COLUMN pro_diploma TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN pro_competences TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN pro_experience_years INTEGER;

-- Géolocalisation (optionnelle)
ALTER TABLE users ADD COLUMN location_lat REAL;
ALTER TABLE users ADD COLUMN location_lng REAL;
