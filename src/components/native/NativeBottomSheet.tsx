'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import { X } from 'lucide-react'

interface NativeBottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  snapPoints?: string[]
  showDragHandle?: boolean
}

export function NativeBottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  snapPoints = ['50%', '75%', '90%'],
  showDragHandle = true,
}: NativeBottomSheetProps) {
  const { t } = useT()
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

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

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet || !open) {
      return
    }

    const onTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      currentY.current = e.touches[0].clientY
      const diff = currentY.current - startY.current
      if (diff > 0) {
        sheet.style.transform = `translateY(${diff}px)`
      }
    }

    const onTouchEnd = () => {
      const diff = currentY.current - startY.current
      if (diff > 100) {
        onClose()
      }
      sheet.style.transform = ''
    }

    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove', onTouchMove, { passive: true })
    sheet.addEventListener('touchend', onTouchEnd)

    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove', onTouchMove)
      sheet.removeEventListener('touchend', onTouchEnd)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end" dir="rtl">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div
        ref={sheetRef}
        className={cn(
          'relative w-full bg-background rounded-t-2xl shadow-2xl animate-slide-up',
          'max-h-[90vh] overflow-y-auto',
          className,
        )}
        style={{ touchAction: 'pan-y' }}
      >
        {showDragHandle && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-base font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="p-4">{children}</div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
