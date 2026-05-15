'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, Loader2, Barcode } from 'lucide-react'

interface ScanFeedbackProps {
  visible: boolean
  type: 'success' | 'error' | 'scanning'
  message?: string
  value?: string
  onDismiss?: () => void
  className?: string
}

export function ScanFeedback({ visible, type, message, value, onDismiss, className }: ScanFeedbackProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      if (type !== 'scanning') {
        const timer = setTimeout(() => {
          setShow(false)
          onDismiss?.()
        }, 2000)
        return () => clearTimeout(timer)
      }
    } else {
      setShow(false)
    }
  }, [visible, type, onDismiss])

  if (!show) {
    return null
  }

  const config = {
    success: {
      bg: 'bg-success/10 border-success/30',
      icon: CheckCircle2,
      iconColor: 'text-success',
      iconBg: 'bg-success/20',
      defaultMessage: 'تم المسح بنجاح',
    },
    error: {
      bg: 'bg-destructive/10 border-destructive/30',
      icon: XCircle,
      iconColor: 'text-destructive',
      iconBg: 'bg-destructive/20',
      defaultMessage: 'فشل المسح',
    },
    scanning: {
      bg: 'bg-primary/10 border-primary/30',
      icon: Loader2,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/20',
      defaultMessage: 'جاري المسح...',
    },
  }

  const { bg, icon: Icon, iconColor, iconBg, defaultMessage } = config[type]

  return (
    <div
      className={cn(
        'fixed inset-x-4 bottom-24 z-50 p-4 rounded-2xl border shadow-xl backdrop-blur-sm animate-fade-in',
        bg,
        className,
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-full shrink-0', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor, type === 'scanning' && 'animate-spin')} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message ?? defaultMessage}</p>
          {value && (
            <div className="flex items-center gap-1.5 mt-1">
              <Barcode className="h-3 w-3 text-muted-foreground" />
              <code className="text-[11px] text-muted-foreground font-mono truncate">{value}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
