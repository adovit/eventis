# PRD: Eventis Design System Overhaul

**Version:** 1.0
**Date:** 2026-03-01
**Author:** Product Manager
**Status:** Ready for `/po` — story writing
**Sprint:** Iteration 5.1 (Design System Hardening)
**Input documents:** `docs/design-system-brief.md`, `docs/ux-design-system.md`

---

## 1. Overview

Eventis is a functional marketplace, but its current UI reads as a prototype: system fonts, hardcoded Tailwind color classes with no CSS variables, no dark mode, and inconsistent component styling across auth pages. This sprint establishes the visual foundation the product needs before growth-stage marketing begins. We will introduce a complete CSS token layer (colors, spacing, radius, shadows), load Inter as the brand typeface, implement class-based dark mode with localStorage persistence and system preference detection, migrate all six UI primitives and the auth pages to use semantic tokens, and apply tabular-number formatting to all price displays. The outcome is a design system that makes Eventis feel like a deliberate product — one that buyers and sellers trust with real money — while closing the gap against Biletai.lt, Tiketa.lt, and established European secondary markets.

---

## 2. Goals and Success Metrics

| Goal | Metric | Target | Measurement method |
|------|--------|--------|--------------------|
| Increase buyer conversion | Checkout completion rate | +15% vs pre-sprint baseline | Supabase `orders` funnel, 30-day post-launch window |
| Reduce seller drop-off | Listing completion rate (`tickets` created / listing started) | +20% vs pre-sprint baseline | Supabase funnel, 30-day post-launch window |
| Brand trust perception | User survey: "this platform looks professional" | ≥80% agree | Post-purchase survey, n≥50 responses |
| Accessibility compliance | WCAG 2.1 AA on all P0 pages | 100% of P0 pages pass | axe DevTools audit, manual keyboard nav check |
| Dark mode adoption | Share of sessions using dark mode | ≥30% within 3 months of launch | localStorage event logged to analytics |
| No visual regression | Pixel diff on all existing pages | Zero unintended layout breaks | Manual QA pass across breakpoints (375px, 768px, 1280px) |

---

## 3. User Personas

### Marius — The Seller (Primary)

- 28–40, tech-moderate professional, sells 2–10 tickets per month from Vilnius or Kaunas
- Lists tickets on MacBook, occasionally checks status on iPhone
- Core need: confidence that the platform looks trustworthy enough that buyers will pay him
- Current pain: form pages feel unpolished, input focus states are barely visible, submission feedback is minimal
- Design system impact: consistent Input component styling, visible focus rings, card-style success confirmation after listing

### Kotryna — The Buyer (Primary)

- 20–35, mobile-first, impulse decision maker arriving via Instagram or TikTok ads
- 80% on mobile Safari; often browses at night in iOS dark mode
- Core need: a platform that looks as established as Vinted or Pigu.lt so she trusts it with her card
- Current pain: white-background site at 22:00 hurts her eyes and feels dated; non-aligned prices are hard to compare quickly
- Design system impact: dark mode auto-detection, tabular mono prices right-aligned in ticket lists, trust badge pinned above the fold on EventDetail

### Admin (Secondary)

- Internal operator managing listings, orders, and payouts
- Needs scannable data tables and unambiguous status badges at a glance
- Current pain: badge color inconsistency (some use `gray`, some use `indigo`) makes status unclear without reading the label
- Design system impact: semantic badge tokens ensure status colors are consistent across all admin views

---

## 4. Feature Requirements

Requirements are grouped by priority tier. Each item maps to the MoSCoW categories defined in the design-system brief.

---

### P0 — Launch Blockers

These must be complete before any growth marketing begins. The product cannot be considered "launched" without them.

---

#### P0-1: CSS Design Token Layer

Introduce CSS custom properties as the single source of truth for all visual decisions. No component should reference a hardcoded Tailwind color class after this sprint.

