'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'minimal' | 'icon-only'
  animated?: boolean
  className?: string
}

const sizeMap = {
  sm: { text: 'text-sm', icon: 'w-7 h-7', gap: 'gap-2' },
  md: { text: 'text-lg', icon: 'w-9 h-9', gap: 'gap-2.5' },
  lg: { text: 'text-2xl', icon: 'w-12 h-12', gap: 'gap-3' },
  xl: { text: 'text-4xl', icon: 'w-16 h-16', gap: 'gap-4' },
}

export function BrandLogo({ size = 'md', variant = 'default', animated = true, className }: BrandLogoProps) {
  const isIconOnly = variant === 'icon-only'
  const s = sizeMap[size]

  const Logomark = () => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(s.icon, 'flex-shrink-0')}>
      {/* Outer glow ring */}
      <circle cx="24" cy="24" r="22" className="stroke-primary/20" strokeWidth="1" fill="none" />
      {/* Background capsule */}
      <rect x="6" y="6" width="36" height="36" rx="10" className="fill-primary/10" />
      {/* Geometric connected E symbol */}
      <path
        d="M16 16h16M16 24h12M16 32h16"
        stroke="url(#brand-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-fade-in-scale' : ''}
      />
      {/* Vertical connector */}
      <path
        d="M16 14v20"
        stroke="url(#brand-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {/* Decorative dots */}
      <circle cx="16" cy="16" r="1.5" fill="#00E676" opacity="0.8" />
      <circle cx="16" cy="24" r="1.5" fill="#00BCD4" opacity="0.8" />
      <circle cx="16" cy="32" r="1.5" fill="#18FFFF" opacity="0.8" />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="brand-grad" x1="12" y1="14" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E676" />
          <stop offset="0.5" stopColor="#00BCD4" />
          <stop offset="1" stopColor="#18FFFF" />
        </linearGradient>
      </defs>
    </svg>
  )

  if (isIconOnly) {
    return <Logomark />
  }

  return (
    <motion.div
      initial={animated ? { opacity: 0, x: -10 } : {}}
      animate={{ opacity: 1, x: 0 }}
      className={cn('flex items-center', s.gap, className)}
    >
      <Logomark />
      <div className="flex flex-col">
        <span className={cn('font-bold tracking-tight', s.text)}>
          <span className="brand-gradient-text">Ezy</span>
          <span className="text-foreground">ERP</span>
        </span>
        {variant === 'default' && (
          <span className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase -mt-0.5 font-medium">
            Intelligent Enterprise Platform
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function LoadingLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BrandLogo size="lg" animated={false} variant="icon-only" />
      </motion.div>
      <div className="w-36 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #00E676, #00BCD4, #18FFFF)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px]" />
      </div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <BrandLogo size="xl" animated={false} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #00E676, #00BCD4, #18FFFF)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-4 text-xs text-white/40 font-medium tracking-wider uppercase"
      >
        Loading platform...
      </motion.p>
    </div>
  )
}
