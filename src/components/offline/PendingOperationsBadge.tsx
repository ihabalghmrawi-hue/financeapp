'use client'

import { cn } from '@/lib/utils'
import { useSyncStatus } from '@/lib/offline/react/use-sync-status'
import { useOffline } from '@/lib/offline/react/offline-provider'
import { useT } from '@/lib/i18n/language-provider'
import { Upload, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface PendingOperationsBadgeProps {
  className?: string
}

export function PendingOperationsBadge({ className }: PendingOperationsBadgeProps) {
  const { t } = useT()
  const { pendingCount, failedCount, retryFailed, startSync } = useOffline()
  const { isOnline, isSyncing } = useSyncStatus()
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (pendingCount === 0 && failedCount === 0) {
    return null
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
          failedCount > 0
            ? 'bg-warning/10 text-warning hover:bg-warning/20'
            : 'bg-muted text-muted-foreground hover:bg-accent',
        )}
      >
        {isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : failedCount > 0 ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        <span>{pendingCount + failedCount}</span>
      </button>

      {expanded && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-card border rounded-xl shadow-xl z-50 p-3 space-y-2 animate-fade-in">
          <p className="text-xs font-medium text-muted-foreground">{t('offline.pending.title')}</p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{t('offline.pending.waitingSync')}</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-warning">{t('offline.pending.failed')}</span>
              <span className="font-medium text-warning">{failedCount}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {failedCount > 0 && isOnline && (
              <button
                onClick={() => retryFailed()}
                className="flex-1 px-3 py-1.5 text-xs bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors"
              >
                {t('offline.pending.retry')}
              </button>
            )}
            {pendingCount > 0 && isOnline && !isSyncing && (
              <button
                onClick={() => startSync()}
                className="flex-1 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                {t('offline.pending.syncNow')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
