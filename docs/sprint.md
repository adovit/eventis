# Sprint 6 — UX/UI & Value Proposition Overhaul

**Date**: 2026-03-01
**Goal**: Transform Eventis from a working-but-generic tool into a modern, trustworthy marketplace — through a cohesive design system, a redesigned event card, a news/blog section for SEO growth, and a landing experience that communicates value in under 5 seconds.

---

## Dependency Order (execute top-to-bottom)

```
US-060 (colors)
    └── US-061 (UI components)
            ├── US-062 (navigation)
            ├── US-063 (footer)
            ├── US-064 (landing hero)
            ├── US-065 (event card)
            ├── US-066 (news page)  ← also needs DB migration
            ├── US-067 (skeleton loaders)
            ├── US-068 (page hero headers)
            └── US-069 (empty states applied)
```

---

## P0 — Must Have (Sprint Core)

---

### US-060 — Brand color palette + Tailwind design tokens
**Epic**: Design System · **Size**: S · **Priority**: P0

**Story**: As a developer, I want a defined brand color palette in tailwind.config.js so that all components use consistent, intentional colors instead of arbitrary Tailwind defaults.

**Palette direction**: Friendly, playful, trust-inspiring. Think TicketSwap warmth + Stripe clarity.

**Proposed palette**:
- `brand` (primary): Violet-leaning purple — energetic, modern, memorable
  - `brand-50` → `brand-900` scale
  - `brand-500` = primary CTA (#7C3AED — Violet 600 range, or similar)
- `neutral`: Warm gray (not cold blue-gray) — `neutral-50` to `neutral-900`
- `success`: Green — `#16A34A` range
- `warning`: Amber — `#D97706` range
- `danger`: Red — `#DC2626` range
- `info`: Sky blue — `#0284C7` range

**Acceptance Criteria**:
- [ ] `tailwind.config.js` extended with `brand`, `neutral`, `success`, `warning`, `danger`, `info` color scales
- [ ] Old `indigo-*` and `gray-*` references replaced in any NEW or MODIFIED components going forward (existing pages updated incrementally as they're touched this sprint)
- [ ] Color palette documented in a comment block at top of tailwind.config.js

---

### US-061 — Shared UI component library (`src/components/ui/`)
**Epic**: Design System · **Size**: M · **Priority**: P0

**Story**: As a developer, I want reusable, typed UI primitives so that every page uses consistent, on-brand components instead of copy-pasted inline Tailwind.

**Components to build**:

1. **`Button.tsx`**
   - Variants: `primary`, `secondary`, `ghost`, `danger`
   - Sizes: `sm`, `md` (default), `lg`
   - States: default, hover, disabled, loading (spinner)
   - Props: `variant`, `size`, `disabled`, `loading`, `onClick`, `type`, `className`, children, `as` (link support)

2. **`Badge.tsx`**
   - Variants: `success`, `warning`, `danger`, `neutral`, `info`, `brand`
   - Sizes: `sm` (default), `md`
   - Pill shape (rounded-full), uppercase text-xs

3. **`Input.tsx`**
   - Props: `label`, `error`, `helperText`, `required`, standard HTML input props
   - States: default, focused (brand ring), error (danger ring + error text below)

4. **`Card.tsx`**
   - Base wrapper: white bg, rounded-2xl, shadow-sm, border neutral-100
   - Props: `className`, `onClick` (makes it interactive), children

5. **`Skeleton.tsx`**
   - Animated pulse placeholder
   - Sub-components or props: `width`, `height`, `rounded`, `className`
   - Used for loading states matching content shape

6. **`EmptyState.tsx`**
   - Props: `icon` (React node), `title`, `description`, `action` ({ label, onClick/href })
   - Centered layout, icon above title

**Acceptance Criteria**:
- [ ] All 6 components created in `src/components/ui/`
- [ ] `src/components/ui/index.ts` barrel export
- [ ] Each component is typed with TypeScript interfaces
- [ ] Components use brand palette from US-060

---

### US-062 — Navigation redesign
**Epic**: Layout · **Size**: M · **Priority**: P0

**Story**: As a visitor on any device, I want a clear, modern navigation so that I can easily access key pages and understand what Eventis offers.

**Changes**:
- Wordmark: "Eventis" in bold brand color (text-based, no image needed), larger font
- Desktop nav: Add visible links — "Renginiai" (`/`), "Parduoti" (`/sell`) — always visible, not just in dropdown
- Auth state:
  - Logged out: visible "Prisijungti" (ghost button) + "Registruotis" (primary button)
  - Logged in: keep avatar dropdown but cleaner — remove email from dropdown header, show it only in Profile
- Mobile: Replace current desktop-only layout with hamburger menu (open/close toggle)
  - Mobile menu: full-width overlay or slide-down panel with all links
- Admin badge: small dot on avatar if there are pending admin actions (payouts with status=pending > 0)
- Use new Button + brand colors

**Acceptance Criteria**:
- [ ] Desktop nav shows "Renginiai" and "Parduoti" links always
- [ ] Mobile hamburger menu opens/closes correctly
- [ ] Mobile menu contains all nav links including auth actions
- [ ] Logged-out state: "Prisijungti" (ghost) + "Registruotis" (primary button) visible on desktop
- [ ] Nav uses brand palette (no indigo-600)
- [ ] Existing dropdown functionality preserved for logged-in users on desktop

---

### US-063 — Footer
**Epic**: Layout · **Size**: S · **Priority**: P0

**Story**: As a visitor, I want a footer with useful links so that I can navigate to key pages and understand the platform's legal basis.

**Content**:
- Left column: Eventis wordmark + one-line tagline: "Saugi antrinė bilietų rinka Lietuvoje."
- Middle column — "Platforma": Renginiai (`/`), Parduoti biletą (`/sell`), Naujienos (`/naujienos`)
- Right column — "Informacija": Apie mus (`/apie`), Privatumo politika (`/privatumas`), Naudojimo sąlygos (`/salygos`), Kontaktai (`/kontaktai`)
- Bottom bar: "© 2026 Eventis. Visos teisės saugomos." — neutral-400, text-sm
- Note: `/apie`, `/privatumas`, `/salygos`, `/kontaktai` routes don't need to exist yet — links are placeholders

**Acceptance Criteria**:
- [ ] Footer rendered in `Layout.tsx` below `<Outlet />`
- [ ] Responsive: stacked on mobile, 3-column on desktop
- [ ] Uses neutral palette (not white or harsh black)
- [ ] All links render without 404 breaking the layout (use `<a>` or `<Link>` as appropriate)

---

### US-064 — Landing hero section
**Epic**: Home Page · **Size**: M · **Priority**: P0

**Story**: As a first-time visitor, I want to immediately understand what Eventis is and why it's trustworthy so that I know within 5 seconds whether this platform is for me.

**Structure** (added above the filters/grid in EventList):

```
[Hero section — full width, brand gradient bg]
  Headline: "Bilietai į Lietuvos renginius"
  Subtext:  "Perkite ir parduokite antrinius bilietus saugiai.
              Verifikuoti pardavėjai. Mokėjimai apsaugoti."
  CTA (logged out): [Naršyti renginius ↓]  [Parduoti bilietą →]
  CTA (logged in):  [Naršyti renginius ↓]

[Trust bar — 3 stats, full width, neutral-50 bg]
  🎟 500+ renginių  |  ✓ Verifikuoti pardavėjai  |  🔒 Saugus mokėjimas
```

**Design notes**:
- Hero bg: subtle brand gradient (brand-600 → brand-700) or brand-50 with brand text — clean, not garish
- Headline: text-4xl md:text-5xl, font-bold, white or brand-900
- Subtext: text-lg, neutral or white-70 opacity
- Trust bar: icons + text, 3 items, centered, text-sm
- "Naršyti renginius" button scrolls to event grid (anchor or smooth scroll)

**Acceptance Criteria**:
- [ ] Hero section renders above filters on `/`
- [ ] Trust bar renders below hero, above filters
- [ ] Both CTAs work correctly (scroll or navigate)
- [ ] Fully responsive (stacked on mobile)
- [ ] Logged-out vs logged-in CTA variants correct

---

### US-065 — Event card redesign
**Epic**: Event Discovery · **Size**: L · **Priority**: P0

**Story**: As a buyer, I want event cards that show the most important information at a glance — price, date, scarcity — so I can decide to click without opening every card.

**Current problems**: verbose date, price not hero, no scarcity signal, no visual hierarchy.

**New card layout**:

```
┌─────────────────────────────────────┐
│  [Image 16:9, object-cover]         │
│  [Category pill — top-left, white]  │  [🔴 "2 liko" chip — top-right, if <5]
├─────────────────────────────────────┤
│  15          Title of Event Here    │
│  KOV  19:00  that can be 2 lines    │
│  ─────────────────────────────────  │
│  📍 Vilnius, Siemens Arena          │
│  ─────────────────────────────────  │
│  nuo 25 €   3 bilietai  [Peržiūrėti→]│
└─────────────────────────────────────┘
```

**Specific changes**:
1. **Image**: Add gradient overlay (bottom fade to black, 40% opacity) for text contrast if needed
2. **Category pill**: Overlaid on image top-left — brand-600 bg, white text, rounded-full, text-xs
3. **Scarcity chip**: Overlaid top-right — only if `ticket_count > 0 AND ticket_count < 5`. Red bg, white text "N liko". If 0 tickets = don't show secondary market section at all (or show "Nėra bilietų")
4. **Date block**: Left column — large day number (text-2xl, bold), small month abbrev (text-xs, uppercase, neutral-500), small time below
5. **Title**: Right of date — 2-line clamp, text-base, font-semibold, neutral-900
6. **Location**: 📍 icon + location text, text-sm, neutral-500
7. **Bottom row**: Price bold (brand-600, text-lg), ticket count (neutral-400, text-sm), "Peržiūrėti →" ghost/outline button right-aligned
8. **Image fallback**: Gradient placeholder with event category icon or just brand-100 bg with "🎟" centered — not plain gray text

**Acceptance Criteria**:
- [ ] Date shows as structured block (day number + month abbrev + time), not "1 balandžio 2025"
- [ ] Price is visually dominant (larger, brand color)
- [ ] Scarcity chip appears only when ticket_count is 1–4
- [ ] Category pill renders on image
- [ ] Image fallback is a styled placeholder (not plain gray text)
- [ ] Location uses map pin icon
- [ ] Bottom CTA button is present on each card
- [ ] All existing filter/pagination functionality preserved
- [ ] Cards use new brand palette

---

### US-066 — News/blog page
**Epic**: SEO & Content · **Size**: L · **Priority**: P0

**Story**: As an admin, I want to publish news articles in Supabase so that visitors can read Lithuanian event content and Google can index topical pages.

**DB Migration** (`supabase/migrations/009_articles.sql`):
```sql
CREATE TABLE articles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  excerpt       text,
  body          text NOT NULL,          -- Markdown text
  cover_image_url text,
  category      text,                   -- 'Renginiai' | 'Menininkai' | 'Naujienos' | 'Patarimai'
  author_name   text DEFAULT 'Eventis',
  published_at  timestamptz,
  is_published  boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- RLS: public can read published articles only
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON articles
  FOR SELECT USING (is_published = true AND published_at <= now());
CREATE POLICY "Admin full access" ON articles
  USING (auth.jwt() ->> 'is_admin' = 'true');
```

**Frontend pages**:

`/naujienos` — News index:
- Page hero: "Naujienos" + "Aktualijos, renginių apžvalgos ir patarimai."
- Category filter tabs (Visi, Renginiai, Menininkai, Naujienos, Patarimai)
- Article card grid (2 col desktop, 1 col mobile):
  - Cover image (3:2 ratio)
  - Category badge
  - Title (2-line clamp)
  - Excerpt (3-line clamp)
  - Published date + Author
  - "Skaityti →" link
- Empty state if no articles published yet

`/naujienos/:slug` — Article detail:
- `<Helmet>` / `<head>` SEO tags: title, meta description, og:title, og:description, og:image, canonical URL
- Page layout: max-w-2xl centered (readable column width)
- Cover image full width
- Category badge + published date
- H1 title
- Body rendered from Markdown (use `react-markdown` or simple `<pre>` for MVP — confirm with `/cto-ticket` if needed, but for MVP raw text with newlines preserved is acceptable)
- "← Visos naujienos" back link
- Share button (navigator.share Web Share API, fallback to copy link)

**Routes**: Add `/naujienos` and `/naujienos/:slug` to `App.tsx` as public routes.

**Acceptance Criteria**:
- [ ] Migration `009_articles.sql` created and documented
- [ ] RLS: only published articles visible publicly; admin has full access
- [ ] `/naujienos` index renders article cards with category filter
- [ ] `/naujienos/:slug` renders full article with SEO meta tags
- [ ] Empty state shows on index when no articles exist
- [ ] "Naujienos" link added to navigation + footer
- [ ] Article body newlines preserved (at minimum `whitespace-pre-wrap`)
- [ ] Back link works correctly
- [ ] Share button present (degrades gracefully if Web Share API unavailable)

---

## P1 — Should Have

---

### US-067 — Skeleton loaders for EventList + EventDetail
**Epic**: UX Polish · **Size**: S · **Priority**: P1

**Story**: As a buyer, I want loading states that look like content so that the page feels fast and professional instead of showing a plain "Kraunama..." message.

**Acceptance Criteria**:
- [ ] EventList: shows 6 skeleton cards (matching card shape) while fetching
- [ ] EventDetail: shows skeleton for image, title, meta, ticket list while fetching
- [ ] Uses `Skeleton.tsx` from US-061
- [ ] "Kraunama..." text removed from these pages

---

### US-068 — Page hero headers on key seller/buyer pages
**Epic**: UX Polish · **Size**: S · **Priority**: P1

**Story**: As a user, I want each page to introduce itself with a clear heading and purpose so that I always know where I am and what I can do.

**Pages + copy**:
- `/sell`: "Parduokite savo bilietą" / "Saugiai, greitai, be rūpesčių. Užpildykite formą ir mes pasirūpinsime likusiu."
- `/my-listings`: "Mano skelbimai" / "Valdykite savo aktyvius ir parduotus bilietus."
- `/my-orders`: "Mano užsakymai" / "Peržiūrėkite savo pirkimų istoriją."
- `/my-earnings`: "Mano pajamos" / "Stebėkite laukiamas ir gautas išmokas."
- `/profile`: "Mano paskyra" / "Jūsų asmeninė informacija ir nustatymai."

**Acceptance Criteria**:
- [ ] Each listed page has a consistent page hero block (title + subtext, brand styling)
- [ ] Hero block is a reusable pattern (inline or small component — not a full new component if simple)

---

### US-069 — EmptyState applied across empty-list pages
**Epic**: UX Polish · **Size**: S · **Priority**: P1

**Story**: As a user, I want helpful empty states with a clear next action so that I know what to do when I have no listings, orders, or earnings yet.

**Apply to**:
- `MyListings`: "Nėra skelbimų" / "Parduokite bilietą, kurio nebenorite naudoti." / CTA: "Paskelbti bilietą" → `/sell`
- `MyOrders`: "Nėra užsakymų" / "Raskite renginį ir įsigykite bilietą." / CTA: "Naršyti renginius" → `/`
- `MyEarnings`: "Nėra pajamų" / "Pajamos atsiras po to, kai parduosite bilietą." / CTA: "Parduoti bilietą" → `/sell`
- `NewsIndex` (no articles): "Netrukus pasirodys naujienos" / "Sekite aktualijas apie Lietuvos renginius." / no CTA

**Acceptance Criteria**:
- [ ] `EmptyState.tsx` from US-061 used in all 4 locations
- [ ] Plain text "no items" messages replaced
- [ ] CTAs navigate correctly

---

## P2 — Nice to Have (stretch goals, implement if time allows)

---

### US-070 — JSON-LD Article structured data
**Epic**: SEO · **Size**: S · **Priority**: P2

Add `<script type="application/ld+json">` with Article schema on `/naujienos/:slug` pages.
Fields: `@type: Article`, `headline`, `image`, `datePublished`, `author`, `publisher`.

**AC**: [ ] Valid JSON-LD per Google Rich Results Test

---

### US-071 — Related articles widget on event detail
**Epic**: SEO · **Size**: S · **Priority**: P2

Show 2 most-recent published articles at bottom of EventDetail page ("Skaitykite taip pat").

**AC**: [ ] Fetches latest 2 articles; hidden if no articles exist

---

### US-072 — Scarcity chip subtle pulse animation
**Epic**: UX Polish · **Size**: S · **Priority**: P2

Add `animate-pulse` or custom CSS ping animation to the scarcity chip on event cards when ticket_count = 1 or 2.

**AC**: [ ] Animation runs on scarcity chip; not distracting (slows after 3 cycles or uses gentle opacity pulse)

---

## Out of Scope (this sprint)

- Dark mode
- Newsletter / email subscription
- WYSIWYG / rich text editor for articles
- Custom photography or illustration
- Seat map visualisation
- `/apie`, `/privatumas`, `/salygos`, `/kontaktai` page content (links exist in footer as placeholders)
- Refund flow (E8)
- Internationalisation (E9)
- Push notifications (E10)

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Color palette clashes with existing pages not touched this sprint | Medium | Low | Apply new tokens only to new/modified components; legacy pages updated incrementally |
| `react-markdown` dependency adds bundle weight | Low | Low | MVP uses `whitespace-pre-wrap` plain rendering; add markdown lib only if explicitly needed |
| Supabase RLS for articles is too restrictive for admin CRUD | Medium | Medium | Admin writes via Supabase dashboard (service role) — no app-side admin UI this sprint |
| Mobile nav overlay conflicts with existing dropdown logic | Medium | Medium | Rewrite nav section cleanly; don't patch on top of current dropdown |
| Sprint is heavy (2 L stories + 4 M stories) | Medium | Medium | P0 core is shippable without P1/P2; execute P0 first, assess before continuing |

---

## Definition of Done

- [ ] All P0 stories (US-060 → US-066) implemented and functional
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No console errors in browser on affected pages
- [ ] Responsive: all new UI tested at 375px (mobile), 768px (tablet), 1280px (desktop)
- [ ] Supabase migration `009_articles.sql` written and ready to apply
- [ ] New brand palette in `tailwind.config.js`
- [ ] `/review` passed with no CRITICAL or HIGH issues
- [ ] `docs/user-stories.md` updated with new epics (E-DS, E-News, E-UX) and stories marked ✅
- [ ] `CHANGELOG.md` updated via `/document`

---

**Sprint 6 is planned. Use `/create-plan` → `/execute` to implement.**
