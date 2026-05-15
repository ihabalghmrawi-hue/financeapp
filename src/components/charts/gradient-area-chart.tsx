'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { chartColors } from '@/lib/design-tokens'

interface Series {
  dataKey: string
  name: string
  color: string
  gradientId: string
  strokeWidth?: number
  fillOpacity?: number
}

interface GradientAreaChartProps {
  data: any[]
  series: Series[]
  currency?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  timeRange?: string
  formatValue?: (value: number) => string
  className?: string
}

function CustomTooltipContent({ active, payload, label, series, currency }: any) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-popover border border-border/50 rounded-xl shadow-2xl p-4 min-w-[180px] backdrop-blur-xl"
    >
      <p className="text-sm font-medium text-foreground mb-2.5">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => {
          const s = series.find((se: Series) => se.dataKey === entry.dataKey)
          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s?.color || entry.color }} />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
              <span className="text-xs font-semibold text-foreground tabular-nums">{entry.value.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export function GradientAreaChart({
  data,
  series,
  currency,
  height = 260,
  showGrid = true,
  showLegend = true,
  timeRange,
  formatValue,
  className,
}: GradientAreaChartProps) {
  const [focusedKey, setFocusedKey] = useState<string | null>(null)

  return (
    <div className={cn('relative', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="50%" stopColor={s.color} stopOpacity={0.12} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>

          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} strokeOpacity={0.4} />
          )}

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />

          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={formatValue || ((v: number) => `${(v / 1000).toFixed(0)}k`)}
          />

          <Tooltip
            content={<CustomTooltipContent series={series} currency={currency} />}
            cursor={{
              stroke: 'hsl(var(--muted-foreground))',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.4,
            }}
          />

          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
              onMouseEnter={(o) => setFocusedKey(o.dataKey as string)}
              onMouseLeave={() => setFocusedKey(null)}
            />
          )}

          {series.map((s) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.strokeWidth || 2.5}
              fill={`url(#${s.gradientId})`}
              fillOpacity={s.fillOpacity || 1}
              animationDuration={800}
              animationEasing="ease-out"
              opacity={focusedKey && focusedKey !== s.dataKey ? 0.2 : 1}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
