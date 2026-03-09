-- Inside media storage (Postgres)
-- Stocke les fichiers uploadés pour les posts Inside (images/vidéos petites tailles)

CREATE TABLE IF NOT EXISTS inside_media (
  id uuid PRIMARY KEY,
  mime_type text NOT NULL,
  filename text,
  size integer,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inside_media_created_at ON inside_media(created_at);