**Scope:**
- Define all tokens in `src/index.css` under `:root` (light) and `:root.dark` (dark)
- Token categories: color (background, text, border, brand, semantic), spacing (4px grid, `--space-1` through `--space-24`), border radius (`--radius-sm` through `--radius-full`), shadow (`--shadow-sm` through `--shadow-xl`)
- Update `tailwind.config.js` to consume token vars via `var()` references
- Add `darkMode: 'class'` to `tailwind.config.js`
- Create `src/lib/tokens.ts` exporting typed token constants for JS/React dynamic use

**Token reference (color — abridged):**

| Token | Light value | Dark value |
|-------|-------------|------------|
| `--color-bg-primary` | `#ffffff` | `#0f0e11` |
| `--color-bg-secondary` | `#f8f7ff` | `#17151c` |
| `--color-bg-surface` | `#f5f5f4` | `#1e1b26` |
| `--color-text-primary` | `#0c0a09` | `#fafaf9` |
| `--color-text-secondary` | `#57534e` | `#a8a29e` |
| `--color-text-muted` | `#a8a29e` | `#57534e` |
| `--color-brand` | `#7c3aed` | `#a78bfa` |
| `--color-brand-hover` | `#6d28d9` | `#8b5cf6` |
| `--color-border` | `#e7e5e4` | `#2a2533` |
| `--color-border-strong` | `#d6d3d1` | `#3d3650` |

Full shadow and spacing token tables are in `docs/design-system-brief.md` sections 5.4–5.6.

---

#### P0-2: Dark Mode Architecture

Implement class-based dark mode toggling that eliminates flash of wrong theme (FOUC) and persists user preference across sessions.

**Scope:**
- `<html>` receives class `dark` when dark mode is active (drives all Tailwind dark: variants)
- Inline `<script>` in `index.html` `<head>` (before React hydration) reads `localStorage("theme")` and applies the class immediately — this is the FOUC prevention mechanism
- `Layout.tsx` holds the toggle state and provides a context or prop to child components
- Toggle button: sun/moon icon, 24×24px, placed in the navbar between nav links and the avatar — desktop placement
- Mobile hamburger menu: full-width "Tamsi tema" toggle row with moon icon on the right
- Preference persistence: `localStorage("theme")` with values `"light"` or `"dark"`

---

#### P0-3: Inter Font Integration (Self-Hosted)

Load Inter as the global sans-serif typeface for all UI text. Lithuanian glyphs (ą, č, ę, ė, į, š, ų, ū, ž) are confirmed present in Inter.

**Scope:**
- Self-host font files via Vite (not Google Fonts CDN) — required for GDPR compliance on Lithuanian users
- Apply `font-family: var(--font-sans)` globally via `src/index.css`
- Load weights: 400, 500, 600, 700 only (subset to keep bundle lean)
- `--font-sans: 'Inter', system-ui, -apple-system, sans-serif`
- `--font-mono: 'JetBrains Mono', 'Fira Code', monospace` (for prices and ticket IDs)

**Note:** Font hosting strategy is confirmed as self-hosted per UX decision (see Open Decisions section for rationale).

---

#### P0-4: Component Token Migration (6 UI Primitives)

Migrate all six UI primitive components from hardcoded Tailwind classes to semantic token classes. No new components are created in this sprint.

**Components in scope:**
1. `Button` — all variants (primary, secondary, destructive, ghost, link), all states (default, hover, focus, active, loading, disabled)
2. `Card` — background, border, shadow using tokens; hover: shadow-md + translateY(-2px) at 150ms
3. `Input` — all states (default, focus, filled, error, success, disabled); focus ring uses brand glow token
4. `Badge` — semantic color variants (success, warning, danger, info, neutral) from token vars; consistent across all pages
5. `Skeleton` — uses token surface colors; non-interactive, no contrast requirement
6. `EmptyState` — uses token text/muted colors; non-interactive

**Button state specification:**

