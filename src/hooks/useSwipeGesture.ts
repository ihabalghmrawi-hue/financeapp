'use client'

import { useRef, useCallback } from 'react'

export interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeStart?: () => void
  onSwipeEnd?: () => void
}

export interface SwipeOptions {
  threshold?: number
  preventDefault?: boolean
  enableMultiTouch?: boolean
}

export function useSwipeGesture(handlers: SwipeHandlers, options: SwipeOptions = {}) {
  const { threshold = 50, preventDefault = false, enableMultiTouch = false } = options

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const swiping = useRef(false)

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enableMultiTouch && e.touches.length > 1) {
        return
      }
      const touch = e.touches[0]
      touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
      swiping.current = false
      if (preventDefault) {
        e.preventDefault()
      }
      handlers.onSwipeStart?.()
    },
    [enableMultiTouch, preventDefault, handlers],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) {
        return
      }
      if (!enableMultiTouch && e.touches.length > 1) {
        return
      }
      const touch = e.touches[0]
      const dx = touch.clientX - touchStart.current.x
      const dy = touch.clientY - touchStart.current.y
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        swiping.current = true
      }
      if (preventDefault && swiping.current) {
        e.preventDefault()
      }
    },
    [threshold, enableMultiTouch, preventDefault],
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) {
        return
      }
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStart.current.x
      const dy = touch.clientY - touchStart.current.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (Math.max(absDx, absDy) >= threshold) {
        if (absDx > absDy) {
          if (dx > 0) {
            handlers.onSwipeRight?.()
          } else {
            handlers.onSwipeLeft?.()
          }
        } else {
          if (dy > 0) {
            handlers.onSwipeDown?.()
          } else {
            handlers.onSwipeUp?.()
          }
        }
      }

      touchStart.current = null
      swiping.current = false
      handlers.onSwipeEnd?.()
      if (preventDefault) {
        e.preventDefault()
      }
    },
    [threshold, preventDefault, handlers],
  )

  const onTouchCancel = useCallback(() => {
    touchStart.current = null
    swiping.current = false
  }, [])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    isSwiping: swiping,
  }
}

export function useSwipeablePanel(
  isOpen: boolean,
  onToggle: () => void,
  direction: 'left' | 'right' | 'up' | 'down' = 'left',
  options: SwipeOptions = {},
) {
  const swipeHandlers: SwipeHandlers = {}

  if (direction === 'left') {
    swipeHandlers.onSwipeLeft = onToggle
  } else if (direction === 'right') {
    swipeHandlers.onSwipeRight = onToggle
  } else if (direction === 'up') {
    swipeHandlers.onSwipeUp = onToggle
  } else if (direction === 'down') {
    swipeHandlers.onSwipeDown = onToggle
  }

  if (isOpen) {
    if (direction === 'left') {
      swipeHandlers.onSwipeRight = onToggle
    } else if (direction === 'right') {
      swipeHandlers.onSwipeLeft = onToggle
    } else if (direction === 'up') {
      swipeHandlers.onSwipeDown = onToggle
    } else if (direction === 'down') {
      swipeHandlers.onSwipeUp = onToggle
    }
  }

  return useSwipeGesture(swipeHandlers, options)
}
