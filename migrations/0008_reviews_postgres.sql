-- ============================================================
--  CAPITUNE — Postgres/Neon — Migration 0008 (avis clients)
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS pro_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pro_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, pro_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_pro ON pro_reviews(pro_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON pro_reviews(client_id);

COMMIT;
