'use client'

import { motion } from 'framer-motion'

interface PremiumTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  config: {
    labelFormatter?: (label: string) => string
    valueFormatter?: (value: number) => string
    series: Array<{
      dataKey: string
      name: string
      color: string
    }>
  }
}

export function PremiumTooltip({ active, payload, label, config }: PremiumTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  const { labelFormatter, valueFormatter, series } = config

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-3.5 min-w-[160px]"
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {labelFormatter ? labelFormatter(label || '') : label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => {
          const s = series.find((se) => se.dataKey === entry.dataKey)
          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s?.color || entry.color }} />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {valueFormatter ? valueFormatter(entry.value) : entry.value.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 pointer-events-none" />
    </motion.div>
  )
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>
      <div className="bg-muted/50 rounded-xl shimmer" style={{ height }} />
    </div>
  )
}
