-- ============================================================
--  CAPITUNE — Cloudflare D1 Schema — Migration 0006
--  Catalogue global dynamique (packs/services) + premium + devise utilisateur
-- ============================================================

-- Préférence devise (affichage côté UI)
ALTER TABLE users ADD COLUMN currency_code TEXT DEFAULT 'CAD';

-- Abonnement premium: date d’expiration (ISO string)
ALTER TABLE users ADD COLUMN premium_expires_at TEXT;

-- ── Catalogue global (pouvant être enrichi par les pros) ─────

CREATE TABLE IF NOT EXISTS catalog_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🧩',
  base_price REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS catalog_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '📦',
  price REAL NOT NULL DEFAULT 0,
  features TEXT NOT NULL DEFAULT '[]',
  popular INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS catalog_package_services (
  package_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (package_id, service_id)
);
