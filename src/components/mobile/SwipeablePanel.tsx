'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { useIsMobile, useSafeArea } from '@/hooks'
import { X, GripHorizontal } from 'lucide-react'

type PanelSide = 'left' | 'right' | 'bottom' | 'top'

interface SwipeablePanelProps {
  open: boolean
  onClose: () => void
  side?: PanelSide
  children: React.ReactNode
  className?: string
  title?: string
  width?: number
  height?: number
  showGrip?: boolean
  closeOnOverlay?: boolean
}

export function SwipeablePanel({
  open,
  onClose,
  side = 'right',
  children,
  className,
  title,
  width = 320,
  height = 400,
  showGrip = true,
  closeOnOverlay = true,
}: SwipeablePanelProps) {
  const isMobile = useIsMobile()
  const safeArea = useSafeArea()
  const panelRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [offset, setOffset] = useState(0)

  const closeSwipeDirection =
    side === 'right'
      ? 'onSwipeRight'
      : side === 'left'
        ? 'onSwipeLeft'
        : side === 'bottom'
          ? 'onSwipeDown'
          : 'onSwipeUp'

  const swipeHandlers = useSwipeGesture(
    {
      [closeSwipeDirection]: () => {
        if (open) {
          onClose()
        }
      },
      onSwipeStart: () => setIsAnimating(true),
      onSwipeEnd: () => {
        setIsAnimating(false)
        setOffset(0)
      },
    },
    { threshold: 80, preventDefault: true },
  )

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const positionStyles = (() => {
    const base = { position: 'fixed' as const, zIndex: 80, backgroundColor: 'hsl(var(--card))' } as const
    if (!isMobile) {
      switch (side) {
        case 'right':
          return {
            ...base,
            top: 0,
            bottom: 0,
            left: 0,
            width,
            borderRight: '1px solid hsl(var(--border))',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)',
          }
        case 'left':
          return {
            ...base,
            top: 0,
            bottom: 0,
            right: 0,
            width,
            borderLeft: '1px solid hsl(var(--border))',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)',
          }
        case 'bottom':
          return {
            ...base,
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: height,
            borderTop: '1px solid hsl(var(--border))',
            boxShadow: '0 -5px 20px rgba(0,0,0,0.1)',
          }
        case 'top':
          return {
            ...base,
            left: 0,
            right: 0,
            top: 0,
            maxHeight: height,
            borderBottom: '1px solid hsl(var(--border))',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
          }
      }
    }
    return {
      ...base,
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: '85vh',
      borderTopLeftRadius: '1rem',
      borderTopRightRadius: '1rem',
      borderTop: '1px solid hsl(var(--border))',
      boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
    }
  })()

  const transform = (() => {
    if (!open) {
      if (side === 'right' || (isMobile && side !== 'left' && side !== 'top')) {
        return 'translateX(100%)'
      }
      if (side === 'left') {
        return 'translateX(-100%)'
      }
      if (side === 'bottom' || isMobile) {
        return 'translateY(100%)'
      }
      if (side === 'top') {
        return 'translateY(-100%)'
      }
    }
    return `translateX(${offset}px)`
  })()

  if (!open && !isAnimating) {
    return null
  }

  return (
    <div className={cn(isMobile && 'fixed inset-0 z-[75]')}>
      {/* Overlay */}
      {(isMobile || side !== 'right') && (
        <div
          className={cn(
            'fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          onClick={() => closeOnOverlay && onClose()}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'overflow-y-auto transition-transform duration-300 ease-out',
          isAnimating && 'transition-none',
          className,
        )}
        style={{
          ...positionStyles,
          transform,
          paddingBottom: safeArea.bottom,
          paddingTop: safeArea.top,
        }}
        {...swipeHandlers}
      >
        {isMobile && showGrip && (
          <div className="flex justify-center pt-2 pb-1">
            <GripHorizontal className="h-5 w-10 text-muted-foreground/50" />
          </div>
        )}

        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-card z-10">
            <h3 className="text-base font-semibold">{title}</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg transition-colors" aria-label="إغلاق">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
