# Design System Brief — Eventis Visual Language Overhaul
**Version:** 1.0  
**Date:** 2026-03-01  
**Author:** Business Analyst  
**Status:** Ready for PM → PRD  

---

## 1. Problem Statement

Eventis has a functional UI built with Tailwind utility classes and a small set of custom components. It works, but it reads as a prototype, not a product. The design lacks:

- A defined typographic personality (falls back to system fonts)
- CSS design tokens (colors are hardcoded in `tailwind.config.js`, no CSS variables)
- Dark mode (expected by ~40% of users on modern devices)
- Consistent component usage (auth pages use hardcoded `gray`/`indigo` instead of brand tokens)
- Visual hierarchy that competes with Biletai.lt, Tiketa.lt, or any European secondary market

We are at the stage where first impressions determine seller/buyer trust. A polished, opinionated design system is the foundation for all trust signals.

---

## 2. Business Goals

| Goal | Metric | Target |
|------|--------|--------|
| Increase buyer conversion | Checkout completion rate | +15% vs current baseline |
| Reduce seller drop-off | Listing completion rate | +20% vs current |
| Establish brand trust | User survey: "this looks professional" | ≥80% agree |
| Accessibility compliance | WCAG 2.1 AA on all critical flows | 100% of P0 pages |
| Dark mode adoption | Usage share within 3 months | ≥30% of sessions |

---

## 3. User Personas Affected

### Marius — The Seller (Primary)
- 28–40, tech-moderate, sells 2–10 tickets/month
- Wants confidence that buyers trust the platform (reflects on him)
- Pain: form pages feel unpolished, no visual feedback on submission state
- Device: iPhone + MacBook mix

### Kotryna — The Buyer (Primary)
- 20–35, mobile-first, impulse decision maker
- Trusts platforms that look like Vinted or Pigu.lt (established Lithuanian UX)
- Pain: hero sections aren't compelling enough to stop scrolling
- Device: 80% mobile Safari

### Admin (Secondary)
- Internal only; needs readable data tables, status badges, quick scanning
- Pain: badge inconsistency makes status unclear at a glance

---

## 4. Competitive Benchmark Findings

### Shopify Polaris
- **What we adopt:** CSS custom properties as single source of truth for all tokens. Semantic naming (`--color-text-primary` not `--brand-600`). 4px base grid.
- **Gap vs Eventis:** Eventis has no CSS custom properties. All colors defined only in `tailwind.config.js`.

### Vercel Design System
- **What we adopt:** Geist-inspired typography (or Inter). Dark mode as first-class citizen with a `data-theme` attribute toggle. Monochromatic discipline — accent color used sparingly.
- **Gap vs Eventis:** No custom font. No dark mode. Accent color (violet) used too liberally.

### Linear
- **What we adopt:** Dense but breathable layouts. Very precise 8px spacing grid. Shadow-as-depth philosophy (not decoration). Keyboard-first focus states.
- **Gap vs Eventis:** Eventis shadows are decorative. Focus states inconsistent.

### Stripe
- **What we adopt:** Trust through whitespace. Data displays (prices, statuses) use tabular numbers. High-contrast text on any background. Subtle gradient CTAs.
- **Gap vs Eventis:** Price typography isn't differentiated (not tabular). CTAs don't have enough visual weight.

---

## 5. Proposed Eventis Visual Language

### 5.1 Personality
> **"Confident marketplace meets Baltic minimalism."**  
> Professional enough to trust with €200 tickets. Energetic enough to feel like events. Clean enough to never distract from content.

### 5.2 Color Palette Strategy

**Current:** Tailwind violet scale hardcoded in `tailwind.config.js`. No CSS variables.  
**Proposed:** CSS custom properties as tokens, synced to Tailwind via `var()`.

