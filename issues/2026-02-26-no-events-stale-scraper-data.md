# No Events Shown — Stale Scraper Data

**Type:** bug
**Priority:** high
**Effort:** small

## TL;DR
Homepage shows no events because the DB only has stale scraped data from 2026-02-25; the new upcoming-only filter correctly excludes all past events, leaving nothing to display.

## Current State
- Scraper was last run 2026-02-25 (Iteration 1).
- `EventList.tsx` now filters `date >= now` — correct behaviour, but exposes the stale data problem.
- Result: 0 events on homepage.

## Expected Outcome
- Running `npm run scrape` re-populates the DB with fresh upcoming events from all three sources.
- Homepage displays current upcoming events.

## Relevant Files
- `scripts/scraper/index.ts` — entry point; run `npm run scrape` to re-scrape all sources
- `src/pages/EventList.tsx` — upcoming filter is correct; this is purely a data issue

## Risks / Notes
- `zalgiris` and `kakava` scrapers require `BRIGHT_DATA_API_TOKEN` + `BRIGHT_DATA_ZONE` in `.env`; `bilietai` does not.
- If Bright Data creds are unavailable, run bilietai alone: `npx tsx scripts/scraper/bilietai.ts` (or equivalent).
- Recurring scraper (cron) is planned for Iteration 5 — this is a one-time manual fix for now.
- After re-scrape, verify events in Supabase Table Editor before checking the frontend.