| State | Behavior |
|-------|----------|
| Default | Solid brand bg, white text, `rounded-lg` |
| Hover | bg darkens one step (`brand-600` → `brand-700`) |
| Focus | Brand glow ring (3px, 25% opacity), outline retained for accessibility |
| Active | `scale(0.97)` — tactile press-down |
| Loading | Spinner replaces text, button disabled, full opacity |
| Disabled | opacity-40, cursor-not-allowed, no hover effect |

---

#### P0-5: Fix Auth Pages (Login and Register)

Both auth pages currently use hardcoded `gray` and `indigo` Tailwind classes instead of brand tokens, creating a visible inconsistency with the rest of the product.

**Scope:**
- `src/pages/Login.tsx`: replace all `gray-*` → `neutral token`, `indigo-*` → `brand token`
- `src/pages/Register.tsx`: same token replacement pass
- All inputs on auth pages must use the `Input` component (not inline-styled elements)
- Button: use `Button` component, full width, primary variant
- Google OAuth button: secondary variant, full width
- No layout changes — token substitution only
- Verify both pages render correctly in light and dark mode

**Login page token corrections (reference):**
- Heading: `text-primary` (not `gray-900`)
- Label: `text-secondary` (not `gray-700`)
- Input border: `border-border` focus `border-brand` (not `indigo-500`)
- Link: `text-brand` (not `indigo-600`)

---

### P1 — High Value (Target: same sprint, day 3)

These deliver measurable UX improvement and should land in the same 3-day sprint if time permits. They are not launch blockers but significantly affect conversion.

---

#### P1-1: Tabular Price Display

All price values across the product must render in monospace with tabular number alignment. This eliminates visual jitter when comparing ticket prices of different magnitudes.

**Scope:**
- All instances of ticket prices in: `EventDetail`, `MyListings`, `MyOrders`, `MyPayouts`, seller ticket cards
- CSS: `font-family: var(--font-mono); font-variant-numeric: tabular-nums;`
- Alignment: right-aligned within their container
- Format: `€` prefix, two decimal places, "/ bilietas" suffix in `text-muted` at `text-sm`
- Currency symbol: `€` before the number (Lithuanian convention)

---

#### P1-2: Theme Toggle Persistence (localStorage + system preference)

Ensure the toggle survives page reloads and respects the OS setting on first visit.

**Scope:**
- First-visit logic: no `localStorage("theme")` present → read `prefers-color-scheme` → apply that theme
- Return-visit logic: `localStorage("theme")` present → apply it, ignore OS preference
- User toggle: write `localStorage("theme")`, apply class to `<html>` immediately
- Inline script in `<head>` must fire before React mounts to prevent FOUC

---

#### P1-3: Smooth Theme Transition

Color changes when toggling between light and dark mode must animate rather than flash.

**Scope:**
- `:root` receives `transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease`
- All token-driven elements inherit the transition automatically
- The inline `<head>` script that sets the initial theme class must add a `no-transition` class temporarily, removed after first paint — prevents the transition from firing on load
- Transition duration: 200ms, easing: `ease`

---

### P2 — Nice to Have (post-sprint or fast follow)

These are low-effort additions that can be pulled into the sprint if capacity allows but are explicitly not required for sign-off.

---

#### P2-1: System Preference Detection as Default

Already captured in P1-2 (first-visit logic). No additional scope.

---

#### P2-2: meta theme-color for Mobile Browser Chrome

Sets the browser chrome color (address bar on Android Chrome, Safari top bar on iOS) to match the active theme.

**Scope:**
- Add two `<meta name="theme-color">` tags with `media` attributes targeting `(prefers-color-scheme: light)` and `(prefers-color-scheme: dark)`
- Values: `#ffffff` (light), `#0f0e11` (dark)
- Dynamically update via JS when user toggles theme
- Does not affect any component or business logic

---

## 5. Non-Goals

The following are explicitly out of scope for this sprint. Raising any of these items during implementation is a scope creep risk.

