'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  message?: string
  variant?: 'default' | 'minimal' | 'branded'
  className?: string
}

export function LoadingScreen({ message = 'جاري التحميل...', variant = 'default', className }: LoadingScreenProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[60vh]', className)}>
      {variant === 'branded' ? (
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <motion.div
                className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-3xl border border-primary/20"
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
            {message}
          </motion.p>
        </div>
      ) : variant === 'minimal' ? (
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span className="text-xs text-muted-foreground">{message}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      )}
    </div>
  )
}
