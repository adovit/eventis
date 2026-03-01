import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-bg-primary rounded-2xl border border-border shadow-sm',
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-shadow transition-transform duration-150' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