- **New component types** — no modals, tooltips, datepickers, or comboboxes are being added
- **Animation library** — Framer Motion or any motion library integration is a separate sprint
- **Icon library migration** — the current icon set is unchanged; a migration to Lucide or Heroicons is a separate decision
- **Storybook or component documentation site** — Phase 2 only; no component docs or MDX stories
- **White-label theming** — the token system is for Eventis brand only; no multi-tenant theming
- **Page layout redesigns** — this sprint is a token swap, not a redesign; no padding, grid, or structural layout changes
- **New pages** — no new routes or page components
- **shadcn/ui migration** — the question of whether to adopt shadcn/ui + Radix is an open architectural decision; this sprint must not make a choice that forecloses it (see Open Decisions)
- **Stripe Checkout appearance API** — Stripe's own dark mode is handled by Stripe; out of scope here
- **Supabase, Stripe, Bright Data integration changes** — this sprint touches only the frontend visual layer

---

## 6. Acceptance Criteria

Criteria are grouped by requirement. Each is a testable binary statement.

### P0-1: CSS Token Layer

- AC1: `src/index.css` defines all color, spacing, radius, and shadow tokens under `:root` (light) and `:root.dark` (dark) as specified in section 5 of the design-system-brief.
- AC2: `tailwind.config.js` has `darkMode: 'class'` and all color values reference `var(--color-*)` rather than hardcoded hex values.
- AC3: `src/lib/tokens.ts` exports typed constants for all design tokens, usable from React components without importing CSS.
- AC4: No component file outside `src/index.css` or `tailwind.config.js` contains a hardcoded hex color or hardcoded Tailwind color scale class (e.g., `violet-600`, `gray-300`).

### P0-2: Dark Mode Architecture

- AC5: Toggling the sun/moon icon in the navbar applies `class="dark"` to the `<html>` element within one frame.
- AC6: On a return visit with `localStorage("theme") = "dark"`, the page renders in dark mode with no visible flash of the light theme.
- AC7: The dark mode toggle is visible and functional in the mobile hamburger menu as a full-width "Tamsi tema" row.
- AC8: Removing `localStorage("theme")` and reloading the page applies the theme that matches `prefers-color-scheme`.

### P0-3: Inter Font

- AC9: The network panel (DevTools) shows no outbound requests to `fonts.googleapis.com` or `fonts.gstatic.com` on any page load.
- AC10: Body text renders in Inter (verifiable via DevTools computed styles: `font-family` resolves to `Inter`).
- AC11: Lithuanian characters (ą, č, ę, ė, į, š, ų, ū, ž) render correctly in Inter at all four loaded weights.

### P0-4: Component Token Migration

- AC12: All six components (`Button`, `Card`, `Input`, `Badge`, `Skeleton`, `EmptyState`) pass a visual review in both light and dark mode with no hardcoded color classes remaining in their source files.
- AC13: `Button` focus state shows a visible brand glow ring; axe DevTools reports no focus-visibility violations on the component.
- AC14: `Badge` uses semantic color tokens; all four status values (success, warning, danger, info) render distinct and legible in both modes.
- AC15: WCAG contrast ratio for all text/background combinations in both modes is ≥4.5:1 for normal text and ≥3:1 for large text, verified via axe or Colour Contrast Analyser.

### P0-5: Auth Page Fix

- AC16: `Login.tsx` and `Register.tsx` contain no references to `gray-*` or `indigo-*` Tailwind classes.
- AC17: Both auth pages render correctly in dark mode with readable text and visible inputs.
- AC18: All input fields on auth pages use the `Input` component; no inline `<input>` elements with ad-hoc styling remain.

### P1-1: Tabular Prices

- AC19: All price values across `EventDetail`, `MyListings`, `MyOrders`, and `MyPayouts` render in `var(--font-mono)` with `font-variant-numeric: tabular-nums`.
- AC20: In a ticket list with prices `€9.00`, `€48.00`, and `€120.00`, the decimal points visually align vertically (right-aligned container, tabular nums).

