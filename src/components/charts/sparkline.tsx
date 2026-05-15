'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  className?: string
  showAnimation?: boolean
}

export function Sparkline({
  data,
  color = 'hsl(var(--primary))',
  height = 40,
  width = 120,
  className,
  showAnimation = true,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }))
  const gradientId = `sparkline-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <motion.div
      initial={showAnimation ? { opacity: 0 } : {}}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn('', className)}
    >
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            animationDuration={showAnimation ? 800 : 0}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
