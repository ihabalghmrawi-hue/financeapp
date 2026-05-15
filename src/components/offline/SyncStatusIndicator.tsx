'use client'

import { cn } from '@/lib/utils'
import { useSyncStatus } from '@/lib/offline/react/use-sync-status'
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

interface SyncStatusIndicatorProps {
  className?: string
  showLabel?: boolean
}

export function SyncStatusIndicator({ className, showLabel = true }: SyncStatusIndicatorProps) {
  const { status, pendingCount, failedCount, isOnline, isSyncing } = useSyncStatus()

  if (!isOnline) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)} title="غير متصل">
        <CloudOff className="h-3.5 w-3.5" />
        {showLabel && <span>غير متصل</span>}
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-primary', className)} title="جاري المزامنة">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        {showLabel && <span>جاري المزامنة...</span>}
      </div>
    )
  }

  if (failedCount > 0) {
    return (
      <div
        className={cn('flex items-center gap-1.5 text-xs text-warning', className)}
        title={`${failedCount} عملية فاشلة`}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {showLabel && <span>{failedCount} فشل</span>}
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div
        className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}
        title={`${pendingCount} عملية معلقة`}
      >
        <Cloud className="h-3.5 w-3.5" />
        {showLabel && <span>{pendingCount} معلق</span>}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-success', className)} title="تمت المزامنة">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {showLabel && <span>متزامن</span>}
    </div>
  )
}
