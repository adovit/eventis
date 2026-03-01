# Architecture — Eventis

**Last updated**: 2026-03-01 (Sprint 6.1 — Home Page Modernisation + RLS fixes 014)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React)                       │
│  Vite + React + Tailwind · Supabase JS client · Stripe.js   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐
│   Supabase      │    │   Stripe             │
│  - Postgres DB  │    │  - Checkout sessions │
│  - Auth (JWT)   │    │  - Webhooks          │
│  - Storage      │    │  - Transfers         │
│  - Edge Fns     │◄───│  (webhook → Edge Fn) │
│  - RLS policies │    └──────────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────────┐
│   Scraper       │    │   SmartID (Phase 2)  │
│  (Node.js/tsx)  │    │  - IDV API           │
│  Bright Data    │    │  - Webhook callback  │
│  proxy (zalgir) │    └──────────────────────┘
└─────────────────┘
```

---

## Component Architecture

### Frontend (`src/`)
```
src/
├── components/
│   ├── Layout.tsx          # App shell — sticky nav, mobile hamburger, footer; brand-600 avatar (desktop only)
│   ├── ProtectedRoute.tsx  # Redirects to /login?returnUrl=<current-path>
│   └── ui/                 # Shared design-system components (see docs/design-system.md)
│       ├── Button.tsx      # 4 variants (primary/secondary/ghost/danger) × 3 sizes; loading spinner; token classes
│       ├── Badge.tsx       # 6 semantic variants (success/warning/danger/neutral/info/brand); token bg/text
│       ├── Input.tsx       # Label, required asterisk, error, helperText; leadingIcon slot (absolute-left, pl-9); onClear × button (absolute-right, pr-8); token focus ring
│       ├── Select.tsx      # Custom headless dropdown (not native <select>); value/onChange/options/placeholder; click-outside + Escape close; keyboard nav (Enter/Space on options); role="listbox"/aria-expanded; dark-mode safe
│       ├── Card.tsx        # bg-bg-primary border-border shadow-sm; hover lift on clickable variant
│       ├── Skeleton.tsx    # animate-pulse bg-border, configurable rounding
│       ├── EmptyState.tsx  # icon + title + description + ghost action (link or button)
│       └── index.ts        # Barrel export (Button, Badge, Input, Select, Card, Skeleton, EmptyState)
├── hooks/
│   ├── useDocumentMeta.ts  # DOM-based SEO: sets document.title, og meta, canonical link; resets on unmount
│   └── useTheme.ts         # Dark/light mode: derives initial state from FOUC script <html> class; toggleTheme/setTheme persist to localStorage; MediaQueryList listener for OS changes
├── pages/
│   ├── EventList.tsx       # / — home hero + SVG stat section (value prop) + event grid + filters (custom Select + date chip presets) + pagination
│   ├── EventDetail.tsx     # /events/:slug — event detail + resale ticket listings
│   ├── ListTicket.tsx      # /sell — seller listing form (with page hero)
│   ├── Login.tsx           # /login — email+pw + Google OAuth
│   ├── Register.tsx        # /register — email+pw + Google OAuth
│   ├── Profile.tsx         # /profile — account hub (fully on brand-*/neutral-* tokens)
│   ├── MyListings.tsx      # /my-listings — seller dashboard
│   ├── MyOrders.tsx        # /my-orders — buyer order history
│   ├── MyEarnings.tsx      # /my-earnings — seller payout view
│   ├── NewsIndex.tsx       # /naujienos — news article list with category filter (public)
│   ├── NewsDetail.tsx      # /naujienos/:slug — article detail with SEO meta + share (public)
│   ├── OrderSuccess.tsx    # /order-success — post-purchase confirmation
│   ├── Verify.tsx          # /verify — SmartID identity verification
│   ├── AdminPayouts.tsx    # /admin/payouts — admin payout management
│   ├── AdminListings.tsx   # /admin/listings — admin ticket moderation
│   └── AdminUsers.tsx      # /admin/users — admin user suspend/unsuspend
├── context/
│   └── AuthContext.tsx     # AuthProvider + useAuth() hook
├── lib/
│   ├── supabase.ts         # Supabase client singleton
│   └── tokens.ts           # Static typed mirror of all CSS custom property tokens (light + dark); exports getStripeAppearance(theme) for Stripe Elements theming; no getComputedStyle — safe for SSR
└── main.tsx                # Router — NewsIndex/NewsDetail added as public routes
```

### Backend — Supabase

**Edge Functions** (Deno runtime):
- `create-checkout/` — creates Stripe Checkout session, atomically reserves ticket
- `stripe-webhook/` — handles `checkout.session.completed`: marks order paid, ticket sold, emails PDF, creates payout record
- `smartid-verify/` — SmartID identity verification; `initiate` action starts session, `poll` action checks result and sets `user_metadata.verified = true` + upserts `profiles`
- `admin-users/` — admin-only; `GET` lists all auth users, `POST` suspends/unsuspends via `ban_duration`

**Cron**:
- `.github/workflows/scraper-cron.yml` — GitHub Actions, runs daily at 04:00 UTC via `npm run scrape`

**Storage buckets**:
- `ticket-pdfs` — seller PDF uploads (private, RLS-protected; sellers write to own folder only)

---

## Database Schema

### `events`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| title | text NOT NULL | |
| date | timestamptz | |
| location | text | |
| category | text | |
| image_url | text | |
| detail_url | text | Source page URL |
| source | text | 'bilietai' \| 'zalgiris' \| 'kakava' |
| price_from | numeric(10,2) | Cheapest hint from source |
| slug | text UNIQUE NOT NULL | URL identifier |
| is_active | boolean | default true |
| scraped_at | timestamptz | default now() |

### `tickets`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | uuid FK → events | |
| seller_id | uuid FK → auth.users | |
| price | numeric(10,2) NOT NULL | |
| quantity | int | default 1 |
| split_type | text | 'any'\|'none'\|'avoid_one' |
| seating_type | text | 'seated'\|'standing' |
| section | text | |
| row | text | |
| seat_from | int | |
| seat_to | int | |
| ticket_file_url | text | Supabase Storage URL |
| status | text | 'active'\|'reserved'\|'sold'\|'cancelled' |
| created_at | timestamptz | |

### `event_ticket_summary` (view)
| Column | Type | Notes |
|--------|------|-------|
| event_id | uuid | FK → events |
| ticket_count | int | Count of active listings |
| min_price | numeric(10,2) | Lowest active listing price |

Read-only view. Runs with definer security (bypasses RLS); safe — filters `WHERE status = 'active'` so only public data is exposed. `GRANT SELECT` to `anon, authenticated`. Used by `EventList.tsx` to show ticket availability badges without N+1 queries. Migration: `011_ticket_summary_view.sql`.

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK FK → auth.users | ON DELETE CASCADE |
| verified | boolean NOT NULL | default false |
| verified_at | timestamptz | set by `smartid-verify` Edge Function |

RLS: public SELECT (all rows — for Verified badge on EventDetail); INSERT/UPDATE for own row (authenticated user — for Google OAuth users who may not have a profile row yet); INSERT/UPDATE via service_role (Edge Function, bypasses RLS).

### `payout_info` *(added Iteration 5.7)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK FK → auth.users | ON DELETE CASCADE |
| iban | text | nullable; DB-enforced: `CHECK (iban IS NULL OR iban ~ '^LT[0-9]{18}$')` |
| updated_at | timestamptz | default now(), updated on every upsert |

RLS: authenticated user can SELECT/INSERT/UPDATE own row only (`id = auth.uid()`); service_role reads all (admin payout processing). **Not publicly readable — financial data.**
Migrations: `012_payout_info.sql` (table + RLS); `015_payout_info_iban_check.sql` (IBAN format constraint).

### `articles` *(added Sprint 6)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| slug | text UNIQUE NOT NULL | URL identifier (e.g. `zaligirio-arena-bilietai`) |
| title | text NOT NULL | |
| excerpt | text | Short preview text |
| body | text NOT NULL | Raw text / Markdown (rendered with `whitespace-pre-wrap`) |
| cover_image_url | text | Optional hero image |
| category | text | CHECK: `'Renginiai'` `'Menininkai'` `'Naujienos'` `'Patarimai'` |
| author_name | text | default `'Eventis'` |
| published_at | timestamptz | Scheduled publish time |
| is_published | boolean NOT NULL | default false |
| created_at | timestamptz NOT NULL | default now() |

RLS: public SELECT only when `is_published = true AND published_at <= now()`. No public INSERT/UPDATE. Admins write via Supabase dashboard or service_role. Migration: `013_articles.sql`.

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| ticket_id | uuid FK → tickets | |
| event_id | uuid FK → events | |
| buyer_id | uuid FK → auth.users | |
| stripe_session_id | text UNIQUE | |
| amount_paid | numeric(10,2) | |
| status | text | 'pending'\|'paid'\|'refunded' |
| created_at | timestamptz | |

### `payouts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_id | uuid FK → orders NOT NULL | |
| seller_id | uuid FK → auth.users NOT NULL | |
| amount | numeric(10,2) NOT NULL | |
| status | text | 'pending'\|'sent' |
| payout_date | timestamptz | |
| stripe_transfer_id | text | |
| created_at | timestamptz | |

