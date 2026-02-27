-- ============================================================
--  CAPITUNE — Postgres/Neon Schema — Migration 0001
--  (équivalent au schéma Cloudflare D1)
-- ============================================================

-- NOTE:
-- - Exécuter ce script une seule fois dans Neon (SQL Editor).
-- - Les UUID sont fournis par l'app (crypto.randomUUID()).

BEGIN;

-- -------------------------------------------------------
--  USERS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY,
  email          text NOT NULL UNIQUE,
  password_hash  text,
  name           text NOT NULL DEFAULT '',
  phone          text NOT NULL DEFAULT '',
  location       text NOT NULL DEFAULT '',
  bio            text NOT NULL DEFAULT '',
  avatar_key     text NOT NULL DEFAULT '',
  role           text NOT NULL DEFAULT 'client',
  oauth_provider text NOT NULL DEFAULT '',
  oauth_id       text NOT NULL DEFAULT '',
  notif_email    boolean NOT NULL DEFAULT true,
  notif_rdv      boolean NOT NULL DEFAULT true,
  notif_msg      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------
--  SESSIONS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id         text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- -------------------------------------------------------
--  PROJETS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT '',
  province    text NOT NULL DEFAULT '',
  pays        text NOT NULL DEFAULT '',
  diplome     text NOT NULL DEFAULT '',
  domaine     text NOT NULL DEFAULT '',
  experience  text NOT NULL DEFAULT '',
  famille     text NOT NULL DEFAULT '',
  enfants     text NOT NULL DEFAULT '',
  conjoint    text NOT NULL DEFAULT '',
  delai       text NOT NULL DEFAULT '',
  nbpersonnes text NOT NULL DEFAULT '',
  notes       text NOT NULL DEFAULT '',
  langues     text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'en_cours',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- -------------------------------------------------------
--  SERVICES SÉLECTIONNÉS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_services (
  id         uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pack_id    text NOT NULL DEFAULT '',
  pack_price numeric NOT NULL DEFAULT 0,
  carte      text NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_project ON project_services(project_id);

-- -------------------------------------------------------
--  PAIEMENTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id         uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method     text NOT NULL DEFAULT '',
  amount     numeric NOT NULL DEFAULT 0,
  currency   text NOT NULL DEFAULT 'CAD',
  status     text NOT NULL DEFAULT 'pending',
  reference  text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id);

-- -------------------------------------------------------
--  MESSAGES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY,
  project_id  uuid REFERENCES projects(id) ON DELETE SET NULL,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender      text NOT NULL DEFAULT 'user',
  content     text NOT NULL DEFAULT '',
  attachments text NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_user    ON messages(user_id);

COMMIT;
