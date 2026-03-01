-- Fix: atomic ticket reservation to prevent race condition where two buyers
-- simultaneously pass the 'active' status check and both receive a Stripe URL.

-- ── 1. Extend ticket status to include 'reserved' ────────────────────────────
-- Drop the existing inline CHECK (auto-named by Postgres) and replace it.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT constraint_name INTO cname
  FROM information_schema.table_constraints
  WHERE table_name = 'tickets'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%status%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE tickets DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('active', 'reserved', 'sold', 'cancelled'));

-- ── 2. Atomic reservation function ───────────────────────────────────────────
-- Called by the create-checkout Edge Function via RPC.
-- Returns true if the ticket was successfully reserved, false if it was already
-- taken (reserved/sold/cancelled), not found, or owned by the buyer.
CREATE OR REPLACE FUNCTION reserve_ticket(p_ticket_id uuid, p_buyer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent sellers from reserving their own tickets
  IF EXISTS (
    SELECT 1 FROM tickets WHERE id = p_ticket_id AND seller_id = p_buyer_id
  ) THEN
    RETURN false;
  END IF;

  -- Atomically flip status: only succeeds if currently 'active'
  UPDATE tickets SET status = 'reserved'
  WHERE id = p_ticket_id AND status = 'active';

  RETURN FOUND; -- true if the UPDATE touched a row, false otherwise
END;
$$;

-- ── 3. Unreservation function ─────────────────────────────────────────────────
-- Called when a Stripe session expires or on checkout failure to release the hold.
CREATE OR REPLACE FUNCTION unreserve_ticket(p_ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tickets SET status = 'active'
  WHERE id = p_ticket_id AND status = 'reserved';
END;
$$;
