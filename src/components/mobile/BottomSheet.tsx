'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMobileLayout } from './MobileLayoutProvider'
import { useSwipeGesture } from '@/hooks'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  /** When true, sheet style is used even on desktop. Otherwise renders as centered modal on >= sm. */
  forceSheet?: boolean
  /** Max height as a percentage of viewport (mobile only). Default 90. */
  maxHeightVh?: number
  /** Show drag handle bar at the top (mobile only). Default true. */
  showHandle?: boolean
  /** Optional footer pinned to the bottom. */
  footer?: ReactNode
  className?: string
}

/**
 * Adaptive modal: bottom sheet on mobile (swipe-down to dismiss),
 * centered dialog on tablet/desktop. Respects safe-area + keyboard.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  forceSheet = false,
  maxHeightVh = 90,
  showHandle = true,
  footer,
  className,
}: BottomSheetProps) {
  const { isMobile, safeAreaInsets, keyboardHeight } = useMobileLayout()
  const sheetRef = useRef<HTMLDivElement>(null)
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({ onSwipeDown: onClose }, { threshold: 60 })

  // Lock body scroll while open
  useEffect(() => {
    if (!open) {
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Escape to close
  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) {
    return null
  }

  const useSheet = isMobile || forceSheet

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Modal */}
      <div
        ref={sheetRef}
        className={cn(
          'relative bg-card border shadow-2xl overflow-hidden flex flex-col w-full',
          useSheet ? 'rounded-t-2xl sm:rounded-2xl animate-slide-up' : 'rounded-2xl sm:max-w-md animate-fade-in',
          className,
        )}
        style={{
          maxHeight: useSheet ? `${maxHeightVh}vh` : `calc(100vh - 2rem)`,
          paddingBottom: useSheet ? safeAreaInsets.bottom + keyboardHeight : keyboardHeight,
        }}
        onTouchStart={useSheet ? onTouchStart : undefined}
        onTouchMove={useSheet ? onTouchMove : undefined}
        onTouchEnd={useSheet ? onTouchEnd : undefined}
      >
        {useSheet && showHandle && (
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
            <div className="font-semibold text-base">{title}</div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 -m-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {footer && <div className="border-t shrink-0 bg-card">{footer}</div>}
      </div>
    </div>
  )
}
