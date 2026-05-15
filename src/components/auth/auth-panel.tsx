'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/ui/brand-logo'
import { ErpVisualization } from './erp-visualization'
import { Moon, Sun, Globe } from 'lucide-react'

interface AuthPanelProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  variant?: 'dark' | 'light'
}

export function AuthPanel({ children, title, subtitle }: AuthPanelProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')

  const isDark = theme === 'dark'

  return (
    <div className={cn('min-h-screen flex relative overflow-hidden', isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50')}>
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            'absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[150px]',
            isDark ? 'bg-emerald-500/10' : 'bg-cyan-400/5',
          )}
        />
        <div
          className={cn(
            'absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px]',
            isDark ? 'bg-cyan-500/8' : 'bg-emerald-400/5',
          )}
        />
      </div>

      {/* Split layout */}
      <div className="flex w-full">
        {/* Left side - ERP Visualization */}
        <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden">
          <ErpVisualization isDark={isDark} language={language} />
        </div>

        {/* Right side - Auth panel */}
        <div className={cn('flex-1 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 relative')}>
          {/* Theme toggle + Language */}
          <div className="absolute top-6 right-6 flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={cn(
                'p-2 rounded-xl transition-all duration-300',
                isDark
                  ? 'text-white/40 hover:text-white/80 hover:bg-white/5'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-black/5',
              )}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-300',
                isDark
                  ? 'text-white/40 hover:text-white/80 hover:bg-white/5'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-black/5',
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              {language === 'ar' ? 'AR' : 'EN'}
            </button>
          </div>

          <div className="w-full max-w-md">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8"
            >
              <BrandLogo size="md" />
            </motion.div>

            {/* Auth card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={cn('auth-card p-8 sm:p-10', isDark ? '' : '')}
            >
              {/* Card glow */}
              <div
                className={cn(
                  'absolute -inset-0.5 rounded-3xl opacity-30 pointer-events-none blur-sm',
                  isDark
                    ? 'bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent'
                    : 'bg-gradient-to-b from-cyan-400/10 via-emerald-400/5 to-transparent',
                )}
              />

              <div className="relative">
                {/* Header */}
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

                {/* Content */}
                {children}
              </div>
            </motion.div>

            {/* Enterprise footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className={cn('text-xs mt-6 text-center', isDark ? 'text-white/20' : 'text-gray-400')}
            >
              © 2026 EzyERP · Enterprise SaaS Platform · Protected by AES-256
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  )
}
