# Missing DB Migrations on Live Supabase Project

**Type:** bug
**Priority:** critical
**Effort:** small

## TL;DR
Local migration files exist but have never been applied to the live Supabase database — multiple tables and policies are missing, breaking `/my-listings`, `/my-orders`, and the full purchase flow.

## Current State
- `/my-orders` → `Klaida: Could not find the table 'public.orders' in the schema cache` — `orders` table never created
- `/my-listings` → likely failing on missing `tickets` table or missing `reserved` status (migration 006)
- Buying flow (Edge Functions) will also fail — depends on `orders` table and `reserve_ticket`/`unreserve_ticket` RPC functions

Confirmed unapplied migrations (in order):
- `004_events_authenticated_read.sql` — workaround in place (`publicSupabase`), but DB policy still missing
- `005_orders.sql` — `orders` table + RLS
- `006_ticket_reservation.sql` — `reserved` ticket status + `reserve_ticket` / `unreserve_ticket` Postgres functions

Possibly also unapplied (unverified):
- `002_tickets.sql` — `tickets` table + RLS + `ticket-pdfs` storage bucket
- `003_tickets_rls_fix.sql` — tightened UPDATE policy on tickets

## Expected Outcome
All migrations applied in order → tables and RLS policies exist → pages load correctly.

## Relevant Files
- `supabase/migrations/002_tickets.sql` — tickets table, may be missing
- `supabase/migrations/005_orders.sql` — orders table, confirmed missing
- `supabase/migrations/006_ticket_reservation.sql` — reserved status + RPC functions, likely missing

## Risks / Notes
- Migrations must be run **in order** (001 → 006) — 005 has FK references to `tickets` and `events`
- 006 adds `'reserved'` to the tickets status CHECK constraint — if 006 is missing, Edge Functions calling `reserve_ticket()` will error at runtime even if the orders table exists
- After applying 004 at the DB level, remove the `publicSupabase` workaround from `src/lib/supabase.ts` and revert `EventList.tsx` to use the main `supabase` client
- Run all SQL files in the Supabase SQL editor: `https://supabase.com/dashboard/project/nvmylcwkvmyxinpldczo/sql/new`
