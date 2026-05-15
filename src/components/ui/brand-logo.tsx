'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'minimal' | 'icon-only'
  animated?: boolean
  className?: string
  monochrome?: boolean
}

const sizeMap = {
  sm: { text: 'text-sm', icon: 'w-7 h-7', gap: 'gap-2' },
  md: { text: 'text-lg', icon: 'w-9 h-9', gap: 'gap-2.5' },
  lg: { text: 'text-2xl', icon: 'w-12 h-12', gap: 'gap-3' },
  xl: { text: 'text-4xl', icon: 'w-16 h-16', gap: 'gap-4' },
}

function Logomark({ className, monochrome }: { className?: string; monochrome?: boolean }) {
  const accent = monochrome ? '#888' : '#00e676'
  const mid = monochrome ? '#666' : '#00bcd4'
  const light = monochrome ? '#444' : '#18ffff'

  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn('flex-shrink-0', className)}>
      <defs>
        <linearGradient id="lg-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} />
          <stop offset="50%" stopColor={mid} />
          <stop offset="100%" stopColor={light} />
        </linearGradient>
        <linearGradient id="lg-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
          <stop offset="100%" stopColor={light} stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="20" cy="20" r="18" fill="url(#lg-glow)" />

      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" stroke="url(#lg-primary)" strokeWidth="1.5" fill="none" />

      <polygon points="20,10 30,20 20,30 10,20" fill="url(#lg-primary)" fillOpacity="0.1" />
      <polygon points="20,10 30,20 20,30 10,20" stroke="url(#lg-primary)" strokeWidth="0.75" fill="none" />

      <line x1="20" y1="2" x2="20" y2="38" stroke={accent} strokeWidth="0.5" opacity="0.25" />
      <line x1="4" y1="20" x2="36" y2="20" stroke={mid} strokeWidth="0.5" opacity="0.25" />
      <line x1="8" y1="12" x2="32" y2="28" stroke={light} strokeWidth="0.5" opacity="0.15" />
      <line x1="8" y1="28" x2="32" y2="12" stroke={accent} strokeWidth="0.5" opacity="0.15" />

      <circle cx="20" cy="20" r="2.5" fill="url(#lg-primary)" />
      <circle cx="20" cy="20" r="5" stroke="url(#lg-primary)" strokeWidth="0.5" fill="none" opacity="0.4" />

      <circle cx="20" cy="2" r="1.5" fill={accent} />
      <circle cx="36" cy="11" r="1.5" fill={mid} />
      <circle cx="36" cy="29" r="1.5" fill={accent} />
      <circle cx="20" cy="38" r="1.5" fill={mid} />
      <circle cx="4" cy="29" r="1.5" fill={accent} />
      <circle cx="4" cy="11" r="1.5" fill={mid} />
    </svg>
  )
}

function MonochromeLogomark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn('flex-shrink-0', className)}>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <polygon points="20,10 30,20 20,30 10,20" stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.5" />
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
    </svg>
  )
}

export function BrandLogo({
  size = 'md',
  variant = 'default',
  animated = true,
  className,
  monochrome,
}: BrandLogoProps) {
  const isIconOnly = variant === 'icon-only'
  const s = sizeMap[size]

  const LogoMarkComponent = monochrome ? MonochromeLogomark : Logomark

  if (isIconOnly) {
    return (
      <LogoMarkComponent
        className={cn(s.icon, animated ? 'animate-fade-in-scale' : '', className)}
        monochrome={monochrome}
      />
    )
  }

  return (
    <motion.div
      initial={animated ? { opacity: 0, x: -10 } : {}}
      animate={{ opacity: 1, x: 0 }}
      className={cn('flex items-center', s.gap, className)}
    >
      <LogoMarkComponent className={s.icon} monochrome={monochrome} />
      <div className="flex flex-col">
        <span className={cn('font-bold tracking-tight', s.text)}>
          <span className="brand-gradient-text">Ezy</span>
          <span className={cn(monochrome ? 'text-foreground' : 'text-foreground')}>ERP</span>
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

export { MonochromeLogomark }
