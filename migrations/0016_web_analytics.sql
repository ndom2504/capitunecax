-- ============================================================
--  CAPITUNE — Cloudflare D1 — Migration 0016 (trafic web)
-- ============================================================

CREATE TABLE IF NOT EXISTS web_analytics_events (
  id            TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL DEFAULT 'pageview', -- pageview | click
  path          TEXT NOT NULL DEFAULT '/',
  page_title    TEXT NOT NULL DEFAULT '',
  zone          TEXT NOT NULL DEFAULT '',
  label         TEXT NOT NULL DEFAULT '',
  element_tag   TEXT NOT NULL DEFAULT '',
  href          TEXT NOT NULL DEFAULT '',
  referrer      TEXT NOT NULL DEFAULT '',
  session_id    TEXT NOT NULL DEFAULT '',
  user_id       TEXT NOT NULL DEFAULT '',
  viewport_w    INTEGER NOT NULL DEFAULT 0,
  viewport_h    INTEGER NOT NULL DEFAULT 0,
  click_x       REAL NOT NULL DEFAULT 0,
  click_y       REAL NOT NULL DEFAULT 0,
  metadata      TEXT NOT NULL DEFAULT '{}',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_web_analytics_type_created ON web_analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_web_analytics_path_created ON web_analytics_events(path, created_at);
CREATE INDEX IF NOT EXISTS idx_web_analytics_zone_created ON web_analytics_events(zone, created_at);
CREATE INDEX IF NOT EXISTS idx_web_analytics_session_created ON web_analytics_events(session_id, created_at);
