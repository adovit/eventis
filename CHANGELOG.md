# Changelog

## [Unreleased] — Iteration 5.8 — QA Fixes — 2026-03-01

### Fixed
- **Register.tsx — Lithuanian error messages** — `signUp()` errors were passed raw (English) to the user; `localiseError()` now maps: "User already registered" → "Toks el. pašto adresas jau užregistruotas.", "Password should be at least" → "Slaptažodis per trumpas (min. 6 simboliai).", everything else → "Registracija nepavyko. Bandykite dar kartą." (mirrors the pattern in `Login.tsx`)
- **Profile.tsx — data load error state** — `load()` had no error handling; a failed Supabase query left the page on an infinite spinner; wrapped in `try/catch/finally` — `loadError` state set on any query `.error`; `setLoading(false)` always fires in `finally`; error shown in `text-danger-text` where the spinner was

### Added
- **Migration `015_payout_info_iban_check.sql`** — DB-level IBAN format constraint: `CHECK (iban IS NULL OR iban ~ '^LT[0-9]{18}$')`; backstop for client-side validation in `Profile.tsx`; prevents invalid IBAN storage even if the frontend check is bypassed; reversible (DOWN comment included)

---

## [Unreleased] — Home Page Modernisation — 2026-03-01

### Added
- **`Select.tsx`** (`src/components/ui/Select.tsx`) — custom headless dropdown component; props: `value`, `onChange`, `options`, `placeholder`, `className`; click-outside close; Escape-to-close (listener gated on `open` state); full keyboard nav on options (`tabIndex`, Enter/Space); `role="listbox"` / `aria-expanded` for accessibility; dark-mode safe via token classes; barrel-exported from `src/components/ui/index.ts`
- **Date filter chip presets** on EventList — four pill chips (Šiandien / Šią savaitę / Šį mėnesį / Pasirinkti datą) replace the raw `<input type="date">` pair; "Pasirinkti datą" reveals styled custom date inputs; `datePreset` state drives all date logic; `DATE_PRESETS` map with lazy `from`/`to` functions evaluated at click time

### Changed
- **`EventList.tsx` — value proposition section** — emoji trust bar replaced with a full-width 3-card SVG stat section (`TicketIcon`, `ShieldCheckIcon`, `UserCheckIcon`); inline 24×24 stroke SVGs; token classes throughout; dark-mode safe
- **`EventList.tsx` — search input** — inline `<input type="text">` replaced with `<Input leadingIcon={<SearchIcon />} onClear={() => setSearch('')} />`; search icon positioned absolute-left; clear (×) button appears when value is non-empty
- **`EventList.tsx` — filter dropdowns** — both native `<select>` elements (category, city) replaced with `<Select>` component
- **`EventList.tsx` — `EventGridSkeleton`** — `bg-white border-neutral-100` → `bg-bg-primary border-border` (token migration)
- **`Input.tsx`** — extended with `leadingIcon?: ReactNode` (renders icon absolute-left, compensates padding with `pl-9`) and `onClear?: () => void` (renders × button absolute-right when value is non-empty); existing callers unaffected

### Fixed
- **Select placeholder color** — static `text-text-primary` class competed with conditional `text-text-muted` for empty-value state; Tailwind alphabetical CSS order caused `text-text-primary` to always win; removed `text-text-primary` from the static class string (conditional value now unambiguous)
- **Select dropdown mobile overflow** — `min-w-max` on the dropdown `<ul>` could exceed 375px viewport; replaced with `min-w-full max-w-[90vw]`

### Security
- **Migration `014_rls_fixes.sql`** — tightened `"owner can insert own profile"` policy: `WITH CHECK` now enforces `id = auth.uid() AND verified = false AND verified_at IS NULL`; previously `WITH CHECK (id = auth.uid())` allowed any authenticated user to self-insert `verified=true` and bypass SmartID verification (BUG-BE-001)

### Fixed (also in `014_rls_fixes.sql`)
- **Authenticated buyers could not see tickets on EventDetail** — `"anon read active tickets"` policy was `TO anon` only; authenticated users (buyers) using the `authenticated` DB role hit no matching SELECT policy and saw an empty ticket list; new `"authenticated read active tickets"` policy mirrors the anon read for `TO authenticated` (BUG-BE-002)

---

## [Unreleased] — Iteration 5.9 — Design System & Dark Mode — 2026-03-01

