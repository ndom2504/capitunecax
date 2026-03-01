-- ============================================================
--  CAPITUNE — D1 (Cloudflare) — Migration 0008 (avis clients)
-- ============================================================

CREATE TABLE IF NOT EXISTS pro_reviews (
  id          TEXT PRIMARY KEY,
  client_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pro_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (client_id, pro_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_pro ON pro_reviews(pro_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON pro_reviews(client_id);
