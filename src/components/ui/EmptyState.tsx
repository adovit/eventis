import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ActionProps {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ActionProps
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 flex flex-col items-center gap-3">
      {icon && <div className="text-4xl mb-2">{icon}</div>}
      <p className="text-base font-semibold text-text-secondary">{title}</p>
      {description && <p className="text-sm text-text-muted max-w-xs">{description}</p>}
      {action && (
        action.href ? (
          <Link
            to={action.href}
            className="mt-1 inline-flex items-center text-sm font-medium text-brand hover:bg-brand-subtle border border-brand-border px-4 py-2 rounded-lg transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-1 inline-flex items-center text-sm font-medium text-brand hover:bg-brand-subtle border border-brand-border px-4 py-2 rounded-lg transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
