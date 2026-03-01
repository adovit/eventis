import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  /** Node rendered inside the input's left side (e.g. a search icon SVG) */
  leadingIcon?: ReactNode
  /** When provided, a clear (×) button appears on the right whenever value is non-empty */
  onClear?: () => void
}

export default function Input({
  label,
  error,
  helperText,
  required,
  className = '',
  id,
  leadingIcon,
  onClear,
  ...props
}: InputProps) {
  // Generate a stable id from label if not provided
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const hasValue = props.value !== undefined ? String(props.value).length > 0 : false

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
          {required && <span className="text-danger-text ml-1">*</span>}
        </label>
      )}
      {/* Wrapper provides positioning context for leading icon and clear button */}
      <div className="relative">
        {leadingIcon && (
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
            {leadingIcon}
          </span>
        )}
        <input
          {...props}
          id={inputId}
          required={required}
          className={[
            'w-full border rounded-lg py-2 text-sm bg-bg-primary text-text-primary',
            'focus:outline-none focus:ring-2 focus:border-transparent transition-colors',
            error
              ? 'border-danger focus:ring-danger'
              : 'border-border focus:ring-brand',
            // Single ternary chain — each case sets exactly the needed padding, no duplicates
            leadingIcon && onClear ? 'pl-9 pr-8' :
            leadingIcon             ? 'pl-9 pr-4' :
            onClear                 ? 'pl-4 pr-8' :
                                      'px-4',
            className,
          ].join(' ')}
        />
        {/* Clear button — only shown when onClear is provided and input has a value */}
        {onClear && hasValue && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Išvalyti"
            className="absolute inset-y-0 right-2 flex items-center px-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger-text mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-text-muted mt-1">{helperText}</p>}
    </div>
  )
}
