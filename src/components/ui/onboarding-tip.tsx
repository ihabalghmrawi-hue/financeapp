'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { X, Lightbulb, Sparkles, ArrowRight } from 'lucide-react'
import { useState } from 'react'

interface OnboardingTipProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  variant?: 'default' | 'glass' | 'premium'
  className?: string
}

export function OnboardingTip({
  title,
  description,
  icon,
  action,
  dismissible = true,
  variant = 'default',
  className,
}: OnboardingTipProps) {
  const [dismissed, setDismissed] = useState(false)

  const variantStyles = {
    default: 'bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent border border-primary/10',
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10 dark:bg-black/20',
    premium: 'bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 shadow-lg shadow-primary/5',
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn('relative overflow-hidden rounded-xl p-4', variantStyles[variant], className)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                {icon || <Lightbulb className="w-4 h-4" />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              {action && (
                <Button variant="ghost" size="sm" onClick={action.onClick} className="mt-2 h-8 px-3 text-xs gap-1">
                  {action.label}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>

            {dismissible && (
              <button
                onClick={() => setDismissed(true)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
