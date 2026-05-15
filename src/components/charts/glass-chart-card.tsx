'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'premium'
  height?: number
}

export function GlassChartCard({
  title,
  subtitle,
  children,
  action,
  className,
  variant = 'default',
  height = 300,
}: GlassChartCardProps) {
  const variantStyles = {
    default: 'bg-card border border-border/50',
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl dark:bg-black/20',
    premium: 'bg-gradient-to-br from-card via-card to-card/95 border border-border/40 shadow-lg shadow-black/5',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-elevation-3',
        variantStyles[variant],
        className,
      )}
    >
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
      {variant === 'premium' && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      <div className="relative z-10">
        {(title || action) && (
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div>
              <h3 className="font-semibold text-foreground text-base">{title}</h3>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {action && <div className="flex items-center gap-2">{action}</div>}
          </div>
        )}

        <div className="px-2 py-3" style={{ height: title ? height : height + 40 }}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}
