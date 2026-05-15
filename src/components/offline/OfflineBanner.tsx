'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useNetworkStatus } from '@/lib/offline/react/use-network-status'
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react'

export function OfflineBanner() {
  const { isOnline, status, wasOffline } = useNetworkStatus()
  const [dismissed, setDismissed] = useState(false)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (isOnline && wasOffline) {
      setRecovering(true)
      const timer = setTimeout(() => {
        setRecovering(false)
        setDismissed(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    if (isOnline) {
      const timer = setTimeout(() => setDismissed(true), 5000)
      return () => clearTimeout(timer)
    }
    setDismissed(false)
    setRecovering(false)
  }, [isOnline, wasOffline])

  if (dismissed && isOnline && !recovering) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed top-0 inset-x-0 z-[90] transition-all duration-500',
        isOnline && !recovering && 'translate-y-[-100%]',
        (isOnline && recovering) || !isOnline ? 'translate-y-0' : 'translate-y-[-100%]',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium',
          !isOnline
            ? 'bg-destructive text-destructive-foreground'
            : recovering
              ? 'bg-success text-success-foreground'
              : 'bg-muted text-muted-foreground',
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>لا يوجد اتصال بالإنترنت. تعمل في وضع عدم الاتصال</span>
            <RefreshCw className="h-3.5 w-3.5 animate-spin ml-2" />
          </>
        ) : recovering ? (
          <>
            <Wifi className="h-4 w-4 shrink-0" />
            <span>تم استعادة الاتصال. جاري المزامنة...</span>
            <RefreshCw className="h-3.5 w-3.5 animate-spin ml-2" />
          </>
        ) : null}
        <button onClick={() => setDismissed(true)} className="mr-auto p-1 hover:opacity-80 rounded" aria-label="إغلاق">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
