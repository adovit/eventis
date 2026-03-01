-- ============================================================
-- apply_pending.sql
-- Combined migration: 002 → 003 → 004 → 005 → 006
-- Safe to run on a fresh DB or one that already has 001_events.
-- All statements are idempotent (IF NOT EXISTS / IF EXISTS guards).
-- Run in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/nvmylcwkvmyxinpldczo/sql/new
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 002: tickets table + RLS + storage bucket
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid REFERENCES events(id),
  seller_id       uuid REFERENCES auth.users(id),
  price           numeric(10, 2) NOT NULL,
  quantity        int NOT NULL DEFAULT 1,
  split_type      text CHECK (split_type IN ('any', 'none', 'avoid_one')),
  seating_type    text CHECK (seating_type IN ('seated', 'standing')),
  section         text,
  row             text,
  seat_from       int,
  seat_to         int,
  ticket_file_url text,
  status          text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read active tickets"
  ON tickets FOR SELECT TO anon
  USING (status = 'active');

CREATE POLICY "sellers read own tickets"
  ON tickets FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "sellers insert own tickets"
  ON tickets FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "sellers update own tickets"
  ON tickets FOR UPDATE TO authenticated
  USING (seller_id = auth.uid());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ticket-pdfs', 'ticket-pdfs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "sellers upload own pdfs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ticket-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ────────────────────────────────────────────────────────────
-- 003: tighten tickets UPDATE policy (cancel-only)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "sellers update own tickets" ON tickets;

CREATE POLICY "sellers update own tickets"
  ON tickets FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid() AND status = 'cancelled');


-- ────────────────────────────────────────────────────────────
-- 004: authenticated users can read events
-- ────────────────────────────────────────────────────────────

CREATE POLICY "authenticated read events"
  ON events FOR SELECT TO authenticated
  USING (true);


-- ────────────────────────────────────────────────────────────
-- 005: orders table + RLS
-- ────────────────────────────────────────────────────────────

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

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyers read own orders"
  ON orders FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- 006: reserved ticket status + atomic reservation functions
-- ────────────────────────────────────────────────────────────

-- Extend status CHECK to include 'reserved' (drops auto-named constraint first)
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

CREATE OR REPLACE FUNCTION reserve_ticket(p_ticket_id uuid, p_buyer_id uuid)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM tickets WHERE id = p_ticket_id AND seller_id = p_buyer_id
  ) THEN
    RETURN false;
  END IF;
  UPDATE tickets SET status = 'reserved'
  WHERE id = p_ticket_id AND status = 'active';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION unreserve_ticket(p_ticket_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE tickets SET status = 'active'
  WHERE id = p_ticket_id AND status = 'reserved';
END;
$$;
