'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

type MotionDivProps = HTMLMotionProps<'div'>

export const HoverLift = forwardRef<HTMLDivElement, MotionDivProps>(({ className, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileHover={{ y: -2, transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] } }}
    className={cn('', className)}
    {...props}
  >
    {children}
  </motion.div>
))
HoverLift.displayName = 'HoverLift'

export const CardElevation = forwardRef<HTMLDivElement, MotionDivProps>(({ className, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileHover={{
      y: -3,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
    }}
    className={cn('cursor-pointer', className)}
    {...props}
  >
    {children}
  </motion.div>
))
CardElevation.displayName = 'CardElevation'

interface MagneticButtonProps extends HTMLMotionProps<'button'> {
  magnetic?: boolean
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ className, children, magnetic = true, ...props }, ref) => {
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic) {
        return
      }
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      e.currentTarget.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`
    }

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = 'translate(0, 0)'
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn('transition-transform duration-200 ease-out', className)}
        style={{ willChange: 'transform' }}
        {...(props as any)}
      >
        {children}
      </motion.button>
    )
  },
)
MagneticButton.displayName = 'MagneticButton'

export const GlowFocus = forwardRef<HTMLDivElement, MotionDivProps & { glowColor?: string }>(
  ({ className, children, glowColor = 'var(--primary)', ...props }, ref) => (
    <motion.div
      ref={ref}
      whileFocus={{
        boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${glowColor}`,
      }}
      className={cn('focus-visible:outline-none rounded-xl transition-shadow', className)}
      tabIndex={0}
      {...props}
    >
      {children}
    </motion.div>
  ),
)
GlowFocus.displayName = 'GlowFocus'

export const SuccessFeedback = forwardRef<HTMLDivElement, MotionDivProps>(({ className, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={cn('', className)}
    {...props}
  >
    {children}
  </motion.div>
))
SuccessFeedback.displayName = 'SuccessFeedback'

export const LoadingMorph = forwardRef<HTMLDivElement, MotionDivProps>(({ className, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    animate={{
      scale: [1, 0.98, 1],
      opacity: [1, 0.7, 1],
    }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    className={cn('', className)}
    {...props}
  >
    {children}
  </motion.div>
))
LoadingMorph.displayName = 'LoadingMorph'

export const ScalePress = forwardRef<HTMLDivElement, MotionDivProps>(({ className, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={cn('cursor-pointer', className)}
    {...props}
  >
    {children}
  </motion.div>
))
ScalePress.displayName = 'ScalePress'

interface SaveIndicatorProps {
  saving?: boolean
  saved?: boolean
  error?: boolean
}

export function SaveIndicator({ saving, saved, error }: SaveIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="inline-flex items-center gap-1.5 text-xs"
    >
      {saving && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full"
        />
      )}
      {saving && <span className="text-muted-foreground">جاري الحفظ...</span>}
      {saved && !saving && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-success">
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </motion.span>
      )}
      {error && <span className="text-destructive">خطأ في الحفظ</span>}
    </motion.div>
  )
}

export function AnimatedCheck({ size = 24 }: { size?: number }) {
  return (
    <motion.svg
      initial={{ pathLength: 0, scale: 0 }}
      animate={{ pathLength: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-success"
    >
      <motion.path
        d="M20 6L9 17l-5-5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
    </motion.svg>
  )
}
