# PRD — Eventis Secondary Ticket Marketplace

**Status**: Living document — updated per iteration
**Owner**: PM
**Last updated**: 2026-02-28

---

## Problem
Lithuanian event-goers have no trusted digital marketplace for secondary tickets. Facebook groups are the default — they're riddled with scams, no payment protection, and zero accountability. Buyers and sellers both lose. Eventis fixes this with a structured, payment-protected marketplace focused on Lithuanian events.

---

## Goals
1. Enable any Lithuanian event-goer to safely list and sell a ticket they can't use
2. Enable buyers to purchase secondary tickets with confidence (real ticket, secure payment)
3. Build trust through identity verification and transparent transactions
4. Become the default LT secondary ticket platform within 12 months of launch

---

## Non-Goals
- We are NOT building a primary ticketing platform
- We are NOT a global platform — Lithuania first
- We are NOT building a mobile app (web-first (mobile and destop))
- We are NOT automating Stripe payouts in the MVP

---

## User Personas
See `docs/personas.md` for full personas.
- **Primary**: Marius (Seller) + Kotryna (Buyer)
- **Secondary**: Adomas (Admin)

---

## Feature Inventory by Iteration

### ✅ Iteration 1 — Event Discovery (Done)
- Scraped events from bilietai.lt, zalgiris.koobin.com, kakava.lt
- Public event list with search + category + date filter
- Event detail page

### ✅ Iteration 2 — Seller Ticket Listings (Done)
- Supabase Auth (email + password)
- Seller can list ticket: PDF upload, price, seat info, split type
- Event detail shows available tickets
- My Listings page

### ✅ Iteration 3 — Buyer Purchase Flow (Done)
- Stripe Checkout (one-time payment)
- Post-payment webhook: mark ticket sold, email PDF to buyer
- Order confirmation page + order history

### ✅ Iteration 4 — Seller Payouts (Done)
- `payouts` table per order
- Admin view to mark payouts as sent
- Seller "My Earnings" page (pending/paid)
- Manual Stripe transfer flow

### 🔲 Iteration 5 — Hardening & Growth (Current)

#### P0 — Must ship
| Feature | Why |
|---------|-----|
| SmartID identity verification for sellers | Trust is the #1 buyer concern |
| Recurring scraper (cron) | Manual scraping doesn't scale |
| Admin dashboard (event + user management) | Can't operate without visibility |

#### P1 — Should ship this iteration
| Feature | Why |
|---------|-----|
| Refund request flow | Dispute handling essential for trust |
| LT + EN i18n | LT-first but EN for accessibility |
| Email notifications (listing sold, payout scheduled) | Sellers need confirmation |

#### P2 — Next iteration
| Feature | Why |
|---------|-----|
| Multi-ticket cart | Power buyers want to buy multiple listings |
| Seller ratings / reviews | Trust signals |
| Price alerts | Buyer retention |
| SEO-optimised event pages | Organic discovery |

---

## User Stories (Iteration 5)

See `docs/user-stories.md` for full story list.

### SmartID Verification
- As a seller, I want to verify my identity via SmartID so that buyers trust my listings more.
- As a buyer, I want to see a "Verified Seller" badge so that I know the seller is real.
- As an admin, I want unverified sellers to be blocked from listing so that I reduce fraud.

### Admin Dashboard
- As an admin, I want to see all active listings so that I can spot fraudulent content.
- As an admin, I want to deactivate a user account so that I can act on fraud reports.
- As an admin, I want to see payout queue sorted by date so that I can process efficiently.

### Recurring Scraper
- As a system, I want the scraper to run daily so that event data is always fresh.
- As an admin, I want to see the last scrape timestamp so that I know if it's broken.

### Refund Flow
- As a buyer, I want to request a refund so that I'm protected if the ticket is invalid.
- As an admin, I want to review refund requests so that I can make fair decisions.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Verified seller rate | >80% of listings from verified sellers (3 months post IDV launch) |
| Buyer conversion rate | >15% of event detail page visits → purchase |
| Dispute rate | <2% of transactions |
| Scraper uptime | >95% daily run success |
| Admin response time | <24h for refund requests |

---

## Open Questions

- [ ] SmartID API: what are the integration costs per verification? (affects pricing model)
- [ ] Should unverified sellers see a warning or be fully blocked from listing?
- [ ] Refunds: do we handle via Stripe automatically or manually through admin?
- [ ] i18n: translate everything at once or start with key flows?
- [ ] Cron: Supabase Edge Functions cron vs GitHub Actions scheduled workflow?

---

## Dependencies
- **Technical**: Supabase Edge Functions (cron + SmartID webhook handling)
- **External**: SmartID API credentials (business account required)
- **Legal**: GDPR compliance review needed before storing biometric verification data
