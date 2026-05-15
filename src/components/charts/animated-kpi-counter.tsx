'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface AnimatedKPICounterProps {
  value: number
  title: string
  subtitle?: string
  prefix?: string
  suffix?: string
  format?: 'currency' | 'number' | 'percent' | 'decimal'
  currency?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label?: string
    direction?: 'up' | 'down'
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'glass'
  className?: string
  delay?: number
}

export function AnimatedKPICounter({
  value,
  title,
  subtitle,
  prefix,
  suffix,
  format = 'number',
  currency,
  icon,
  trend,
  variant = 'default',
  className,
  delay = 0,
}: AnimatedKPICounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!inView) {
      return
    }
    const controls = animate(0, value, {
      duration: 1.2,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest * 100) / 100),
    })
    return controls.stop
  }, [inView, value, delay])

  const formatDisplay = (v: number) => {
    if (format === 'currency') {
      return formatCurrency(v, currency)
    }
    if (format === 'percent') {
      return `${v.toFixed(1)}%`
    }
    if (format === 'decimal') {
      return v.toFixed(2)
    }
    return formatNumber(v)
  }

  const variantStyles = {
    default: 'bg-card border border-border/50',
    primary: 'bg-gradient-to-br from-primary/90 to-primary/60 text-white border-0',
    success: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0',
    warning: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0',
    danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white border-0',
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl dark:bg-black/20',
  }

  const isColored = variant !== 'default' && variant !== 'glass'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 transition-shadow duration-300',
        variantStyles[variant],
        'hover:shadow-elevation-3',
        className,
      )}
    >
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              'p-2.5 rounded-xl',
              isColored ? 'bg-white/20' : 'bg-primary/10',
              variant === 'glass' && 'bg-white/10',
            )}
          >
            <div
              className={cn('w-5 h-5', isColored ? 'text-white' : 'text-primary', variant === 'glass' && 'text-white')}
            >
              {icon}
            </div>
          </div>
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: delay + 0.3 }}
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
                isColored
                  ? 'bg-white/20 text-white'
                  : trend.direction === 'up'
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive',
                variant === 'glass' && 'bg-white/10 text-white',
              )}
            >
              {trend.direction === 'up' ? (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
              {Math.abs(trend.value).toFixed(1)}%
            </motion.div>
          )}
        </div>

        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.1 }}
            className={cn(
              'text-sm mb-1.5',
              isColored ? 'text-white/80' : 'text-muted-foreground',
              variant === 'glass' && 'text-white/80',
            )}
          >
            {title}
          </motion.p>

          <div className="flex items-baseline gap-1.5">
            {prefix && (
              <span className={cn('text-sm', isColored ? 'text-white/70' : 'text-muted-foreground')}>{prefix}</span>
            )}
            <span
              className={cn(
                'text-2xl sm:text-3xl font-bold tabular-nums tracking-tight',
                isColored ? 'text-white' : 'text-foreground',
                variant === 'glass' && 'text-white',
              )}
            >
              {inView ? formatDisplay(displayValue) : formatDisplay(0)}
            </span>
            {suffix && (
              <span className={cn('text-sm', isColored ? 'text-white/70' : 'text-muted-foreground')}>{suffix}</span>
            )}
          </div>

          {subtitle && (
            <p
              className={cn(
                'text-xs mt-1',
                isColored ? 'text-white/60' : 'text-muted-foreground',
                variant === 'glass' && 'text-white/60',
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
