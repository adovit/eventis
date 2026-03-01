# bilietai.lt scraper: only ~53 events scraped, hundreds missing

**Type:** bug
**Priority:** high
**Effort:** medium
**Status:** resolved

## TL;DR
The bilietai.lt scraper only returns ~53 events because JSON-LD blocks in the initial HTML cover only the first page — paginated or lazy-loaded events (e.g. Pitbull in Kaunas) are never scraped.

## Current State
- Scraper fetches `/lit/renginiai/visi/` via axios and extracts `<script type="application/ld+json">` blocks
- Only events present in the initial server-rendered HTML are captured (~53)
- Paginated or dynamically loaded events are silently skipped
- Example missing: Pitbull concert in Kaunas

## Expected Outcome
- All events on bilietai.lt are scraped (likely 200–500+)
- Pagination is followed until no more events remain
- OR a direct API/search endpoint is discovered and used instead (similar to the kakava.lt fix)

## Relevant Files
- `scripts/scraper/bilietai.ts` — current JSON-LD scraper to rewrite
- `scripts/scraper/utils.ts` — `upsertEvents` and `ScrapedEvent` interface

## Risks / Notes
- bilietai.lt may have a hidden REST/JSON API (check network tab for XHR calls — this approach worked well for kakava.lt)
- If no API exists, pagination URL pattern needs discovery (e.g. `?page=2`, `?offset=50`)
- Cookie session dance must be preserved — session is required to get past their beta redirect
- The JSON-LD approach can stay as a fallback but should not be the primary strategy if events are paginated client-side
