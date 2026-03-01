# Dark Mode: Un-tokenised Classes on 5 Core Pages

**Type:** bug
**Priority:** high
**Effort:** medium

## TL;DR
Five core pages still use hardcoded Tailwind classes (`bg-white`, `text-gray-*`, `indigo-*`, `yellow-*`, `green-*`) that don't respond to the dark mode token system, making them look broken when the user toggles dark mode.

## Current State
Dark mode toggle is live (Layout.tsx, FOUC script, useTheme hook all working). But the following pages were not in scope for the design-system sprint migration and still use pre-token classes:

- **EventDetail.tsx** — hero bg `bg-gray-100`, heading `text-gray-900`, meta `text-gray-700`/`text-gray-500`, section headings `text-gray-900`, ticket list bg `bg-gray-50`, error messages `text-red-500`/`text-red-600`, links `text-indigo-600`, verified badge `text-green-700 bg-green-100`, buy button `bg-indigo-600 hover:bg-indigo-700`
- **EventList.tsx** — hero `bg-brand-600` (numeric not token), trust bar `bg-white border-neutral-200 text-neutral-600`, EventGridSkeleton `bg-white border-neutral-100`, filter inputs `border-neutral-300 focus:ring-brand-500`, EventCard `bg-white border-neutral-100`, date block `text-neutral-900`/`text-neutral-400`, location `text-neutral-500`, price fallback `text-neutral-500`, CTA `text-brand-600`, scarcity chip `bg-danger-600`, pagination `border-neutral-300 hover:bg-neutral-50`
- **MyListings.tsx** — page hero `bg-white border-neutral-100`, heading `text-neutral-900`, CTA button `bg-brand-600 hover:bg-brand-700`, `cancelError` `text-red-600`, ticket card `bg-white border-neutral-200`, `STATUS_COLOURS` using numeric scales (`bg-success-100 text-success-700`, `bg-warning-100 text-warning-700`, `bg-info-100 text-info-700`) — static hex, not dark-mode aware, cancel button `text-red-600 hover:text-red-800`
- **MyOrders.tsx** — page hero `bg-white border-neutral-100`, order card `bg-white border-neutral-200`, `STATUS_COLOURS` numeric scales (`bg-warning-100 text-warning-700`, `bg-success-100 text-success-700`)
- **MyEarnings.tsx** — summary cards `bg-white border-gray-200 text-gray-500`, totals `text-yellow-600`/`text-green-600`, IBAN nudge `bg-yellow-50 border-yellow-200 text-yellow-800`, link `text-indigo-600`, payout cards `bg-white border-gray-200 text-gray-900`/`text-gray-500`, `STATUS_COLOURS` using bare `bg-yellow-100 text-yellow-700` and `bg-green-100 text-green-700` (not even in the token system)

## Expected Outcome
All pages render correctly in both light and dark mode. Token classes used throughout:
- `bg-white` → `bg-bg-primary`
- `bg-gray-50`/`bg-neutral-50` → `bg-bg-secondary` or `bg-bg-surface`
- `border-neutral-*`/`border-gray-*` → `border-border`
- `text-gray-900`/`text-neutral-900` → `text-text-primary`
- `text-gray-500`/`text-neutral-500` → `text-text-muted`
- `text-indigo-600` → `text-brand`
- `bg-indigo-600 hover:bg-indigo-700` → `bg-brand hover:bg-brand-hover` (use `<Button variant="primary">`)
- `text-red-500`/`text-red-600` → `text-danger-text`
- `STATUS_COLOURS` in MyListings/MyOrders/MyEarnings → semantic token aliases: `bg-success-bg text-success-text`, `bg-warning-bg text-warning-text`, `bg-info-bg text-info-text`
- `text-yellow-600`/`text-green-600` summary totals → `text-warning-text`/`text-success-text`
- IBAN nudge → `bg-warning-bg border-warning-border text-warning-text`

## Relevant Files
- `src/pages/EventDetail.tsx` — most changes; buy button, error messages, ticket list, hero
- `src/pages/EventList.tsx` — hero, trust bar, EventCard (all three price states), filters, pagination
- `src/pages/MyListings.tsx` — STATUS_COLOURS map, hero, card layout, cancel button
- `src/pages/MyOrders.tsx` — STATUS_COLOURS map, hero, card layout
- `src/pages/MyEarnings.tsx` — STATUS_COLOURS map, summary totals, IBAN nudge, payout cards

## Risks / Notes
- `STATUS_COLOURS` maps in MyListings/MyOrders are inline string maps — replace with token aliases or consider reusing the `<Badge>` component which is already fully tokenised
- `MyEarnings.STATUS_COLOURS` uses bare `yellow-*`/`green-*` classes not present in tailwind.config.js at all — PurgeCSS may already be stripping them in production builds; verify
- EventList `EventCard` is a co-located subcomponent at the bottom of the file (not in `components/ui/`) — migration stays in-file
- Scarcity chip in EventCard currently uses `bg-danger-600` (numeric) — swap to `bg-danger`
- Buy button in EventDetail (`bg-indigo-600`) can be replaced with `<Button variant="primary" size="sm">` from `components/ui/Button` to stay DRY
