/**
 * Design Tokens — JavaScript mirror of src/index.css CSS custom properties.
 *
 * PURPOSE: Provides typed constants for contexts where CSS vars are not
 * accessible — primarily the Stripe Appearance API and any inline style props.
 *
 * IMPORTANT: These are STATIC values. When changing a token in index.css,
 * update the corresponding value here too. This file intentionally does NOT
 * use getComputedStyle() — it must be safe to import before the DOM is
 * available and in potential future SSR contexts.
 */

export const tokens = {
  // ── Light mode colors ──────────────────────────────────────────
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

  // ── Dark mode colors ───────────────────────────────────────────
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

  // ── Typography ─────────────────────────────────────────────────
  font: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  },

  // ── Border radius ──────────────────────────────────────────────
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

/**
 * getStripeAppearance — returns a Stripe Appearance API object
 * that matches the current Eventis theme.
 *
 * Usage:
 *   const { theme } = useTheme()
 *   <Elements stripe={stripe} options={{ appearance: getStripeAppearance(theme) }}>
 */
export function getStripeAppearance(theme: 'light' | 'dark') {
  const c = theme === 'dark' ? tokens.colorDark : tokens.color
  const glow = theme === 'dark'
    ? 'rgba(167, 139, 250, 0.30)'  // brand-400 glow on dark
    : 'rgba(124, 58, 237, 0.25)'   // brand-600 glow on light

  return {
    theme: theme === 'dark' ? 'night' : 'stripe',
    variables: {
      colorPrimary:    c.brand,
      colorBackground: c.bgPrimary,
      colorText:       c.textPrimary,
      colorDanger:     c.danger,
      fontFamily:      tokens.font.sans,
      borderRadius:    tokens.radius.md,
      focusBoxShadow:  `0 0 0 3px ${glow}`,
    },
  } as const
}
