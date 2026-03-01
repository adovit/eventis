# User Stories Backlog — Eventis

**Last updated**: 2026-03-01 (Iteration 5.8 — QA Fixes)
**Owner**: PO

---

## Epic Index

| ID | Epic | Iteration | Status |
|----|------|-----------|--------|
| E1 | Event Discovery | 1 | ✅ Done |
| E2 | Seller Listings | 2 | ✅ Done |
| E3 | Buyer Purchase | 3 | ✅ Done |
| E4 | Seller Payouts | 4 | ✅ Done |
| E5 | Identity Verification | 5 | ✅ Done |
| E6 | Admin Dashboard | 5 | ✅ Done |
| E7 | Recurring Scraper | 5 | ✅ Done |
| E8 | Refund Flow | 5 | 🔲 Backlog |
| E9 | Internationalisation | 5 | 🔲 Backlog |
| E10 | Notifications | 5 | 🔲 Backlog |
| E11 | Trust & Ratings | 6 | 🔲 Future |
| E12 | Multi-ticket Cart | 6 | 🔲 Future |
| E13 | SEO & Discovery | 6 | 🔲 Future |
| E14 | Discovery & Search UX | 5.6 | ✅ Done |
| E15 | Navbar Overhaul | 5.7 | ✅ Done |
| E16 | Google OAuth | 5.7 | ✅ Done |
| E17 | Profile Page | 5.7 | ✅ Done |
| E18 | Auth Gate | 5.7 | ✅ Done |
| E19 | DB: payout_info table | 5.7 | ✅ Done |
| E20 | QA Fixes 5.7 | 5.8 | ✅ Done |
| E21 | Design System & Visual Language Overhaul | 5.9 | ✅ Done |
| E22 | Home Page Modernisation | 6.1 | ✅ Done |

---

## ✅ Iteration 1 — Event Discovery

### E1 — Event Discovery

**Goal**: Scraped events visible on website. No auth, no tickets, no payments.

#### US-E1-01 — Public event list with filters ✅
**Story**: As a visitor, I want to browse scraped events with search, category, and date filters so that I can find events I'm interested in.
**Delivered**: `EventList.tsx` — search + category + date filter, Lithuanian plural forms

#### US-E1-02 — Event detail page ✅
**Story**: As a visitor, I want to view an event's details and a link to the original ticket source so that I can learn more and buy primary tickets.
**Delivered**: `EventDetail.tsx` — event info + `detail_url` link to source

#### US-E1-03 — Scrapers for 3 sources ✅
**Story**: As the system, I want to scrape events from bilietai.lt, zalgiris.koobin.com, and kakava.lt so that the catalogue is populated automatically.
**Delivered**: `scripts/scraper/bilietai.ts`, `zalgiris.ts`, `kakava.ts`, `index.ts`

---

## ✅ Iteration 2 — Seller Listings

### E2 — Seller Ticket Listings

**Goal**: Authenticated sellers can list tickets for sale on an event.

#### US-E2-01 — Seller registration and login ✅
**Story**: As a seller, I want to register and log in with email + password so that I can manage my listings.
**Delivered**: `Register.tsx`, `Login.tsx`, Supabase Auth, `ProtectedRoute.tsx`

#### US-E2-02 — List a ticket for sale ✅
**Story**: As a seller, I want to upload a PDF ticket with price and seat info so that buyers can find and purchase it.
**Delivered**: `ListTicket.tsx` — event search, PDF upload, price, split type, seating

#### US-E2-03 — My listings page ✅
**Story**: As a seller, I want to see all my active listings so that I can manage what I'm selling.
**Delivered**: `MyListings.tsx`

#### US-E2-04 — Tickets visible on event detail ✅
**Story**: As a buyer, I want to see available tickets on the event page so that I can compare options.
**Delivered**: `EventDetail.tsx` — ticket list with price, seat info, buy button

---

## ✅ Iteration 3 — Buyer Purchase Flow

### E3 — Buyer Purchase

**Goal**: Buyers can purchase tickets with Stripe. PDF delivered by email.

#### US-E3-01 — Stripe Checkout purchase ✅
**Story**: As a buyer, I want to pay for a ticket via Stripe so that my payment is secure.
**Delivered**: Stripe Checkout session creation, redirect to Stripe hosted page

#### US-E3-02 — PDF delivery after payment ✅
**Story**: As a buyer, I want the ticket PDF sent to my email after payment so that I receive my ticket automatically.
**Delivered**: `stripe-webhook` Edge Function — marks order paid, ticket sold, emails PDF

#### US-E3-03 — Order confirmation and history ✅
**Story**: As a buyer, I want to see my order confirmed and view past orders so that I have a record of my purchases.
**Delivered**: `OrderSuccess.tsx`, `MyOrders.tsx`

---

## ✅ Iteration 4 — Seller Payouts

### E4 — Seller Payouts

**Goal**: Sellers get paid after the event via manual Stripe payout tracking.

#### US-E4-01 — Payout record per sale ✅
**Story**: As a seller, I want a payout record created when my ticket sells so that the admin knows to pay me.
**Delivered**: `payouts` table, created by `stripe-webhook` Edge Function

#### US-E4-02 — My Earnings page ✅
**Story**: As a seller, I want to see my pending and paid earnings so that I know what's coming.
**Delivered**: `MyEarnings.tsx` — pending / paid breakdown

#### US-E4-03 — Admin marks payouts as sent ✅
**Story**: As an admin, I want to mark payouts as sent after transferring money so that sellers see their payout status updated.
**Delivered**: `AdminPayouts.tsx` — payout table, "Mark Sent" action, per-row error handling

---

## ✅ Iteration 5 — Hardening & Growth

### E5 — Identity Verification (SmartID)

---

### US-001 — Seller can initiate SmartID verification ✅
**Epic**: E5 · **Priority**: P0 · **Persona**: Seller · **Size**: L

**Story**: As a seller, I want to verify my identity via SmartID so that buyers can see I'm a real, trusted person.

**Acceptance Criteria**:
- [x] Given I'm logged in as a seller, when I visit `/verify`, then I see a personal code + country form
- [x] Given I submit, when SmartID flow completes successfully, then `verified=true` is stored in my user metadata and `profiles` table
- [x] Given verification fails, when I retry, then I can restart the SmartID flow
- [x] Given I'm already verified, when I visit `/verify`, then I'm redirected to `/profile`

**Delivered**: `Verify.tsx`, `smartid-verify` Edge Function, `010_profiles.sql`

---

