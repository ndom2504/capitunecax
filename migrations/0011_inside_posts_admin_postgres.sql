-- Admin management fields for Inside posts (Postgres)

ALTER TABLE inside_posts ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE inside_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_inside_posts_is_hidden ON inside_posts(is_hidden);