---

## Auth & Security

### Role model
- **Anonymous**: Can read events. Cannot read tickets/orders.
- **Authenticated user (seller)**: Can CRUD own tickets. Can read own orders. Can read own payouts.
- **Authenticated user (buyer)**: Can read active tickets. Can create orders. Can read own orders.
- **Admin**: Special `auth.users` metadata flag. Full read on all tables.

### RLS Policy principles
- `events`: public SELECT, no INSERT/UPDATE from frontend (scraper uses service_role)
- `tickets`: anon SELECT (active only), seller INSERT/UPDATE own rows, admin SELECT all + UPDATE any
- `orders`: buyer INSERT own, buyer/seller SELECT own rows
- `payouts`: seller SELECT own, admin SELECT all, admin UPDATE status
- `profiles`: public SELECT (for Verified badge); authenticated user INSERT own row only with `WITH CHECK (id = auth.uid() AND verified = false AND verified_at IS NULL)` — prevents self-inserting `verified=true` to bypass SmartID; no UPDATE from frontend; service_role all (SmartID Edge Function sets verified/verified_at) — Migration `014_rls_fixes.sql`
- `tickets`: anon and authenticated SELECT for `status = 'active'`; seller INSERT/UPDATE own rows; admin SELECT all + UPDATE any — `"authenticated read active tickets"` policy added in `014_rls_fixes.sql` (previously `TO anon` only caused logged-in buyers to see 0 tickets)
- `payout_info`: authenticated user SELECT/INSERT/UPDATE own row only; no public access; service_role reads all

