# Authenticated buyers see 0 tickets on EventDetail

**Type:** bug
**Priority:** high
**Effort:** small

## TL;DR
No RLS policy grants authenticated users read access to active tickets — `"anon read active tickets"` is `TO anon` only, so logged-in buyers see an empty ticket list on EventDetail.

## Current State
`002_tickets.sql` defines:
```sql
CREATE POLICY "anon read active tickets"
  ON tickets FOR SELECT TO anon
  USING (status = 'active');
```
`TO anon` means this policy applies **only** when the session uses the `anon` database role. Once a user authenticates, Supabase switches the role to `authenticated`. No `TO authenticated` policy exists that grants read access to tickets from other sellers. The `"sellers read own tickets"` policy only returns the caller's own listings.

The `event_ticket_summary` view bypasses RLS (SECURITY DEFINER), so the count/min-price badge on EventList still shows. But EventDetail queries `tickets` directly — authenticated buyers see 0 rows.

## Expected Outcome
Authenticated users should be able to read active ticket listings from any seller, the same as anonymous users. A mirror policy is needed:
```sql
CREATE POLICY "authenticated read active tickets"
  ON tickets FOR SELECT TO authenticated
  USING (status = 'active');
```
This pattern is already established for `events` in `004_events_authenticated_read.sql`.

## Relevant Files
- `supabase/migrations/002_tickets.sql` — defines the anon-only read policy
- `supabase/migrations/004_events_authenticated_read.sql` — the exact same problem was already fixed for events; fix tickets the same way
- `src/pages/EventDetail.tsx` — queries `tickets` table directly

## Risks / Notes
- This is a silent failure — no error is thrown, the ticket list just renders empty for logged-in users.
- Fix is a single new migration (no code changes needed).
- Pair with BUG-BE-001 (profiles INSERT allows `verified=true` self-insert) in the same fix migration.
