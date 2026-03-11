-- ============================================================
--  CAPITUNE — Cloudflare D1 — Migration 0017 (analytics geo)
-- ============================================================

ALTER TABLE web_analytics_events ADD COLUMN country_code TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_web_analytics_country_created ON web_analytics_events(country_code, created_at);
