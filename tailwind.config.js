/**
 * Eventis Design Tokens — v2 (Design System Sprint)
 *
 * Architecture: CSS custom properties are the single source of truth (src/index.css).
 * This config consumes them via var() references — never defines hex values directly.
 *
 * Naming: bg-bg-primary, text-text-primary, border-border — semantic over scale.
 * Numeric scales (brand-600, neutral-200) are retained as escape hatches for
 * non-semantic uses (gradients, illustrations). Do not use them in components.
 *
 * darkMode: 'class' — toggled by <html class="dark">, never by media query,
 * so users can override their OS preference via the navbar toggle.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },

      colors: {
        // ── Semantic token aliases ───────────────────────────────
        // These are the classes components should use.
        // Values resolve automatically in light AND dark mode via CSS vars.
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
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },

        // ── Brand — token aliases on top of numeric scale ────────
        brand: {
          // Numeric scale retained as escape hatch (gradients, tints)
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
          // Token aliases — use these in components
          DEFAULT: 'var(--color-brand)',
          hover:   'var(--color-brand-hover)',
          subtle:  'var(--color-brand-subtle)',
          border:  'var(--color-brand-border)',
        },

        // ── Neutral grays — stone scale (warm undertone) ─────────
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

        // ── Semantic: success ────────────────────────────────────
        success: {
          DEFAULT: 'var(--color-success)',
          bg:      'var(--color-success-bg)',
          border:  'var(--color-success-border)',
          text:    'var(--color-success-text)',
          // Numeric scale retained
          50:  '#f0fdf4',
          100: '#dcfce7',
          600: '#16a34a',
          700: '#15803d',
        },

        // ── Semantic: warning ────────────────────────────────────
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

        // ── Semantic: danger ─────────────────────────────────────
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

        // ── Semantic: info ───────────────────────────────────────
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

      // ── Shadows via CSS vars (depth signal, not decoration) ────
      boxShadow: {
        sm:           'var(--shadow-sm)',
        md:           'var(--shadow-md)',
        lg:           'var(--shadow-lg)',
        xl:           'var(--shadow-xl)',
        'brand-glow': 'var(--shadow-brand-glow)',
      },

      // ── Border radius via CSS vars ─────────────────────────────
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