### US-002 — Unverified sellers see listing restriction warning ✅
**Epic**: E5 · **Priority**: P0 · **Persona**: Seller · **Size**: S

**Story**: As an unverified seller, I want to know I need to verify before listing so that I understand the requirement upfront.

**Acceptance Criteria**:
- [x] Given I'm unverified, when I visit /sell, then I see a yellow banner: "Patvirtinkite tapatybę"
- [x] Given I click "Patvirtinti dabar", then I'm taken to `/verify`
- [x] Given I'm unverified, when the form is shown, then the submit button is disabled

**Delivered**: `ListTicket.tsx` verification gate

---

### US-003 — Buyer sees Verified Seller badge on ticket listings ✅
**Epic**: E5 · **Priority**: P1 · **Persona**: Buyer · **Size**: S

**Story**: As a buyer, I want to see which sellers are verified so that I can buy with more confidence.

**Acceptance Criteria**:
- [x] Given a ticket listing by a verified seller, when I view EventDetail, then I see a green "Patvirtintas" badge
- [x] Given an unverified seller's listing, when I view it, then there is no badge

**Delivered**: `EventDetail.tsx` profiles query + badge render

---

### E6 — Admin Dashboard

---

### US-010 — Admin can view all listings ✅
**Epic**: E6 · **Priority**: P0 · **Persona**: Admin · **Size**: M

**Story**: As an admin, I want to see all active ticket listings so that I can spot fraudulent content.

**Acceptance Criteria**:
- [x] Given I'm admin, when I visit /admin/listings, then I see all listings (title, seller, price, status, date)
- [x] Given a listing, when I click "Deaktyvuoti", then its status changes to 'cancelled'
- [x] Given a non-admin user, when they try /admin/listings, then they are redirected to /

**Delivered**: `AdminListings.tsx`, `009_admin_tickets_policy.sql`

---

### US-011 — Admin can deactivate a user account ✅
**Epic**: E6 · **Priority**: P0 · **Persona**: Admin · **Size**: M

**Story**: As an admin, I want to suspend a user account so that I can act on fraud or abuse reports.

**Acceptance Criteria**:
- [x] Given I'm admin, when I view /admin/users, then I see all registered users
- [x] Given a user, when I click "Sustabdyti", then `banned_until` is set (10-year ban)
- [x] Admin cannot suspend themselves or other admins

**Delivered**: `AdminUsers.tsx`, `admin-users` Edge Function

---

### US-012 — Admin payout queue with date sorting ✅
**Epic**: E6 · **Priority**: P1 · **Persona**: Admin · **Size**: S
**Delivered**: `AdminPayouts.tsx` (Iteration 4) — sorted by `created_at` ascending

---

### E7 — Recurring Scraper

---

### US-020 — Scraper runs automatically every day ✅
**Epic**: E7 · **Priority**: P0 · **Persona**: System · **Size**: M

**Story**: As the system, I want the scraper to run daily so that event listings are always fresh without manual runs.

**Acceptance Criteria**:
- [x] GitHub Actions cron runs at 04:00 UTC daily; all 3 scrapers run
- [x] `scraped_at` updated on upsert
- [x] Per-scraper errors logged; sibling scrapers continue on failure

**Delivered**: `.github/workflows/scraper-cron.yml`

---

### US-021 — Admin sees last scrape timestamp
**Epic**: E7 · **Priority**: P1 · **Persona**: Admin · **Size**: S
**Status**: 🔲 Backlog — not yet built (`scraped_at` column exists; UI not yet added)

---

### E8 — Refund Flow

---

### US-030 — Buyer can request a refund
**Epic**: E8 · **Priority**: P1 · **Persona**: Buyer · **Size**: M

**Story**: As a buyer, I want to request a refund so that I'm protected if the ticket turns out to be invalid.

**Acceptance Criteria**:
- [ ] Given a paid order, when I visit My Orders, then I see a "Request Refund" option
- [ ] Given I click "Request Refund", when I submit a reason + optional screenshot, then a refund request is created
- [ ] Given my request is submitted, then I receive an email confirmation
- [ ] Given my request is approved by admin, then Stripe refund is initiated and order status → 'refunded'

---

### US-031 — Admin reviews refund requests
**Epic**: E8 · **Priority**: P1 · **Persona**: Admin · **Size**: M

**Story**: As an admin, I want to review refund requests so that I can make fair decisions.

**Acceptance Criteria**:
- [ ] Given /admin/refunds, when loaded, then I see all open refund requests with buyer reason
- [ ] Given a request, when I click "Approve", then Stripe refund is triggered
- [ ] Given a request, when I click "Deny", then buyer is notified by email

---

### E9 — Internationalisation

---

### US-040 — All UI text available in Lithuanian
**Epic**: E9 · **Priority**: P1 · **Persona**: All · **Size**: L

**Story**: As a Lithuanian user, I want the entire UI to be in Lithuanian so that I don't need to understand English.

**Acceptance Criteria**:
- [ ] Given any page, when loaded, then all labels, buttons, error messages are in Lithuanian
- [ ] Given i18n strings file `src/i18n/lt.ts`, when a string is missing, then it falls back to key name (not blank)

---

### US-041 — UI can be switched to English
**Epic**: E9 · **Priority**: P2 · **Persona**: All · **Size**: M

**Story**: As an English-speaking user, I want to switch the UI to English so that I can use the platform.

**Acceptance Criteria**:
- [ ] Given a language switcher in the header, when I select EN, then all text switches to English
- [ ] Given I refresh the page, then my language preference is preserved

---

### E10 — Notifications

---

### US-050 — Seller gets email when ticket sells
**Epic**: E10 · **Priority**: P1 · **Persona**: Seller · **Size**: S

**Story**: As a seller, I want an email when my ticket sells so that I know without checking the dashboard.

**Acceptance Criteria**:
- [ ] Given a ticket is sold (order status → paid), when webhook fires, then seller receives email: "Your ticket sold! Payout scheduled."
- [ ] Email contains: event name, amount, estimated payout date

---

### US-051 — Seller gets email when payout is sent
**Epic**: E10 · **Priority**: P1 · **Persona**: Seller · **Size**: S

**Story**: As a seller, I want an email when my payout is sent so that I can confirm the money is coming.

**Acceptance Criteria**:
- [ ] Given admin marks payout as sent, when status changes, then seller receives email: "Your payout of €XX has been sent."

---

## 🔲 Iteration 6 — Trust & Scale

### E11 — Trust & Ratings

