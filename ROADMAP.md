# Eventis — Secondary Ticket Marketplace

Lithuanian secondary ticket marketplace. Users list tickets for events, buyers purchase them. Events are scraped from public sources.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Vite + React + Tailwind CSS |
| Backend / DB | Supabase (Postgres + Auth + Storage) |
| Payments | Stripe |
| Scraping | Bright Data |
| Identity Verification | SmartID (Phase 2) |

---

## Prerequisites (do once, before any dev work)

- [ ] Create Supabase project → copy `SUPABASE_URL` + `SUPABASE_ANON_KEY` into `.env`
- [ ] Create Bright Data account → get API token + scraping browser zone → copy into `.env`
- [ ] Create Stripe account → get `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` (needed for Iteration 3)

`.env` shape (project root):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=           # frontend read-only
SUPABASE_SERVICE_ROLE_KEY=        # scraper write access — never expose to frontend
BRIGHT_DATA_API_TOKEN=
BRIGHT_DATA_ZONE=
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
```

---

## Iteration 1 — Event Discovery (current)

**Goal:** Scraped events visible on website. No auth, no tickets, no payments.

### Deliverables
- Vite + React + Tailwind project scaffold at `/Eventis/`
- Supabase `events` table with RLS (public read)
- One-time scraper scripts for:
  - bilietai.lt
  - zalgiris.koobin.com
  - kakava.lt
- Frontend pages:
  - `/` — Event list (search + category + date filter)
  - `/events/:slug` — Event detail

### DB Schema — `events`
```sql
id            uuid primary key default gen_random_uuid()
title         text not null
date          timestamptz
location      text
category      text
image_url     text
detail_url    text              -- source page URL
source        text              -- 'bilietai' | 'zalgiris' | 'kakava'
price_from    numeric(10,2)     -- cheapest ticket hint from source
slug          text unique not null
is_active     boolean default true
scraped_at    timestamptz default now()
```

### Status: ✅ Done — 2026-02-25

---

## Iteration 1.5 — Code Quality Fixes (before Iteration 2)

**Goal:** Address technical debt from code review before adding new features.

- [ ] `utils.ts:21` — Fix misleading comment: update to "server-side only — uses service_role key, never expose to frontend"
- [ ] `bilietai.ts:29,40` — Remove `as any` cast on `set-cookie` header; use proper `Array.isArray` check
- [ ] `bilietai.ts:16-17` — Remove unused `BD_ZONE` / `BD_TOKEN` variables (bilietai fetches without proxy)
- [ ] `bilietai.ts:11` — Remove redundant `dotenv.config()` call (already called in `utils.ts`)
- [ ] `utils.ts:83` — Add comment explaining why `rejectUnauthorized: false` is needed for Bright Data proxy
- [ ] `index.ts:4` — Update JSDoc comment: replace `VITE_SUPABASE_ANON_KEY` → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `EventDetail.tsx` — Render `detail_url` as a link to the original ticket source near the buy button
- [ ] `EventList.tsx:121` — Fix Lithuanian plural forms (1 = renginys, 2–9 = renginiai, 10+ = renginių)

### Status: ✅ Done — 2026-02-26

---

## Iteration 2 — Seller Ticket Listings

**Goal:** Authenticated sellers can list tickets for sale on an event.

### Deliverables
- Supabase Auth (email + password)
- `tickets` table
- Supabase Storage bucket for PDF uploads
- Seller flow:
  - Register / Login
  - My Listings page
  - List Ticket form (event search, PDF upload, price, seat info, split type)
- Event detail page shows available tickets

### DB Schema — `tickets`
```sql
id              uuid primary key default gen_random_uuid()
event_id        uuid references events(id)
seller_id       uuid references auth.users(id)
price           numeric(10,2) not null
quantity        int not null default 1
split_type      text check (split_type in ('any','none','avoid_one'))
seating_type    text check (seating_type in ('seated','standing'))
section         text
row             text
seat_from       int
seat_to         int
ticket_file_url text              -- Supabase Storage URL (PDF)
status          text default 'active' check (status in ('active','sold','cancelled'))
created_at      timestamptz default now()
```

### Status: ✅ Done — 2026-02-26

---

## Iteration 3 — Buyer Purchase Flow

**Goal:** Buyers can purchase tickets with Stripe. PDF delivered by email.

### Deliverables
- Stripe Checkout integration (one-time payment)
- `orders` table
- Post-payment webhook: mark ticket as sold, send PDF to buyer via email (Resend or Supabase Edge Function)
- Buyer: Order confirmation page + order history

### DB Schema — `orders`
```sql
id                  uuid primary key default gen_random_uuid()
ticket_id           uuid references tickets(id)
event_id            uuid references events(id)
buyer_id            uuid references auth.users(id)
stripe_session_id   text unique
amount_paid         numeric(10,2)
status              text default 'pending' check (status in ('pending','paid','refunded'))
created_at          timestamptz default now()
```

### Status: ✅ Done — 2026-02-27

---

## Iteration 4 — Seller Payouts

**Goal:** Sellers get paid after the event via manual Stripe payout tracking.

### Deliverables
- `payouts` table tracking payout status per seller per order
- Admin-side view (basic, internal only) to mark payouts as sent
- Seller "My Earnings" page showing pending / paid amounts
- Stripe manual transfer flow (triggered by admin, not automatic)

### DB Schema — `payouts`
```sql
id              uuid primary key default gen_random_uuid()
order_id        uuid references orders(id)
seller_id       uuid references auth.users(id)
amount          numeric(10,2)
status          text default 'pending' check (status in ('pending','sent'))
payout_date     timestamptz
stripe_transfer_id text
created_at      timestamptz default now()
```

### Status: ✅ Done — 2026-02-28

---

## Iteration 5.9 — Design System Foundation & Dark Mode

**Goal**: Replace hardcoded utility classes with a CSS custom property token system, add dark/light mode with FOUC-free initial paint, self-host Inter font (GDPR), and apply tabular number formatting to all price displays.

### Delivered
- CSS custom property token system (`src/index.css` `:root`/`:root.dark`, `tailwind.config.js` `var()` consumers)
- Dark/light mode toggle — OS preference auto-detected, user override, `localStorage` persistence
- FOUC prevention — inline synchronous IIFE in `index.html` `<head>`, double-`rAF` `.no-transition` trick
- `src/hooks/useTheme.ts` — derives initial state from FOUC script, `MediaQueryList` listener, cleanup
- `src/lib/tokens.ts` — static typed token mirror, `getStripeAppearance(theme)` for Stripe Elements
- Theme toggle in desktop navbar + mobile hamburger (both auth states)
- Self-hosted Inter Variable font (`public/fonts/InterVariable.woff2`) — no Google Fonts CDN (GDPR)
- Full token migration: Button, Card, Input, Badge, Skeleton, EmptyState, Layout.tsx, Login.tsx, Register.tsx
- Tabular numbers on all price displays: EventDetail, EventList, MyListings, MyOrders, MyEarnings
- WCAG 2.1 AA contrast audit documented in `src/index.css` header
- Bug fixes: Button secondary/danger hover, CSS transition cascade

### Status: ✅ Done — 2026-03-01

---

## Sprint 6.1 — Home Page Modernisation

**Goal**: Upgrade EventList home page to 2026 standard — SVG value proposition, custom headless Select dropdown, enhanced Input with search icon + clear button, date filter chip presets.

### Delivered
- Value proposition section: emoji trust bar → 3-card SVG stat section (`TicketIcon`, `ShieldCheckIcon`, `UserCheckIcon`); token classes, dark-mode safe
- `Select.tsx` new component — custom headless dropdown (not native `<select>`); click-outside close, Escape close (gated on open), keyboard nav, `role="listbox"` accessibility, token classes
- `Input.tsx` extended — `leadingIcon` slot (left-side SVG icon, `pl-9` compensation) + `onClear` prop (× button, `pr-8` compensation)
- EventList search updated to `<Input leadingIcon={<SearchIcon />} onClear={...} />`
- EventList category + city `<select>` replaced with `<Select>` component
- Date filter: 4 chip presets (Šiandien / Šią savaitę / Šį mėnesį / Pasirinkti datą) with conditional custom date inputs
- `EventGridSkeleton` tokenised: `bg-white border-neutral-100` → `bg-bg-primary border-border`
- Migration `014_rls_fixes.sql`: profiles INSERT policy tightened (prevents `verified=true` self-insert), `"authenticated read active tickets"` policy added (was `TO anon` only — logged-in buyers saw empty ticket list)

### Status: ✅ Done — 2026-03-01

---

## Sprint 6 — UX/UI & Value Proposition

**Goal:** Transform the product from functional to trustworthy and polished. Design system, component library, redesigned home page, news SEO page.

### Delivered
- Design system (`docs/design-system.md`) — full color token system, typography, component patterns, forbidden class rules
- UI component library (`src/components/ui/`) — Button, Badge, Input, Card, Skeleton, EmptyState
- Home hero (bg-brand-600, H1, trust bar)
- Event card redesign — structured date, category pill, scarcity chip, map pin SVG
- Page heroes on all seller/buyer pages
- Mobile nav hamburger with full-screen overlay
- Footer (3-column grid, copyright)
- News pages `/naujienos` + `/naujienos/:slug` with SEO meta
- `articles` DB table + RLS (migration `013_articles.sql`)
- Full color migration: all files now use `brand-*`/`neutral-*`/semantic tokens (no raw `indigo-*`/`gray-*`)
- Bug fixes: hero text contrast, profile avatar mismatch, mobile nav double menu, status badge colors

### Status: ✅ Done — 2026-03-01

---

## Iteration 5+ — Hardening & Growth

**Goal:** Production-ready, trusted marketplace.

- SmartID identity verification for sellers (required before listing)
- Admin dashboard (event management, user management, payout approval)
- Recurring scraper (cron via Supabase Edge Functions or GitHub Actions)
- Refund request flow with file upload
- Multi-ticket cart
- LT + EN i18n

### Status: ✅ Done (5.0–5.6)

---

## Iteration 5.7 — Auth UX Overhaul & User Profile

**Goal:** Clean navbar with avatar dropdown, Google OAuth, profile page with IBAN entry, auth-gated buy/sell.

### Delivered
- Navbar: flat link list → avatar icon + dropdown (avatar circle, click-outside close, admin section, verify nudge)
- Google OAuth on Login (below form) + Register (above form, Google-first) via Supabase social auth
- `returnUrl` support on all auth redirects; `safeReturnUrl()` open-redirect guard
- `/profile` page: email, member since, SmartID verification badge, IBAN input, listing/order counts
- Auth gate on buy button (EventDetail) with `?returnUrl=` redirect
- IBAN nudge banner on MyEarnings when pending payouts exist and no IBAN saved
- Bug fix: `Verify.tsx` redirect after SmartID success/already-verified changed from `/sell` → `/profile`

### DB — `payout_info` table (separate from `profiles` — ADR-007)
```sql
CREATE TABLE payout_info (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  iban        text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
-- RLS: owner SELECT/INSERT/UPDATE only; no public read
```
Migration: `012_payout_info.sql`. Also adds `"owner can insert own profile"` INSERT-only policy to `profiles` (no UPDATE — prevents self-verification bypass).

### External Config (manual, one-time)
- Google Console: OAuth 2.0 client, redirect URI = `https://<project>.supabase.co/auth/v1/callback`
- Supabase: Auth → Providers → Google → enable, Client ID + Secret
- Supabase: Auth → URL Configuration → add `http://localhost:5173` to Redirect URLs

### Status: ✅ Done — 2026-03-01

---

## Iteration 5.8 — QA Fixes

**Goal:** Close the three bugs surfaced by the post-5.7 FE+BE QA pass. Small, surgical changes only.

### Scope

| Story | File | Change |
|-------|------|--------|
| US-111 | `src/pages/Register.tsx` | `localiseError()` — maps Supabase signup errors to Lithuanian |
| US-112 | `src/pages/Profile.tsx` | `loadError` state + `try/catch/finally` in `load()` |
| US-113 | `supabase/migrations/015_payout_info_iban_check.sql` | `CHECK (iban IS NULL OR iban ~ '^LT[0-9]{18}$')` |

### DB Change — `015_payout_info_iban_check.sql`
```sql
-- UP
ALTER TABLE payout_info
  ADD CONSTRAINT iban_format CHECK (iban IS NULL OR iban ~ '^LT[0-9]{18}$');

-- DOWN
-- ALTER TABLE payout_info DROP CONSTRAINT IF EXISTS iban_format;
```

### Status: ✅ Done — 2026-03-01

---

## Folder Structure (target after Iteration 1)

```
/Eventis/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── EventList.tsx
│   │   └── EventDetail.tsx
│   ├── lib/
│   │   └── supabase.ts
│   └── main.tsx
├── scripts/
│   ├── scraper/
│   │   ├── bilietai.ts
│   │   ├── zalgiris.ts
│   │   ├── kakava.ts
│   │   └── index.ts     ← run this to scrape all sources
│   └── seed.ts
├── supabase/
│   └── migrations/
│       └── 001_events.sql
├── .env.example
├── ROADMAP.md           ← this file
└── package.json
```

---

## Where to Start Each Day

1. Open `ROADMAP.md` — find the first iteration with status `🔲 Not started`
2. Check **Prerequisites** for that iteration are met (env vars, accounts)
3. Run `/create-plan` in Claude Code with the iteration scope
4. Implement, test, mark iteration complete (`✅ Done — YYYY-MM-DD`)
