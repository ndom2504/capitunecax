-- ============================================================
--  CAPITUNE — Postgres/Neon — Migration 0017 (analytics geo)
-- ============================================================

ALTER TABLE web_analytics_events ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_web_analytics_country_created ON web_analytics_events(country_code, created_at);