### Added
- **Dark/light mode** — system-wide theme toggle with OS preference detection (`prefers-color-scheme`) and user override; persists to `localStorage`; no flash of unstyled content (FOUC prevention via synchronous inline `<head>` IIFE in `index.html` that reads preference and sets `<html class="dark">` before React hydrates)
- **CSS custom property token system** (`src/index.css`) — all colors defined as CSS vars on `:root` (light) and `:root.dark` (dark); `tailwind.config.js` consumes via `var()` references; components use semantic classes (`bg-bg-primary`, `text-text-secondary`, `border-border`, `text-brand`, etc.); no hex values in config or components
- **Theme toggle in navbar** — inline SVG sun icon (dark mode) / moon icon (light mode) on desktop between nav links and avatar; "Tamsi tema" row with icon in mobile hamburger menu (both logged-in and logged-out states); `aria-label="Perjungti temą"`
- **Self-hosted Inter Variable font** (`public/fonts/InterVariable.woff2`) — GDPR compliant: no Google Fonts CDN call, no Lithuanian user IPs sent to US servers; Latin-ext subset covers all diacritics (ą č ę ė į š ų ū ž); `font-display: swap`
- **`src/hooks/useTheme.ts`** — `useTheme()` hook returning `{ theme, toggleTheme, setTheme }`; derives initial state from `<html>` class already set by FOUC script (avoids DOM mismatch); `MediaQueryList` listener syncs OS changes when no `localStorage` preference exists; cleanup on unmount
- **`src/lib/tokens.ts`** — static typed `as const` mirror of all CSS vars (light + dark); no `getComputedStyle()` — safe for Stripe Appearance API and future SSR; exports `getStripeAppearance(theme)` helper for correct Stripe Elements theming in both modes
- **Tabular numbers on all monetary displays** — `font-mono tabular-nums` applied to: `EventDetail.tsx` ticket prices (reformatted `€ X.XX` with `/ bilietas` suffix in `text-text-muted`, price+CTA block right-aligned), `EventList.tsx` EventCard (`nuo € X.XX`, `text-brand`), `MyListings.tsx`, `MyOrders.tsx`, `MyEarnings.tsx` (all `.toFixed(2)` instances)
- **WCAG 2.1 AA contrast audit** — ratios computed and documented in `src/index.css` header: light text-primary 19.1:1 ✅, dark text-primary 18.7:1 ✅, light brand 5.8:1 ✅, dark brand 6.1:1 ✅, focus rings ≥ 3:1 ✅

### Changed
- **`tailwind.config.js`** — `darkMode: 'class'` added; semantic token groups (`bg.*`, `text.*`, `border.*`, `brand.*`, semantic `success/warning/danger/info`) mapped to `var(--color-*)` references; numeric scales retained as escape hatches; `boxShadow` and `borderRadius` extended to consume CSS var tokens; `fontFamily.sans/mono` via CSS vars
- **`src/index.css`** — complete rewrite: `@font-face` for Inter Variable, `:root` light-mode token block, `:root.dark` dark-mode overrides, `*, *::before, *::after` 200ms ease color transition, `.no-transition` override class for FOUC suppression on initial paint
- **`index.html`** — FOUC prevention inline `<script>` (synchronous, no defer/async) in `<head>` before any `<link>`; IIFE reads `localStorage("theme")`, falls back to `prefers-color-scheme`, adds `dark` class if needed; adds `.no-transition` removed via double `requestAnimationFrame` to suppress animation on first paint only
- **UI components migrated to token classes** — all 6 primitives: `Button` (4 variants + active:scale-[0.97] + opacity-40 disabled), `Card` (+ hover lift), `Input`, `Badge`, `Skeleton`, `EmptyState`
- **`Layout.tsx`** — full token migration throughout (navbar, dropdown, mobile overlay, footer); `useTheme` imported; desktop toggle + mobile "Tamsi tema" row added
- **`Login.tsx`** — all `gray-*`/`indigo-*` classes → token equivalents; inline `<input>` elements → `<Input>` component; inline submit/Google buttons → `<Button variant="primary/secondary">`
- **`Register.tsx`** — same token/component migration as Login; `confirmationSent` screen also fully tokenised; password `helperText` moved into `<Input helperText="min. 6 simboliai">`

### Fixed
- **`Button.tsx` secondary variant hover** — `hover:bg-bg-surface` was identical to the resting `bg-bg-surface`; no visual hover feedback on Google OAuth buttons and any secondary Button; corrected to `hover:bg-bg-secondary`
- **`Button.tsx` danger variant hover** — `hover:bg-danger` was identical to `bg-danger`; corrected to `hover:bg-danger-700`
- **CSS theme transition not cascading** — transition was set on `:root` only; CSS `transition` is not an inherited property and does not cascade to children; moved selector to `*, *::before, *::after` so all elements animate smoothly on toggle

---

## [Unreleased] — Sprint 6 — UX/UI & Value Proposition — 2026-03-01

