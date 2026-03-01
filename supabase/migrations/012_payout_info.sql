-- ============================================================
-- 012: payout_info table — stores seller IBAN for payouts
--
-- Kept SEPARATE from profiles because profiles has a public
-- SELECT policy (needed for Verified badge display). Supabase
-- RLS cannot restrict individual columns, so IBAN must live in
-- a table with owner-only read access. See ADR-007.
--
-- Written by: authenticated frontend user (own row only).
-- Read by: authenticated user (own row); service_role (admin).
-- ============================================================

CREATE TABLE IF NOT EXISTS payout_info (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  iban        text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payout_info ENABLE ROW LEVEL SECURITY;

-- Owner can read their own payout info
CREATE POLICY "owner can select own payout_info"
  ON payout_info FOR SELECT
  USING (id = auth.uid());

-- Owner can insert their own row (first time)
CREATE POLICY "owner can insert own payout_info"
  ON payout_info FOR INSERT
  WITH CHECK (id = auth.uid());

-- Owner can update their own row
CREATE POLICY "owner can update own payout_info"
  ON payout_info FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- Also: add user self-write policy to profiles table
-- (needed for Google OAuth users who never go through SmartID
--  and therefore have no profile row created by the Edge Fn)
-- ============================================================

-- Allow authenticated user to insert their own profile row
-- (needed for Google OAuth users who skip SmartID and therefore
--  have no profile row created by the smartid-verify Edge Fn)
-- INSERT only — no UPDATE. Verified/verified_at are service_role only.
-- A user self-updating 'verified=true' would bypass SmartID — not allowed.
CREATE POLICY "owner can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- DOWN (to reverse this migration):
--
-- DROP POLICY IF EXISTS "owner can insert own profile" ON profiles;
-- DROP TABLE IF EXISTS payout_info;
-- ============================================================
