# Sprint Brief — UX/UI & Value Proposition Overhaul
**Date**: 2026-03-01
**Sprint focus**: SEO growth (news page) + event card redesign + full UX modernization
**Roles**: BA + UX + PM combined
**Status**: Ready for `/create-plan` → `/execute`

---

## 1. PROBLEM STATEMENT

Eventis has working core flows (browse → buy → sell → payout) but the product looks and feels like a first-draft internal tool. It does not yet reflect the trust, authority, or modernity of the best marketplaces in Lithuania or Europe. Three concrete problems:

1. **No organic content engine** — zero SEO-optimised pages beyond event listings. No news/blog. Google has nothing to index that builds topical authority for "bilietai", "renginiai Vilnius", "Lietuvos renginiai".
2. **Event cards undersell the product** — cards show basic info but miss the signals that drive click-through: urgency, social proof, scarcity. Primary info (date/venue/price) is not visually prioritised.
3. **UI looks generic** — no visual identity beyond indigo Tailwind defaults. Pages use raw utility classes with no coherent design language. Compared to TicketSwap, StubHub, or Revolut, the product looks unfinished.

---

## 2. COMPETITOR & BENCHMARK ANALYSIS

### Secondary Ticket Marketplace Competitors

| Platform | UX Strengths | UX Weaknesses |
|---|---|---|
| **TicketSwap** | Clean, fan-first, capped resale pricing (+20%), haptic feedback, barcode auto-crop, strong trust signals | Limited to specific EU markets |
| **StubHub** | Strong search/filter UX, intuitive event browsing, seat map visualisation | Overloaded with pricing tiers, confusing fee display |
| **Viagogo** | Wide listings coverage | Confusing UX, dark patterns on pricing, poor trust |
| **SeatGeek** | Best-in-class deal scoring (Deal Score widget), clean card design | US-focused |
| **Ticketmaster Resale** | Trusted brand, integrated with primary purchase | Heavy UI, slow, cluttered |

### Companies Known for World-Class UX

**Stripe**
- Zero unnecessary friction — every step removed increases conversion
- Radical clarity: one primary action per screen
- Progressive disclosure — show only what's needed now
- Microinteractions validate input instantly
- Design system: clean whites, subtle grays, one accent color
- Typography does the heavy lifting (no decorative noise)

**Shopify**
- Mobile-first — every interaction designed for thumb reach
- Checkout conversion obsession: 26% uplift with streamlined mobile checkout
- Card-based content: clean image, clear hierarchy (title → meta → price → CTA)
- Consistent spacing system with intentional whitespace
- Trust signals embedded in purchase flow (locks, badges, reviews)

**Revolut**
- Onboarding: 10–15 minutes, zero paper, radical friction reduction
- Dark/light adaptive, premium feel
- Numbers as hero — large, bold financial figures dominate
- Haptic + animation feedback on every interaction
- Status chips/badges used to communicate state (pending, active, locked)

**Apple**
- Negative space as design element — content breathes
- Hierarchy through scale and weight, not color noise
- Product photography carries the experience
- One font family, strict weight/size system
- Every interaction feels intentional, never accidental

### Key Takeaways for Eventis
- All four use a **restrained color palette** — one primary accent, not rainbow Tailwind
- All four **lead with the image** — product/event photography is hero, not afterthought
- All four use **large, bold typography** for the most important number (price, date)
- All four have **trust signals embedded** — not added as afterthought
- All four use **status chips** (colored, pill-shaped) consistently

---

## 3. AREA 1 — NEWS / BLOG PAGE (SEO)

### Problem
No content beyond event listings. Google sees a thin site. No topical authority for Lithuanian event search terms. No reason for return visits outside of active purchase intent.

### SEO Opportunity
- Target keywords: "renginiai Vilnius", "bilietai Lietuvoje", "koncertai Kaunas", "teatro bilietai", "sporto renginiai"
- Local SEO: location-tagged articles index well for geo-modified searches
- Content creates backlink targets — no blog = no link building surface
- Event announcements, artist news, venue guides = recurring organic traffic

### What Best-in-Class News Pages Do
- **Ticketmaster blog**: Event announcements, artist spotlights, buying guides → drives branded search
- **TicketSwap blog**: Fan stories, event guides → community trust
- **Festival SEO playbook**: Behind-the-scenes, lineup announcements, venue guides = long-tail keyword coverage

### Requirements

**Must Have (MVP)**
- `/naujienos` route — news/blog index page
- `/naujienos/:slug` — individual article page
- Article fields: title, cover image, excerpt, body (rich text/markdown), published_at, category tag, author
- SEO meta tags per article: title, description, og:image, og:url, canonical
- Structured data: Article schema (JSON-LD) for Google rich results
- Sitemap updated to include news articles
- CMS-style: admin can create/edit articles via Supabase table (`articles`)