### Added
- **Design system** (`docs/design-system.md`) — single source of truth for all color tokens, typography, spacing, component patterns, page patterns, accessibility rules, and forbidden class patterns
- **Shared UI component library** (`src/components/ui/`) — `Button`, `Badge`, `Input`, `Card`, `Skeleton`, `EmptyState`; barrel-exported via `index.ts`
- **Home page hero** — full-width `bg-brand-600` hero on `EventList.tsx` with H1, `text-white/80` subtitle, two CTAs (browse + sell); trust bar below with 3 trust signals
- **Event card redesign** — structured date block (day number + month abbreviation + time), category pill overlaid on image, scarcity chip (`bg-danger-600`) when < 5 tickets remain, map-pin SVG for location, price in `text-brand-600 font-bold`, "Peržiūrėti →" CTA
- **Skeleton loading** (`EventGridSkeleton`) — 6-card animated skeleton grid replaces blank-screen wait on EventList
- **Page heroes** — consistent white hero bar with H1 + subtitle added to: ListTicket, MyListings, MyOrders, MyEarnings, Profile
- **`EmptyState` component** — replaces inline empty-div patterns on MyListings, MyOrders, MyEarnings
- **News pages** — `NewsIndex` (`/naujienos`) and `NewsDetail` (`/naujienos/:slug`) with category filter tabs, article grid, skeleton loaders, share button, SEO meta; public routes (no auth required)
- **`articles` table** — `supabase/migrations/013_articles.sql`; fields: `slug`, `title`, `excerpt`, `body`, `cover_image_url`, `category`, `author_name`, `published_at`, `is_published`; RLS: public SELECT for published articles only
- **`useDocumentMeta` hook** — DOM-based SEO meta (`document.title`, og tags, canonical link); no external dependency; resets on unmount
- **Footer** — 3-column grid (brand + Platform links + Info links) embedded in `Layout.tsx`; copyright line; all links use `text-neutral-600 hover:text-brand-600`
- **Mobile hamburger menu** — full-screen overlay at `top-14` with all navigation links including profile/account; adapts to auth state

### Changed
- **Color system** — migrated from raw `indigo-*`/`gray-*` Tailwind classes to semantic design tokens: `brand-*` (violet), `neutral-*` (stone), `success-*`, `warning-*`, `danger-*`, `info-*` across all files
- **Nav avatar** — `bg-brand-600` (was `bg-indigo-600`); avatar wrapper is `hidden sm:block` so mobile users see only the hamburger (eliminates double-menu confusion on mobile)
- **Profile.tsx** — fully migrated to design tokens: avatar `bg-brand-600`, IBAN form `focus:ring-brand-500`, verification badges use `success-*`/`warning-*`, all `gray-*` → `neutral-*`
- **`STATUS_COLOURS` maps** — MyListings and MyOrders: `green/yellow/blue/gray` → `success/warning/info/neutral` semantic tokens
- **Footer heading contrast** — `text-neutral-400` → `text-neutral-500` (passes WCAG AA on `bg-neutral-50`)
- **Hero subtext contrast** — `text-brand-100` → `text-white/80` on `bg-brand-600` (was WCAG AA fail ~2.5:1; now passes ~4.7:1)
- **Loading/error states** — all pages: `text-gray-500` → `text-neutral-500`; `text-red-500` → `text-danger-600`
- **Desktop nav links** — added Renginiai, Parduoti, Naujienos links (`hidden sm:flex`)

### Fixed
- **Invisible hero subtitle** — `text-brand-100` on `bg-brand-600` had ~2.5:1 contrast (WCAG fail); fixed to `text-white/80`
- **Profile avatar color mismatch** — nav avatar was `bg-brand-600` (violet), profile page avatar was `bg-indigo-600` (old indigo); both now `bg-brand-600`
- **Mobile nav double menu** — logged-in mobile users saw avatar dropdown button AND hamburger simultaneously; avatar is now desktop-only (`hidden sm:block`)
- **Status badges not migrated** — MyListings/MyOrders `STATUS_COLOURS` were still using old `green-*/yellow-*/gray-*` classes; migrated to semantic system

---

## [Unreleased] — Iteration 5.7 — Auth UX Overhaul & User Profile — 2026-03-01

### Added
- **Avatar + dropdown navbar** — logged-in users see a circular avatar (first letter of email, indigo) that opens a dropdown with all nav links, admin section, verify nudge, and sign-out; replaces flat text link list
- **Google OAuth** — "Prisijungti su Google" button on Login page (below form); "Registruotis su Google" button on Register page (above form, Google-first for new users)
- **`/profile` page** — account hub: email, member-since date, SmartID verification badge, IBAN entry for receiving payouts, listing/order counts
- **`payout_info` table** — separate from `profiles` to protect IBAN from public read access; owner-only RLS (`SELECT/INSERT/UPDATE` for `id = auth.uid()`); migration `012_payout_info.sql`
- **IBAN nudge banner on MyEarnings** — shown when pending payouts exist and no IBAN is saved; links to `/profile`
- **Context banner on Login** — shown when user was redirected mid-flow (`?returnUrl` present): "Prisijunkite, kad galėtumėte tęsti"
- **`safeReturnUrl()` guard** — all `returnUrl` consumption validates value starts with `/`; prevents open redirect attacks