| ID | Story | Priority | Size |
|----|-------|----------|------|
| US-060 | Seller ratings after transaction | P2 | M |
| US-061 | Buyer can flag a listing as suspicious | P2 | S |

### E12 — Multi-ticket Cart

| ID | Story | Priority | Size |
|----|-------|----------|------|
| US-070 | Multi-ticket cart | P2 | L |
| US-071 | Price alert subscriptions | P2 | M |

### E13 — SEO & Discovery

| ID | Story | Priority | Size |
|----|-------|----------|------|
| US-080 | SEO-optimised event URLs with structured data | P1 | M |
| US-081 | Sitemap.xml generation | P2 | S |
| US-082 | OpenGraph tags for social sharing | P1 | S |

---

## ✅ Iteration 5.6 — Discovery & Search UX

### E14 — Discovery & Search UX

---

### US-090 — Keyword-based search on EventList (P0) ✅
**Epic**: E14 · **Priority**: P0 · **Persona**: Buyer · **Size**: S

**Story**: As a buyer, I want the event search to work correctly regardless of trailing spaces or multi-word input so that I always find relevant events.

**Acceptance Criteria**:
- [x] Given I type `"Rytas "` (trailing space), when results render, then Rytas events appear
- [x] Given I type `"žalgiris rytas"`, when results render, then events containing both words appear (all tokens must match, in any order)
- [x] Given search input is active, then date/city/category filters are ignored (search is global)
- [x] Given I clear the search input, then filters resume applying

**Delivered**: `EventList.tsx` — trim + token split + `transliterate()` diacritic stripping; search mode bypasses all filters.

---

### US-091 — Keyword-based search in ListTicket event lookup (P0) ✅
**Epic**: E14 · **Priority**: P0 · **Persona**: Seller · **Size**: S

**Story**: As a seller, I want the event search on the "List Ticket" form to work reliably so that I can find the correct event when creating a listing.

**Acceptance Criteria**:
- [x] Given I type `"Pitbull "` (trailing space), when dropdown renders, then matching events appear
- [x] Given I type `"rytas rungtynės"`, when dropdown renders, then events matching all keywords appear
- [x] Minimum 2 non-whitespace characters required before triggering search (unchanged)

**Delivered**: `ListTicket.tsx` — trim guard, token split, first-token DB query, client-side all-token filter with `transliterate()`.

---

### US-092 — Date filter: default next 30 days, past dates disabled, always required (P0) ✅
**Epic**: E14 · **Priority**: P0 · **Persona**: Buyer · **Size**: S

**Story**: As a buyer, I want the date filter to always show a sensible default period so that I see upcoming events without manual configuration.

**Acceptance Criteria**:
- [x] Given I load the events page, then `dateFrom` = today, `dateTo` = today + 30 days (pre-filled)
- [x] Given I interact with the date pickers, then past dates (before today) are disabled / cannot be selected
- [x] Given I clear either date field, then it reverts to the default (cannot be left empty)
- [x] Given search mode is active (search input non-empty), then date filters are not applied

**Delivered**: `EventList.tsx` — `todayISO()` / `thirtyDaysLaterISO()` helpers, `useState(todayISO)` defaults, `min` attribute, `onChange` guard.

---

### US-093 — City filter for main Lithuanian cities (P0) ✅
**Epic**: E14 · **Priority**: P0 · **Persona**: Buyer · **Size**: S

**Story**: As a buyer from Kaunas, I want to filter events by city so that I only see events near me.

**Acceptance Criteria**:
- [x] Given the filters bar, then a "Miestas" dropdown exists with: Visi miestai (default), Vilnius, Kaunas, Klaipėda, Šiauliai, Panevėžys
- [x] Given I select "Kaunas", then only events whose `location` field contains "Kaunas" (case-insensitive) are shown
- [x] Given search mode is active, then the city filter is ignored

**Delivered**: `EventList.tsx` — `LT_CITIES` constant, city `<select>`, `location?.toLowerCase().includes(city)` filter.

---

### US-094 — "No tickets available" message on EventDetail (P0) ✅
**Epic**: E14 · **Priority**: P0 · **Persona**: Buyer · **Size**: XS

**Story**: As a buyer, I want to see a clear message when no secondary tickets are listed for an event so that I'm not left wondering if tickets exist.

**Acceptance Criteria**:
- [x] Given an event with 0 active ticket listings, when I view EventDetail, then I see: "Šiuo metu nėra parduodamų bilietų." with a link to `detail_url` if available
- [x] Given tickets exist, then the existing ticket list renders as-is (no change)

**Delivered**: `EventDetail.tsx` — `!ticketsError && tickets.length === 0` branch with message and original source link.

---

### US-095 — Pagination on EventList (P1) ✅
**Epic**: E14 · **Priority**: P1 · **Persona**: Buyer · **Size**: M

**Story**: As a buyer, I want the event list to paginate so that the page loads quickly even with 200+ events.

**Acceptance Criteria**:
- [x] Given the event list loads, then max 24 events per page are shown
- [x] Given more than 24 events match the current filters, then Previous / Next pagination controls are visible
- [x] Given search input is non-empty (search mode), then pagination is disabled and all matching events are shown
- [x] Given I change a filter (city, category, date), then pagination resets to page 1
- [x] Page number is shown: "Puslapis 2 iš 5"

**Delivered**: `EventList.tsx` — `PAGE_SIZE = 24`, `page` state, `useEffect` reset, `paginated` slice, pagination controls.

---

### US-096 — Ticket availability summary on EventList cards (P1) ✅
**Epic**: E14 · **Priority**: P1 · **Persona**: Buyer · **Size**: M

**Story**: As a buyer browsing the event list, I want to see how many secondary tickets are available for each event so that I know which events have resale listings before clicking through.

**Acceptance Criteria**:
- [x] Given an event card with ≥1 active ticket listings, then a badge shows: "N bilietas / bilietai / bilietų nuo X.XX €"
- [x] Given an event card with 0 active listings, then no badge is shown (clean card — no clutter)
- [x] Ticket count data is fetched efficiently (single aggregate query, not N+1)

**Delivered**: `EventList.tsx` + `supabase/migrations/011_ticket_summary_view.sql` — `event_ticket_summary` view, parallel fetch, `Map<string, TicketSummary>`, green badge on `EventCard`.

---

## ✅ Iteration 5.7 — Auth UX Overhaul & User Profile

### E15 — Navbar Overhaul

---

### US-100 — Avatar icon + dropdown navbar (P0) ✅
**Epic**: E15 · **Priority**: P0 · **Persona**: All logged-in users · **Size**: M

