-- ============================================================
-- 008: add NOT NULL constraints to payouts table
-- order_id, seller_id, and amount must always be present —
-- a payout without these is unrecoverable from the admin UI.
-- Safe to run: payouts table is empty at this point.
-- ============================================================

ALTER TABLE payouts ALTER COLUMN order_id  SET NOT NULL;
ALTER TABLE payouts ALTER COLUMN seller_id SET NOT NULL;
ALTER TABLE payouts ALTER COLUMN amount    SET NOT NULL;
