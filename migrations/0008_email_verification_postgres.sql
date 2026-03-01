-- ============================================================
--  CAPITUNE — PostgreSQL/Neon Schema — Migration 0008
--  Objectif: vérification de l'adresse courriel à l'inscription
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified           BOOLEAN  NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT     DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires BIGINT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_sent_at BIGINT DEFAULT NULL;