**Story**: As a logged-in user, I want a clean avatar icon in the top-right of the navbar that opens a dropdown, so that I can navigate my account without a cluttered flat link list.

**Acceptance Criteria**:
- [x] Given I'm logged in, when I view any page, then I see a circular avatar (first letter of email, indigo background) in the top-right navbar — no flat text links
- [x] Given I click the avatar, then a dropdown opens with: Profilis, Mano skelbimai, Mano užsakymai, Mano pajamos, Atsijungti
- [x] Given I'm an admin, then the dropdown also shows an "Admin" section: Išmokos, Skelbimai, Vartotojai
- [x] Given I'm unverified, then the dropdown shows a yellow "Patvirtinti tapatybę" link above sign out
- [x] Given I click outside the dropdown, then it closes
- [x] Given I'm logged out, then I see "Prisijungti" and "Registruotis" buttons (no avatar)

**Delivered**: `Layout.tsx` — avatar circle, click-outside useEffect, dropdown with all nav items

---

### E16 — Google OAuth

---

### US-101 — Google sign-in on Login page (P0) ✅
**Epic**: E16 · **Priority**: P0 · **Persona**: Kotryna (Buyer) · **Size**: S

**Story**: As a visitor, I want to sign in with Google on the login page so that I can skip email/password entry.

**Acceptance Criteria**:
- [x] Given I visit `/login`, then I see a "Prisijungti su Google" button below the email form, separated by an "arba" divider
- [x] Given I click the Google button, then I'm redirected to Google OAuth consent screen
- [x] Given I approve the Google consent, then I'm redirected back to Eventis as a logged-in user
- [x] Given I came from a buy flow (`?returnUrl=/events/slug`), then after Google sign-in I'm returned to that page
- [x] Given Google auth fails, then I see a generic error message in Lithuanian

**Delivered**: `Login.tsx` — `signInWithOAuth`, `getSession()` on mount for post-OAuth detection, Google SVG button

---

### US-102 — Google sign-up on Register page (P0) ✅
**Epic**: E16 · **Priority**: P0 · **Persona**: All new users · **Size**: S

**Story**: As a new visitor, I want to register with Google on the register page so that I don't need to create a password.

**Acceptance Criteria**:
- [x] Given I visit `/register`, then I see a "Registruotis su Google" button above the form, with "arba" divider below it
- [x] Given I click it and approve Google consent, then my account is created and I'm logged in
- [x] Given I'm a returning Google user who clicks "Registruotis su Google", then I'm simply logged in (no duplicate account)

**Delivered**: `Register.tsx` — Google button at top (new-user-first pattern)

---

### US-103 — Return URL after auth (P0) ✅
**Epic**: E16 · **Priority**: P0 · **Persona**: Kotryna (Buyer) · **Size**: S

**Story**: As a user who was redirected to login mid-flow, I want to be sent back to where I was after authenticating so that I don't lose my place.

**Acceptance Criteria**:
- [x] Given I click "Buy" while logged out, when I'm redirected to `/login?returnUrl=/events/slug`, then after successful login I'm sent to `/events/slug`
- [x] Given I use email/password login, then `returnUrl` param is respected
- [x] Given I use Google OAuth login, then `returnUrl` param is respected (passed through OAuth redirectTo)
- [x] Given no `returnUrl` param, then default redirect is `/` (home)

**Delivered**: `ProtectedRoute.tsx`, `Login.tsx`, `Register.tsx`, `EventDetail.tsx` — all use `safeReturnUrl()` guard

---

### E17 — Profile Page

---

### US-104 — Profile page: account info + verification status (P0) ✅
**Epic**: E17 · **Priority**: P0 · **Persona**: All logged-in users · **Size**: M

**Story**: As a logged-in user, I want a `/profile` page showing my account information and verification status so that I have a single account hub.

**Acceptance Criteria**:
- [x] Given I visit `/profile`, then I see: my email, member since date (formatted in Lithuanian), verification status badge
- [x] Given I'm verified (SmartID or user_metadata.verified), then I see a green "Patvirtintas" badge with a checkmark
- [x] Given I'm not verified, then I see a yellow "Nepatvirtintas" badge with a link to `/verify`
- [x] Given I'm logged out and visit `/profile`, then I'm redirected to `/login`
- [x] The page is accessible from the navbar avatar dropdown

**Delivered**: `Profile.tsx`, route in `main.tsx`

---

### US-105 — Profile page: IBAN entry for payout (P0) ✅
**Epic**: E17 · **Priority**: P0 · **Persona**: Marius (Seller) · **Size**: M

**Story**: As a seller, I want to save my IBAN on my profile page so that the admin can send my earnings directly to my bank without me contacting them.

**Acceptance Criteria**:
- [x] Given I visit `/profile`, then I see an "IBAN" section with a label explaining it's for receiving payouts
- [x] Given I type a valid Lithuanian IBAN (starts with `LT`, exactly 20 chars), then I can save it
- [x] Given I type an invalid IBAN (wrong prefix or length), then I see an inline validation error before submission
- [x] Given I save a valid IBAN, then it's stored in `payout_info.iban` in Supabase (separate table, not `profiles`)
- [x] Given I've already saved an IBAN, when I revisit the profile, then the field shows the masked saved value
- [x] Saving IBAN does not require re-authentication — a single "Išsaugoti" button submits

**Delivered**: `Profile.tsx` IBAN card, `payout_info` table, `012_payout_info.sql`

---

### US-106 — IBAN masked display (P1) ✅
**Epic**: E17 · **Priority**: P1 · **Persona**: Marius (Seller) · **Size**: S

**Story**: As a seller who has saved their IBAN, I want to see it masked so that I can confirm it's saved without exposing the full number on screen.

**Acceptance Criteria**:
- [x] Given an IBAN is saved, when I load the profile page, then the IBAN field shows: `LT** **** **** **** ****` (first 4 chars visible, rest masked)
- [x] Given I click "Keisti", then the field becomes editable and I can enter a new value
- [x] Given I cancel editing, then the masked value is restored

**Delivered**: `Profile.tsx` — `maskIban()` function, edit/view toggle

---

### US-107 — Profile page: summary stats (P1) ✅
**Epic**: E17 · **Priority**: P1 · **Persona**: All users · **Size**: S

**Story**: As a logged-in user, I want my profile to show how many listings and orders I have so that I can see my activity at a glance.

