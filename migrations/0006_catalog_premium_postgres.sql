-- ============================================================
--  CAPITUNE — Postgres/Neon Schema — Migration 0006
--  Catalogue global dynamique (packs/services) + premium + devise utilisateur
-- ============================================================

BEGIN;

-- Préférence devise (affichage côté UI)
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'CAD';

-- Abonnement premium
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- Catalogue global
CREATE TABLE IF NOT EXISTS catalog_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🧩',
  base_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '📦',
  price NUMERIC NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  popular BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_package_services (
  package_id TEXT NOT NULL REFERENCES catalog_packages(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES catalog_services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (package_id, service_id)
);

COMMIT;
