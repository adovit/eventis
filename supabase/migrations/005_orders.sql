-- Iteration 3: Buyer Purchase Flow
-- Run this migration in the Supabase SQL editor after 004_events_authenticated_read.sql.

-- ── Orders table ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id         uuid REFERENCES tickets(id),
  event_id          uuid REFERENCES events(id),
  buyer_id          uuid REFERENCES auth.users(id),
  stripe_session_id text UNIQUE,
  amount_paid       numeric(10, 2),
  status            text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  created_at        timestamptz DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Buyers: read their own orders only (used by OrderSuccess + MyOrders pages)
CREATE POLICY "buyers read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- No INSERT/UPDATE policies needed — Edge Functions use the service role key
-- which bypasses RLS entirely, preventing buyers from self-manipulating order state.
