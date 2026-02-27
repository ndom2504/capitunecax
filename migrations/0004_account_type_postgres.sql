-- Ajout du type de compte : client (particulier) vs pro (professionnel)
-- Par défaut : client

ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'client';