### Admin flag
`is_admin: true` in `auth.users.raw_user_meta_data`. Checked in RLS policies via `(auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true` and in Edge Functions via `supabaseAdmin.auth.getUser()`.

### Secrets handling
- `SUPABASE_ANON_KEY` — safe in Vite bundle (limited permissions, enforced by RLS)
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only (scraper, Edge Functions)
- `STRIPE_SECRET_KEY` — Edge Functions only, never in frontend
- `STRIPE_WEBHOOK_SECRET` — Edge Functions only
- `SMARTID_RELYING_PARTY_UUID` — Edge Function secret (`smartid-verify`)
- `SMARTID_RELYING_PARTY_NAME` — Edge Function secret (`smartid-verify`)
- `SMARTID_BASE_URL` — Edge Function secret; defaults to `https://sid.demo.sk.ee/smart-id-rp/v2`
- `BRIGHT_DATA_API_TOKEN` / `BRIGHT_DATA_ZONE` — scraper `.env` only; only needed for zalgiris (HTTP proxy); kakava and bilietai no longer require Bright Data

---

## Integration Architecture

### Stripe flow
```
Buyer clicks "Buy"
  → Frontend creates Stripe Checkout session (via Supabase Edge Fn or direct API)
  → Buyer completes payment on Stripe hosted page
  → Stripe fires webhook → stripe-webhook Edge Function
  → Edge Function: order=paid, ticket=sold, email PDF, create payout record
  → Buyer lands on /order-success
```

