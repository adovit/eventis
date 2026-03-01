interface SkeletonProps {
  className?: string
  rounded?: string
}

export default function Skeleton({ className = '', rounded = 'rounded-md' }: SkeletonProps) {
  return <div className={`animate-pulse bg-border ${rounded} ${className}`} />
}
