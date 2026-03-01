-- ============================================================
-- 009: Admin RLS policies for tickets table
-- Grants admin full SELECT (all statuses) and UPDATE on any ticket row.
-- Admin flag: is_admin = true in auth.users user_metadata.
-- ============================================================

-- Admin reads all tickets regardless of status (used by AdminListings page)
CREATE POLICY "admin read all tickets"
  ON tickets FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Admin can update any ticket (e.g. deactivate fraudulent listings)
CREATE POLICY "admin update any ticket"
  ON tickets FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
