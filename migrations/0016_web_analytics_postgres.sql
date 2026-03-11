-- ============================================================
--  CAPITUNE — Postgres/Neon — Migration 0016 (trafic web)
-- ============================================================

CREATE TABLE IF NOT EXISTS web_analytics_events (
  id          uuid PRIMARY KEY,
  event_type  text NOT NULL DEFAULT 'pageview',
  path        text NOT NULL DEFAULT '/',
  page_title  text NOT NULL DEFAULT '',
  zone        text NOT NULL DEFAULT '',
  label       text NOT NULL DEFAULT '',
  element_tag text NOT NULL DEFAULT '',
  href        text NOT NULL DEFAULT '',
  referrer    text NOT NULL DEFAULT '',
  session_id  text NOT NULL DEFAULT '',
  user_id     uuid,
  viewport_w  integer NOT NULL DEFAULT 0,
  viewport_h  integer NOT NULL DEFAULT 0,
  click_x     numeric NOT NULL DEFAULT 0,
  click_y     numeric NOT NULL DEFAULT 0,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_analytics_type_created ON web_analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_web_analytics_path_created ON web_analytics_events(path, created_at);
CREATE INDEX IF NOT EXISTS idx_web_analytics_zone_created ON web_analytics_events(zone, created_at);
CREATE INDEX IF NOT EXISTS idx_web_analytics_session_created ON web_analytics_events(session_id, created_at);
