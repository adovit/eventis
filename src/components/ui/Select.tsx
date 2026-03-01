import { useEffect, useRef, useState } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

// Chevron icon — rendered inline, no library dependency
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={['transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// Check icon — shown next to the currently selected option in the dropdown
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Pasirinkti...',
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside the component
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape key — listener registered only while dropdown is open
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder

  function handleSelect(optionValue: string) {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={['relative', className].join(' ')}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          'flex items-center justify-between gap-2 w-full',
          'border rounded-lg px-4 py-2 text-sm',
          'bg-bg-primary border-border',
          'hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
          'transition-colors',
          // text colour is the only source — no static text-text-primary to compete with
          value === '' ? 'text-text-muted' : 'text-text-primary',
        ].join(' ')}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="shrink-0 text-text-muted">
          <ChevronIcon open={open} />
        </span>
      </button>

      {/* Dropdown list */}
      {open && (
        <ul
          role="listbox"
          aria-label={placeholder}
          className={[
            'absolute z-50 mt-1 min-w-full max-w-[90vw]',
            'bg-bg-primary border border-border rounded-xl shadow-md',
            'py-1 max-h-60 overflow-y-auto',
          ].join(' ')}
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(option.value)
                  }
                }}
                className={[
                  'flex items-center justify-between gap-2 px-4 py-2 text-sm cursor-pointer',
                  'focus:outline-none focus:bg-bg-surface',
                  isSelected
                    ? 'text-brand bg-brand-subtle font-medium'
                    : 'text-text-secondary hover:bg-bg-surface',
                ].join(' ')}
              >
                <span>{option.label}</span>
                {isSelected && <CheckIcon />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
