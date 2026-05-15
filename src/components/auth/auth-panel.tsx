'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/ui/brand-logo'
import { SceneBackground } from '@/components/auth/scene-background'
import { Moon, Sun, Globe } from 'lucide-react'

interface AuthPanelProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

const variantMap: Record<string, Record<string, 'dark-en' | 'dark-ar' | 'dark-alt' | 'morning-ar' | 'morning-en'>> = {
  en: { dark: 'dark-en', light: 'morning-en' },
  ar: { dark: 'dark-ar', light: 'morning-ar' },
}

export function AuthPanel({ children, title, subtitle }: AuthPanelProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')

  const isDark = theme === 'dark'
  const variant = variantMap[language]?.[theme] || 'dark-en'

  return (
    <div
      className={cn('relative min-h-screen overflow-hidden', !isDark && 'light')}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <SceneBackground variant={variant} />

      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex items-center justify-center lg:justify-end p-4 sm:p-6 lg:p-12">
        {/* Theme toggle + Language */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 z-20" dir="ltr">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-xl transition-all duration-300 bg-black/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/30"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 bg-black/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/30"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'ar' ? 'EN' : 'AR'}
          </button>
        </div>

        {/* Auth card */}
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <BrandLogo size="md" monochrome={!isDark} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="auth-card p-8 sm:p-10"
          >
            <div className="absolute -inset-0.5 rounded-3xl opacity-30 pointer-events-none blur-sm bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent" />

            <div className="relative">
              {title && (
                <div className="mb-8">
                  <h2
                    className={cn(
                      'text-2xl sm:text-3xl font-bold tracking-tight',
                      isDark ? 'text-white' : 'text-gray-900',
                    )}
                  >
                    {title}
                  </h2>
                  <p className={cn('text-sm mt-2', isDark ? 'text-white/40' : 'text-gray-500')}>{subtitle}</p>
                </div>
              )}

              {children}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className={cn('text-xs mt-6 text-center', isDark ? 'text-white/40' : 'text-gray-400')}
          >
            © 2026 EzyERP · Enterprise SaaS Platform · Protected by AES-256
          </motion.p>
        </div>
      </div>
    </div>
  )
}
