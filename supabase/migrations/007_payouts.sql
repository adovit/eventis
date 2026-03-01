-- ============================================================
-- 007: payouts table + RLS
-- Tracks seller payouts for completed orders.
-- Created by: stripe-webhook Edge Function (service role, bypasses RLS).
-- Read by: sellers (own rows), admin (all rows via is_admin metadata flag).
-- Updated by: admin only (to mark as sent + record stripe_transfer_id).
-- ============================================================

CREATE TABLE IF NOT EXISTS payouts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid REFERENCES orders(id),
  seller_id          uuid REFERENCES auth.users(id),
  amount             numeric(10, 2),
  status             text DEFAULT 'pending' CHECK (status IN ('pending', 'sent')),
  payout_date        timestamptz,
  stripe_transfer_id text,
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Sellers read their own payout rows
CREATE POLICY "sellers read own payouts"
  ON payouts FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

-- Admin reads all payouts (is_admin set in Supabase Dashboard → Auth → user metadata)
CREATE POLICY "admin read all payouts"
  ON payouts FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Admin marks payouts as sent
CREATE POLICY "admin update payouts"
  ON payouts FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
