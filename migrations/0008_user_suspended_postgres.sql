-- -------------------------------------------------------
--  Ajout colonne suspended sur users (Postgres)
--  0 = actif (défaut), 1 = suspendu
-- -------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended INTEGER NOT NULL DEFAULT 0;
