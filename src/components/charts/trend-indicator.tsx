'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkline } from './sparkline'

interface TrendIndicatorProps {
  value: number
  label?: string
  sparklineData?: number[]
  direction?: 'up' | 'down' | 'neutral'
  variant?: 'default' | 'card' | 'badge'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TrendIndicator({
  value,
  label,
  sparklineData,
  direction,
  variant = 'default',
  size = 'md',
  className,
}: TrendIndicatorProps) {
  const isPositive = value >= 0
  const trendDirection = direction || (value > 0 ? 'up' : value < 0 ? 'down' : 'neutral')

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  const variantStyles = {
    default: cn(
      'inline-flex items-center rounded-full font-medium',
      trendDirection === 'up' && 'bg-success/10 text-success',
      trendDirection === 'down' && 'bg-destructive/10 text-destructive',
      trendDirection === 'neutral' && 'bg-muted text-muted-foreground',
    ),
    card: cn(
      'flex items-center justify-between rounded-xl p-3 border',
      trendDirection === 'up' && 'bg-success/5 border-success/20',
      trendDirection === 'down' && 'bg-destructive/5 border-destructive/20',
      trendDirection === 'neutral' && 'bg-muted/30 border-border/50',
    ),
    badge: cn(
      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border',
      trendDirection === 'up' && 'bg-success/10 text-success border-success/20',
      trendDirection === 'down' && 'bg-destructive/10 text-destructive border-destructive/20',
      trendDirection === 'neutral' && 'bg-muted text-muted-foreground border-border/50',
    ),
  }

  const content = (
    <>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="inline-flex"
      >
        {trendDirection === 'up' ? (
          <svg
            className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        ) : trendDirection === 'down' ? (
          <svg
            className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : (
          <svg
            className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
          </svg>
        )}
      </motion.span>

      <span className="font-semibold tabular-nums">
        {isPositive ? '+' : ''}
        {Math.abs(value).toFixed(1)}%
      </span>
      {label && <span className="opacity-70">{label}</span>}
    </>
  )

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(variantStyles[variant], className)}
      >
        <div className="flex items-center gap-2">{content}</div>
        {sparklineData && sparklineData.length > 0 && (
          <Sparkline
            data={sparklineData}
            color={
              trendDirection === 'up'
                ? 'hsl(var(--success))'
                : trendDirection === 'down'
                  ? 'hsl(var(--destructive))'
                  : 'hsl(var(--muted-foreground))'
            }
            height={32}
            width={80}
          />
        )}
      </motion.div>
    )
  }

  return (
    <span className={cn(variantStyles[variant], sizeStyles[size], size === 'sm' ? '' : 'gap-1.5', className)}>
      {content}
    </span>
  )
}
