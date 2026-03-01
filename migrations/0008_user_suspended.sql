-- -------------------------------------------------------
--  Ajout colonne suspended sur users
--  0 = actif (défaut), 1 = suspendu
-- -------------------------------------------------------
ALTER TABLE users ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0;
