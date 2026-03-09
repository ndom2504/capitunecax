-- Admin management fields for Inside posts (D1 / SQLite)

ALTER TABLE inside_posts ADD COLUMN IF NOT EXISTS is_hidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inside_posts ADD COLUMN IF NOT EXISTS updated_at TEXT NOT NULL DEFAULT (datetime('now'));

CREATE INDEX IF NOT EXISTS idx_inside_posts_is_hidden ON inside_posts(is_hidden);
