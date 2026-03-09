-- Inside media storage (D1 / SQLite)
-- Stocke les fichiers uploadés pour les posts Inside (images/vidéos petites tailles)

CREATE TABLE IF NOT EXISTS inside_media (
  id TEXT PRIMARY KEY,
  mime_type TEXT NOT NULL,
  filename TEXT,
  size INTEGER,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inside_media_created_at ON inside_media(created_at);