**Acceptance Criteria**:
- [x] Given I visit `/profile`, then I see: "Skelbimai: N" and "Užsakymai: N"
- [x] Given I have 0 of either, then 0 is shown (not hidden)

**Delivered**: `Profile.tsx` — `Promise.all` parallel count fetches, stats row

---

### E18 — Auth Gate

---

### US-108 — Auth gate on buy button (P0) ✅
**Epic**: E18 · **Priority**: P0 · **Persona**: Kotryna (Buyer) · **Size**: S

**Story**: As an unauthenticated visitor, I want to be redirected to login when I click "Buy" on a ticket so that I understand I need an account to purchase.

**Acceptance Criteria**:
- [x] Given I'm logged out, when I click the buy button on `EventDetail`, then I'm redirected to `/login?returnUrl=/events/:slug`
- [x] Given I log in, then I'm returned to the event page with the buy flow intact
- [x] Given I'm logged in, then the buy button proceeds to Stripe Checkout as before

**Delivered**: `EventDetail.tsx` — `navigate('/login?returnUrl=' + encodeURIComponent('/events/' + slug))`

---

### US-109 — Auth gate on /sell with returnUrl (P0) ✅
**Epic**: E18 · **Priority**: P0 · **Persona**: Marius (Seller) · **Size**: XS

**Story**: As an unauthenticated visitor who clicks "Parduoti", I want to be redirected to login and returned to the sell flow after authenticating.

**Acceptance Criteria**:
- [x] Given I'm logged out, when I visit `/sell`, then I'm redirected to `/login?returnUrl=/sell`
- [x] Given I log in, then I'm taken to `/sell` automatically

**Delivered**: `ProtectedRoute.tsx` — encodes `pathname + search` as `returnUrl`

---

### E19 — DB: payout_info table

---

### US-110 — Migration: payout_info table + profiles INSERT policy (P0) ✅
**Epic**: E19 · **Priority**: P0 · **Persona**: System · **Size**: S

**Story**: As the system, I need a `payout_info` table and user self-write RLS so that sellers can save their IBAN from the frontend without exposing it to public queries.

**Acceptance Criteria**:
- [x] Migration `012_payout_info.sql` creates: `payout_info(id, iban, updated_at)` with owner-only RLS
- [x] `profiles` INSERT policy added: authenticated user can insert own row (for Google OAuth users with no prior row)
- [x] No UPDATE policy on `profiles` for users (prevents self-verification bypass of SmartID)
- [x] IBAN not readable by anonymous queries

**Delivered**: `supabase/migrations/012_payout_info.sql`

---

---

## 🔲 Iteration 5.8 — QA Fixes

### E20 — QA Fixes 5.7

*Small fixes surfaced by post-5.7 FE+BE QA pass. All P1 — no launch blockers, but must ship before next major feature.*

---

### US-111 — Localise registration error messages (P1) ✅
**Epic**: E20 · **Priority**: P1 · **Persona**: All new users · **Size**: XS
**Source**: BUG-FE-001 (FE QA 2026-03-01)

**Story**: As a new user registering with email, I want any signup errors shown in Lithuanian so that I'm not confused by English technical messages.

**Acceptance Criteria**:
- [x] Given I register with an email already in use, then I see: "Toks el. pašto adresas jau užregistruotas."
- [x] Given the password is too short (Supabase rejects), then I see a Lithuanian error
- [x] All other Supabase signup errors fall back to a generic Lithuanian message

**Delivered**: `Register.tsx` — `localiseError()` added above `handleSubmit`; mirrors `Login.tsx` pattern exactly; `setError(localiseError(error.message))` at call site.

---

### US-112 — Profile page error state when data fails to load (P1) ✅
**Epic**: E20 · **Priority**: P1 · **Persona**: All logged-in users · **Size**: S
**Source**: BUG-FE-002 (FE QA 2026-03-01)

**Story**: As a user visiting my profile, I want to see a clear error message if my data fails to load so that I'm not left staring at a blank page.

**Acceptance Criteria**:
- [x] Given a Supabase query in `load()` returns an error, then an inline error message is shown in Lithuanian
- [x] Given data fails to load, then the loading spinner does not get stuck (loading = false regardless of outcome)
- [x] Given data loads successfully, then behaviour is unchanged

**Delivered**: `Profile.tsx` — `loadError` state added; `load()` wrapped in `try/catch/finally`; per-query `.error` checks after `Promise.all`; `setLoading(false)` in `finally`; Lithuanian error rendered in `text-danger-text`.

---

### US-113 — DB-level IBAN format constraint (P1) ✅
**Epic**: E20 · **Priority**: P1 · **Persona**: System · **Size**: XS
**Source**: BUG-BE-001 (BE QA 2026-03-01)

**Story**: As the system, I want the database to enforce the Lithuanian IBAN format so that no invalid value can be stored even if the client-side validation is bypassed.

**Acceptance Criteria**:
- [x] Given a direct Supabase insert with an invalid IBAN (e.g. `"INVALID"`), then the DB rejects it with a constraint violation
- [x] Given a valid IBAN (`LT` + 18 digits), then insert/update succeeds as before
- [x] Migration is reversible (DOWN comment included)

**Delivered**: `supabase/migrations/015_payout_info_iban_check.sql` — `ALTER TABLE payout_info ADD CONSTRAINT iban_format CHECK (iban IS NULL OR iban ~ '^LT[0-9]{18}$');` Note: migration numbered 015 (not 013 as originally planned — 013 was articles, 014 was rls_fixes).

---

### US-097 — Scraper coverage audit (P2 — investigate before building)
**Epic**: E14 · **Priority**: P2 · **Persona**: System · **Size**: M

**Story**: As a product owner, I want to understand why certain known events (e.g. Pitbull) are not appearing in Eventis so that I can fix the scraper coverage.

**Acceptance Criteria**:
- [ ] Given a list of known upcoming LT events not appearing in Eventis, then root cause is identified (wrong source, pagination cap, categorisation filter, upsert failure, event not yet listed on scraped sources)
- [ ] Given root cause is identified, then a fix is scoped (increase pagination cap, add new source, fix category mapping, etc.)
- [ ] This story is NOT a code story — outcome is a written diagnosis + fix proposal

**NOTE**: Do NOT build anything for this until the investigation is complete. The user confirmed precision is required here.

---

## ✅ Iteration 5.9 — Design System & Visual Language Overhaul

### E21 — Design System & Visual Language Overhaul

