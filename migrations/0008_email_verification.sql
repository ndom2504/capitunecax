-- ============================================================
--  CAPITUNE — Cloudflare D1 Schema — Migration 0008
--  Objectif: vérification de l'adresse courriel à l'inscription
-- ============================================================

-- DEFAULT 1 pour les comptes existants (non bloqués)
-- Les nouveaux inscrits reçoivent email_verified = 0 via le code

ALTER TABLE users ADD COLUMN email_verified          INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN email_verification_token TEXT    DEFAULT NULL;
ALTER TABLE users ADD COLUMN email_verification_expires INTEGER DEFAULT NULL;
ALTER TABLE users ADD COLUMN email_verification_sent_at  INTEGER DEFAULT NULL;
