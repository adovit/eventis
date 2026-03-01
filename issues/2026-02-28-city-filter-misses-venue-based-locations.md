# City filter misses events where location is a venue name, not a city name

**Type:** bug
**Priority:** high
**Effort:** small

## TL;DR
Events in Kaunas (e.g. Žalgirio Arena events) don't appear when filtering by "Kaunas" because the `location` field stores the venue name only — "Žalgirio Arena" — which doesn't contain the word "Kaunas".

## Current State
- `EventList.tsx` city filter: `e.location?.toLowerCase().includes(city.toLowerCase())`
- **kakava scraper** (`kakava.ts:74`): `show.location?.name ?? show.city?.name ?? null` — uses venue name (`location.name`) and falls back to city only when venue is absent. When both are present, city is dropped entirely.
- **bilietai scraper** (`bilietai.ts:100`): `typeof location?.name === 'string' ? location.name : null` — uses JSON-LD `location.name` (venue), never checks `location.address` for city/locality.
- Result: events at "Žalgirio Arena" (Kaunas), "Siemens Arena" / "Švyturys Arena" (Klaipėda), "Žalgirio Arena" etc. never match city filter even though the city is known.

## Expected Outcome
- Filtering by "Kaunas" shows all events where the venue is physically in Kaunas, regardless of how the venue name is written.
- Location string should contain city when available: e.g. `"Žalgirio Arena, Kaunas"` instead of `"Žalgirio Arena"`.

## Fix
**kakava.ts** — when both `location.name` and `city.name` are present, combine them:
```ts
// before
location: show.location?.name ?? show.city?.name ?? null

// after
location: show.location?.name
  ? show.city?.name
    ? `${show.location.name}, ${show.city.name}`
    : show.location.name
  : show.city?.name ?? null
```
This produces `"Žalgirio Arena, Kaunas"` — substring filter then finds "Kaunas".

**bilietai.ts** — JSON-LD `location` object may contain `address.addressLocality` (city). Check and append if present:
```ts
const locationName = typeof location?.name === 'string' ? location.name : null
const addressLocality = (location?.address as Record<string, unknown> | undefined)?.addressLocality
const city = typeof addressLocality === 'string' ? addressLocality : null
const locationStr = locationName && city ? `${locationName}, ${city}` : locationName ?? city
```
After fix: re-run `npm run scrape` to back-fill `location` for existing rows (upsert on slug updates all fields).

## Relevant Files
- `scripts/scraper/kakava.ts:74` — location field construction
- `scripts/scraper/bilietai.ts:100` — location field from JSON-LD
- `src/pages/EventList.tsx:128` — city filter substring match (no change needed here)

## Risks / Notes
- Fix is purely in scrapers; no DB schema or frontend changes needed.
- Must re-run `npm run scrape` after fix to update existing DB rows.
- bilietai JSON-LD `location.address` structure needs verification against live data before assuming `addressLocality` key exists.
