'use client'

import { cn } from '@/lib/utils'
import { useSyncStatus } from '@/lib/offline/react/use-sync-status'
import { useT } from '@/lib/i18n/language-provider'
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

interface SyncStatusIndicatorProps {
  className?: string
  showLabel?: boolean
}

export function SyncStatusIndicator({ className, showLabel = true }: SyncStatusIndicatorProps) {
  const { t } = useT()
  const { status, pendingCount, failedCount, isOnline, isSyncing } = useSyncStatus()

  if (!isOnline) {
    return (
      <div
        className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}
        title={t('mobile.offline')}
      >
        <CloudOff className="h-3.5 w-3.5" />
        {showLabel && <span>{t('mobile.offline')}</span>}
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-primary', className)} title={t('mobile.syncing')}>
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        {showLabel && <span>{t('offline.syncStatus.syncing')}</span>}
      </div>
    )
  }

  if (failedCount > 0) {
    return (
      <div
        className={cn('flex items-center gap-1.5 text-xs text-warning', className)}
        title={`${failedCount} ${t('offline.syncStatus.failedOperations')}`}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {showLabel && (
          <span>
            {failedCount} {t('offline.syncStatus.failed')}
          </span>
        )}
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div
        className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}
        title={`${pendingCount} ${t('offline.syncStatus.pendingOperations')}`}
      >
        <Cloud className="h-3.5 w-3.5" />
        {showLabel && (
          <span>
            {pendingCount} {t('offline.syncStatus.pending')}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-center gap-1.5 text-xs text-success', className)}
      title={t('offline.syncStatus.synced')}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {showLabel && <span>{t('offline.syncStatus.synced')}</span>}
    </div>
  )
}
