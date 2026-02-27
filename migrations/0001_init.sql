-- ============================================================
--  CAPITUNE — Cloudflare D1 Schema — Migration 0001
-- ============================================================

-- -------------------------------------------------------
--  USERS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,           -- UUID v4
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT,                       -- NULL si OAuth uniquement
  name         TEXT NOT NULL DEFAULT '',
  phone        TEXT DEFAULT '',
  location     TEXT DEFAULT '',
  bio          TEXT DEFAULT '',
  avatar_key   TEXT DEFAULT '',             -- Cloudflare R2 key (futur)
  role         TEXT NOT NULL DEFAULT 'client', -- 'client' | 'admin'
  oauth_provider TEXT DEFAULT '',           -- 'google' | 'microsoft' | ''
  oauth_id     TEXT DEFAULT '',
  notif_email  INTEGER NOT NULL DEFAULT 1,  -- booléen 0/1
  notif_rdv    INTEGER NOT NULL DEFAULT 1,
  notif_msg    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -------------------------------------------------------
--  SESSIONS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,             -- token opaque (64 chars hex)
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- -------------------------------------------------------
--  PROJETS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL DEFAULT '',
  province      TEXT DEFAULT '',
  pays          TEXT DEFAULT '',
  diplome       TEXT DEFAULT '',
  domaine       TEXT DEFAULT '',
  experience    TEXT DEFAULT '',
  famille       TEXT DEFAULT '',
  enfants       TEXT DEFAULT '',
  conjoint      TEXT DEFAULT '',
  delai         TEXT DEFAULT '',
  nbpersonnes   TEXT DEFAULT '',
  notes         TEXT DEFAULT '',
  langues       TEXT DEFAULT '',            -- JSON array sérialisé
  status        TEXT NOT NULL DEFAULT 'en_cours', -- 'en_cours' | 'soumis' | 'annule' | 'termine'
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- -------------------------------------------------------
--  SERVICES SÉLECTIONNÉS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_services (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pack_id     TEXT DEFAULT '',              -- ex: 'tourisme', 'essentiel', 'standard', 'premium'
  pack_price  REAL DEFAULT 0,
  carte       TEXT DEFAULT '{}',            -- JSON objet { serviceId: qty }
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_project ON project_services(project_id);

-- -------------------------------------------------------
--  PAIEMENTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method        TEXT NOT NULL DEFAULT '',  -- 'stripe' | 'paypal' | 'interac' | 'virement'
  amount        REAL NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'CAD',
  status        TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed' | 'refunded'
  reference     TEXT DEFAULT '',           -- Stripe PI id, PayPal order id, etc.
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id);

-- -------------------------------------------------------
--  MESSAGES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  project_id  TEXT REFERENCES projects(id) ON DELETE SET NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender      TEXT NOT NULL DEFAULT 'user', -- 'user' | 'bot' | 'admin'
  content     TEXT NOT NULL DEFAULT '',
  attachments TEXT DEFAULT '[]',            -- JSON array de noms de fichiers
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_user    ON messages(user_id);
