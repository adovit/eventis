# Event List: No Events Shown + Upcoming-Only Filter

**Type:** bug + feature
**Priority:** high
**Effort:** small

## TL;DR
Event list page shows zero events; additionally, the query should only return upcoming events (date >= now), not past ones.

## Current State
- `EventList.tsx` renders an empty list — no events appear despite data being in the DB.
- The Supabase query has no date filter: fetches all `is_active = true` events including past ones.

```typescript
// src/pages/EventList.tsx — current query
.from('events')
.eq('is_active', true)
.order('date', { ascending: true })
// No .gte('date', ...) — past events included
```

## Expected Outcome
1. **Bug fix**: Events that exist in the DB are actually displayed on the page.
2. **Filter**: Only upcoming events shown — `date >= now()` — so events starting later today or in the future are included; fully past events are excluded.

## Relevant Files
- `src/pages/EventList.tsx` — `load()` in `useEffect`; the `.from('events')` query needs `.gte('date', new Date().toISOString())` added and any render/state bug investigated.

## Risks / Notes
- Events with `date = null` would be excluded by a `.gte` filter — decide whether null-date events should be shown (e.g. `.or('date.gte.' + now + ',date.is.null')`).
- The empty-list bug may be an env issue (wrong `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`), an RLS misconfiguration, or a render bug — check browser console for Supabase errors first.
- Confirm scraped events in DB have future dates before assuming it's a filter problem.
