'use client'

import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import { AlertTriangle, Clock } from 'lucide-react'

interface StaleDataWarningProps {
  isStale: boolean
  lastUpdated?: string
  className?: string
  onRefresh?: () => void
}

export function StaleDataWarning({ isStale, lastUpdated, className, onRefresh }: StaleDataWarningProps) {
  const { t } = useT()
  if (!isStale) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs',
        'bg-warning/10 text-warning border border-warning/20',
        className,
      )}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">
        {t('offline.staleData.message')}
        {lastUpdated && ` - ${t('offline.staleData.lastUpdated')}: ${lastUpdated}`}
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-2 py-0.5 rounded bg-warning/20 hover:bg-warning/30 transition-colors text-[10px] font-medium"
        >
          {t('common.update')}
        </button>
      )}
    </div>
  )
}

export function OfflineTimestamp({ syncedAt, className }: { syncedAt: string | null; className?: string }) {
  const { t } = useT()
  if (!syncedAt) {
    return null
  }

  const formatRelativeTime = (dateStr: string): string => {
    const now = Date.now()
    const date = new Date(dateStr).getTime()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) {
      return t('offline.staleData.now')
    }
    if (minutes < 60) {
      return `${t('offline.staleData.ago')} ${minutes} ${t('offline.staleData.minutes')}`
    }
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return `${t('offline.staleData.ago')} ${hours} ${t('offline.staleData.hours')}`
    }
    const days = Math.floor(hours / 24)
    return `${t('offline.staleData.ago')} ${days} ${t('offline.staleData.days')}`
  }

  return (
    <div className={cn('flex items-center gap-1 text-[10px] text-muted-foreground', className)}>
      <Clock className="h-3 w-3" />
      <span>
        {t('offline.staleData.lastSync')}: {formatRelativeTime(syncedAt)}
      </span>
    </div>
  )
}