**Should Have**
- Category filter on news index (e.g., Renginiai, Menininkai, Naujienos, Patarimai)
- Related articles widget on event detail page ("Skaitykite taip pat")
- Share buttons (native Web Share API)
- Open Graph preview image per article

**Nice to Have**
- Newsletter subscribe CTA embedded in articles
- Event mention linking — article references an event → link to event detail
- Reading time estimate

### User Stories
- *As an admin, I want to publish a news article so that I can drive SEO traffic without developer help.*
- *As a visitor, I want to read event-related news so that I have a reason to return to the platform.*
- *As a buyer, I want to discover events through content so that I learn about events I didn't know existed.*

### Success Metrics
- 10+ articles published in first 60 days
- Google indexes news section within 30 days of launch
- News pages account for 15%+ of organic traffic within 90 days
- Average session duration up (content keeps users on site longer)

---

## 4. AREA 2 — EVENT CARD REDESIGN

### Current State (what cards show now)
```
[ Image 16:9 ]
[Category badge]
[Title — 2-line clamp]
[Date]
[Location]
[Price from: X €]
[Secondary market badge: N bilietai nuo X €]
```

### Problems with Current Cards
1. **Date format is verbose** — "1 balandžio 2025" takes too much space, loses visual punch
2. **No urgency signal** — doesn't show "3 tickets left" or "Selling fast" scarcity
3. **Price is not hero** — small text, same weight as location
4. **Category badge is redundant noise** — users are already filtering by category
5. **No visual hierarchy** — title, date, location, price all similar size/weight
6. **Secondary market badge is an afterthought** — green text at bottom, not designed
7. **Missing**: Performer/artist name when different from event title
8. **Missing**: "Verified sellers only" signal if all sellers are verified
9. **Image fallback is just gray text** — ugly when no image

### What Best Cards Do (StubHub, SeatGeek, TicketSwap)
- **Hero image** dominates (60–70% of card height)
- **Date is structured**: Day + Month in two lines (big number, small month) — scannable instantly
- **Price is bold and large** — the most important conversion number
- **Scarcity chip** overlaid on image or below title: "Paskutiniai 2 bilietai"
- **Location is secondary** — smaller, lighter weight
- **Hover state** reveals quick-action (Add to watchlist, Buy now)
- **Aspect ratio consistent** across all cards — no layout jank

### Redesigned Card Information Architecture (recommended)
```
[ Image — 16:9, object-cover, with gradient overlay at bottom ]
  [overlay: Category pill top-left] [Scarcity chip top-right if < 5 tickets]
[ Date block: "15 / KOV" large/bold | Time "19:00" ]
[ Title — 2-line clamp, font-semibold lg ]
[ Location — text-sm text-gray-500, with map pin icon ]
[ Divider ]
[ Price: "nuo 25 €" bold + "3 bilietai" lighter text | [Pirkti →] button ]
```

### User Stories
- *As a buyer, I want to see the most important event info at a glance so that I can decide quickly whether to click.*
- *As a buyer, I want to see ticket scarcity so that I feel urgency to act.*
- *As a buyer, I want price to be immediately visible so that I can filter mentally without opening the detail page.*

### Success Metrics
- Event page click-through rate increases (measure via analytics event tracking)
- Time-to-first-purchase decreases
- Bounce rate from home page decreases

---

## 5. AREA 3 — OVERALL UX MODERNIZATION

### Current State Assessment
The codebase uses raw Tailwind utility classes with no shared component library. Every page reinvents buttons, badges, form inputs, and cards independently. The result:
- Inconsistent border-radius across pages
- Inconsistent button styles (some rounded-md, some rounded-lg)
- No design tokens — colors hardcoded throughout
- No shared Badge, Button, Input, Card components
- Hero/landing experience = zero: home page goes straight to filters

### Gap Analysis vs Modern Platforms

| Element | Eventis Now | Best Practice |
|---|---|---|
| **Landing hero** | None — straight to filter grid | Full-bleed hero section with headline, value prop, CTA |
| **Typography** | Random sizes, no scale | Defined type scale: display, h1–h3, body, caption |
| **Color palette** | All Tailwind defaults, indigo + gray | Custom palette: brand primary, neutrals, semantic colors |
| **Buttons** | Mix of styles per page | Single Button component, 3 variants (primary/secondary/ghost) |
| **Badges/chips** | Mix of inline spans | Shared Badge component: semantic variants (success/warning/danger/info) |
| **Form inputs** | Unstyled HTML, inconsistent focus | Shared Input with label, error state, helper text |
| **Empty states** | Plain text links | Illustrated (or icon-based) empty states with CTA |
| **Loading states** | "Kraunama..." text | Skeleton loaders matching card/list shape |
| **Navigation** | Small logo, dense dropdown | Prominent brand, clean nav, mobile hamburger menu |
| **Footer** | None | Footer with links, legal, social |
| **Page titles** | "Renginiai" (plain) | Hero sections with description copy per page |

