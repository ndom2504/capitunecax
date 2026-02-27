-- CAPITUNE — Seed / promotion admins
--
-- Objectif: promouvoir des comptes existants en `role = 'admin'`.
--
-- Important:
-- - Ce script ne crée pas d’utilisateurs (le schéma peut varier).
-- - Si les comptes n’existent pas encore, connecte-toi une fois avec ces emails
--   (Google/Microsoft/credentials) ou crée-les via l’UI, puis relance ce script.

-- ==========================================================
-- Neon Postgres
-- ==========================================================
UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE LOWER(email) IN (
  'info@misterdil.ca',
  'divinegismille@gmail.com'
);

-- ==========================================================
-- Cloudflare D1 (SQLite)
-- ==========================================================
UPDATE users
SET role = 'admin', updated_at = datetime('now')
WHERE LOWER(email) IN (
  'info@misterdil.ca',
  'divinegismille@gmail.com'
);
