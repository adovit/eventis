# ADR-009: Design System Token Architecture

**Status:** Accepted
**Date:** 2026-03-01
**Author:** Solution Architect
**Feeds into:** `plan.md` (design system sprint), `/execute`

---

## Context

### Current state (as of 2026-03-01)

**`src/index.css`** — three lines:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
No CSS custom properties. No font loading. No dark mode variables.

**`tailwind.config.js`** — all design values are hardcoded Tailwind color scales:
- `brand` mapped to Tailwind violet scale (`#f5f3ff` → `#2e1065`)
- `neutral` mapped to Tailwind stone scale
- `success`, `warning`, `danger`, `info` as inline hex values
- No `darkMode` setting (defaults to `media`, which blocks user override)
- No custom `fontFamily`

**Components** — partially token-aware:
- `Button.tsx`, `Input.tsx`, `Badge.tsx`, `Card.tsx`, `Skeleton.tsx` use `brand-*`, `neutral-*`, `danger-*` Tailwind classes — these map to hardcoded hex values, not CSS vars
- `Layout.tsx` uses `bg-white`, `bg-neutral-50`, `border-neutral-200` — all hardcoded
- `Login.tsx` uses `indigo-*` and `gray-*` directly — completely off-brand, bypasses the token system entirely

**`index.html`** — no inline theme script. Dark mode toggle added at runtime would cause flash of white (FOUC) before React hydrates.

**No `src/hooks/` directory** — `useTheme` hook does not exist.
**No `src/lib/tokens.ts`** — no JS token export for use in Stripe Appearance API or inline styles.
**No `public/fonts/`** — Inter is not loaded; the UI falls back to system fonts.

### Problem

All design values are defined in one place (`tailwind.config.js`) as static hex strings. This means:

1. Dark mode requires duplicating every Tailwind utility class with a `dark:` variant — exponential class sprawl in every component and page
2. No runtime theming: values cannot change after the CSS bundle is compiled
3. Stripe's Appearance API requires JS-accessible token values — impossible without a `tokens.ts` layer
4. Login and Register pages use `indigo` and `gray` — Tailwind built-in scales not even present in `tailwind.config.js`, making the design system inconsistent
5. System font fallback (no Inter) degrades perceived quality and trust signals

---

## Decision

Adopt a **CSS Custom Property (CSS variable) token architecture** as the single source of truth for all design values. Tailwind config reads from those variables. Components reference Tailwind utility classes. JS code accesses a typed `tokens.ts` mirror.

The architecture has six layers:

```
CSS vars (:root / :root.dark)
    ↓
tailwind.config.js (maps CSS vars → Tailwind utility names)
    ↓
Component classes (e.g. bg-bg-primary, text-text-primary)
    ↓
src/lib/tokens.ts (typed JS mirror of CSS vars — for Stripe, inline styles)
    ↓
src/hooks/useTheme.ts (reads/writes localStorage, toggles <html class="dark">)
    ↓
index.html inline script (reads localStorage before React hydrates — prevents FOUC)
```

---

## Decision Details

### 1. CSS Custom Properties — `src/index.css`

All tokens are defined in `:root` (light) and `:root.dark` (dark). The `dark` class is toggled on the `<html>` element by `useTheme`.

A `transition-colors` declaration on `:root` ensures 200ms smooth crossfade between themes.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Inter variable font ─────────────────────────────────── */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/InterVariable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

/* ─── Smooth theme crossfade ──────────────────────────────── */
:root {
  transition-property: color, background-color, border-color, fill, stroke;
  transition-timing-function: ease;
  transition-duration: 200ms;
}