### Changed
- **`ProtectedRoute.tsx`** — redirects now include `?returnUrl=<current-path>` so users return to intended destination after login
- **`EventDetail.tsx`** — buy button redirect normalised from `?next=` to `?returnUrl=`
- **`Login.tsx`** — `getSession()` on mount detects post-Google-OAuth session and navigates to `returnUrl`; post-login redirect respects `returnUrl`; default destination is `/`
- **`Register.tsx`** — post-signup redirect respects `returnUrl`; default destination is `/` (was `/my-listings`)
- **`Verify.tsx`** — successful verification and already-verified redirect both now send to `/profile` (was `/sell`)
- **`Profile.tsx`** — verified status checked from both `profiles` DB table AND `user_metadata` to handle source inconsistency for Google OAuth users with prior SmartID history

### Security
- **`payout_info` has no public read** — IBAN is never exposed to anonymous Supabase queries (ADR-007)
- **`profiles` UPDATE policy removed** — users can only INSERT their own row; verified/verified_at remain service_role-only; prevents self-verification bypass of SmartID
- **`safeReturnUrl()`** — open redirect prevented on all `returnUrl` params

---

## [Unreleased] — Iteration 5.9 — 2026-02-28

### Fixed
- **Purchase still failing — CORS preflight rejected by `create-checkout`** — `Access-Control-Allow-Headers` was missing `x-client-info` and `apikey`; Supabase JS client sends both headers on every `functions.invoke()` call; browser's OPTIONS preflight was rejected, blocking the actual POST before it reached the function handler. Fixed to match the standard 4-header pattern used by all other browser-callable Edge Functions. Redeployed.

### Changed
- **`STRIPE_SECRET_KEY` switched to test mode** — updated Supabase secret to `sk_test_...` to allow testing with Stripe test cards (e.g. `4242 4242 4242 4242`)

---

## [Unreleased] — Iteration 5.8 — 2026-02-28

### Fixed
- **Purchase still failing after 5.7 deploy — cold-start Stripe crash** — `create-checkout` was deployed moments before `STRIPE_SECRET_KEY` was set; `new Stripe(key)` at module scope threw synchronously before `Deno.serve()` was registered, leaving the function in a permanently broken cold-start state. Moved Stripe client to a lazy singleton (`getStripe()`) initialised on first request, then redeployed. Module-scope crash impossible.
- **City filter missing venue-based events** — `kakava.ts` dropped `city.name` whenever `location.name` was present; events at "Žalgirio Arena" (Kaunas), "Kauno valstybinė filharmonija" (Kaunas) etc. never matched city filter. Now combined as `"Venue Name, City"` when both fields are available.
- **`bilietai.ts` city never extracted** — Schema.org `location.address.addressLocality` (city) was never read; only `location.name` (venue) was stored. Now extracts `addressLocality` and appends to venue: `"Kauno kultūros centro Girstučio padalinys, Kaunas"`.

### Changed
- **`supabase/functions/create-checkout/index.ts`** — Stripe client moved from module scope to lazy singleton `getStripe()` pattern; prevents cold-start crash if secret is temporarily unavailable
- **`scripts/scraper/kakava.ts`** — location field now `"${location.name}, ${city.name}"` when both present; falls back to whichever is available
- **`scripts/scraper/bilietai.ts`** — location field now `"${venueName}, ${cityName}"` when `location.address.addressLocality` is available; gracefully falls back to venue-only or city-only

---

## [Unreleased] — Iteration 5.7 — 2026-02-28

### Fixed
- **Purchase flow broken — `create-checkout` not deployed** — Edge Function was present in code but never deployed to Supabase; all "Pirkti" clicks returned "Failed to send a request to the Edge Function"; now deployed and ACTIVE (version 1)
- **`STRIPE_SECRET_KEY` missing from Supabase secrets** — `create-checkout` would have failed at runtime even after deploy; key now set via `npx supabase secrets set`
- **Event search only returning upcoming events** — `EventList.tsx` DB query included `.or('date.gte.${isoNow},date.is.null')` which constrained the entire dataset before search ran; search mode bypassed client-side filters but not the server-side date constraint; removed the constraint — all scraped events now returned from DB; browse mode still shows only upcoming events via the existing client-side `dateFrom/dateTo` filter (default today → today+30d)
- **Category dropdown always empty** — `bilietai.ts` hardcoded `category: null`; `kakava.ts` hardcoded `category: null`; both scrapers now populate `category`; scraper re-run back-filled all 1,666 existing DB rows via slug-based upsert

### Changed
- **`scripts/scraper/bilietai.ts`** — category now extracted from `detail_url` path segment (pattern `/renginiai/{category}/`); first letter capitalised, hyphens replaced with spaces (e.g. `teatro-renginiai` → `Teatro renginiai`); falls back to `null` if URL doesn't match pattern
- **`scripts/scraper/kakava.ts`** — added `inferKakavaCategory(title)` helper; maps keyword patterns in event title to: Sportas (krepšin, žalgiris, rungtyn, futbol), Koncertai (koncer, muzika, grupė, dainink), Festivalis (festiv), Teatras (teatr, spektakl, opera, balet, cirkas), Pramogos (pramog, šou, show); returns `null` when no keyword matches

