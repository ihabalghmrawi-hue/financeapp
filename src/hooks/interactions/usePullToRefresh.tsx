'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  maxPull?: number
}

export function usePullToRefresh({ onRefresh, threshold = 80, maxPull = 120 }: PullToRefreshOptions) {
  const [refreshing, setRefreshing] = useState(false)
  const pullDistance = useMotionValue(0)
  const pullProgress = useTransform(pullDistance, [0, threshold], [0, 1])
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pulling = useRef(false)

  const pullStyle = {
    y: useTransform(pullDistance, (d) => Math.min(d, maxPull) * 0.5),
    opacity: useTransform(pullProgress, [0, 1], [0, 1]),
  }

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (refreshing) {
        return
      }
      if (window.scrollY > 0) {
        return
      }
      startY.current = e.touches[0].clientY
      pulling.current = true
    },
    [refreshing],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || refreshing) {
        return
      }
      const diff = e.touches[0].clientY - startY.current
      if (diff > 0) {
        pullDistance.set(Math.min(diff, maxPull))
      }
    },
    [refreshing, pullDistance, maxPull],
  )

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) {
      return
    }
    pulling.current = false

    if (pullDistance.get() >= threshold) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        animate(pullDistance, 0, {
          type: 'spring',
          stiffness: 200,
          damping: 25,
        })
      }
    } else {
      animate(pullDistance, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })
    }
  }, [refreshing, pullDistance, threshold, onRefresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el) {
      return
    }
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const PullIndicator = useCallback(
    () => (
      <motion.div style={pullStyle} className="flex items-center justify-center w-full overflow-hidden">
        <motion.div
          animate={refreshing ? { rotate: 360 } : {}}
          transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
        />
      </motion.div>
    ),
    [pullStyle, refreshing],
  )

  return { containerRef, pullDistance, pullProgress, refreshing, PullIndicator, pullStyle }
}
