# Eventis Design System

**Last updated**: 2026-03-01 (Sprint 6 — UX/UI & Value Proposition)

This document is the single source of truth for all visual decisions in Eventis. When the design changes — update this file first, then update `tailwind.config.js` and components.

---

## 1. Design Principles

| Principle | What it means in practice |
|-----------|--------------------------|
| **Friendly** | Rounded corners, warm grays (stone), approachable copy |
| **Playful** | Violet brand color with energy; scarcity chips; hover animations |
| **Trustworthy** | Consistent colors, clear hierarchy, WCAG-compliant contrast, verified seller badges |
| **Minimal** | No decoration for its own sake. Every element earns its place. |

---

## 2. Color Tokens

Defined in `tailwind.config.js` under `theme.extend.colors`. **Never use hardcoded hex values or raw Tailwind palette names (gray-*, indigo-*) in components.** Always use the semantic tokens below.

### 2.1 Brand — Violet

Primary color. Used for CTAs, links, active states, focus rings.

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-50` | `#f5f3ff` | Hover background on ghost buttons |
| `brand-100` | `#ede9fe` | Badge background |
| `brand-200` | `#ddd6fe` | Ghost button border |
| `brand-300` | `#c4b5fd` | Decorative accents |
| `brand-400` | `#a78bfa` | — |
| `brand-500` | `#8b5cf6` | Focus rings |
| `brand-600` | `#7c3aed` | **Primary CTA, links, logo, avatar** |
| `brand-700` | `#6d28d9` | CTA hover state |
| `brand-800` | `#5b21b6` | — |
| `brand-900` | `#4c1d95` | — |
| `brand-950` | `#2e1065` | — |

### 2.2 Neutral — Stone (warm gray)

Background, borders, secondary text. Stone has a warm undertone (vs. cold blue-gray).

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#fafaf9` | Page background, footer background |
| `neutral-100` | `#f5f5f4` | Card inner sections, skeleton base |
| `neutral-200` | `#e7e5e4` | Card borders, dividers, skeleton color |
| `neutral-300` | `#d6d3d1` | Input borders |
| `neutral-400` | `#a8a29e` | Placeholder text, secondary icons |
| `neutral-500` | `#78716c` | Helper text, subtitles, footer body |
| `neutral-600` | `#57534e` | Secondary nav links, footer headings |
| `neutral-700` | `#44403c` | Labels, form text |
| `neutral-800` | `#292524` | — |
| `neutral-900` | `#1c1917` | Primary body text, headings |

### 2.3 Semantic Colors

Used for status badges, alerts, and feedback states. Never use `green-*`, `yellow-*`, `red-*`, `blue-*` directly.

| Scale | Default | 50 | 100 | 600 | 700 | Usage |
|-------|---------|----|----|-----|-----|-------|
| `success` | `#16a34a` | `#f0fdf4` | `#dcfce7` | `#16a34a` | `#15803d` | Active/paid/verified states |
| `warning` | `#d97706` | `#fffbeb` | `#fef3c7` | `#d97706` | `#b45309` | Pending, unverified states |
| `danger` | `#dc2626` | `#fef2f2` | `#fee2e2` | `#dc2626` | `#b91c1c` | Errors, destructive actions, scarcity chip |
| `info` | `#0284c7` | `#f0f9ff` | `#e0f2fe` | `#0284c7` | `#0369a1` | Sold/informational states |

### 2.4 Color Rules

- **Text on `bg-brand-600`**: use `text-white` or `text-white/80`. Never `text-brand-100` — same hue family, fails WCAG AA (~2.5:1 contrast).
- **Hero backgrounds**: `bg-brand-600` or gradient `bg-gradient-to-br from-brand-700 to-brand-500`.
- **Page backgrounds**: `bg-neutral-50`.
- **Card backgrounds**: `bg-white` with `border border-neutral-200` (not `border-gray-200`).
- **Footer headings**: minimum `text-neutral-500` on `bg-neutral-50`. Never `text-neutral-400` (fails WCAG AA).