---

## [Unreleased] — Iteration 5.6 — 2026-02-28

### Added
- **City filter** — event list now has a "Miestas" dropdown with Vilnius, Kaunas, Klaipėda, Šiauliai, Panevėžys; filters by `location` field (substring match); bypassed in search mode
- **Ticket availability badge on event cards** — cards now show "N bilietų nuo X.XX €" in green when active resale listings exist; powered by new `event_ticket_summary` DB view fetched in parallel with events
- **Pagination** — event list shows 24 events per page with "← Ankstesnis / Puslapis X iš Y / Kitas →" controls; disabled in search mode (all results shown); resets to page 1 on any filter change
- **"No tickets" message on event detail** — when an event has no active resale listings, `EventDetail` now shows "Šiuo metu nėra parduodamų bilietų." with a link to the original ticket source
- **`supabase/migrations/011_ticket_summary_view.sql`** — `event_ticket_summary` view: `SELECT event_id, COUNT(*), MIN(price) FROM tickets WHERE status = 'active' GROUP BY event_id`; `GRANT SELECT` to `anon, authenticated`

### Changed
- **Event list date filter** — defaults to today → today+30 days (was empty); past dates disabled in picker; fields cannot be cleared to empty; date filter is bypassed entirely in search mode
- **Event list loads full catalogue** — query now uses `.range(0, 4999)` to override Supabase's 1000-row default cap; full ~1700-event catalogue now loads correctly
- **Keyword search — EventList** — now splits input into tokens (`"žalgiris rytas"` → two tokens); every token must appear in title; trailing spaces no longer break results; Lithuanian diacritics stripped before comparison (`"gargzdai"` matches `"Gargždai"`)
- **Keyword search — ListTicket seller form** — same token + diacritic fix applied; DB query uses first token (broad), client filters for all tokens; limit raised to 20 before slicing to 8

### Fixed
- **Search returning 0 results with trailing space** — `"Rytas "` now finds "Rytas" events in both `EventList` and `ListTicket` seller search
- **Multi-word search ignoring diacritics** — `"gargzdai"` now matches `"Gargždai"`, `"siauliai"` matches `"Šiauliai"` etc.; `transliterate()` applied to both tokens and titles
- **Only 1000 events loading** — Supabase `max-rows` project setting raised to 5000; `.range(0, 4999)` added to query

---

## [Unreleased] — Iteration 5.5 — 2026-02-28

### Fixed
- **bilietai.lt scraper** — was only scraping the first page (~53 events); now paginates all pages (`?page=N`) until empty, yielding 748 events
- **kakava.lt scraper** — fully rewritten to use the public REST API (`api.kakava.lt/api/v1/event/show`) instead of Puppeteer + Bright Data Scraping Browser; yields 923 events reliably with no browser overhead
- **In-batch slug collisions** — `upsertEvents` now deduplicates rows by slug within each batch before sending to Postgres, preventing `ON CONFLICT DO UPDATE command cannot affect row a second time` errors
- **Empty `startDate` string** — bilietai JSON-LD sometimes emits `startDate: ""` which Postgres rejects as a timestamptz; now coerced to `null`

### Changed
- **`kakava.ts`** — `BRIGHT_DATA_SCRAPING_BROWSER_URL` no longer required; kakava.lt has a public REST API
- **`bilietai.ts`** — cookie session established once and reused across all 13 pages; per-page error handling added (a single failed page skips rather than aborting the run); stops after 2 consecutive empty pages
- **`generateSlug`** — now transliterates Lithuanian characters before stripping (`ą→a`, `č→c`, `ę→e`, `ė→e`, `į→i`, `š→s`, `ų→u`, `ū→u`, `ž→z`), producing more readable and collision-resistant fallback slugs
- **Slug strategy** — bilietai events use the numeric ID from the detail URL (`bilietai-{id}`); kakava shows use the API `shortId` (`kakava-{shortId}`); both guarantee uniqueness independent of title or date
- **GitHub Actions workflow** — removed `BRIGHT_DATA_SCRAPING_BROWSER_URL` secret (no longer needed)
- **`ScrapedEvent` interface** — added optional `slug` field; when set, overrides auto-generated slug in `upsertEvents`

### Removed
- `fetchRenderedPage()` from `scripts/scraper/utils.ts` — Puppeteer/CDP function no longer used by any scraper
- `puppeteer-core` import from `utils.ts`

---

## [Unreleased] — Iteration 5 — 2026-02-28

