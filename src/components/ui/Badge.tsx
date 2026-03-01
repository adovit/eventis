import type { ReactNode } from 'react'

type Variant = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'brand'
type Size = 'sm' | 'md'

interface BadgeProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

// Token-based variant classes — resolve in both light and dark mode
const variantClasses: Record<Variant, string> = {
  success: 'bg-success-bg text-success-text',
  warning: 'bg-warning-bg text-warning-text',
  danger:  'bg-danger-bg text-danger-text',
  neutral: 'bg-bg-surface text-text-secondary',
  info:    'bg-info-bg text-info-text',
  brand:   'bg-brand-subtle text-brand',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

export default function Badge({
  variant = 'neutral',
  size = 'sm',
  className = '',
  children,
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-block rounded-full font-medium uppercase tracking-wide',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
