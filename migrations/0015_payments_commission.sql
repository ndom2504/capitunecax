-- ============================================================
--  CAPITUNE — Cloudflare D1 — Migration 0015 (paiements + commission)
-- ============================================================

-- Extension de la table payments pour supporter:
-- - paiements liés aux devis (quote_id, pro_id)
-- - commission plateforme (platform_fee, net_amount)
-- - vérification/idempotence via ids provider (Stripe)

ALTER TABLE payments ADD COLUMN kind TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN pro_id TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN quote_id TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN platform_fee REAL NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN net_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN provider_event_id TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN provider_payment_intent_id TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN provider_session_id TEXT NOT NULL DEFAULT '';
ALTER TABLE payments ADD COLUMN metadata TEXT NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_payments_pro ON payments(pro_id);
CREATE INDEX IF NOT EXISTS idx_payments_quote ON payments(quote_id);
CREATE INDEX IF NOT EXISTS idx_payments_pi ON payments(provider_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(provider_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_event ON payments(provider_event_id);