### Added
- **SmartID identity verification** — sellers can verify identity at `/verify`; 4-digit code shown, polled every 2 s for up to 90 s; sandbox personal code `40404040009` auto-approves for testing
- **Verified Seller badge** — `EventDetail.tsx` shows "Patvirtintas" green badge on ticket listings from verified sellers; profile data fetched separately (no FK join needed)
- **Listing gate for unverified sellers** — `ListTicket.tsx` shows a yellow banner and disables the submit button until `user_metadata.verified = true`
- **"Patvirtinti tapatybę" nav link** — shown in `Layout.tsx` for logged-in, unverified users; disappears after verification
- **Admin Listings page** (`/admin/listings`) — admin views all tickets across all sellers, can deactivate any active listing
- **Admin Users page** (`/admin/users`) — admin views all registered users, can suspend / unsuspend (10-year ban); guard prevents suspending self or other admins
- **`supabase/functions/smartid-verify`** — Edge Function (no JWT verify required at gateway); `initiate` action calls SmartID sandbox API; `poll` action checks session status; on success calls `supabase.auth.admin.updateUserById` to set `user_metadata.verified = true` and upserts `profiles` row
- **`supabase/functions/admin-users`** — Edge Function; `GET` lists all auth users; `POST` suspends/unsuspends via `ban_duration`; restricted to `is_admin` callers
- **`supabase/migrations/009_admin_tickets_policy.sql`** — admin SELECT-all and UPDATE-any policies on `tickets` table
- **`supabase/migrations/010_profiles.sql`** — `profiles` table (`id`, `verified`, `verified_at`); public SELECT, service-role write only
- **GitHub Actions daily cron** (`.github/workflows/scraper-cron.yml`) — runs `npm run scrape` at 04:00 UTC every day; `workflow_dispatch` available for manual runs
- **`fetchRenderedPage()`** in `scripts/scraper/utils.ts` — Puppeteer + Bright Data Scraping Browser (CDP/WebSocket) for JS-rendered SPAs *(removed in Iteration 5.5 — kakava.lt switched to REST API)*

### Changed
- **`kakava.ts` scraper** — rewritten to use `fetchRenderedPage()` instead of axios; selectors updated for React SPA rendered DOM *(subsequently replaced in Iteration 5.5 with direct REST API call)*
- **`EventDetail.tsx`** — ticket query no longer attempts a `profiles!seller_id` join (no direct FK); profiles fetched in a separate query keyed by seller IDs
- **`Layout.tsx`** — admin nav restructured: "Admin" link split into "Išmokos" / "Skelbimai" / "Vartotojai"

### Fixed
- `admin-users` Edge Function — missing CORS headers and OPTIONS preflight handler added; all responses now include `Access-Control-Allow-Origin: *`
- `smartid-verify` Edge Function — CORS headers added to 401 (missing auth) and 400 (invalid JSON) responses
- `smartid-verify` — `countryCode` validated against `/^[A-Z]{2}$/`, `personalCode` against `/^\d{11}$/`, `sessionId` against UUID format before URL interpolation
- `admin-users` — `userId` validated as UUID format before `updateUserById` call
- `Verify.tsx` — deferred `setTimeout(startPoll, delay)` now tracked in `pollStartRef` and cancelled on unmount (zombie interval fix)
- `Verify.tsx` — post-success navigation `setTimeout` tracked in `navTimerRef` and cancelled on unmount
- `ListTicket.tsx` — `if (submitting) return` guard added before validation to prevent double-submit
- `ListTicket.tsx` — silent `!user` return replaced with visible Lithuanian error message

### Security
- `smartid-verify` — input allowlist validation prevents path traversal in SmartID API URL construction
- `admin-users` — UUID format validation on `userId` before admin API call

---

## [Unreleased] — Iteration 4 — 2026-02-28

### Added
- **Seller earnings page** (`/my-earnings`) — sellers see total pending and total paid amounts, plus a chronological list of individual payouts with event name, sale date, amount, and status badge
- **Admin payouts page** (`/admin/payouts`) — internal page for marking payouts as sent; admin enters the Stripe transfer ID and clicks "Pažymėti kaip išsiųstą"; only visible to users with `is_admin: true` in Supabase user metadata
- `supabase/migrations/007_payouts.sql` — `payouts` table; RLS: sellers read own rows, admin reads/updates all via `is_admin` metadata flag
- `supabase/migrations/008_payouts_not_null.sql` — adds `NOT NULL` to `order_id`, `seller_id`, `amount` on `payouts`
- **Nav** — "Mano pajamos" link added for all authenticated users; "Admin" link added when `is_admin` is set

### Changed
- `stripe-webhook` Edge Function — after marking order as `paid` and ticket as `sold`, inserts a `pending` payout row for the seller (`order_id`, `seller_id`, `amount`); payout creation failure is non-fatal and logged

### Fixed
- `AdminPayouts.tsx` — Rules of Hooks violation: `useEffect` was called after a conditional `return <Navigate>`, causing a crash in StrictMode; redirect moved after all hook declarations
- `AdminPayouts.tsx` — save error was a single global string shared across all rows; replaced with per-row `Record<string, string>` so errors appear inline under the correct payout