### SmartID flow
```
Seller visits /verify, enters personal code + country
  → POST smartid-verify { action: 'initiate', personalCode, countryCode }
  → Edge Function: validate inputs → POST SmartID API /authentication/pno/{country}/{code}
  → Returns { sessionId, verificationCode } (4-digit code shown to seller)
  → Frontend polls every 2 s: POST smartid-verify { action: 'poll', sessionId }
  → Edge Function: GET SmartID /session/{sessionId}
  → On COMPLETE + OK: updateUserById(verified: true) + upsert profiles
  → Frontend: refreshSession() → user_metadata.verified = true → redirect /sell
```
Mock bypass: personal code `40404040009` skips SmartID API entirely (sandbox only — remove before production).

### Scraping flow
```
GitHub Actions cron (04:00 UTC daily) OR manual: npm run scrape
  → scripts/scraper/index.ts
  → bilietai.ts: axios (cookie session) → HTML pages 1–N → JSON-LD extraction (~748 events)
  → zalgiris.ts: axios + Bright Data HTTP proxy → Cheerio (currently 403)
  → kakava.ts: axios → public REST API api.kakava.lt/api/v1/event/show (~923 events)
  → Deduplicate by slug within batch
  → Upsert to events table via service_role client (conflict on slug)
```

**Slug strategy**: bilietai uses `bilietai-{numeric-id}` from detail URL; kakava uses `kakava-{shortId}` from API; zalgiris uses auto-generated `generateSlug(source, title, date)`. All sources apply Lithuanian-to-ASCII transliteration before slug generation.

**Location format**: When both venue name and city are available, stored as `"Venue Name, City"` (e.g. `"Žalgirio Arena, Kaunas"`). bilietai extracts city from JSON-LD `location.address.addressLocality`; kakava uses `show.city.name`. This ensures the city substring filter on `EventList` works correctly for venue-named locations.

**Category strategy**: bilietai extracts category from the URL path segment (`/renginiai/{category}/`); kakava infers from event title via keyword regex map. zalgiris defaults to `'Sportas'` with DOM class fallback.

---

## Edge Function Reference

### create-checkout

**URL**: `POST /functions/v1/create-checkout`
**Auth**: Bearer JWT required (verified via `supabaseAdmin.auth.getUser`)
**Gateway JWT verify**: disabled (`--no-verify-jwt`)

#### Implementation note
Stripe client uses a **lazy singleton** (`getStripe()`) — not initialised at module scope. This prevents cold-start crashes if `STRIPE_SECRET_KEY` is briefly unavailable when the function loads. `supabaseAdmin` remains at module scope (safe — Supabase client constructor does not validate or connect immediately).

**CORS**: must include `authorization, x-client-info, apikey, content-type` in `Access-Control-Allow-Headers`. Missing `x-client-info` or `apikey` causes the browser's OPTIONS preflight to fail, blocking all `supabase.functions.invoke()` calls before they reach the handler. All browser-callable Edge Functions must use this 4-header pattern.

#### What it does
1. Verifies caller JWT and extracts `buyer_id` + `buyer_email`
2. Validates `ticket_id` from request body
3. Fetches ticket + joined event (`id`, `title`, `slug`)
4. Guards: rejects if ticket not found, event orphaned, or buyer is the seller
5. Atomically reserves ticket via `reserve_ticket(p_ticket_id, p_buyer_id)` RPC — prevents race conditions
6. Creates Stripe Checkout Session via `getStripe()` (mode: `payment`, currency: EUR); `origin` header used for `success_url` / `cancel_url`
7. Inserts `pending` order row
8. Returns `{ url: session.url }` for frontend redirect
9. On any failure after reservation, calls `unreserve_ticket` to release

#### Environment variables required
- `STRIPE_SECRET_KEY` — Stripe live/test secret key
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (bypasses RLS)
- `SITE_URL` *(optional)* — fallback origin for redirect URLs when `origin` header absent

#### Error responses
- 401: missing/invalid JWT
- 400: `ticket_id` missing, or buyer is the seller
- 404: ticket or event not found
- 409: ticket no longer available (already reserved/sold)
- 500: Stripe session creation failed or order insert failed

---

### smartid-verify

**URL**: `POST /functions/v1/smartid-verify`
**Auth**: Bearer JWT required (verified via `supabaseAdmin.auth.getUser`)
**Gateway JWT verify**: disabled (`--no-verify-jwt`)

