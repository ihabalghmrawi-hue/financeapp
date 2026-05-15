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
    <img
      src="/1.png"
      alt="EzyERP"
      className={cn(s.icon, 'flex-shrink-0 object-contain', animated ? 'animate-fade-in-scale' : '')}
    />
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