---

## [Unreleased] — 2026-02-28

### Added
- `scripts/verify-migrations.ts` — queries `tickets` and `orders` via service-role key and logs row counts; confirms tables and RLS are live after migration

### Changed
- Removed `publicSupabase` client from `src/lib/supabase.ts` — the workaround (session-less anon client) is no longer needed now that migration 004 (`authenticated read events` policy) is applied to the live DB
- `EventList.tsx` — reverted import back to `supabase`; event listing now uses the normal authenticated client

### Fixed
- **Events not shown when logged in** — permanently resolved by applying migration 004 (`CREATE POLICY "authenticated read events"`) to the live DB; the temporary `publicSupabase` workaround is removed

---

## [Unreleased] — 2026-02-27

### Fixed
- **Events not shown when logged in** — authenticated users saw an empty event list because the `authenticated` RLS role had no SELECT policy on `events` (only `anon` did). Added `publicSupabase` client in `src/lib/supabase.ts` (session-less, always anon role) and switched `EventList.tsx` to use it; event listing now works regardless of auth state. Permanent DB fix: apply `004_events_authenticated_read.sql` migration in the Supabase SQL editor.
- **Stale event data** — all events in the DB had past dates; re-ran `npm run scrape` to populate 60 fresh upcoming events from bilietai.lt (zalgiris and kakava scrapers currently failing — see known issues).
- `EventList.tsx` — added `console.error` on Supabase query failure to surface RLS/credential issues during development.

---

## [Unreleased] — Iteration 3 — 2026-02-27

### Added
- **Buyer purchase flow** — authenticated buyers can purchase tickets via Stripe-hosted Checkout; "Pirkti" button on `/events/:slug` is now live
- **Order confirmation page** (`/order-success`) — shown after successful payment; displays event title, amount paid, status badge, and email confirmation note
- **Order history page** (`/my-orders`) — protected route listing all buyer orders with event title, date, amount, and status
- **Nav** — "Mano užsakymai" link added to authenticated nav in `Layout.tsx`
- `supabase/functions/create-checkout/index.ts` — Deno Edge Function; verifies JWT, atomically reserves ticket via `reserve_ticket` RPC, creates Stripe Checkout Session, inserts pending order, returns redirect URL
- `supabase/functions/stripe-webhook/index.ts` — Deno Edge Function; verifies Stripe signature, handles `checkout.session.completed` (marks order paid, ticket sold, emails buyer PDF link via Resend) and `checkout.session.expired` (releases reservation, deletes pending order)
- `supabase/migrations/005_orders.sql` — `orders` table with RLS (buyers read own orders only; Edge Functions write via service role)
- `supabase/migrations/006_ticket_reservation.sql` — adds `'reserved'` ticket status; `reserve_ticket(uuid, uuid)` and `unreserve_ticket(uuid)` Postgres functions for atomic reservation
- `.env.example` — added `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SITE_URL`

### Changed
- `src/pages/EventDetail.tsx` — "Pirkti" button enabled; unauthenticated users redirected to `/login?next=...`; per-ticket loading state (`loadingTicketId`) prevents concurrent clicks; global disabled placeholder button removed
- `src/pages/MyListings.tsx` — added `'reserved'` status label ("Rezervuotas", yellow badge) for tickets mid-checkout
- `src/main.tsx` — added `/order-success` (public) and `/my-orders` (protected) routes

### Fixed
- **Race condition** — two buyers simultaneously clicking "Pirkti" on the same ticket could both receive a Stripe URL; fixed by replacing the JS-level status check with the atomic `reserve_ticket` RPC (`UPDATE … WHERE status = 'active'`)
- **Duplicate emails on Stripe webhook retry** — Stripe retries webhooks on failure; fixed by filtering the order update with `.eq('status', 'pending')` — if the order is already `'paid'`, the update matches 0 rows and the handler returns 200 without re-sending the email
- **Orphaned reservations** — if Stripe session creation or order insert fails, `unreserve_ticket` is called so the ticket doesn't get stuck as `'reserved'`
- `create-checkout` — added null guard for `ticket.events` join (orphaned ticket with no matching event now returns 404 instead of crashing)
- `stripe-webhook` — added explicit `stripe-signature` header null check before passing to Stripe SDK

---

## [Unreleased] — 2026-02-26

### Fixed
- `EventList.tsx` — event list now only shows upcoming events (`date >= now` or `date` is null); past events are excluded at the query level, not client-side
- `EventList.tsx` — empty state now distinguishes "no upcoming events in DB" (`Šiuo metu nėra artėjančių renginių.`) from "filters too narrow" (`Renginių nerasta.`)

---

## [Unreleased] — Iteration 2 — 2026-02-26