```
Light mode:
  --color-bg-primary:       #ffffff
  --color-bg-secondary:     #f8f7ff   (very faint violet tint — brand awareness)
  --color-bg-surface:       #f5f5f4   (neutral-100 equivalent)
  --color-text-primary:     #0c0a09   (neutral-950 — near black, warmer than pure #000)
  --color-text-secondary:   #57534e   (neutral-600)
  --color-text-muted:       #a8a29e   (neutral-400)
  --color-brand:            #7c3aed   (brand-600 — kept, it works)
  --color-brand-hover:      #6d28d9   (brand-700)
  --color-border:           #e7e5e4   (neutral-200)
  --color-border-strong:    #d6d3d1   (neutral-300)

Dark mode (data-theme="dark"):
  --color-bg-primary:       #0f0e11   (near black with violet undertone)
  --color-bg-secondary:     #17151c
  --color-bg-surface:       #1e1b26
  --color-text-primary:     #fafaf9   (neutral-50)
  --color-text-secondary:   #a8a29e   (neutral-400)
  --color-text-muted:       #57534e   (neutral-600)
  --color-brand:            #a78bfa   (brand-400 — lighter for dark bg contrast)
  --color-brand-hover:      #8b5cf6   (brand-500)
  --color-border:           #2a2533
  --color-border-strong:    #3d3650
```

**Semantic colors — unchanged (success/warning/danger/info), but exposed as CSS vars.**

### 5.3 Typography Scale

**Current:** System font stack (browser default). No hierarchy beyond Tailwind's `text-xs` → `text-2xl`.  
**Proposed:**

```
Font family:
  --font-sans:   'Inter', system-ui, -apple-system, sans-serif
  --font-mono:   'JetBrains Mono', 'Fira Code', monospace  (prices, ticket IDs)

Scale (rem-based, 4px grid):
  --text-xs:     0.75rem  / 1rem     (12px / 16px)
  --text-sm:     0.875rem / 1.25rem  (14px / 20px)
  --text-base:   1rem     / 1.5rem   (16px / 24px)
  --text-lg:     1.125rem / 1.75rem  (18px / 28px)
  --text-xl:     1.25rem  / 1.75rem  (20px / 28px)
  --text-2xl:    1.5rem   / 2rem     (24px / 32px)
  --text-3xl:    1.875rem / 2.25rem  (30px / 36px)
  --text-4xl:    2.25rem  / 2.5rem   (36px / 40px)

Weights:
  Regular: 400  (body copy)
  Medium:  500  (labels, secondary CTAs)
  Semibold: 600 (headings, primary CTAs)
  Bold:    700  (hero headlines only)

Price display:
  font-variant-numeric: tabular-nums  (always, for prices)
  font-family: var(--font-mono)       (prices in ticket cards)
```

### 5.4 Spacing System

4px base grid. All spacing in multiples of 4.

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
```

### 5.5 Border Radius

```
--radius-sm:   4px    (tags, badges)
--radius-md:   8px    (inputs, buttons small)
--radius-lg:   12px   (buttons default, cards compact)
--radius-xl:   16px   (cards, panels)
--radius-2xl:  24px   (modals, hero cards)
--radius-full: 9999px (pills, avatars)
```

### 5.6 Shadow / Elevation

Linear-inspired: shadow = depth signal, not decoration.

```
--shadow-sm:   0 1px 2px rgba(0,0,0,0.05)
--shadow-md:   0 4px 12px rgba(0,0,0,0.08)
--shadow-lg:   0 8px 24px rgba(0,0,0,0.12)
--shadow-xl:   0 20px 40px rgba(0,0,0,0.16)

Dark mode: increase opacity by 2× (rgba(0,0,0,0.16/0.24/0.32))
Brand glow (CTAs):  0 0 0 3px rgba(124,58,237,0.25)  (focus rings)
```

### 5.7 Dark / Light Mode Architecture

```
tailwind.config.js:
  darkMode: 'class'   (toggle via <html class="dark">)

src/index.css:
  :root { /* light tokens */ }
  :root.dark { /* dark tokens */ }
  
  All component classes reference var(--color-*) not hardcoded Tailwind classes.
  Tailwind theme.extend maps token vars: 
    colors.bg.primary: 'var(--color-bg-primary)'
