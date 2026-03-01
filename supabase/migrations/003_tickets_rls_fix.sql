-- Iteration 2 post-review: tighten the UPDATE RLS policy on tickets.
-- The original policy had no WITH CHECK, allowing sellers to mutate any column
-- (e.g. self-marking status = 'sold'). Restrict updates to cancellation only.

DROP POLICY IF EXISTS "sellers update own tickets" ON tickets;

CREATE POLICY "sellers update own tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  -- Only allow updating to 'cancelled'; all other mutations are rejected.
  WITH CHECK (seller_id = auth.uid() AND status = 'cancelled');
