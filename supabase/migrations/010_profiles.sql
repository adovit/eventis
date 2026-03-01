-- ============================================================
-- 010: profiles table for seller identity verification
-- Stores SmartID verification status per user.
-- Written by: smartid-verify Edge Function (service role).
-- Read by: public (to show Verified badge on listings).
-- No direct INSERT/UPDATE from frontend — service role only.
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  verified    boolean NOT NULL DEFAULT false,
  verified_at timestamptz
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read profiles to display Verified badge
CREATE POLICY "public read profiles"
  ON profiles FOR SELECT
  USING (true);