#### What it does
1. Validates `countryCode` (2-letter allowlist) and `personalCode` (11-digit) or `sessionId` (UUID)
2. `initiate`: POSTs to SmartID API, returns `{ sessionId, verificationCode }`
3. `poll`: GETs SmartID session status; on success calls `auth.admin.updateUserById(verified: true)` and upserts `profiles`
4. Mock bypass: personal code `40404040009` → instant approval (sandbox only)

#### Environment variables required
- `SMARTID_RELYING_PARTY_UUID` — from SK ID Solutions demo portal
- `SMARTID_RELYING_PARTY_NAME` — from SK ID Solutions demo portal
- `SMARTID_BASE_URL` — defaults to `https://sid.demo.sk.ee/smart-id-rp/v2`

#### Error responses
- 400: missing/invalid inputs
- 401: missing or invalid JWT
- 502: SmartID API returned non-2xx

---

### admin-users

**URL**: `GET /functions/v1/admin-users` · `POST /functions/v1/admin-users`
**Auth**: Bearer JWT required; caller must have `user_metadata.is_admin = true`
**Gateway JWT verify**: disabled (`--no-verify-jwt`)

#### What it does
- `GET`: returns array of `{ id, email, created_at, banned_until, is_admin }` for all users
- `POST { action: 'suspend' | 'unsuspend', userId }`: sets `ban_duration = '87600h'` or `'none'`

#### Error responses
- 401: missing/invalid JWT
- 403: caller is not admin
- 400: invalid action or malformed userId (not a UUID)
- 500: Supabase Admin API failure

---

## ADRs — Architecture Decision Records

### ADR-001: Supabase over custom backend
**Date**: 2026-02 (Iteration 1)
**Status**: Accepted
**Decision**: Use Supabase for DB, auth, storage, and edge functions instead of building a custom Express/Node backend.
**Consequences**: Fast to build, low ops overhead, vendor lock-in to Supabase. Acceptable for this stage.

### ADR-002: Manual Stripe payouts (not automatic)
**Date**: 2026-02 (Iteration 4)
**Status**: Accepted
**Decision**: Admin manually marks payouts as sent and triggers Stripe transfers manually.
**Consequences**: More admin work, but full control over payout timing. Reduces risk of auto-paying before disputes resolve. Automate in Iteration 5+.

### ADR-003: PDF stored in Supabase Storage (not emailed at listing time)
**Date**: 2026-02 (Iteration 2)
**Status**: Accepted
**Decision**: Seller uploads PDF at listing time. PDF delivered to buyer only after payment confirmed.
**Consequences**: Prevents PDF theft before payment. Requires reliable Edge Function webhook.

### ADR-004: Service-role key in scraper, not in frontend
**Date**: 2026-02 (Iteration 1)
**Status**: Accepted
**Decision**: Scraper writes to DB using service_role key (bypasses RLS). Frontend uses anon key only.
**Consequences**: Scraper can upsert any row. Must never expose this key to client.

### ADR-005: SmartID verification sets `user_metadata.verified` (not just `profiles.verified`)
**Date**: 2026-02 (Iteration 5)
**Status**: Accepted
**Decision**: On successful SmartID verification, the Edge Function calls `auth.admin.updateUserById({ user_metadata: { verified: true } })` in addition to upserting the `profiles` row. `profiles.verified` is the canonical record; `user_metadata.verified` is the cached value the frontend reads after `refreshSession()`.
**Consequences**: Single `refreshSession()` call is enough for the frontend to reflect verification. If `profiles` upsert fails it is non-fatal — `user_metadata` is the gate for listing.

### ADR-006: Scraper cron via GitHub Actions, not Supabase cron
**Date**: 2026-02 (Iteration 5)
**Status**: Accepted
**Decision**: Daily scraper triggered by GitHub Actions scheduled workflow, not a Supabase Edge Function cron.
**Consequences**: Zero rewrite of existing Node.js scraper; free tier sufficient; requires 5 GitHub Actions secrets. Logs visible in GitHub Actions UI.

