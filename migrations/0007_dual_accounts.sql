-- ============================================================
--  CAPITUNE — Cloudflare D1 Schema — Migration 0007
--  Objectif: autoriser un même email en "client" ET en "pro"
--            via une unicité (email, account_type)
-- ============================================================

-- SQLite/D1 ne permet pas de supprimer proprement un UNIQUE inline sur une colonne.
-- On reconstruit donc la table `users` sans UNIQUE sur `email`, puis on crée
-- un index UNIQUE composite.

PRAGMA foreign_keys=OFF;

BEGIN;

CREATE TABLE IF NOT EXISTS users__new (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  password_hash TEXT,
  name          TEXT NOT NULL DEFAULT '',
  phone         TEXT DEFAULT '',
  location      TEXT DEFAULT '',
  bio           TEXT DEFAULT '',
  avatar_key    TEXT DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'client',
  oauth_provider TEXT DEFAULT '',
  oauth_id      TEXT DEFAULT '',
  notif_email   INTEGER NOT NULL DEFAULT 1,
  notif_rdv     INTEGER NOT NULL DEFAULT 1,
  notif_msg     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  account_type  TEXT NOT NULL DEFAULT 'client'
);

INSERT INTO users__new (
  id, email, password_hash, name, phone, location, bio, avatar_key,
  role, oauth_provider, oauth_id, notif_email, notif_rdv, notif_msg,
  created_at, updated_at, account_type
)
SELECT
  id, email, password_hash, name, phone, location, bio, avatar_key,
  role, oauth_provider, oauth_id, notif_email, notif_rdv, notif_msg,
  created_at, updated_at,
  COALESCE(account_type, 'client')
FROM users;

DROP TABLE users;
ALTER TABLE users__new RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_account_type
  ON users(email, account_type);

COMMIT;

PRAGMA foreign_keys=ON;