/* ═══════════════════════════════════════════════════════════ */
/*  LIGHT TOKENS (default)                                     */
/* ═══════════════════════════════════════════════════════════ */
:root {
  /* ── Background ─────────────────────────────────────────── */
  --color-bg-primary:       #ffffff;
  --color-bg-secondary:     #f8f7ff;   /* faint violet tint */
  --color-bg-surface:       #f5f5f4;   /* neutral-100 */

  /* ── Text ───────────────────────────────────────────────── */
  --color-text-primary:     #0c0a09;   /* neutral-950, warm near-black */
  --color-text-secondary:   #57534e;   /* neutral-600 */
  --color-text-muted:       #a8a29e;   /* neutral-400 */
  --color-text-on-brand:    #ffffff;   /* white text on brand bg */

  /* ── Brand ──────────────────────────────────────────────── */
  --color-brand:            #7c3aed;   /* violet-600 */
  --color-brand-hover:      #6d28d9;   /* violet-700 */
  --color-brand-subtle:     #f5f3ff;   /* violet-50 — ghost button bg */
  --color-brand-border:     #ddd6fe;   /* violet-200 — ghost button border */

  /* ── Border ─────────────────────────────────────────────── */
  --color-border:           #e7e5e4;   /* neutral-200 */
  --color-border-strong:    #d6d3d1;   /* neutral-300 */

  /* ── Semantic: success ──────────────────────────────────── */
  --color-success:          #16a34a;
  --color-success-bg:       #f0fdf4;   /* green-50 */
  --color-success-border:   #dcfce7;   /* green-100 */
  --color-success-text:     #15803d;   /* green-700 */

  /* ── Semantic: warning ──────────────────────────────────── */
  --color-warning:          #d97706;
  --color-warning-bg:       #fffbeb;   /* amber-50 */
  --color-warning-border:   #fef3c7;   /* amber-100 */
  --color-warning-text:     #b45309;   /* amber-700 */

  /* ── Semantic: danger ───────────────────────────────────── */
  --color-danger:           #dc2626;
  --color-danger-bg:        #fef2f2;   /* red-50 */
  --color-danger-border:    #fee2e2;   /* red-100 */
  --color-danger-text:      #b91c1c;   /* red-700 */

  /* ── Semantic: info ─────────────────────────────────────── */
  --color-info:             #0284c7;
  --color-info-bg:          #f0f9ff;   /* sky-50 */
  --color-info-border:      #e0f2fe;   /* sky-100 */
  --color-info-text:        #0369a1;   /* sky-700 */

  /* ── Shadow ─────────────────────────────────────────────── */
  --shadow-sm:   0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:   0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg:   0 8px 24px rgba(0,0,0,0.12);
  --shadow-xl:   0 20px 40px rgba(0,0,0,0.16);
  --shadow-brand-glow: 0 0 0 3px rgba(124,58,237,0.25); /* focus rings */

  /* ── Border radius ──────────────────────────────────────── */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  24px;
  --radius-full: 9999px;

  /* ── Spacing (4px grid) ─────────────────────────────────── */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;

  /* ── Typography ─────────────────────────────────────────── */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

/* ═══════════════════════════════════════════════════════════ */
/*  DARK TOKENS                                                */
/* ═══════════════════════════════════════════════════════════ */
:root.dark {
  /* ── Background ─────────────────────────────────────────── */
  --color-bg-primary:       #0f0e11;   /* near-black, violet undertone */
  --color-bg-secondary:     #17151c;
  --color-bg-surface:       #1e1b26;

  /* ── Text ───────────────────────────────────────────────── */
  --color-text-primary:     #fafaf9;   /* neutral-50 */
  --color-text-secondary:   #a8a29e;   /* neutral-400 */
  --color-text-muted:       #57534e;   /* neutral-600 */
  --color-text-on-brand:    #ffffff;

  /* ── Brand ──────────────────────────────────────────────── */
  --color-brand:            #a78bfa;   /* violet-400 — lighter for dark bg contrast */
  --color-brand-hover:      #8b5cf6;   /* violet-500 */
  --color-brand-subtle:     #1e1b26;   /* reuse surface */
  --color-brand-border:     #3d3650;

  /* ── Border ─────────────────────────────────────────────── */
  --color-border:           #2a2533;
  --color-border-strong:    #3d3650;

  /* ── Semantic: success ──────────────────────────────────── */
  --color-success:          #4ade80;   /* green-400 */
  --color-success-bg:       #052e16;
  --color-success-border:   #14532d;
  --color-success-text:     #86efac;   /* green-300 */

  /* ── Semantic: warning ──────────────────────────────────── */
  --color-warning:          #fbbf24;   /* amber-400 */
  --color-warning-bg:       #1c1208;
  --color-warning-border:   #451a03;
  --color-warning-text:     #fcd34d;   /* amber-300 */

  /* ── Semantic: danger ───────────────────────────────────── */
  --color-danger:           #f87171;   /* red-400 */
  --color-danger-bg:        #1c0707;
  --color-danger-border:    #450a0a;
  --color-danger-text:      #fca5a5;   /* red-300 */

  /* ── Semantic: info ─────────────────────────────────────── */
  --color-info:             #38bdf8;   /* sky-400 */
  --color-info-bg:          #03111c;
  --color-info-border:      #082f49;
  --color-info-text:        #7dd3fc;   /* sky-300 */

  /* ── Shadow (2x opacity for dark backgrounds) ───────────── */
  --shadow-sm:   0 1px 2px rgba(0,0,0,0.16);
  --shadow-md:   0 4px 12px rgba(0,0,0,0.24);
  --shadow-lg:   0 8px 24px rgba(0,0,0,0.32);
  --shadow-xl:   0 20px 40px rgba(0,0,0,0.40);
  --shadow-brand-glow: 0 0 0 3px rgba(167,139,250,0.30);

  /* Radius and spacing are theme-independent — not redefined in dark block */
}
```

**Token naming convention:**
- `--color-{category}-{variant}` — always `--color-` prefix to prevent collisions with browser or third-party vars
- Categories: `bg`, `text`, `brand`, `border`, `success`, `warning`, `danger`, `info`
- Semantic over scale: `--color-text-primary` not `--color-neutral-950` — components do not need to know the underlying scale value

---

### 2. `tailwind.config.js` Update

The config is updated to:
1. Set `darkMode: 'class'` — enables `dark:` variant tied to `<html class="dark">`
2. Add `fontFamily` extension — wires `font-sans` and `font-mono` to CSS vars
3. Replace hardcoded color values with `var(--color-*)` references in `theme.extend.colors`
4. Retain the full brand and neutral Tailwind scale for escape-hatch use (e.g. `brand-50` for subtle tints not covered by tokens)

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // toggled by <html class="dark"> — not media query
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },

      colors: {
        // ── Semantic token aliases ───────────────────────────
        // These are the primary classes components should use.
        // e.g. bg-bg-primary, text-text-primary, border-border
        bg: {
          primary:   'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          surface:   'var(--color-bg-surface)',
        },
        text: {
          primary:    'var(--color-text-primary)',
          secondary:  'var(--color-text-secondary)',
          muted:      'var(--color-text-muted)',
          'on-brand': 'var(--color-text-on-brand)',
        },
        brand: {
          // Keep full scale for escape hatches (gradients, illustrations)
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
          // Token aliases on top of scale
          DEFAULT: 'var(--color-brand)',
          hover:   'var(--color-brand-hover)',
          subtle:  'var(--color-brand-subtle)',
          border:  'var(--color-brand-border)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        neutral: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          bg:      'var(--color-success-bg)',
          border:  'var(--color-success-border)',
          text:    'var(--color-success-text)',
          // Keep raw values for non-tokenised uses
          50:  '#f0fdf4',
          100: '#dcfce7',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg:      'var(--color-warning-bg)',
          border:  'var(--color-warning-border)',
          text:    'var(--color-warning-text)',
          50:  '#fffbeb',
          100: '#fef3c7',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          bg:      'var(--color-danger-bg)',
          border:  'var(--color-danger-border)',
          text:    'var(--color-danger-text)',
          50:  '#fef2f2',
          100: '#fee2e2',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          bg:      'var(--color-info-bg)',
          border:  'var(--color-info-border)',
          text:    'var(--color-info-text)',
          50:  '#f0f9ff',
          100: '#e0f2fe',
          600: '#0284c7',
          700: '#0369a1',
        },
      },

      boxShadow: {
        sm:           'var(--shadow-sm)',
        md:           'var(--shadow-md)',
        lg:           'var(--shadow-lg)',
        xl:           'var(--shadow-xl)',
        'brand-glow': 'var(--shadow-brand-glow)',
      },

      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
    },
  },
  plugins: [],
}
```

**Key design choices:**

- `bg-bg-primary` reads odd but is unambiguous and grep-able. The namespace doubling (`bg-bg-*`) is a Tailwind constraint: the framework generates `bg-{colorName}` — the token category is named `bg`, so the resulting class is `bg-bg-*`. This is the same pattern used by Radix UI Themes.
- The raw numeric scale (`brand-600`, `neutral-200`, etc.) is retained alongside token aliases. Existing classes that use `brand-600` directly continue working without immediate migration. The numeric scale is also the correct tool for non-semantic uses (e.g. `brand-50` for a hero gradient overlay).
- `darkMode: 'class'` is mandatory. `darkMode: 'media'` cannot be overridden by user preference and ignores `localStorage`. Note: the `dark:` variant prefix in Tailwind classes is not needed for color tokens in this architecture — token values themselves switch via `:root.dark` — but `dark:` remains available for structural changes (e.g. `dark:hidden` to hide decorative light-mode-only elements).

---

### 3. Dark Mode Toggle Implementation

#### 3a. FOUC Prevention — Inline script in `index.html`

This script runs synchronously before the browser paints. It reads `localStorage` and applies the `dark` class to `<html>` before React loads, preventing any flash of the wrong theme.

```html
<!doctype html>
<html lang="lt">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Eventis — Bilietai lietuviškiems renginiams</title>

    <!-- Theme initialisation: runs before first paint to prevent FOUC.
         Priority order: localStorage > prefers-color-scheme > light default.
         IMPORTANT: This script must remain inline (no defer/async) and must
         appear before any stylesheet link. Do not extract to an external file. -->
    <script>
      (function () {
        var stored = localStorage.getItem('theme')
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (stored === 'dark' || (!stored && prefersDark)) {
          document.documentElement.classList.add('dark')
        }
      })()
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Why an IIFE:** Avoids polluting the global scope. `stored` and `prefersDark` are scoped to the function. The script is intentionally minimal — no TypeScript, no imports — because it runs before any bundled code is available.

**Why `classList.add` and not `setAttribute('class', 'dark')`:** The `<html lang="lt">` attribute is already present. `setAttribute` would overwrite it. `classList.add` is additive.

#### 3b. React Hook — `src/hooks/useTheme.ts`

```typescript
// src/hooks/useTheme.ts
import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface UseThemeReturn {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export function useTheme(): UseThemeReturn {
  // Derive initial state from the class already set by the inline script.
  // This avoids a state-vs-DOM mismatch on first render.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement
    if (next === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, applyTheme])

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
  }, [applyTheme])

  // Sync with OS-level changes (e.g. user toggles system dark mode while tab is open).
  // Only fires if the user has NOT set an explicit preference in localStorage.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [applyTheme])

  return { theme, toggleTheme, setTheme }
}
```

**Usage in `Layout.tsx`:**
```typescript
import { useTheme } from '../hooks/useTheme'