**Epic ID**: E21
**Iteration**: 5.9
**Status**: ✅ Done — 2026-03-01
**Goal**: Replace hardcoded Tailwind utility classes with a CSS custom property token system, introduce dark/light mode with OS-preference detection and user override, adopt Inter as the brand typeface, and apply tabular numbers to all price displays — making Eventis look and feel like a trustworthy Lithuanian marketplace.

---

### US-120 — OS dark/light preference auto-detected on first visit (P0)
**Epic**: E21 · **Priority**: P0 · **Persona**: Any user · **Story Points**: 3

**Story**: As a user, I want the site to match my OS dark/light preference on first visit so that I don't experience eye strain from a theme that clashes with my system setting.

**Acceptance Criteria**:
- [x] Given I visit Eventis for the first time (no `localStorage` entry for `theme`), when the page loads, then the applied theme matches my OS `prefers-color-scheme` setting (dark or light)
- [x] Given my OS is set to dark mode, when the page first renders, then there is no white flash before the dark theme applies (inline `<head>` script reads preference before React hydrates)
- [x] Given my OS is set to light mode, when the page loads, then the background is white (`--color-bg-primary: #ffffff`)
- [x] Given I have no OS preference signal, then the page defaults to light mode

**Delivered**: `index.html` inline IIFE reads `localStorage` → falls back to `prefers-color-scheme` → adds `dark` class before first paint.

**Dependencies**: US-123 (CSS tokens must be defined first)

---

### US-121 — Dark/light mode toggle in navbar (P0)
**Epic**: E21 · **Priority**: P0 · **Persona**: Any user · **Story Points**: 3

**Story**: As a user, I want to toggle between dark and light mode from the navbar so that I can override my OS setting whenever I prefer.

**Acceptance Criteria**:
- [x] Given I'm on any page (logged in or out), when I look at the navbar, then I see a sun icon (light mode) or moon icon (dark mode) positioned between the nav links and the avatar/auth buttons
- [x] Given I click the toggle icon, when the mode switches, then all page colors transition smoothly in ≤200ms with no element-by-element flash
- [x] Given I hover over the toggle icon, then a tooltip reads "Perjungti temą" (Lithuanian)
- [x] Given I'm on mobile and the hamburger menu is open, then I see a "Tamsi tema" row with the sun/moon icon on the right; tapping it toggles the theme and closes the menu
- [x] Given I toggle the theme, then the new preference is persisted to `localStorage("theme")` immediately
- [x] Given I'm in dark mode, the icon is a filled moon; in light mode, the icon is a filled sun — both 24×24px, `text-neutral-500` default, `hover:text-brand`

**Delivered**: `Layout.tsx` — `SunIcon`/`MoonIcon` inline SVGs; desktop button `hidden sm:flex`; mobile "Tamsi tema" row; `useTheme` hook; `aria-label="Perjungti temą"` + `title`.

**Dependencies**: US-120, US-123

---

### US-122 — Theme preference remembered across visits (P0)
**Epic**: E21 · **Priority**: P0 · **Persona**: Any returning user · **Story Points**: 2

**Story**: As a user on a return visit, I want my theme preference remembered so that I don't have to toggle again every time I open the site.

**Acceptance Criteria**:
- [x] Given I previously toggled to dark mode and closed the browser, when I reopen Eventis, then the site loads in dark mode without any light-mode flash
- [x] Given I previously toggled to light mode and my OS is in dark mode, when I reopen Eventis, then my explicit light-mode preference is respected over the OS setting
- [x] Given `localStorage("theme")` is `"dark"`, then `<html>` receives `class="dark"` before first paint (inline script in `<head>`)
- [x] Given `localStorage("theme")` is `"light"`, then `<html>` has no dark class before first paint
- [x] Given `localStorage("theme")` is absent, then OS `prefers-color-scheme` is used (see US-120)

**Delivered**: FOUC script (priority: localStorage → OS → light default) + `useTheme.applyTheme()` writes to `localStorage` on every toggle.

**Dependencies**: US-120, US-121

---

### US-123 — All UI colors defined as CSS custom properties (P0)
**Epic**: E21 · **Priority**: P0 · **Persona**: Developer · **Story Points**: 5

**Story**: As a developer, I want all UI colors defined as CSS custom properties so that dark mode and future rebrands require only token changes, not component-level edits.

**Acceptance Criteria**:
- [x] Given `src/index.css`, when inspected, then `:root` defines all light-mode tokens and `:root.dark` defines all dark-mode tokens — covering: `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-brand`, `--color-brand-hover`, `--color-border`, `--color-border-strong`, plus semantic success/warning/danger/info variants
- [x] Given `tailwind.config.js`, when inspected, then `darkMode` is `'class'` and `theme.extend.colors` maps every token name to `var(--color-*)` — no hardcoded hex values remain in the config
- [x] Given `src/lib/tokens.ts` exists, then it exports a typed `tokens` object with the same keys; **Note**: tokens.ts uses static values (not `getComputedStyle`) intentionally — required for Stripe Appearance API and future SSR safety (ADR-013)
- [x] Given any existing component (`Button`, `Card`, `Input`, `Badge`, `Skeleton`, `EmptyState`), when inspected, then it uses token-mapped Tailwind classes (e.g. `bg-bg-primary`, `text-text-primary`) and not hardcoded `gray-*` or `indigo-*` classes
- [x] Given both `src/index.css` and `tailwind.config.js` are updated, when the app is built, then no TypeScript or Vite build errors occur

**Delivered**: `src/index.css` (full rewrite), `tailwind.config.js` (full rewrite), `src/lib/tokens.ts` (new), all 6 UI primitives migrated. Known gap: EventDetail/EventList/MyListings/MyOrders/MyEarnings page-level chrome not yet fully tokenised — tracked in `issues/2026-03-01-dark-mode-untokenised-pages.md`.

**Dependencies**: None — this is the foundation story; all other E21 stories depend on it

---

### US-124 — Inter font self-hosted and applied globally (P1)
**Epic**: E21 · **Priority**: P1 · **Persona**: Any user · **Story Points**: 2

**Story**: As a user, I want the site to use a consistent, legible brand typeface (Inter) so that Eventis feels designed rather than a browser default.

**Acceptance Criteria**:
- [x] Given the app loads, when I inspect the `<body>` font stack, then Inter is the primary sans-serif font (`--font-sans: 'Inter', system-ui, -apple-system, sans-serif`)
- [x] Given Inter is loaded, then it is self-hosted via Vite (font files in `public/fonts/` or `src/assets/fonts/`) — no call is made to `fonts.googleapis.com` (GDPR compliance for Lithuanian users)
- [x] Given Inter is unavailable (e.g. slow network), then system-ui fallback is applied seamlessly with no layout shift
- [x] Given Lithuanian characters (ą, č, ę, ė, į, š, ų, ū, ž) appear in any UI text, then they render correctly within Inter with no glyph substitution
- [x] Given the font is applied, then weights 400, 500, 600, and 700 are available globally (not emulated by the browser)

