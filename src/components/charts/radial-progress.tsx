'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RadialProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  label?: string
  subtitle?: string
  color?: string
  trackColor?: string
  className?: string
  showPercentage?: boolean
  children?: React.ReactNode
}

export function RadialProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  label,
  subtitle,
  color = 'hsl(var(--primary))',
  trackColor = 'hsl(var(--muted))',
  className,
  showPercentage = true,
  children,
}: RadialProgressProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [animatedValue, setAnimatedValue] = useState(0)
  const [displayText, setDisplayText] = useState('0')

  const percentage = Math.min((value / max) * 100, 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedValue / 100) * circumference

  useEffect(() => {
    if (!inView) {
      return
    }
    const controls = animate(0, percentage, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setAnimatedValue(latest)
        setDisplayText(latest.toFixed(0))
      },
    })
    return controls.stop
  }, [inView, percentage])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex flex-col items-center gap-3', className)}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={inView ? offset : circumference}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children || (
            <span className="text-xl font-bold text-foreground tabular-nums">{inView ? `${displayText}%` : '0%'}</span>
          )}
        </div>
      </div>

      {(label || subtitle) && (
        <div className="text-center">
          {label && <p className="text-sm font-medium text-foreground">{label}</p>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      )}
    </motion.div>
  )
}