// Inside the component:
const { theme, toggleTheme } = useTheme()

// In JSX (navbar, between nav links and avatar):
<button
  onClick={toggleTheme}
  aria-label="Perjungti tema"
  title="Perjungti tema"
  className="p-2 text-text-secondary hover:text-brand transition-colors rounded-md"
>
  {theme === 'dark' ? (
    <SunIcon className="w-5 h-5" />
  ) : (
    <MoonIcon className="w-5 h-5" />
  )}
</button>
```

**Hook contract:**
- `theme` — current active theme, always in sync with `<html>` class and `localStorage`
- `toggleTheme` — flips between light and dark, persists to `localStorage`
- `setTheme` — explicit setter, used by the mobile menu toggle row or any future settings page
- The hook does not render anything, does not depend on Context, and can be called in any component

**File location:** `src/hooks/useTheme.ts`

---

### 4. Inter Font — Self-Hosted Loading

**Decision: self-hosted via `/public/fonts/`**

Rationale: Eventis is a Lithuanian site subject to GDPR. Loading fonts from Google's CDN (`fonts.googleapis.com`) sends user IP addresses to Google servers on page load — a data transfer to a US third party that requires explicit consent under GDPR/BDAR. Self-hosting eliminates this entirely at a one-time setup cost.

**Required files in `/public/fonts/`:**
```
public/
  fonts/
    InterVariable.woff2          — variable font, covers weight 100-900 (recommended)
    InterVariable-Italic.woff2   — variable italic (optional, include if italic is used)