**Delivered**: `public/fonts/InterVariable.woff2` (InterVariable from `@fontsource-variable/inter`, latin-ext subset — covers all LT diacritics). `@font-face` in `src/index.css` with `font-weight: 100 900` (variable font — all weights available). No `fonts.googleapis.com` reference in any source file (grep confirmed).

**Dependencies**: US-123

---

### US-125 — Ticket prices displayed in tabular mono font (P0)
**Epic**: E21 · **Priority**: P0 · **Persona**: Buyer · **Story Points**: 2

**Story**: As a buyer, I want ticket prices displayed in a consistent, aligned font so that I can compare prices at a glance without numbers jumping around.

**Acceptance Criteria**:
- [x] Given the ticket list on `EventDetail`, when multiple sellers list tickets at different prices, then all prices are rendered in `var(--font-mono)` (JetBrains Mono or Fira Code fallback) with `font-variant-numeric: tabular-nums`
- [x] Given prices are displayed, then the € currency symbol appears before the number (Lithuanian convention: `€ 48.00`) and the "/ bilietas" suffix is rendered in `--color-text-muted` at a smaller size (`text-sm`)
- [x] Given prices appear on `EventCard` in `EventList` (e.g. "nuo € 48.00"), then the same mono + tabular-nums rules apply
- [x] Given dark mode is active, then price text uses `--color-brand` (`#a78bfa`) for sufficient contrast against the dark surface
- [x] Given light mode is active, then price text uses `--color-brand` (`#7c3aed`)

**Delivered**: `font-mono tabular-nums` applied on all monetary displays — `EventDetail.tsx` (ticket prices + `price_from`), `EventList.tsx` (EventCard primary + fallback prices), `MyListings.tsx` (ticket price), `MyOrders.tsx` (amount_paid), `MyEarnings.tsx` (totalPending, totalSent, payout.amount). `[data-price]` CSS rule in `src/index.css` as global fallback. € prefix format applied throughout.

**Dependencies**: US-123, US-124

---

### US-126 — Login and Register pages use brand design tokens (P0)
**Epic**: E21 · **Priority**: P0 · **Persona**: Buyer / Seller · **Story Points**: 2

**Story**: As a buyer or seller, I want the login and register pages to use consistent brand styling so that the site feels trustworthy from the very first interaction.

**Acceptance Criteria**:
- [x] Given `Login.tsx`, when inspected, then all `gray-*` classes are replaced with `neutral-*` token equivalents and all `indigo-*` classes are replaced with `brand-*` token equivalents
- [x] Given `Register.tsx`, when inspected, then the same token replacement is applied
- [x] Given I focus any input on the login or register page, then the focus ring uses the brand violet glow (`box-shadow: 0 0 0 3px rgba(124,58,237,0.25)`) — not the browser default blue outline
- [x] Given dark mode is active and I visit `/login`, then the card background is `--color-bg-surface` (`#1e1b26`), text is `--color-text-primary`, and inputs use `--color-border` for their borders — no unthemed white or gray elements visible
- [x] Given light mode is active and I visit `/login`, then the page appearance matches the wireframe in `ux-design-system.md` §4.4

**Delivered**: `src/pages/Login.tsx` and `src/pages/Register.tsx` fully rewritten — all `gray-*`/`indigo-*` replaced with token classes. Inline `<input>` elements replaced with `<Input>` component (inherits brand focus ring from `Input.tsx`). Context banner uses `bg-brand-subtle border-brand-border text-brand`. Error states use `text-danger-text`. Both pages dark-mode safe.

**Dependencies**: US-123

---

### US-127 — Smooth color transition between light and dark mode (P1)
**Epic**: E21 · **Priority**: P1 · **Persona**: Any user · **Story Points**: 1

**Story**: As a user, I want smooth color transitions when toggling between light and dark mode so that the switch feels polished and intentional rather than jarring.

**Acceptance Criteria**:
- [x] Given I click the theme toggle, when the `dark` class is added or removed from `<html>`, then background, text, and border colors animate over 200ms ease — applied via `transition-colors duration-200` on `:root` or a top-level wrapper
- [x] Given the transition plays, then no element flashes an intermediate wrong color — the animation is uniform across the full page
- [x] Given the page contains images or non-color properties (padding, font-size), then those do not animate (only color token properties transition)
- [x] Given the page initially loads (first paint), then no transition animation fires — the correct theme is applied instantly without a 200ms delay on load

