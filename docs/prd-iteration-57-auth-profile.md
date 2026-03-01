# PRD — Iteration 5.7: Auth UX Overhaul & User Profile

**Status**: Approved
**Owner**: PM
**Last updated**: 2026-03-01
**Iteration**: 5.7 (fits within Iteration 5 hardening scope)

---

## Problem

The current navbar is a flat, cluttered list of text links that does not scale and provides no account hub. There is no profile page — users cannot see their own account status, verification state, or manage payout details. Google OAuth is absent, creating unnecessary sign-up friction. Unauthenticated users can reach buy flows without being redirected to login. These gaps hurt both conversion (Kotryna abandons before buying) and seller trust (Marius can't easily manage his payout bank details).

---

## Goals

1. Reduce auth friction — Google OAuth adoption ≥30% of new registrations within 30 days of launch
2. Consolidate account UX — single profile page replaces scattered nav links
3. Enable payout setup — ≥60% of active sellers save IBAN within 30 days of feature launch
4. Enforce auth gate — zero anonymous users completing a buy or sell action

---

## Non-Goals

- Stripe Connect / automated bank payouts (manual transfer by admin remains for now)
- IBAN bank-level validation via external API (format check only)
- Profile photo upload
- Password change / reset flow (Supabase magic link covers reset; UI in future iteration)
- Facebook or Apple OAuth
- Two-factor authentication

---

## User Personas

- **Primary**: Marius (Seller) — needs IBAN entry, verification status, clean account hub
- **Primary**: Kotryna (Buyer) — needs Google sign-in, frictionless auth, profile page
- **Secondary**: Adomas (Admin) — benefits from IBAN stored per user for payout processing

---

## User Stories

### Navbar (P0)
- As any user, I want to see a clean avatar icon in the top-right navbar when logged in so that I can access my account without a cluttered link list. [P0]
- As any user, I want to click the avatar icon to open a dropdown with navigation links so that I can access My Listings, My Orders, My Earnings, Profile, and Sign Out from one place. [P0]
- As a logged-out visitor, I want to see "Prisijungti" and "Registruotis" buttons in the top-right navbar so that I can quickly access auth. [P0]

### Google OAuth (P0)
- As Kotryna (buyer), I want to sign in with Google on the login page so that I can skip email/password and get to buying faster. [P0]
- As any new user, I want to register with Google so that I don't need to create a separate password. [P0]
- As a Google-authenticated user, I want to be redirected to the page I came from after sign-in so that I don't lose my place in the buy flow. [P0]

### Profile Page (P0)
- As any logged-in user, I want a `/profile` page showing my email, registration date, and verification status so that I have a single account hub. [P0]
- As Marius (seller), I want to enter and save my IBAN on my profile so that the admin can send my earnings without me emailing them separately. [P0]
- As Marius, I want to see my saved IBAN masked on the profile page so that I can confirm it's saved without exposing the full number. [P1]
- As an unverified seller, I want to see a "Not Verified" badge with a link to `/verify` so that I know how to get verified. [P1]

### Auth Gate (P0)
- As an unauthenticated visitor, I want to be redirected to login when I click "Buy" on a ticket so that I understand I need an account. [P0]
- As an unauthenticated visitor, I want to be redirected to login when I visit `/sell` so that I can't start a listing without an account. [P0]
- As a user returning from login/register, I want to be sent back to the page I was on before so that I can complete my action. [P0]

---

## Requirements

### P0 — Must Have (launch blockers)

| ID | Requirement |
|----|-------------|
| R1 | Navbar: replace flat link list with avatar icon (initials) + dropdown when logged in |
| R2 | Navbar: show "Prisijungti" + "Registruotis" buttons when logged out |
| R3 | Dropdown items: Profilis, Mano skelbimai, Mano užsakymai, Mano pajamos, Atsijungti; Admin section (Išmokos, Skelbimai, Vartotojai) shown only to admins |
| R4 | Google OAuth button on Login page and Register page (Supabase social auth) |
| R5 | Post-OAuth redirect: return user to originating page via `?returnUrl=` query param |
| R6 | `/profile` page: display email, member since date, verification status badge (Patvirtintas / Nepatvirtintas) |
| R7 | `/profile` page: IBAN input — saves to `profiles.iban` column in Supabase |
| R8 | IBAN client-side validation: must start with `LT`, be 20 characters total (LT + 18 digits) |
| R9 | Auth gate on buy button: unauthenticated click → redirect to `/login?returnUrl=/events/:slug` |
| R10 | Auth gate on `/sell` route: already handled by ProtectedRoute, add `returnUrl` support |
| R11 | DB: add `iban text` column to `profiles` table (migration `012_profiles_iban.sql`) |
| R12 | DB: add RLS policy allowing authenticated users to upsert their own profile row |

### P1 — Should Have (this iteration)

| ID | Requirement |
|----|-------------|
| R13 | IBAN displayed masked on profile after saving: `LT** **** **** **** **** **` |
| R14 | Profile shows summary stats: total listings count, total orders count |
| R15 | Verification badge on profile links to `/verify` if status is unverified |
| R16 | "Complete your profile" prompt on My Earnings if IBAN not saved and user has paid listings |

### P2 — Nice to Have (next iteration)

| ID | Requirement |
|----|-------------|
| R17 | Profile avatar uses first letter of email as initials in navbar circle |
| R18 | Full name field on profile (for display + payout reference) |
| R19 | Password change UI on profile page |

---

## Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Google OAuth signups | ≥30% of new registrations | 30 days post-launch |
| IBAN completion rate | ≥60% of active sellers | 30 days post-launch |
| Auth gate effectiveness | 0 anonymous buy/sell completions | From day 1 |
| Profile page bounce rate | <40% | 30 days post-launch |
| Navbar-driven nav usage | >50% of logged-in users use dropdown | 30 days post-launch |

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| IBAN storage | `profiles.iban` column (Supabase, encrypted at rest) | Simplest for manual admin payouts; Stripe Connect deferred to Phase 2 |
| IBAN validation | Client-side format only (LT + 18 chars) | MVP; no external banking API needed |
| Google OAuth | Supabase built-in social auth | Already using Supabase Auth; no extra library |
| Avatar | CSS initials circle (first char of email) | No image upload infra needed |
| returnUrl | Query param `?returnUrl=` on login/register | Standard pattern; no session storage needed |

---

## Open Questions

- [x] IBAN: DB storage confirmed (not Stripe Connect) — PM decision
- [x] IBAN validation: format check only — PM decision
- [ ] Should Google-authenticated users skip email confirmation? (Supabase default: yes for OAuth)
- [ ] Should IBAN be required before first listing, or optional? **Recommendation**: optional (show prompt, don't block)
- [ ] Profile row creation: SmartID flow creates the profile row — what about Google OAuth users who never verify? Migration must ensure upsert works for any authenticated user.

---

## Dependencies

- **Technical**: `profiles` table exists (migration 010) — needs `iban` column (migration 012) + user self-write RLS policy
- **External**: Google OAuth app credentials from Google Console (client ID + secret) — must be added to Supabase Auth dashboard and `.env`
- **Env vars**: `VITE_GOOGLE_CLIENT_ID` not needed (Supabase handles OAuth redirect internally)
- **Supabase dashboard**: Google provider must be enabled in Auth → Providers → Google

---

## Out of Scope (explicitly)

- Stripe Connect seller onboarding
- Biometric or document-based KYC beyond existing SmartID
- Multi-provider OAuth (Facebook, Apple, GitHub)