```

**Source:** Download from https://github.com/rsms/inter/releases — `Inter-{version}.zip` — extract `InterVariable.woff2`.

**Why variable font over static cuts:** A single `InterVariable.woff2` (~500 KB) replaces 9+ static weight files. `font-display: swap` means the system font renders first, then swaps when Inter loads. Vite copies `/public/` as-is to `/dist/` — no build config required.

**`@font-face` declaration in `src/index.css`** (shown in Decision 1 above):
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/InterVariable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

**Global application via Tailwind `base` layer** — add to `src/index.css` after `@tailwind base`:
```css
@layer base {
  html {
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Tabular numbers on all price/numeric displays */
  [data-price], .tabular-nums {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
}
```

**Fallback stack:** `'Inter', system-ui, -apple-system, sans-serif` — defined in `--font-sans` CSS var, referenced by `fontFamily.sans` in Tailwind config. If the font file fails to load, `system-ui` renders correctly on all target platforms (macOS: SF Pro, Windows: Segoe UI, iOS: SF Pro, Android: Roboto).

**Lithuanian character support:** Inter covers the full Latin Extended-A block, which includes all Lithuanian diacritics: a with ogonek, c with caron, e with ogonek, e with dot above, i with ogonek, s with caron, u with ogonek, u with macron, z with caron. No subsetting issues.

---

### 5. Token JS Export — `src/lib/tokens.ts`

This file provides typed constants that mirror the CSS vars. Used for:
- Stripe Appearance API (requires JS objects, cannot read CSS vars)
- `recharts` / D3 chart colors (inline props)
- Any Radix UI / Headless UI component that requires color as a JS prop

```typescript
// src/lib/tokens.ts
// Mirror of CSS custom properties in src/index.css.
// These are static values. For dark mode in Stripe, call
// getStripeAppearance(theme) which returns the appropriate token set.
//
// SYNC REQUIRED: When adding or changing a token in src/index.css,
// update the corresponding value in this file.
// Tokens are intentionally static (not read from getComputedStyle)
// to support Stripe Elements setup and potential SSR contexts.

export const tokens = {
  color: {
    bgPrimary:      '#ffffff',
    bgSecondary:    '#f8f7ff',
    bgSurface:      '#f5f5f4',
    textPrimary:    '#0c0a09',
    textSecondary:  '#57534e',
    textMuted:      '#a8a29e',
    textOnBrand:    '#ffffff',
    brand:          '#7c3aed',
    brandHover:     '#6d28d9',
    brandSubtle:    '#f5f3ff',
    brandBorder:    '#ddd6fe',
    border:         '#e7e5e4',
    borderStrong:   '#d6d3d1',
    success:        '#16a34a',
    successBg:      '#f0fdf4',
    successText:    '#15803d',
    warning:        '#d97706',
    warningBg:      '#fffbeb',
    warningText:    '#b45309',
    danger:         '#dc2626',
    dangerBg:       '#fef2f2',
    dangerText:     '#b91c1c',
    info:           '#0284c7',
    infoBg:         '#f0f9ff',
    infoText:       '#0369a1',
  },
  colorDark: {
    bgPrimary:      '#0f0e11',
    bgSecondary:    '#17151c',
    bgSurface:      '#1e1b26',
    textPrimary:    '#fafaf9',
    textSecondary:  '#a8a29e',
    textMuted:      '#57534e',
    textOnBrand:    '#ffffff',
    brand:          '#a78bfa',
    brandHover:     '#8b5cf6',
    brandSubtle:    '#1e1b26',
    brandBorder:    '#3d3650',
    border:         '#2a2533',
    borderStrong:   '#3d3650',
    danger:         '#f87171',
    dangerBg:       '#1c0707',
    dangerText:     '#fca5a5',
  },
  font: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  },
  radius: {
    sm:   '4px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    '2xl':'24px',
    full: '9999px',
  },
} as const

export type Tokens = typeof tokens

// ── Stripe Appearance API helper ──────────────────────────────
// Usage: <Elements stripe={stripe} options={{ appearance: getStripeAppearance(theme) }}>
export function getStripeAppearance(theme: 'light' | 'dark') {
  const c = theme === 'dark' ? tokens.colorDark : tokens.color
  return {
    theme: theme === 'dark' ? 'night' : 'stripe',
    variables: {
      colorPrimary:    c.brand,
      colorBackground: c.bgPrimary,
      colorText:       c.textPrimary,
      colorDanger:     c.danger,
      fontFamily:      tokens.font.sans,
      borderRadius:    tokens.radius.md,
      focusBoxShadow:  theme === 'dark'
        ? '0 0 0 3px rgba(167,139,250,0.30)'
        : '0 0 0 3px rgba(124,58,237,0.25)',
    },
  } as const
}
```

**Important:** This file contains static values only. It does not call `getComputedStyle()` or read the DOM. Reason: it must be importable in Stripe's `<Elements>` setup before React renders, and must remain compatible with server-side rendering if Eventis ever adopts SSR. The trade-off is that `tokens.ts` must be kept manually in sync with `index.css` — enforced by the `SYNC REQUIRED` comment at the top of the file.

---

### 6. Migration Strategy

The migration is additive: CSS vars and Tailwind aliases are added first. Existing classes continue to work because the old numeric scale (`brand-600`, `neutral-200`) is not removed. Components are updated one layer at a time.

#### Order of operations

```
Step 1 — Foundation (no visible change, no risk)
  1a. Add @font-face + CSS vars (:root + :root.dark) to src/index.css
  1b. Update tailwind.config.js: add darkMode:'class', fontFamily, token aliases
  1c. Add inline FOUC script to index.html <head>
  1d. Create src/hooks/useTheme.ts
  1e. Create src/lib/tokens.ts
  Verify: app renders identically in light mode. Dark class can be toggled
          manually in DevTools to test token switching.

Step 2 — UI primitives (isolated, low risk)
  2a. Button.tsx    — replace brand-*/neutral-*/danger-* with token aliases
  2b. Input.tsx     — same
  2c. Badge.tsx     — replace variant classes with token aliases
  2d. Card.tsx      — replace bg-white/border-neutral-100 with bg-bg-primary/border-border
  2e. Skeleton.tsx  — replace bg-neutral-200 with bg-border
  2f. EmptyState.tsx — audit and replace any hardcoded colors
  Verify: both modes render correctly per component in isolation.

Step 3 — Layout.tsx
  3a. Replace bg-white/bg-neutral-50/border-neutral-200 with token classes
  3b. Add useTheme hook import
  3c. Add toggle button to navbar (desktop: between nav links and avatar)
  3d. Add toggle row to mobile menu (before sign-out)
  Verify: toggle works, persists across reload, no FOUC.

Step 4 — Auth pages (targeted fix, high visibility)
  4a. Login.tsx    — replace all gray-*/indigo-* classes with token classes
  4b. Register.tsx — same
  Verify: both pages match design brief wireframes in both modes.

Step 5 — Remaining pages (sweep)
  5a. Search: grep -r "indigo-\|gray-[0-9]" src/pages/
  5b. For each match: replace with token equivalent or brand-* scale
  5c. Tabular nums: add font-mono + tabular-nums to all price displays
      in EventDetail.tsx, MyEarnings.tsx, MyOrders.tsx
  Verify: WCAG contrast check on all pages, both modes.
```

#### Class replacement reference

| Old class | New class | Notes |
|-----------|-----------|-------|
| `bg-white` | `bg-bg-primary` | Primary page/card backgrounds |
| `bg-neutral-50` | `bg-bg-secondary` or `bg-bg-surface` | Depends on context |
| `bg-neutral-100` | `bg-bg-surface` | Panel / inset backgrounds |
| `text-gray-900` | `text-text-primary` | Login.tsx specific |
| `text-gray-700` | `text-text-secondary` | Login.tsx specific |
| `text-gray-400` | `text-text-muted` | |
| `text-neutral-700` | `text-text-secondary` | |
| `text-neutral-500` | `text-text-muted` | |
| `border-gray-300` | `border-border` | Login.tsx inputs |
| `border-neutral-200` | `border-border` | |
| `border-neutral-100` | `border-border` | |
| `bg-indigo-50` | `bg-brand-subtle` | Login.tsx context banner |
| `border-indigo-200` | `border-brand-border` | |
| `text-indigo-700` | `text-brand` | |
| `bg-indigo-600` | `bg-brand` | Login.tsx submit button |
| `hover:bg-indigo-700` | `hover:bg-brand-hover` | |
| `focus:ring-indigo-500` | `focus:ring-brand` | |
| `text-indigo-600` | `text-brand` | |
| `hover:bg-gray-50` | `hover:bg-bg-surface` | |
| `bg-danger-600` | `bg-danger` | Semantic token (DEFAULT) |
| `text-danger-600` | `text-danger-text` | Semantic token |
| `bg-danger-100` | `bg-danger-bg` | Semantic token |

---

## Consequences

### Pros

- **Single source of truth:** All color, shadow, radius, and spacing values live in one place (`index.css`). Tailwind config and `tokens.ts` are consumers, not sources.
- **Dark mode at zero component cost:** Switching `:root` values via a class toggle affects every component automatically. No `dark:` class duplication in JSX required for color changes.
- **Runtime theming:** CSS vars can be overridden by any selector at runtime. Future white-label or per-event theming is possible without a rebuild.
- **GDPR compliance:** Self-hosted Inter eliminates Google Fonts network requests on Lithuanian users.
- **Stripe integration:** `tokens.ts` provides the typed values Stripe's Appearance API requires; `getStripeAppearance(theme)` keeps the checkout UI consistent with the app theme in both modes.
- **Tabular numbers:** Centralised in `--font-mono` token and the `[data-price]` base style — no per-component class required.
- **No new dependencies:** Pure CSS + Tailwind config change. Zero additional npm packages.
- **FOUC eliminated:** Inline `<script>` in `<head>` reads `localStorage` before paint. No theme flicker on page load.
- **OS preference respected:** `prefers-color-scheme` is the default when no `localStorage` entry exists, then overridden by explicit user choice.

### Cons

- **`tokens.ts` manual sync:** Static values in `tokens.ts` must be kept in sync with `index.css` by hand. A mismatch means Stripe checkout uses wrong colors while the rest of the app is correct — a silent inconsistency. Mitigated by the `SYNC REQUIRED` comment. A future CI script can automate this check.
- **`bg-bg-primary` naming is visually noisy:** The doubled namespace is a Tailwind constraint. Teams unfamiliar with the pattern find it confusing initially. Mitigated by the class replacement reference table and consistent usage across all components.
- **Variable font file size:** `InterVariable.woff2` is approximately 500 KB. On slow connections this delays the custom font render. `font-display: swap` mitigates this with a system font fallback, but a brief FOUT (Flash of Unstyled Text) is possible on first load. Subsequent loads are served from the browser cache.
- **CSS vars not supported inside `@media` queries:** Token values cannot be used as breakpoint conditions in media queries (e.g. `min-width: var(--breakpoint-sm)` is invalid). Tailwind's static breakpoints handle this case; it is not a practical limitation for this codebase.
- **Migration surface area:** Approximately 40-60 class replacements across 6 components and 16 pages. Low risk per change but requires a full QA pass in both modes to verify nothing was missed.

---

## Alternatives Considered

### Alternative A: `dark:` variant class duplication (rejected)

Add `dark:` prefix classes to every component: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-gray-100`, etc.

**Rejected because:**
- Every component needs `dark:` versions of every color class — doubles the number of color-related classes in JSX
- `tailwind.config.js` safelist grows to prevent purging of dynamically generated `dark:` classes
- Adding a new token (e.g. `--color-bg-tertiary`) requires changes in every file that uses a background color, not just `index.css`
- Does not address the `tokens.ts` requirement — Stripe API still has no access to design values

### Alternative B: CSS-in-JS (e.g. styled-components or Emotion) (rejected)

Define tokens as JS objects and use a CSS-in-JS library for theming.

**Rejected because:**
- Adds a runtime CSS injection library — performance cost on mobile Safari (Kotryna's primary device, 80% of sessions)
- Incompatible with Tailwind utilities — requires choosing one or the other, or creating a hybrid with significant class duplication
- Vite + Tailwind build pipeline is already established; adding a CSS-in-JS layer mid-project creates a dual-system problem
- Server component compatibility concerns if SSR is ever adopted

### Alternative C: Tailwind CSS v4 `@theme` directive (deferred, not rejected)

Tailwind v4 introduces a native `@theme` directive that defines tokens directly in CSS and auto-generates utility classes:
```css
@theme {
  --color-brand: #7c3aed;
}
/* generates: bg-brand, text-brand, border-brand automatically */
```

**Deferred because:**
- Tailwind v4 migration from v3 config format is breaking — requires updating all `tailwind.config.js` syntax and potentially all plugin dependencies
- This sprint's scope is token architecture, not framework upgrade
- The CSS var approach chosen in this ADR is forward-compatible with v4: the `:root` token definitions will migrate cleanly; only the config consumption syntax changes
- Recommend revisiting v4 migration in a dedicated sprint after this design system is stable

### Alternative D: shadcn/ui token system (deferred, not rejected)

shadcn/ui uses a specific CSS var naming convention (`--background`, `--foreground`, `--primary`, etc.) compatible with Radix UI Themes.

**Deferred because:**
- shadcn/ui adoption is listed as an open question in the design brief (question 5) — not yet decided
- The naming convention in this ADR (`--color-bg-primary`, `--color-text-primary`) is more verbose but more explicit than shadcn's convention, which maps `--background` to multiple semantic contexts
- If shadcn/ui is adopted in a future sprint, a token rename is required — but it is a mechanical find-and-replace, not a structural change
- Recommend deciding on shadcn/ui adoption before the next major component sprint

---

## Related Documents

- `docs/design-system-brief.md` — business requirements, color palette, typography scale
- `docs/ux-design-system.md` — UX decisions (toggle placement, default mode, journey flows)
- `src/index.css` — implementation target (Step 1a)
- `tailwind.config.js` — implementation target (Step 1b)
- `index.html` — implementation target (Step 1c)
- `src/hooks/useTheme.ts` — implementation target (Step 1d, new file)
- `src/lib/tokens.ts` — implementation target (Step 1e, new file)
- `src/components/ui/` — migration target (Step 2)
- `src/components/Layout.tsx` — migration target (Step 3)
- `src/pages/Login.tsx`, `src/pages/Register.tsx` — migration target (Step 4)
