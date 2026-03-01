# UX Design — Design System Overhaul
**Version:** 1.0  
**Date:** 2026-03-01  
**Author:** UX Designer  
**Feeds into:** `/pm` PRD, `/architect` token architecture  

---

## Scope
Design the UX layer of the Eventis design system overhaul:
1. Dark mode toggle flow & placement
2. Visual hierarchy improvements across core flows
3. Component interaction patterns (buttons, inputs, prices)
4. Key wireframes: updated Event Card, updated Navbar with theme toggle

---

## 1. Answers to Open UX Questions (from analyst brief)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Default mode? | **Respect `prefers-color-scheme`, user override persisted in `localStorage`** | Respects OS-level preference (Gen Z/mobile-first standard). User override survives page reload. |
| Toggle placement? | **Navbar icon (top right, before avatar)** | Always accessible; never buried. Linear, Vercel, GitHub all use this pattern. Mobile: include in hamburger menu. |
| Font hosting? | **Self-hosted via Vite** | GDPR compliant (no Google Fonts call to US server on Lithuanian site). One-time setup. |

---

## 2. User Journeys

---

### Journey A: Buyer discovers event in Dark Mode
**Persona:** Kotryna (25, iPhone, uses dark mode at night)  
**Goal:** Find a concert ticket, trust the platform, buy

```
1. Arrives at eventis.lt at 22:00 via Instagram ad
   → Site loads in DARK mode (matches her iPhone setting)
   → Sees: deep violet-black hero, event grid with card glow
   → Feels: modern, intentional — not a scam site

2. Browses event grid
   → Cards: readable white text on dark surface, price in mono font
   → Scarcity badge (red) still pops against dark card
   → No eye strain from white flash

3. Taps event card → EventDetail
   → Seller tickets listed, prices tabular-aligned
   → "Pirkti" CTA: brand violet button with glow focus ring
   → Trust badge visible under seller name

4. Checkout → Stripe
   → Stripe's own dark mode handles this (Stripe Appearance API)

SUCCESS: Buyer completes purchase without friction from theme mismatch
```

**Pain points (current):**
- ⚠️ Site forces white background at 22:00 — hurts eyes, feels dated
- ⚠️ Prices in EventDetail not aligned (non-tabular) — hard to compare quickly
- ⚠️ No trust signal visible without scrolling on mobile EventDetail

**Proposed improvements:**
- ✅ Dark mode: auto-detect + toggle
- ✅ Prices in `font-mono` + `tabular-nums`, right-aligned in ticket list
- ✅ Trust badge pinned to top of ticket card (not below fold)

---

### Journey B: Seller lists a ticket — new design system
**Persona:** Marius (32, MacBook, sells 4–6 tickets/year)  
**Goal:** List his Rammstein tickets in under 3 minutes

```
1. Clicks "Parduoti bilietus" in navbar
   → Redirected to login if not authed (return URL preserved — already works)

2. ListTicket form loads
   → Currently: inconsistent input styling, no visible step progress
   → Proposed: consistent Input components, clear section headers

3. Fills form: price, quantity, seating details
   → Input focus ring: brand violet glow (visible, not just underline)
   → Error state: red border + Lithuanian error message below field

4. Submits → success state
   → Card-style confirmation (not just an alert)
   → Link to "Mano skelbimai" to verify listing

SUCCESS: Under 3 minutes, no confusion about which fields are required
```

**Pain points (current):**
- ⚠️ ListTicket uses some inline styles rather than `Input` component (inconsistent)
- ⚠️ No clear required field indicators on submit (error appears after)
- ⚠️ Success is a basic redirect, no satisfaction moment

**Proposed improvements:**
- ✅ All fields use `Input` component with required asterisk
- ✅ Show inline validation on blur (not just on submit)
- ✅ Success: full-page or modal confirmation with next steps

---

### Journey C: Theme toggle interaction
**Persona:** Any user  
**Goal:** Switch between light and dark mode

```
1. User clicks sun/moon icon in navbar
   → Icon: filled sun (light mode) / filled moon (dark mode)
   → Transition: 200ms ease on all color tokens (no flash)
   → Preference saved to localStorage("theme")

2. User returns next visit
   → localStorage checked first → applies before first paint (no FOUC)
   → If no localStorage → checks prefers-color-scheme

3. Mobile: hamburger menu includes "Tamsi tema" toggle row
   → Toggle row: label left, sun/moon icon right
   → Same localStorage persistence
```

**Implementation note for architect:**  
Inline script in `<head>` (before React hydration) reads localStorage and sets `class="dark"` on `<html>`. Eliminates flash of wrong theme.

---

## 3. Component Interaction Patterns

### 3.1 Button States (all variants)

```
DEFAULT:    solid bg, white text, rounded-lg
HOVER:      bg darkens by one step (brand-600 → brand-700), cursor: pointer
FOCUS:      brand glow ring (3px, 25% opacity), no outline: none — keep accessible
ACTIVE:     scale(0.97) — slight press-down tactile feel
LOADING:    spinner replaces text, button disabled, opacity 100% (not dimmed)
DISABLED:   opacity-40, cursor-not-allowed, no hover effect
```

### 3.2 Input States

```
DEFAULT:    border-neutral-300, bg-white (light) / bg-surface (dark)
FOCUS:      border-brand, ring-brand-glow (not just blue, uses brand token)
FILLED:     border-neutral-400 (slightly stronger — shows data present)
ERROR:      border-danger, bg-danger-50 tint, error msg below in danger-600
SUCCESS:    border-success (on explicit validation, e.g. promo code)
DISABLED:   opacity-50, cursor-not-allowed, bg-neutral-50
```

