# Developer Onboarding — Eventis

**Last updated**: 2026-03-01

---

## What is Eventis?

Lithuanian secondary ticket marketplace. Sellers list tickets for events, buyers purchase via Stripe. Events are scraped from bilietai.lt and kakava.lt.

---

## Prerequisites

Before running the project you need accounts on:

| Service | What for |
|---------|----------|
| Supabase | Database, Auth, Storage, Edge Functions |
| Stripe | Payments (test mode for dev) |
| Bright Data | HTTP proxy (only needed for zalgiris scraper) |
| Google Console | Google OAuth (for social login) |

---

## Environment Setup

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=          # Supabase project URL (safe in frontend)
VITE_SUPABASE_ANON_KEY=     # Anon key (safe in frontend — RLS enforced)
SUPABASE_SERVICE_ROLE_KEY=  # Service role key — NEVER expose to frontend
BRIGHT_DATA_API_TOKEN=      # Bright Data proxy token (scraper only)
BRIGHT_DATA_ZONE=           # Bright Data zone name (scraper only)
STRIPE_SECRET_KEY=          # Stripe secret (sk_test_... for dev)
```

> `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. It is used only by the scraper (`scripts/`) and Supabase Edge Functions. It must never be imported into `src/`.

---

## First-Run Setup (do once per environment)

### 1. Apply DB Migrations

Run each SQL file in order in the **Supabase SQL Editor** (Dashboard → SQL Editor):

```
001_events.sql
002_tickets.sql
003_tickets_rls_fix.sql
004_events_authenticated_read.sql
005_orders.sql
006_ticket_reservation.sql
007_payouts.sql
008_payouts_not_null.sql
009_admin_tickets_policy.sql
010_profiles.sql
011_ticket_summary_view.sql
012_payout_info.sql
```

### 2. Configure Google OAuth

1. **Google Console** → APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Authorised JavaScript origins: `http://localhost:5173`
   - Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Supabase Dashboard** → Auth → Providers → Google → Enable, paste Client ID + Secret
3. **Supabase Dashboard** → Auth → URL Configuration → add `http://localhost:5173` to Redirect URLs

### 3. Configure Stripe Webhook (for local dev)

Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

Set `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets.

### 4. Deploy Edge Functions

```bash
npx supabase functions deploy create-checkout --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy smartid-verify --no-verify-jwt
npx supabase functions deploy admin-users --no-verify-jwt
```

Set required secrets:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase secrets set SMARTID_RELYING_PARTY_UUID=...
npx supabase secrets set SMARTID_RELYING_PARTY_NAME=...
```

---

## Running the App

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
```

---

## Running the Scraper

```bash
npm run scrape     # Scrapes bilietai.lt + kakava.lt, upserts to events table
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env`. Bright Data proxy only needed for zalgiris scraper (currently 403ing).

---

## Key Architecture Concepts to Understand First

1. **RLS on all tables** — auth is enforced at the DB level, not just in the frontend. Never rely on the frontend alone to protect data.
2. **`payout_info` is separate from `profiles`** — `profiles` has public SELECT (for Verified badge); IBAN must not be publicly readable, so it lives in `payout_info` with owner-only RLS (ADR-007).
3. **`profiles.verified` vs `user_metadata.verified`** — both are set by the SmartID Edge Function. `profiles.verified` is the canonical DB record. `user_metadata.verified` is the cached value read after `refreshSession()`. Check both when displaying verification status.
4. **Login page is the OAuth callback** — after Google OAuth, Supabase redirects to `/login?returnUrl=...`. `Login.tsx` calls `getSession()` on mount; if a session exists, it navigates to `returnUrl` immediately (ADR-008).
5. **`safeReturnUrl()`** — all `returnUrl` consumption validates the value starts with `/` to prevent open redirect attacks.
6. **Admin flag** — `is_admin: true` in `auth.users.raw_user_meta_data`. Set manually via Supabase dashboard or service role. Not a DB table.
7. **Edge Functions use service_role** — they bypass RLS. `STRIPE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are Edge Function secrets only — never in the Vite bundle.
8. **CSS custom property token system** — `src/index.css` is the single source of truth for all color tokens (`:root` for light, `:root.dark` for dark). `tailwind.config.js` and `src/lib/tokens.ts` are consumers via `var()` references — do not define color values there. Always use semantic token classes (`bg-bg-primary`, `text-text-muted`, `border-border`) not raw Tailwind palette classes (`bg-white`, `text-gray-500`) in new code. See ADR-013.
9. **Dark mode via `<html class="dark">`** — a synchronous inline `<script>` IIFE in `index.html` `<head>` reads `localStorage` and applies the `dark` class before React hydrates, preventing FOUC. `useTheme.ts` derives its initial state from the existing `<html>` class (not `localStorage` directly) to avoid DOM mismatch. The `.no-transition` class is added by the same script and removed after first paint via double-`requestAnimationFrame` to suppress the 200ms color transition on load. See ADR-014.

---

## Test Accounts

| Persona | How to create |
|---------|--------------|
| Regular user | Register at `/register` with any email |
| Admin | Register, then set `is_admin: true` in Supabase Auth → Users → Edit raw_user_meta_data |
| SmartID sandbox | Use personal code `40404040009` on `/verify` — instant approval (sandbox only) |

**Stripe test card**: `4242 4242 4242 4242` · any future expiry · any CVC

---

## Docs Reference

| File | What it covers |
|------|---------------|
| `docs/architecture.md` | DB schema, ADRs, Edge Functions, RLS policies |
| `docs/user-stories.md` | Full backlog by epic and iteration |
| `docs/prd.md` | Product requirements |
| `docs/personas.md` | Seller (Marius), Buyer (Kotryna), Admin |
| `ROADMAP.md` | Iteration history and status |
| `CHANGELOG.md` | Per-iteration change log |
