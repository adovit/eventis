-- Iteration 1: Event Discovery
-- Run this migration in the Supabase SQL editor after provisioning the project.

CREATE TABLE IF NOT EXISTS events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  date        timestamptz,
  location    text,
  category    text,
  image_url   text,
  detail_url  text,                        -- original source page URL
  source      text,                        -- 'bilietai' | 'zalgiris' | 'kakava'
  price_from  numeric(10, 2),              -- cheapest ticket hint scraped from source
  slug        text UNIQUE NOT NULL,
  is_active   boolean DEFAULT true,
  scraped_at  timestamptz DEFAULT now()
);

-- Public read access — no auth required in Iteration 1
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"
  ON events
  FOR SELECT
  TO anon
  USING (true);