### 3.3 Price Display Pattern

```
Ticket list (EventDetail):
┌──────────────────────────────────────────────┐
│ Pardavėjas: Marius V.   ✓ Patvirtintas       │
│                                              │
│ Kiekis: 2 bilietai   Vieta: 14A, 14B         │
│                                              │
│                         €  48.00 / bilietas │
│                    [  Pirkti 2 →  ]          │
└──────────────────────────────────────────────┘

Rules:
- Price always right-aligned
- Currency symbol: € before number (Lithuanian convention)
- Font: var(--font-mono), tabular-nums
- "/ bilietas" suffix in text-muted, smaller
- CTA button: full width on mobile, auto width on desktop (right-aligned)
```

---

## 4. Wireframes

### 4.1 Updated Navbar — Light & Dark

```
LIGHT MODE:
┌──────────────────────────────────────────────────────────────┐
│  ◆ Eventis          Renginiai  Parduoti      ☀  [👤 Marius ▾]│
│  ─────────────────────────────────────────────────────────── │
│  border-b: neutral-200 / bg: white                           │
└──────────────────────────────────────────────────────────────┘

DARK MODE:
┌──────────────────────────────────────────────────────────────┐
│  ◆ Eventis          Renginiai  Parduoti      🌙  [👤 Marius ▾]│
│  ─────────────────────────────────────────────────────────── │
│  border-b: border-dark / bg: #0f0e11                         │
└──────────────────────────────────────────────────────────────┘

Toggle icon:  24×24px, text-neutral-500, hover: text-brand
              Tooltip on hover: "Perjungti temą" (Lithuanian)
              Position: between nav links and avatar
```

### 4.2 Event Card — Updated

```
LIGHT:
┌────────────────────────┐
│ ┌──────────────────┐   │
│ │  [event image]   │   │  aspect-video, object-cover
│ │  ┌─────────────┐ │   │
│ │  │ 🎵 Muzika   │ │   │  category pill: bg-white/90, brand text
│ │  └─────────────┘ │   │
│ │  ┌─────────────┐ │   │
│ │  │ ⚡ 3 liko   │ │   │  scarcity: bg-danger, white text (only <5)
│ │  └─────────────┘ │   │
│ └──────────────────┘   │
│                         │
│  Rammstein             │  text-xl font-semibold text-primary
│  Kaunas · 2026-06-14   │  text-sm text-muted
│                         │
│  nuo  € 48.00          │  mono, tabular, brand color
└────────────────────────┘
  rounded-xl border-border shadow-sm
  hover: shadow-md, translateY(-2px), 150ms ease

DARK:
  Same layout. bg: --color-bg-surface (#1e1b26)
  Border: --color-border (#2a2533)
  Image: no change
  Text: --color-text-primary (#fafaf9)
  Price: --color-brand (#a78bfa — lighter violet for dark)
```

### 4.3 Mobile Hamburger Menu — Updated

```
┌─────────────────────────┐
│ ◆ Eventis          ✕   │
├─────────────────────────┤
│ Renginiai               │
│ Parduoti bilietus       │
├─────────────────────────┤
│ Mano skelbimai          │
│ Mano užsakymai          │
│ Mano pajamos            │
├─────────────────────────┤
│ Tamsi tema          🌙  │  ← toggle row, full width
├─────────────────────────┤
│ Atsijungti              │
└─────────────────────────┘
```

### 4.4 Login Page — Token-Corrected

```
CURRENT PROBLEM: uses hardcoded `indigo` + `gray`
PROPOSED (same layout, token fix):

┌────────────────────────────────┐
│         ◆ Eventis              │  brand-600 logo
│                                │
│   Prisijunkite prie paskyros   │  text-2xl font-semibold text-primary
│                                │
│  ┌─────────────────────────┐   │
│  │ El. paštas              │   │  Input component, label above
│  │ [jūsų@pastas.lt      ]  │   │  border-border, focus: brand ring
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Slaptažodis             │   │
│  │ [••••••••••••••••••  ]  │   │
│  └─────────────────────────┘   │
│                                │
│  [   Prisijungti   ]           │  Button primary, full width
│                                │
│  ──────── arba ────────        │
│                                │
│  [G  Tęsti su Google  ]        │  Button secondary, full width
│                                │
│  Neturite paskyros? Registruotis│  text-sm, brand link
└────────────────────────────────┘

Token fix: gray → neutral, indigo → brand
```

---

## 5. UX Checklist — Design System Scope

| Check | Status after overhaul |
|-------|----------------------|
| Primary CTA obvious? | ✅ Brand violet, full-width on mobile |
| Error messages in Lithuanian? | ✅ Already done in Login; apply to all forms |
| Empty states handled? | ✅ EmptyState component exists, needs token update |
| Loading states shown? | ✅ Skeleton component exists, needs token update |
| Works at 375px? | ✅ Mobile-first layouts unchanged |
| Form labels visible? | ✅ Input component has labels above (not placeholder-only) |
| Dark mode no FOUC? | ✅ Inline script in `<head>` before hydration |
| Prices readable in dark? | ✅ brand-400 on dark bg, tabular mono |
| Focus rings accessible? | ✅ Brand glow ring, 3px, WCAG ≥3:1 |

---

## 6. What UX Does NOT Cover (handoff to architect)

- How `tailwind.config.js` consumes CSS vars — architect decision
- Whether `darkMode: 'class'` or `darkMode: 'media'` — architect decides (UX recommends `class` for user override)
- Token file structure (`tokens.ts`) — architect designs
- Inter font loading strategy — devops/architect decision

---

**Ready for `/pm` to create the PRD, `/po` to write stories, `/architect` to design the token system.**