---

## 3. Typography

No custom font — uses Tailwind's system font stack. Vite default (Inter via system).

| Role | Classes | Example |
|------|---------|---------|
| Page title (H1) | `text-2xl font-bold text-neutral-900` | "Mano skelbimai" |
| Section title (H2) | `text-xl font-bold text-neutral-900` | EventDetail sections |
| Card title | `font-semibold text-neutral-900` | Event card title |
| Hero title | `text-4xl md:text-5xl font-bold text-white` | Home page hero |
| Hero subtitle | `text-lg md:text-xl text-white/80` | Home page subtitle |
| Label / form | `text-sm font-medium text-neutral-700` | Input labels |
| Body | `text-sm text-neutral-600` | General body |
| Secondary / caption | `text-sm text-neutral-500` | Dates, subtitles |
| Micro / badge | `text-xs font-medium` | Status badges |
| Section label (caps) | `text-xs font-semibold uppercase tracking-wider text-neutral-500` | Card section headers |

---

## 4. Spacing & Layout

- **Max content width**: `max-w-6xl mx-auto px-4` (nav, event grid, footer)
- **Narrow content (forms, detail pages)**: `max-w-3xl mx-auto px-4` or `max-w-2xl`
- **Page hero padding**: `py-8`
- **Section padding**: `py-8` or `py-12` (footer)
- **Card padding**: `px-5 py-4` (list rows) or `px-6 py-5` (profile cards)
- **Grid gap**: `gap-6` for event card grid

---

## 5. Border Radius

| Usage | Class |
|-------|-------|
| Large cards (event card, profile section) | `rounded-2xl` |
| Standard cards, buttons, inputs | `rounded-xl` or `rounded-lg` |
| Small elements (badges, pills) | `rounded-full` |
| Image overlays | `rounded-none` (inside `overflow-hidden` parent) |

---

## 6. Shadows

| Usage | Class |
|-------|-------|
| Default card | `shadow-sm` |
| Card on hover | `shadow-md` |
| Dropdown overlays | `shadow-lg` |

---

## 7. Component Library

All components live in `src/components/ui/`. Import via barrel export:

```tsx
import { Button, Badge, Input, Card, Skeleton, EmptyState } from '../components/ui'
```

### 7.1 Button

**File**: `src/components/ui/Button.tsx`

```tsx
<Button variant="primary" size="md" loading={false}>Label</Button>
```

| Prop | Type | Default | Options |
|------|------|---------|---------|
| `variant` | string | `'primary'` | `'primary'` `'secondary'` `'ghost'` `'danger'` |
| `size` | string | `'md'` | `'sm'` `'md'` `'lg'` |
| `loading` | boolean | `false` | Shows spinner, disables button |
| `disabled` | boolean | `false` | Dims + disables |

| Variant | Background | Text | Use for |
|---------|-----------|------|---------|
| `primary` | `brand-600` | white | Main CTA |
| `secondary` | `neutral-100` | `neutral-800` | Alternative action |
| `ghost` | transparent | `brand-600` | Low-emphasis, inline actions |
| `danger` | `danger-600` | white | Destructive (cancel, delete) |

| Size | Padding | Text | Border radius |
|------|---------|------|--------------|
| `sm` | `px-3 py-1.5` | `text-xs` | `rounded-lg` |
| `md` | `px-4 py-2` | `text-sm` | `rounded-lg` |
| `lg` | `px-6 py-3` | `text-base` | `rounded-xl` |

### 7.2 Badge

**File**: `src/components/ui/Badge.tsx`

```tsx
<Badge variant="success" size="sm">Aktyvus</Badge>
```

| Variant | Background | Text | Use for |
|---------|-----------|------|---------|
| `success` | `success-100` | `success-700` | Active, paid, verified |
| `warning` | `warning-100` | `warning-700` | Pending, reserved, unverified |
| `danger` | `danger-100` | `danger-700` | Cancelled, error |
| `neutral` | `neutral-100` | `neutral-600` | Refunded, inactive |
| `info` | `info-100` | `info-700` | Sold, informational |
| `brand` | `brand-100` | `brand-700` | Feature highlight |

