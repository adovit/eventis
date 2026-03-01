# No Events Displayed on Localhost

**Type:** bug
**Priority:** critical
**Effort:** small

## TL;DR
The events listing page always shows an empty state in local dev — no events are rendered regardless of what's in the database.

## Current State
Opening localhost shows the empty state UI ("Šiuo metu nėra artėjančių renginių."). The Supabase query in `EventList.tsx` filters for `is_active = true` AND (`date >= now` OR `date is null`), but nothing returns.

Likely causes (in order of probability):
- `.env` is missing or `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are not set locally → Supabase client silently fails
- No seed data in the local/dev database — events table is empty
- All existing events have `is_active = false` or past dates

## Expected Outcome
Events present in the Supabase `events` table (with `is_active = true` and a future/null date) should render as cards on the listing page.

## Relevant Files
- `src/pages/EventList.tsx` — contains the Supabase query and empty-state UI (lines 41–46, 137–142)
- `src/lib/supabase.ts` — client initialization; will silently use empty strings if env vars are missing
- `.env` (untracked) — must define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Risks / Notes
- Supabase JS client does **not** throw on bad credentials — it just returns empty data, making this hard to notice without checking the network tab.
- Add a visible error state or console warning when the Supabase response returns an error, to surface credential/connection issues faster.
- Consider adding a dev seed script so local setup works out of the box.