### ADR-007: IBAN stored in separate `payout_info` table, not in `profiles`
**Date**: 2026-03 (Iteration 5.7)
**Status**: Accepted
**Context**: PRD originally specified `profiles.iban`. However, `profiles` has a `public SELECT USING (true)` policy (needed for the Verified badge on EventDetail). Supabase RLS operates at the row level — column-level restriction is not possible via policies alone. Adding `iban` to `profiles` would expose every user's bank account number to any anonymous Supabase query.
**Decision**: Create a separate `payout_info` table with RLS restricted to: owner reads/writes own row; service_role reads all (for admin payout processing). `profiles` is untouched.
**Consequences**: One extra table and migration. Frontend reads from `payout_info` for profile page. Admin payout tooling (future) can join `payout_info` via service_role. Slightly more complex query on Profile page (two fetches). Correct security posture for financial data.

### ADR-008: Google OAuth callback via Login page with `?returnUrl=` param
**Date**: 2026-03 (Iteration 5.7)
**Status**: Accepted
**Context**: After Google OAuth, Supabase redirects to the `redirectTo` URL we specify. We need to preserve the user's intended destination (e.g., the event they were buying from) through the OAuth round-trip.
**Decision**: Pass `redirectTo: '${origin}/login?returnUrl=${encoded}'` to `signInWithOAuth`. Login.tsx gets a `useEffect` that calls `supabase.auth.getSession()` on mount — if a session exists (including post-OAuth return), it navigates to `returnUrl` (default: `/`). This reuses the existing Login page as an implicit OAuth callback handler with no extra route needed.
**Consequences**: Login page briefly renders before redirect on OAuth return. Acceptable — it's instant. No separate `/auth/callback` route needed. `returnUrl` must be URI-encoded and decoded before navigation. Standardize all redirects to `/login?returnUrl=` (replace existing `?next=` in EventDetail).

### ADR-010: Design tokens over raw Tailwind palette classes
**Date**: 2026-03 (Sprint 6)
**Status**: Accepted
**Decision**: All components and pages must use semantic design token classes (`brand-*`, `neutral-*`, `success-*`, `warning-*`, `danger-*`, `info-*`) defined in `tailwind.config.js`. Raw Tailwind palette classes (`gray-*`, `indigo-*`, `green-*`, `red-*`, etc.) are forbidden in `src/` files.
**Consequences**: Changing the brand color or any semantic color requires editing only `tailwind.config.js` and `docs/design-system.md`, not hunting across dozens of files. Enforced via code review. See `docs/design-system.md` section 11 (Forbidden Patterns) for the full list.

### ADR-011: UI components in `src/components/ui/`, no external component library
**Date**: 2026-03 (Sprint 6)
**Status**: Accepted
**Decision**: Build and own all UI primitives (Button, Badge, Input, Card, Skeleton, EmptyState) instead of installing a third-party component library (e.g., shadcn/ui, Radix, Chakra).
**Consequences**: Full control over styling and tokens with zero dependency risk. More initial work, but keeps the bundle lean and avoids fighting library theming systems. Components stay in `src/components/ui/` and are documented in `docs/design-system.md`.

### ADR-012: DOM-based SEO meta (no react-helmet)
**Date**: 2026-03 (Sprint 6)
**Status**: Accepted
**Decision**: Use the custom `useDocumentMeta` hook (direct DOM mutation) instead of installing `react-helmet` or `react-helmet-async` for per-page title and og meta tags.
**Consequences**: Zero new dependencies. Sufficient for the current SSG-less Vite SPA. If server-side rendering is added in future, replace with `react-helmet-async` or Vite SSR meta.

### ADR-013: CSS custom properties as single token source of truth
**Date**: 2026-03 (Iteration 5.9)
**Status**: Accepted
**Context**: Sprint 6 established a design token system using Tailwind numeric scales (`brand-600`, `neutral-200`). To support dark mode, every color must resolve differently depending on context — this is impossible with static hex values in `tailwind.config.js`.
**Decision**: `src/index.css` is the single source of truth. All colors are CSS custom properties defined on `:root` (light) and `:root.dark` (dark). `tailwind.config.js` consumes them via `var(--color-*)` references — it never defines hex values. `src/lib/tokens.ts` is a static JS mirror for non-CSS contexts (Stripe Appearance API). Components use semantic token classes (`bg-bg-primary`, `text-text-secondary`, `border-border`) — not hardcoded utility classes.
**Consequences**: Changing any color in both modes requires editing only `src/index.css`. No `dark:` prefix classes in JSX. Dark mode is a one-line class toggle on `<html>`. CSS var changes are instant; transition is handled by `*, *::before, *::after { transition: color, background-color, border-color 200ms ease }`. `tokens.ts` must be manually kept in sync with `index.css` — no runtime derivation.

