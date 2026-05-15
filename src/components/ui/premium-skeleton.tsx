'use client'

import { cn } from '@/lib/utils'

interface PremiumSkeletonProps {
  className?: string
  variant?: 'default' | 'shimmer' | 'pulse'
  style?: React.CSSProperties
}

export function PremiumSkeleton({ className, variant = 'shimmer', style }: PremiumSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-muted',
        variant === 'shimmer' && 'shimmer',
        variant === 'pulse' && 'animate-pulse-soft',
        className,
      )}
      style={style}
    />
  )
}

export function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <PremiumSkeleton className="w-10 h-10 rounded-xl" />
            <PremiumSkeleton className="w-16 h-6 rounded-full" />
          </div>
          <div className="space-y-2">
            <PremiumSkeleton className="w-20 h-3" />
            <PremiumSkeleton className="w-32 h-7" />
            <PremiumSkeleton className="w-24 h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartSkeletonPremium({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <PremiumSkeleton className="w-28 h-4" />
          <PremiumSkeleton className="w-20 h-3" />
        </div>
        <PremiumSkeleton className="w-24 h-8 rounded-lg" />
      </div>
      <PremiumSkeleton className="w-full rounded-xl" style={{ height }} />
    </div>
  )
}

export function TableSkeletonPremium({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <PremiumSkeleton className="w-32 h-5" />
        <PremiumSkeleton className="w-24 h-9 rounded-lg" />
      </div>
      <div className="space-y-3">
        <div className="flex gap-4 pb-3 border-b border-border/50">
          {Array.from({ length: columns }).map((_, i) => (
            <PremiumSkeleton key={i} className="flex-1 h-3" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2">
            {Array.from({ length: columns }).map((_, j) => (
              <PremiumSkeleton key={j} className="flex-1 h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <PremiumSkeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <PremiumSkeleton className="w-3/5 h-4" />
            <PremiumSkeleton className="w-2/5 h-3" />
          </div>
          <PremiumSkeleton className="w-16 h-4" />
        </div>
      ))}
    </div>
  )
}
