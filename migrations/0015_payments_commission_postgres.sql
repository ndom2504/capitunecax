-- ============================================================
--  CAPITUNE — Postgres/Neon — Migration 0015 (paiements + commission)
-- ============================================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pro_id uuid;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS quote_id uuid;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS platform_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS net_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_event_id text NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_intent_id text NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_session_id text NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_payments_pro ON payments(pro_id);
CREATE INDEX IF NOT EXISTS idx_payments_quote ON payments(quote_id);
CREATE INDEX IF NOT EXISTS idx_payments_pi ON payments(provider_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(provider_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_event ON payments(provider_event_id);