### P1-2: Theme Persistence

- AC21: After toggling to dark mode, closing and reopening the browser tab restores dark mode without any light flash.
- AC22: A user who has never visited the site and whose OS is set to dark mode sees dark mode on first load.

### P1-3: Smooth Transition

- AC23: Toggling between light and dark mode produces a visible 200ms color fade with no element flashing to an intermediate state.
- AC24: On initial page load (both themes), no transition animation fires — the correct theme appears instantly.

### P2-2: meta theme-color

- AC25: On Android Chrome in dark mode, the browser address bar matches `#0f0e11`; in light mode it matches `#ffffff`.

---

## 7. Open Decisions

The following items are unresolved as of the PRD date. They must be decided before or during implementation. The implementing engineer should not assume a default.

| # | Decision | Options | Owner | Deadline |
|---|----------|---------|-------|----------|
| OD-1 | Font hosting | (A) Self-hosted via Vite — confirmed by UX for GDPR; (B) Google Fonts CDN if GDPR exemption agreed | PM + legal check | Before Day 1 implementation starts |
| OD-2 | shadcn/ui migration path | (A) This token system is designed to be shadcn-compatible (use CSS variable naming convention matching shadcn's defaults); (B) Design tokens are Eventis-bespoke, migration handled later | Architect | Before Day 2 (affects token naming in `tokens.ts`) |
| OD-3 | Brand color evolution | (A) Violet stays as primary brand color — no changes this sprint; (B) Evaluate alternatives during sprint | PM | Confirmed: violet stays (decision deferred to brand sprint) |
| OD-4 | `tokens.ts` structure | (A) Flat object `{ colorBgPrimary: 'var(--color-bg-primary)' }`; (B) Nested object `{ color: { bg: { primary: ... } } }` | Architect | Before Day 1 |
| OD-5 | Toggle icon set | Which icon library supplies the sun/moon icons: (A) current icon set (if it has them); (B) inline SVG; (C) pull in Lucide for this component only | Engineer | Before Day 2 |

**Note on OD-1:** UX has already recommended self-hosting. PM endorses this. It requires a legal confirmation that no Google Fonts are loaded. Treat self-hosting as the working assumption unless the legal check returns a blocker.

---

## 8. Timeline Suggestion — 3-Day Sprint

| Day | AM | PM | Acceptance gate |
|-----|----|----|-----------------|
| **Day 1** | CSS tokens in `src/index.css` (light + dark full token set) | `tailwind.config.js` update + `darkMode: 'class'` + Inter self-hosting | AC1, AC2, AC9, AC10, AC11 |
| **Day 1** | Inline `<head>` FOUC-prevention script | `localStorage` + `prefers-color-scheme` first-visit logic | AC6, AC8, AC22 |
| **Day 2** | Migrate `Button`, `Input`, `Card` to tokens | Migrate `Badge`, `Skeleton`, `EmptyState` to tokens | AC12, AC13, AC14 |
| **Day 2** | `Layout.tsx` dark toggle (navbar icon + hamburger row) | Fix `Login.tsx` + `Register.tsx` | AC5, AC7, AC16, AC17, AC18 |
| **Day 3** | Tabular numbers on all price displays | Smooth transition (200ms, no FOUC on load) | AC19, AC20, AC23, AC24 |
| **Day 3** | WCAG contrast audit (axe + manual) | Full QA pass: both modes, 375px/768px/1280px, mobile Safari, keyboard nav | AC15, AC21 |
| **Day 3 (if time)** | meta theme-color (P2-2) | `src/lib/tokens.ts` typed export (if not done Day 1) | AC3, AC25 |

**Sprint sign-off criteria:** All P0 and P1 acceptance criteria pass. P2 items logged as follow-up tickets if not completed.

---

Ready for `/po` to write user stories.