Always `rounded-full uppercase tracking-wide font-medium`.

### 7.3 Input

**File**: `src/components/ui/Input.tsx`

```tsx
<Input label="El. paštas" error="Privalomas" helperText="Format: name@email.com" required />
```

- Label: `text-sm font-medium text-neutral-700`
- Required asterisk: `text-danger-600`
- Normal border: `border-neutral-300`, focus: `ring-brand-500`
- Error border: `border-danger-300`, focus: `ring-danger-500`
- Error message: `text-xs text-danger-600`
- Helper text: `text-xs text-neutral-500`

### 7.4 Card

**File**: `src/components/ui/Card.tsx`

```tsx
<Card onClick={() => navigate('/events/slug')}>…content…</Card>
```

- Base: `bg-white rounded-2xl border border-neutral-100 shadow-sm`
- Clickable: adds `cursor-pointer hover:shadow-md transition-shadow`

### 7.5 Skeleton

**File**: `src/components/ui/Skeleton.tsx`

```tsx
<Skeleton className="h-6 w-3/4 mb-3" />
<Skeleton className="aspect-video w-full" rounded="rounded-none" />
```

- Base: `animate-pulse bg-neutral-200 rounded-md`
- Override rounding with `rounded` prop (e.g., `rounded-none` for image areas)

### 7.6 EmptyState

**File**: `src/components/ui/EmptyState.tsx`

```tsx
<EmptyState
  icon="🎟"
  title="Nėra skelbimų"
  description="Parduokite bilietą, kurio nebenorite naudoti."
  action={{ label: 'Paskelbti bilietą', href: '/sell' }}
/>
```

- Centered, `py-16`
- Action renders as `Link` (if `href`) or `button` (if `onClick`)
- Action style: ghost variant (`text-brand-600 border-brand-200 hover:bg-brand-50`)

---

## 8. Page Patterns

### 8.1 Page Hero

Every authenticated/seller page (MyListings, MyOrders, MyEarnings, Profile, ListTicket) uses a consistent page hero:

```tsx
<div className="bg-white border-b border-neutral-100">
  <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Page Title</h1>
      <p className="text-sm text-neutral-500 mt-1">Supporting subtitle.</p>
    </div>
    {/* Optional CTA button */}
    <Link to="/sell" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
      + Action
    </Link>
  </div>
</div>
```

### 8.2 Home Hero (EventList)

```tsx
<section className="bg-brand-600 text-white">
  <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">…</h1>
    <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">…</p>
    {/* CTAs */}
  </div>
</section>
```

**Rule**: subtext on brand hero is always `text-white/80`, never `text-brand-*`.

### 8.3 Trust Bar

Follows the home hero. SVG icons preferred over emoji for polish.

```tsx
<div className="bg-white border-b border-neutral-200">
  <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-600 font-medium">
    <span className="flex items-center gap-2">{/* SVG icon */} 500+ renginių</span>
    …
  </div>
</div>
```

### 8.4 Event Card

```
┌─────────────────────────────┐
│  [image]        [category]  │  ← category pill top-left (bg-white/90 text-brand-700)
│                  [X liko]   │  ← scarcity chip top-right (bg-danger-600 text-white) when < 5
├──────────────────────────────┤
│ [DD]  Event Title            │  ← date block left (dayNum bold, monthAbbr neutral-400)
│ [MM]  Line 2 of title        │
│ [HH]                         │
│ 📍 Venue, City               │  ← map pin SVG (neutral-400)
├──────────────────────────────┤
│ nuo X.XX €  [N bilietų]    → │  ← price brand-600 bold; CTA "Peržiūrėti →" brand-600
└─────────────────────────────┘
```

### 8.5 Navigation

```
Desktop (sm+):
[Logo]  [Renginiai] [Parduoti] [Naujienos]     [avatar ▼]
                                               (hidden sm:block — desktop only)

Mobile (<sm):
[Logo]                                          [☰]
```

