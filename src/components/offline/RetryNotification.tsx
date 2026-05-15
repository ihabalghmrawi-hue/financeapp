'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useOffline } from '@/lib/offline/react/offline-provider'
import { X, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'

export function RetryNotification() {
  const { failedCount, retryFailed, isOnline } = useOffline()
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (failedCount === 0) {
      setDismissed({})
    }
  }, [failedCount])

  if (failedCount === 0 || dismissed['all']) {
    return null
  }

  const handleRetry = async () => {
    setRetrying(true)
    await retryFailed()
    setRetrying(false)
  }

  return (
    <div className="fixed bottom-20 inset-x-4 z-[80] max-w-md mx-auto animate-slide-up">
      <div className="bg-card border shadow-xl rounded-xl p-4 flex items-start gap-3">
        <div
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
            retrying ? 'bg-primary/10' : 'bg-warning/10',
          )}
        >
          {retrying ? (
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{retrying ? 'جاري إعادة المحاولة...' : `فشل ${failedCount} عملية`}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {retrying
              ? 'محاولة مزامنة العمليات الفاشلة'
              : isOnline
                ? 'اضغط لإعادة محاولة المزامنة'
                : 'يرجى الاتصال بالإنترنت للمزامنة'}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isOnline && !retrying && (
            <button
              onClick={handleRetry}
              className="p-2 hover:bg-accent rounded-lg text-primary transition-colors"
              title="إعادة المحاولة"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setDismissed({ all: true })}
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
            title="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function SyncCompleteToast({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDismiss, 4000)
      return () => clearTimeout(timer)
    }
  }, [show, onDismiss])

  if (!show) {
    return null
  }

  return (
    <div className="fixed bottom-20 inset-x-4 z-[80] max-w-md mx-auto animate-slide-up">
      <div className="bg-card border shadow-xl rounded-xl p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-4 w-4 text-success" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">تمت المزامنة بنجاح</p>
          <p className="text-xs text-muted-foreground">جميع العمليات محدثة</p>
        </div>
        <button onClick={onDismiss} className="p-1 hover:bg-accent rounded-lg">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
