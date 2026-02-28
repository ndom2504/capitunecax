-- ============================================================
--  CAPITUNE — Postgres/Neon Schema — Migration 0007
--  Objectif: autoriser un même email en "client" ET en "pro"
--            via une unicité (email, account_type)
-- ============================================================

BEGIN;

-- S'assure que les lignes existantes ont un account_type
UPDATE users SET account_type = 'client' WHERE account_type IS NULL;

-- Remplace l'unicité sur email par une unicité composite
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_account_type_key UNIQUE (email, account_type);

COMMIT;