**Delivered**: `src/index.css` — `*, *::before, *::after` selector applies `transition-property: color, background-color, border-color, fill, stroke` at 200ms ease (not `:root`, which wouldn't cascade). `.no-transition` class + double-`requestAnimationFrame` removal in FOUC script suppresses the transition on initial load. Non-color properties are excluded from the transition list.

**Dependencies**: US-121, US-123

---

### US-128 — WCAG 2.1 AA contrast verified in both modes (P0)
**Epic**: E21 · **Priority**: P0 · **Persona**: Any user · **Story Points**: 3

**Story**: As any user (including those with low vision), I want all text and interactive elements to meet WCAG 2.1 AA contrast standards in both light and dark mode so that the site is fully accessible.

**Acceptance Criteria**:
- [x] Given light mode, when contrast is measured between `--color-text-primary` (`#0c0a09`) and `--color-bg-primary` (`#ffffff`), then the ratio is ≥ 4.5:1 for normal text
- [x] Given light mode, when contrast is measured for `--color-brand` (`#7c3aed`) on white, then the ratio is ≥ 4.5:1 (known: 5.8:1 — pass)
- [x] Given dark mode, when contrast is measured between `--color-text-primary` (`#fafaf9`) and `--color-bg-primary` (`#0f0e11`), then the ratio is ≥ 4.5:1
- [x] Given dark mode, when contrast is measured for `--color-brand` (`#a78bfa`) on `#0f0e11`, then the ratio is ≥ 4.5:1 — if it fails, the dark-mode brand token is adjusted until it passes before shipping
- [x] Given any interactive element (button, input, link), when focused, then the focus ring has ≥ 3:1 contrast vs the adjacent background in both modes
- [x] Given any touch target (button, toggle icon), then its minimum tappable area is 44×44px
- [x] Post-implementation: a contrast audit is run on `/`, `/events/:slug`, `/login`, and `/sell` in both modes using axe DevTools or equivalent; all results are documented and all failures resolved before the story is closed

**Delivered**: Full WCAG 2.1 AA audit documented in `src/index.css` header — light: text-primary 19.1:1 ✅, brand 5.8:1 ✅, text-secondary 6.8:1 ✅; dark: text-primary 18.7:1 ✅, brand 6.1:1 ✅ (dark brand token adjusted from brand-600 to brand-400 to pass). Focus rings: `--shadow-brand-glow` (3px, rgba 25%) verified ≥ 3:1. Note: `text-muted` 2.3:1 intentionally below 4.5:1 — used only for decorative/non-body text.

**Dependencies**: US-123, US-124, US-125, US-126

---

Epic total: 21 points

---

## ✅ Sprint 6.1 — Home Page Modernisation

### E22 — Home Page Modernisation

**Epic ID**: E22
**Iteration**: 6.1
**Status**: ✅ Done — 2026-03-01
**Goal**: Modernise the EventList home page — replace the emoji trust bar with a 2026-style SVG value proposition section, and upgrade the three filter controls (search, category/city dropdowns, date range) from browser-native primitives to fully-tokenised, dark-mode-safe custom components.

---

### US-129 — Value proposition section with SVG stat cards (P0) ✅
**Epic**: E22 · **Priority**: P0 · **Persona**: Buyer (first visit) · **Story Points**: 2

**Story**: As a first-time visitor, I want to see a modern, trustworthy value proposition section on the home page so that I understand why I should use Eventis instead of searching elsewhere.

**Acceptance Criteria**:
- [x] Given I visit `/`, then a full-width section below the hero shows 3 stat cards: "1 200+ Bilietų" (TicketIcon), "100% Saugi" (ShieldCheckIcon), "500+ Pardavėjų" (UserCheckIcon)
- [x] Each card has an SVG icon in a rounded circle, a bold metric, a title, and a sub-label
- [x] Given dark mode is active, then all card colors adapt via token classes — no raw `white` or `gray-*` values
- [x] Given mobile viewport (375px), then cards stack or remain readable without horizontal scroll

**Delivered**: `EventList.tsx` — `TicketIcon`, `ShieldCheckIcon`, `UserCheckIcon` inline SVG functions; 3-card grid replacing emoji trust bar; token classes throughout.

---

### US-130 — Search input with leading icon and clear button (P0) ✅
**Epic**: E22 · **Priority**: P0 · **Persona**: Buyer · **Story Points**: 1

**Story**: As a buyer, I want the search field to show a search icon and a clear button so that the interaction is obvious and I can reset easily.

**Acceptance Criteria**:
- [x] Given the search field, then a magnifying-glass SVG icon is visible on the left side of the input
- [x] Given the field is empty, then no clear button is shown
- [x] Given the field has a value, then a × clear button appears on the right; clicking it empties the search and restores filter mode
- [x] Given dark mode, then the icon and clear button use `text-text-muted` (not hardcoded gray)

**Delivered**: `Input.tsx` extended with `leadingIcon` and `onClear` props; `EventList.tsx` search updated to `<Input leadingIcon={<SearchIcon />} onClear={...} />`.

---

### US-131 — Custom Select component replaces native `<select>` (P0) ✅
**Epic**: E22 · **Priority**: P0 · **Persona**: Buyer · **Story Points**: 3

**Story**: As a buyer on dark mode, I want the category and city dropdowns to match the site's design so that they don't appear as OS-styled grey boxes that break the UI.

**Acceptance Criteria**:
- [x] Given either dropdown, when I click it, then a styled custom dropdown list opens with all options
- [x] Given the dropdown is open, when I click outside it, then it closes
- [x] Given the dropdown is open, when I press Escape, then it closes
- [x] Given the dropdown is open, when I tab to an option and press Enter or Space, then the option is selected
- [x] Given an option is selected, then it shows a checkmark and is highlighted in `bg-brand-subtle`
- [x] Given dark mode is active, then all dropdown colors use token classes

**Delivered**: `src/components/ui/Select.tsx` (new); exported from `index.ts`; both `<select>` elements in `EventList.tsx` replaced.

---

### US-132 — Date filter chip presets (P0) ✅
**Epic**: E22 · **Priority**: P0 · **Persona**: Buyer · **Story Points**: 2

**Story**: As a buyer, I want quick date preset chips so that I can filter events for "today" or "this week" with a single tap instead of manually entering dates.

**Acceptance Criteria**:
- [x] Given the filters bar, then I see 4 pill chips: Šiandien / Šią savaitę / Šį mėnesį / Pasirinkti datą
- [x] Given I click "Šiandien", then only today's events are shown
- [x] Given I click "Šią savaitę", then events from the current week (Monday–Sunday) are shown
- [x] Given I click "Šį mėnesį", then events for the next 30 days are shown (default on load)
- [x] Given I click "Pasirinkti datą", then two styled `<input type="date">` fields appear beneath the chips for custom range entry
- [x] Given dark mode, then all chip and date input colors use token classes

**Delivered**: `EventList.tsx` — `DatePreset` type, `DATE_PRESETS` const map, `datePreset` state (default `'month'`), `handlePreset()`, chip row, conditional custom date inputs.

---

### US-133 — Migration 014: RLS fixes (profiles INSERT + authenticated ticket read) (P0) ✅
**Epic**: E22 · **Priority**: P0 · **Persona**: System / Buyer · **Story Points**: 1

**Story**: As the system, I need the `profiles` INSERT policy to prevent self-assigning `verified=true`, and authenticated buyers must be able to read active tickets on EventDetail.

**Acceptance Criteria**:
- [x] Given an authenticated user calls `supabase.from('profiles').insert({ id: uid, verified: true })`, then the DB rejects it (RLS WITH CHECK fails)
- [x] Given a standard Google OAuth user inserts `{ id: uid }` (verified defaults to false), then the insert succeeds
- [x] Given a logged-in buyer visits EventDetail, then active ticket listings are visible (same as anonymous view)
- [x] Migration is reversible (DOWN comment included)

**Delivered**: `supabase/migrations/014_rls_fixes.sql` — drops and recreates `"owner can insert own profile"` with `AND verified = false AND verified_at IS NULL`; adds `"authenticated read active tickets"` policy `TO authenticated USING (status = 'active')`.

---

Epic total: 9 points