### High-Priority UX Changes

**1. Create a shared UI component library** (`src/components/ui/`)
- `Button.tsx` — primary, secondary, ghost, danger variants + sizes
- `Badge.tsx` — semantic color variants (success, warning, danger, neutral, info)
- `Input.tsx` — with label, error, helper text
- `Card.tsx` — base card wrapper
- `Skeleton.tsx` — loading skeleton that matches layout
- `EmptyState.tsx` — icon + heading + description + optional CTA

**2. Add a landing hero section** (`/` home page)
- Full-width section: headline, value prop subtext, search bar CTA
- Example: "Bilietai į lietuviškus renginius" / "Saugi antrinė bilietų rinka"
- Stat/trust bar below hero: "X+ renginių · Verifikuoti pardavėjai · Saugus mokėjimas"

**3. Redesign navigation**
- Logo: larger, with wordmark
- Primary nav links visible (not just in dropdown): "Renginiai", "Parduoti", "Apie"
- Mobile: hamburger menu
- Add notification dot for pending actions (unread, payout pending)

**4. Add a footer**
- Links: Apie, Kontaktai, Privatumas, Naudojimo sąlygos, Naujienų puslapis
- Social links (placeholder)
- "© 2026 Eventis" legal line

**5. Page-level hero sections**
- Each major page gets a consistent hero/header block: page title + description
- Example on `/sell`: "Parduokite savo bilietą / Saugiai, greitai, be rūpesčių."

**6. Skeleton loaders** to replace "Kraunama..." text
- EventList grid: skeleton cards during load
- Event detail: skeleton for header + ticket list

**7. Mobile navigation** — currently no mobile menu at all (dropdown is desktop-only)

### User Stories
- *As a first-time visitor, I want to understand what Eventis is in 5 seconds so that I know if it's for me.*
- *As a buyer on mobile, I want a usable navigation so that I can browse events on my phone.*
- *As a developer, I want shared UI components so that adding a new page is consistent and fast.*

### Success Metrics
- Mobile usability score (Lighthouse) ≥ 90
- First Contentful Paint ≤ 1.5s
- Bounce rate from home page ≤ 45%
- NPS from early users ≥ 7/10

---

## 6. SCOPE (IN / OUT)

### In Scope (this sprint)
- News/blog page: routes, DB table, admin create/edit, public index + detail, SEO meta
- Event card redesign: new layout, scarcity chip, price as hero, better image handling
- Shared UI component library: Button, Badge, Input, Card, Skeleton, EmptyState
- Landing hero section on home page
- Footer (static, with nav links)
- Navigation redesign (larger logo, visible nav links, mobile menu)
- Page hero headers on key pages (home, sell, my-listings, my-orders)
- Skeleton loaders for event list + event detail

### Out of Scope (future sprints)
- Custom illustration/photography (requires design assets)
- Dark mode
- Newsletter integration
- Advanced CMS (rich text editor, image upload for articles) — use Supabase direct for now
- Seat map visualisation
- Push notifications

---

## 7. MOSCOW REQUIREMENTS

### Must Have
- [ ] News page (`/naujienos` index + `/naujienos/:slug` detail)
- [ ] `articles` table in Supabase (admin create via direct insert, public read)
- [ ] SEO meta per article (title, description, og:image)
- [ ] Event card redesign (image dominant, date structured, price bold, scarcity chip)
- [ ] `Button`, `Badge`, `Input`, `Card` shared components
- [ ] Landing hero section
- [ ] Footer

### Should Have
- [ ] Skeleton loaders
- [ ] Navigation redesign (mobile menu + visible links)
- [ ] Page hero headers on key pages
- [ ] `EmptyState` component replacing plain text

### Nice to Have
- [ ] Article structured data (JSON-LD)
- [ ] Related articles on event detail
- [ ] Share button on article pages
- [ ] Scarcity chip animation (subtle pulse)

---

## 8. ASSUMPTIONS
- `[ASSUMPTION]` Admin can create articles by inserting directly into Supabase table (no in-app editor needed for MVP)
- `[ASSUMPTION]` Event images from scraped sources are sufficient for cards — no new photography pipeline needed
- `[ASSUMPTION]` Lithuanian-only content for news articles in this sprint
- `[ASSUMPTION]` No A/B testing infrastructure — ship and measure manually

---

## 9. OPEN QUESTIONS FOR PM / CTO
1. Who writes the news articles? Admin only, or can we allow external contributors?
2. Do we want a WYSIWYG editor for article body, or is Markdown/raw text acceptable for MVP?
3. Should news articles be Lithuanian only or bilingual (LT/EN)?
4. Is there a brand guidelines doc or approved color palette we should use?
5. Do we want to redesign the logo/wordmark as part of this sprint?

---

**Ready for `/pm` to create the PRD and `/create-plan` to scope the execution plan.**
