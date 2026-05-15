'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BarChartPremiumProps {
  data: any[]
  bars: Array<{
    dataKey: string
    name: string
    color?: string
    radius?: [number, number, number, number]
  }>
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showAnimation?: boolean
  stacked?: boolean
  layout?: 'vertical' | 'horizontal'
  className?: string
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-3.5 min-w-[140px]"
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 pointer-events-none" />
    </motion.div>
  )
}

export function BarChartPremium({
  data,
  bars,
  height = 260,
  showGrid = true,
  showLegend = true,
  showAnimation = true,
  stacked = false,
  layout = 'vertical',
  className,
}: BarChartPremiumProps) {
  if (layout === 'horizontal') {
    return (
      <div className={cn('', className)}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            barCategoryGap={bars.length > 1 ? 8 : 4}
          >
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
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            {showLegend && (
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
            )}
            {bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.color || 'hsl(var(--primary))'}
                radius={bar.radius || ([4, 4, 0, 0] as any)}
                stackId={stacked ? 'stack' : undefined}
                animationDuration={showAnimation ? 800 : 0}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className={cn('', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={4}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} strokeOpacity={0.4} />
          )}
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="label"
            type="category"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<BarTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
          {showLegend && (
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
          )}
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color || 'hsl(var(--primary))'}
              radius={bar.radius || ([0, 4, 4, 0] as any)}
              stackId={stacked ? 'stack' : undefined}
              animationDuration={showAnimation ? 800 : 0}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
