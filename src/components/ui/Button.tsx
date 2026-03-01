import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

// Token-based variant classes — resolve correctly in light and dark mode
// via CSS custom properties defined in src/index.css
const variantClasses: Record<Variant, string> = {
  primary:   'bg-brand text-text-on-brand hover:bg-brand-hover focus:ring-brand',
  secondary: 'bg-bg-surface text-text-primary hover:bg-bg-secondary focus:ring-brand border border-border',
  ghost:     'text-brand hover:bg-brand-subtle border border-brand-border focus:ring-brand',
  danger:    'bg-danger text-text-on-brand hover:bg-danger-700 focus:ring-danger',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
}

// Inline spinner shown during loading state
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'active:scale-[0.97]',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? 'opacity-40 cursor-not-allowed' : '',
        className,
      ].join(' ')}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}
