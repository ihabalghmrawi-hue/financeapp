'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastData {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface NativeToastProps {
  toast: ToastData | null
  onDismiss: (id: string) => void
  className?: string
}

const toastConfig: Record<ToastType, { bg: string; border: string; Icon: typeof CheckCircle2; iconBg: string }> = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    Icon: CheckCircle2,
    iconBg: 'text-success',
  },
  error: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    Icon: XCircle,
    iconBg: 'text-destructive',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    Icon: AlertTriangle,
    iconBg: 'text-warning',
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    Icon: Info,
    iconBg: 'text-primary',
  },
}

export function NativeToast({ toast, onDismiss, className }: NativeToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (toast) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => onDismiss(toast.id), 300)
      }, toast.duration ?? 3000)
      return () => clearTimeout(timer)
    }
  }, [toast, onDismiss])

  if (!toast) {
    return null
  }

  const { bg, border, Icon, iconBg } = toastConfig[toast.type]

  return (
    <div
      className={cn(
        'fixed top-16 left-4 right-4 z-[100] transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
        className,
      )}
      dir="rtl"
    >
      <div className={cn('rounded-2xl border shadow-xl p-4 backdrop-blur-sm', bg, border)}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <Icon className={cn('h-5 w-5', iconBg)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.description && <p className="text-xs text-muted-foreground mt-1">{toast.description}</p>}
          </div>
          <button
            onClick={() => {
              setVisible(false)
              setTimeout(() => onDismiss(toast.id), 300)
            }}
            className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors text-muted-foreground"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export type { ToastData, ToastType }