### ADR-014: Dark mode via `class` strategy with inline FOUC prevention
**Date**: 2026-03 (Iteration 5.9)
**Status**: Accepted
**Context**: Tailwind's `darkMode: 'media'` applies dark mode based on OS preference only — users cannot override. `darkMode: 'class'` allows user override but requires careful FOUC (Flash of Unstyled Content) prevention because React hydrates after the browser's first paint.
**Decision**: `darkMode: 'class'` in `tailwind.config.js`. Dark mode is activated by adding `class="dark"` to `<html>`. A synchronous inline `<script>` IIFE in `index.html` `<head>` (before any `<link>`) reads `localStorage("theme")`, falls back to `prefers-color-scheme`, and adds the `dark` class if needed — all before the browser paints. A `.no-transition` class is applied during this IIFE and removed via double `requestAnimationFrame` to suppress the 200ms color animation on first load (we only want it on user-triggered toggles). Theme state is managed by `src/hooks/useTheme.ts` which derives its initial value from the existing `<html>` class set by the IIFE — avoiding a React/DOM mismatch on mount.
**Consequences**: Zero FOUC. User OS preference respected on first visit. User toggle overrides OS preference and persists. The double-`rAF` trick is load-order-sensitive — the `.no-transition` class must be added before any CSS transition fires. `useTheme` must not derive initial state from `localStorage` directly (would cause hydration mismatch if SSR is added later).

### ADR-009: ProtectedRoute passes current path as `returnUrl`
**Date**: 2026-03 (Iteration 5.7)
**Status**: Accepted
**Context**: `ProtectedRoute` currently redirects to `/login` with no context. Users who navigate directly to `/sell` or `/profile` while logged out land on the login page with no way back to where they intended.
**Decision**: `ProtectedRoute` reads `useLocation()` and constructs `returnUrl = pathname + search`, passes it to the login redirect. After auth, user is returned to the exact protected route they requested.
**Consequences**: Minimal change to `ProtectedRoute.tsx`. Requires `useLocation` import from react-router-dom.

### ADR-015: Custom headless `<Select>` over native `<select>`
**Date**: 2026-03 (Home Page Modernisation)
**Status**: Accepted
**Context**: Native `<select>` elements cannot be reliably styled in dark mode — OS-level styling overrides CSS across all major browsers. The EventList category and city filter dropdowns were visually broken on dark mode.
**Decision**: Build a custom `Select` component (`src/components/ui/Select.tsx`) using a `<div>` trigger button + absolute-positioned `<ul role="listbox">`. Click-outside close via `useRef`; Escape listener gated on `open` state (only registered when dropdown is open — avoids unnecessary global listeners). Keyboard navigation: `tabIndex={0}` + Enter/Space on `<li role="option">`. Token classes throughout; `aria-expanded`, `aria-haspopup="listbox"`, `aria-selected` for accessibility.
**Consequences**: Fully dark-mode compatible. Zero external library dependency. Accessible via keyboard. Slightly more code than a native element, but the only way to match the token system reliably. Future additions (multi-select, grouped options) are straightforward. All new dropdown controls in the app should use this component.

### ADR-016: Date filter chip presets over raw `<input type="date">`
**Date**: 2026-03 (Home Page Modernisation)
**Status**: Accepted
**Context**: Two raw `<input type="date">` elements were hard to style (OS-rendered calendar widget), not dark-mode safe, and required manual entry for the 90% use case of "show me events this week / this month".
**Decision**: Replace with four pill-chip `<button>` presets (Šiandien / Šią savaitę / Šį mėnesį / Pasirinkti datą). `datePreset` state drives all date logic via a `DATE_PRESETS` map where each entry has lazy `from()` / `to()` functions evaluated at click time. The "Pasirinkti datą" chip reveals two styled `<input type="date">` elements for custom ranges. Default preset is `'month'` (equivalent to the previous today → today+30d default).
**Consequences**: Better UX for common use cases. Dates are computed fresh each click (no stale `now()` from module load). Custom date input falls back to native date picker — acceptable since it's an edge-case flow. Date range is still passed as ISO strings to the existing filter logic — zero changes to the query layer.