### Added
- **Auth** — email + password registration (`/register`) and login (`/login`) via Supabase Auth
- **Seller flow** — `/sell` page: event search dropdown, ticket fields (price, quantity, split type, seating type, seat numbers), PDF upload to private Supabase Storage bucket `ticket-pdfs`
- **My Listings** (`/my-listings`) — sellers can view all their own tickets with status badges and cancel active listings
- **EventDetail** — "Parduodami bilietai" section shows active seller tickets for the event (price, quantity, seat info); per-row "Pirkti" button is disabled until Iteration 3
- **Shared nav bar** (`Layout.tsx`) — auth-aware links; shows Parduoti / Mano skelbimai / Atsijungti when logged in, Prisijungti / Registruotis otherwise
- `src/context/AuthContext.tsx` — `AuthProvider` + `useAuth()` hook; single source of truth for session state
- `src/components/ProtectedRoute.tsx` — redirects unauthenticated users to `/login`
- `supabase/migrations/002_tickets.sql` — `tickets` table, 4 RLS policies, private `ticket-pdfs` storage bucket
- `supabase/migrations/003_tickets_rls_fix.sql` — tightens UPDATE policy: sellers can only set `status = 'cancelled'`, not mutate other columns

### Changed
- `src/main.tsx` — converted to layout route pattern (`<Layout>` + `<Outlet>`); added `/register`, `/login`, `/sell`, `/my-listings` routes; wrapped in `<AuthProvider>`
- `src/pages/EventDetail.tsx` — now fetches active tickets for the event after loading event data; surfaces ticket fetch errors inline

### Fixed
- `Register.tsx` — checks `data.session` after `signUp()`; if email confirmation is required (session is null), shows "Patikrinkite el. paštą" screen instead of silently redirecting to a protected route
- `Layout.tsx` — nav links hidden during auth initialisation to prevent flash of unauthenticated state for logged-in users; `signOut()` only navigates on success
- `ListTicket.tsx` — if ticket row INSERT fails after PDF upload, the orphan file is removed from storage; event search dropdown closes on outside click
- `MyListings.tsx` — cancel failures show an inline error message instead of replacing the entire page with a full-screen error
- `Login.tsx` — Supabase error messages translated to Lithuanian for the three most common cases (invalid credentials, unconfirmed email, rate limit)

### Security
- `tickets` UPDATE RLS policy now enforces `WITH CHECK (seller_id = auth.uid() AND status = 'cancelled')` — sellers cannot self-mark tickets as sold or change price/quantity after listing

---

## [Unreleased] — 2026-02-26

### Added
- `EventDetail.tsx` — link to original ticket source (`detail_url`) shown below the buy button when available

### Changed
- `scripts/scraper/utils.ts` — `proxyConfig()` now reads and validates `BRIGHT_DATA_API_TOKEN`/`BRIGHT_DATA_ZONE` at call time (throws) rather than at module import time (`process.exit`); scrapers that don't use the proxy (bilietai) can import `utils.ts` without requiring Bright Data env vars
- `scripts/scraper/bilietai.ts` — removed redundant `dotenv.config()` call; removed unused `BD_ZONE`/`BD_TOKEN` imports; replaced `as any` casts on `set-cookie` headers with `Array.isArray` guards
- `scripts/scraper/index.ts` — corrected JSDoc: `VITE_SUPABASE_ANON_KEY` → `SUPABASE_SERVICE_ROLE_KEY`

### Fixed
- `EventList.tsx` — result count now uses correct Lithuanian plural forms (1 → renginys, 2–9 → renginiai, 10+ → renginių)

---

## [Unreleased] — 2026-02-25

### Added
- `CHANGELOG.md` — this file
- `ROADMAP.md` — Iteration 1.5 code quality checklist (8 items from post-launch code review)
- `.env` — created from `.env.example` with Supabase, Bright Data, and service role credentials
- `.env.example` — added `SUPABASE_SERVICE_ROLE_KEY` with note that it must never reach the frontend
- `ROADMAP.md` — updated `.env` shape to include `SUPABASE_SERVICE_ROLE_KEY`

### Changed
- `scripts/scraper/utils.ts`
  - Fixed ESM compatibility: replaced `require('https')` with `import https from 'https'`
  - Fixed Bright Data proxy config: was computing `proxyUrl` but never using it; now passes `proxy: { host, port, auth }` to axios correctly
  - Switched Supabase client from `VITE_SUPABASE_ANON_KEY` to `SUPABASE_SERVICE_ROLE_KEY` — anon key has read-only RLS, scraper needs write access

- `scripts/scraper/bilietai.ts` — full rewrite
  - Fixed URL: `/lt/renginiai` (404) → `/lit/renginiai/visi/`
  - Fixed selectors: `a.event_short`, `.event_short_title`, `time.event_short_datetime[datetime]`, `.event_short_venue_text`, `img.event_short_image`
  - Added cookie handshake: homepage → `/beta/assign` → events page (required by bilietai.lt session init)
  - Removed Bright Data proxy (bilietai.lt accessible directly); 60 events scraped and upserted successfully
