# Event search dropdown empty on /sell page

**Type:** bug
**Priority:** high
**Effort:** small

## TL;DR
Sellers can't list tickets because the event search dropdown always returns empty — was caused by missing `authenticated` RLS policy on `events`; fixed by migration 004 applied 2026-02-28.

## Current State
- Typing in the "Renginys" search field on `/sell` returns no results
- `ListTicket.tsx:31` queries `events` using the authenticated `supabase` client (`.ilike('title', ...)`)
- Before migration 004 (`authenticated read events`) was applied to the live DB, authenticated users had **no SELECT policy** on `events` → Supabase silently returned 0 rows

## Expected Outcome
- Typing ≥2 characters in the event search shows matching events in the dropdown
- Seller can select an event and proceed to list a ticket

## Resolution
Migration 004 applied 2026-02-28 adds `CREATE POLICY "authenticated read events" ON events FOR SELECT TO authenticated USING (true)`.
**Verify this is now fixed** by visiting `/sell` while logged in and searching for an event name.

## Relevant Files
- `src/pages/ListTicket.tsx:31-39` — event search query (uses `supabase`, not `publicSupabase`)
- `supabase/migrations/apply_pending.sql:78-80` — migration 004 that adds the missing policy

## Risks / Notes
- The `publicSupabase` workaround applied to `EventList.tsx` was **never applied here** — `ListTicket.tsx` was silently broken the entire time Iteration 2 was live
- Search only triggers at `query.length >= 2` — if still reported as empty after migration, confirm user is actually typing before concluding the policy is wrong
- No code change needed if migration 004 resolves it; reopen if search still returns empty after confirming auth state and DB policy
