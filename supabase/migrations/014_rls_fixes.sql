-- ============================================================
-- 014: RLS fixes from BE QA audit (2026-03-01)
--
-- Fix 1: Tighten profiles INSERT policy — prevent users from
--         self-inserting verified=true and bypassing SmartID.
--
-- Fix 2: Allow authenticated buyers to read active tickets —
--         "anon read active tickets" was TO anon only, so
--         logged-in buyers saw 0 tickets on EventDetail.
-- ============================================================

-- ── Fix 1: profiles INSERT policy ────────────────────────────────────────────

DROP POLICY IF EXISTS "owner can insert own profile" ON profiles;

-- Allow authenticated users to insert their own unverified profile row.
-- (Needed for Google OAuth users who skip SmartID and have no profile row.)
-- Verified/verified_at must remain false/null — only the smartid-verify
-- Edge Function (service_role, bypasses RLS) may set verified=true.
CREATE POLICY "owner can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    id = auth.uid()
    AND verified = false
    AND verified_at IS NULL
  );

-- ── Fix 2: authenticated buyer read active tickets ────────────────────────────

-- Mirrors "anon read active tickets" for authenticated users.
-- Without this policy, logged-in buyers see 0 tickets on EventDetail
-- because the anon policy only applies to the anon DB role.
-- Pattern is identical to 004_events_authenticated_read.sql.
CREATE POLICY "authenticated read active tickets"
  ON tickets FOR SELECT TO authenticated
  USING (status = 'active');

-- ============================================================
-- DOWN (to reverse this migration):
--
-- DROP POLICY IF EXISTS "authenticated read active tickets" ON tickets;
-- DROP POLICY IF EXISTS "owner can insert own profile" ON profiles;
-- CREATE POLICY "owner can insert own profile"
--   ON profiles FOR INSERT
--   WITH CHECK (id = auth.uid());
-- ============================================================