- Avatar (logged-in): `w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold`
- Avatar is `hidden sm:block` — mobile uses hamburger menu only
- Hamburger opens full-screen overlay with all links including profile/account

### 8.6 Status Badges (lists)

Use the semantic `STATUS_COLOURS` map pattern:

```tsx
const STATUS_COLOURS: Record<string, string> = {
  active:    'bg-success-100 text-success-700',
  reserved:  'bg-warning-100 text-warning-700',
  sold:      'bg-info-100 text-info-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
  pending:   'bg-warning-100 text-warning-700',
  paid:      'bg-success-100 text-success-700',
  refunded:  'bg-neutral-100 text-neutral-500',
}
```

### 8.7 Loading States

Replace full-page spinners with skeleton screens where possible.

- Inline loading text: `text-neutral-500` (never `text-gray-500`)
- Skeleton: `<Skeleton className="h-X w-X" />`
- Error text: `text-danger-600` (never `text-red-500`)

### 8.8 Footer

Embedded in `Layout.tsx`. 3-column grid on sm+:

```
[Brand name + tagline]   [Platform links]   [Info links]
                         Platforma          Informacija
                                            (text-neutral-500, not 400)
© 2026 Eventis. Visos teisės saugomos.
```

---

## 9. Accessibility Rules

| Rule | Detail |
|------|--------|
| Minimum contrast | 4.5:1 for normal text (WCAG AA) |
| White on brand-600 | ✅ passes (~5.9:1) |
| `text-white/80` on brand-600 | ✅ passes (~4.7:1) |
| `text-brand-100` on brand-600 | ❌ FAIL — same hue, ~2.5:1 |
| `text-neutral-500` on white | ✅ passes |
| `text-neutral-400` on neutral-50 | ❌ FAIL for small text |
| Focus rings | All interactive elements: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500` |
| Buttons | Always include `aria-label` when icon-only |

---

## 10. When to Update This Document

| Change | Action |
|--------|--------|
| New color added to `tailwind.config.js` | Add row to section 2 |
| New component added to `src/components/ui/` | Add subsection to section 7 |
| New page pattern established | Add to section 8 |
| Color token renamed | Update `tailwind.config.js`, all usages, and sections 2+7+8 |
| Font changed | Update section 3 |
| Spacing convention changed | Update section 4 |

---

## 11. Forbidden Patterns

The following raw Tailwind classes must **never** appear in component files. Use the semantic tokens instead.

| Forbidden | Use instead |
|-----------|-------------|
| `bg-indigo-*`, `text-indigo-*`, `ring-indigo-*` | `bg-brand-*`, `text-brand-*`, `ring-brand-*` |
| `bg-gray-*`, `text-gray-*`, `border-gray-*` | `bg-neutral-*`, `text-neutral-*`, `border-neutral-*` |
| `bg-green-*`, `text-green-*` | `bg-success-*`, `text-success-*` |
| `bg-yellow-*`, `text-yellow-*` | `bg-warning-*`, `text-warning-*` |
| `bg-red-*`, `text-red-*` | `bg-danger-*`, `text-danger-*` |
| `bg-blue-*`, `text-blue-*` | `bg-info-*`, `text-info-*` |
| `text-brand-100` on `bg-brand-600` | `text-white/80` |

---

## 12. File Locations

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Single source for all color hex values |
| `src/components/ui/Button.tsx` | Button component |
| `src/components/ui/Badge.tsx` | Badge / pill component |
| `src/components/ui/Input.tsx` | Form input with label/error |
| `src/components/ui/Card.tsx` | Card wrapper |
| `src/components/ui/Skeleton.tsx` | Loading placeholder |
| `src/components/ui/EmptyState.tsx` | Empty list state |
| `src/components/ui/index.ts` | Barrel export for all above |
| `src/components/Layout.tsx` | Nav + footer shell |
| `src/hooks/useDocumentMeta.ts` | SEO meta tags (title, og, canonical) |