```

---

## 6. Scope

### In Scope (this design system sprint)
- `tailwind.config.js` — sync with CSS variables, add `darkMode: 'class'`
- `src/index.css` — define all CSS custom properties (light + dark)
- `src/components/ui/` — update all 6 primitives to use token classes
- `src/components/Layout.tsx` — update to token classes, add dark mode toggle
- Fix `Login.tsx` + `Register.tsx` color inconsistencies
- Inter font integration (Google Fonts or self-hosted)
- Tabular numbers on all price displays
- Design token export file: `src/lib/tokens.ts` (for JS access)

### Out of Scope
- New component types (modals, tooltips, datepickers)
- Animation library (Framer Motion) — separate sprint
- Icon library migration — separate sprint
- Storybook / component documentation — Phase 2
- White-label theming for third parties

---

## 7. MoSCoW Requirements

### Must Have
- [ ] CSS custom properties for all color, spacing, radius, shadow tokens
- [ ] `tailwind.config.js` consuming tokens via `var()` references
- [ ] Dark mode: `class`-based toggle, full token set for dark theme
- [ ] Inter font loaded and applied globally
- [ ] All 6 UI components (`Button`, `Card`, `Input`, `Badge`, `Skeleton`, `EmptyState`) updated to token classes
- [ ] `Layout.tsx` dark mode toggle button (persisted to `localStorage`)
- [ ] Fix `Login.tsx` + `Register.tsx` — replace `gray`/`indigo` with brand tokens
- [ ] WCAG AA contrast on all text/background combinations in both modes
- [ ] Tabular nums on all price displays

### Should Have
- [ ] `src/lib/tokens.ts` — typed JS token export for dynamic use
- [ ] Focus ring consistency: `brand glow` on all interactive elements
- [ ] Smooth dark mode transition (`transition-colors duration-200` on `:root`)
- [ ] Semantic color naming in component props (not "brand-600" but "primary")

### Nice to Have
- [ ] System preference detection (`prefers-color-scheme`) as default
- [ ] Color-mode-aware meta theme-color for mobile browser chrome
- [ ] Per-component design token documentation comments

---

## 8. Technical Constraints

- `[ASSUMPTION]` No breaking changes to existing page layouts — token swap only, not redesign
- `[ASSUMPTION]` Inter font loaded via Google Fonts CDN (or swap to self-hosted for GDPR)
- No new npm dependencies required (pure CSS + Tailwind config change)
- Supabase, Stripe, Bright Data integrations unaffected
- Must work in Chrome, Firefox, Safari (iOS 15+), and Chrome Android

---

## 9. Accessibility Requirements (WCAG 2.1 AA)

| Requirement | Threshold |
|-------------|-----------|
| Normal text contrast | ≥ 4.5:1 |
| Large text contrast (18px+ or 14px bold+) | ≥ 3:1 |
| UI component / graphical contrast | ≥ 3:1 |
| Focus indicator visible | ≥ 3:1 contrast vs adjacent colour |
| No information conveyed by colour alone | Verified |
| Touch target minimum | 44×44px |

**Key checks to run post-implementation:**
- Brand violet (#7c3aed) on white: 5.8:1 — PASS
- Brand violet (#7c3aed) on brand-50 (#f5f3ff): 4.9:1 — PASS
- Dark mode brand-400 (#a78bfa) on #0f0e11: verify ≥4.5:1 (calculate in implementation)
- All Skeleton + EmptyState states: non-interactive, skip contrast check

---

## 10. Open Questions for PM

1. **Font hosting:** Google Fonts CDN (simple, GDPR risk) vs self-hosted via Vite plugin? — needs decision before implementation.
2. **Default mode:** Light as default, or respect `prefers-color-scheme`? — UX preference.
3. **Toggle placement:** Navbar icon vs Settings page only? — UX decision.
4. **Brand color evolution:** Violet stays as primary, or does this sprint evaluate alternatives?
5. **Component library migration:** Is shadcn/ui + Radix on the roadmap? If yes, should this token system be shadcn-compatible? — architectural decision that affects token naming.
6. **Lithuanian language:** Are any font glyphs needed that Inter doesn't cover? (Lithuanian uses ą, č, ę, ė, į, š, ų, ū, ž — all in Inter.)

---

## 11. Suggested Sprint Structure

| Day | Deliverable |
|-----|-------------|
| 1 | CSS tokens in `index.css` + `tailwind.config.js` update + Inter font |
| 1 | Dark mode architecture: `class` toggle, localStorage persistence |
| 2 | All 6 UI components updated to tokens |
| 2 | `Layout.tsx` dark toggle button + fix auth pages |
| 3 | Tabular numbers on prices, WCAG contrast verification |
| 3 | QA pass: both modes, mobile Safari, keyboard nav |

---

**Ready for `/pm` to create the PRD.**
