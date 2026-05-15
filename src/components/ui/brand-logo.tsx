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
  sm: { text: 'text-base', icon: 'w-6 h-6', gap: 'gap-1.5' },
  md: { text: 'text-xl', icon: 'w-8 h-8', gap: 'gap-2' },
  lg: { text: 'text-2xl', icon: 'w-10 h-10', gap: 'gap-2.5' },
  xl: { text: 'text-4xl', icon: 'w-14 h-14', gap: 'gap-3' },
}

export function BrandLogo({ size = 'md', variant = 'default', animated = true, className }: BrandLogoProps) {
  const isIconOnly = variant === 'icon-only'
  const s = sizeMap[size]

  const Logomark = () => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(s.icon, 'flex-shrink-0')}>
      <rect width="40" height="40" rx="10" className="fill-primary" />
      <path
        d="M12 20L18 26L28 14"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-fade-in-scale' : ''}
      />
      <circle cx="20" cy="20" r="16" className="stroke-white/20" strokeWidth="1.5" fill="none" />
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
        <span className={cn('font-bold tracking-tight text-foreground', s.text)}>
          Ezy
          <span className="text-primary">ERP</span>
        </span>
        {variant === 'default' && (
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase -mt-0.5">
            Enterprise Platform
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function LoadingLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BrandLogo size="lg" animated={false} variant="icon-only" />
      </motion.div>
      <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <BrandLogo size="xl" animated={false} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-8 w-48 h-1 bg-muted rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-4 text-xs text-muted-foreground"
      >
        جاري تحميل المنصة...
      </motion.p>
    </div>
  )
}
