-- Iteration 2: Seller Ticket Listings
-- Run this migration in the Supabase SQL editor after 001_events.sql.

-- ── Tickets table ─────────────────────────────────────────────────────────────

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
  ticket_file_url text,                        -- Supabase Storage path (PDF)
  status          text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at      timestamptz DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read active listings (used by EventDetail)
CREATE POLICY "anon read active tickets"
  ON tickets
  FOR SELECT
  TO anon
  USING (status = 'active');

-- Sellers: read all own tickets regardless of status (used by My Listings)
CREATE POLICY "sellers read own tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Sellers: insert own tickets only
CREATE POLICY "sellers insert own tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Sellers: update own tickets only (e.g. cancel)
CREATE POLICY "sellers update own tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid());

-- ── Storage bucket ────────────────────────────────────────────────────────────

-- Private bucket: PDF uploads only, 10 MB max per file
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ticket-pdfs', 'ticket-pdfs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Sellers can upload PDFs only to their own folder: ticket-pdfs/{uid}/{filename}
CREATE POLICY "sellers upload own pdfs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ticket-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
