'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Clock } from 'lucide-react'

interface StaleDataWarningProps {
  isStale: boolean
  lastUpdated?: string
  className?: string
  onRefresh?: () => void
}

export function StaleDataWarning({ isStale, lastUpdated, className, onRefresh }: StaleDataWarningProps) {
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
        هذه البيانات قد لا تكون محدثة
        {lastUpdated && ` - آخر تحديث: ${lastUpdated}`}
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-2 py-0.5 rounded bg-warning/20 hover:bg-warning/30 transition-colors text-[10px] font-medium"
        >
          تحديث
        </button>
      )}
    </div>
  )
}

export function OfflineTimestamp({ syncedAt, className }: { syncedAt: string | null; className?: string }) {
  if (!syncedAt) {
    return null
  }

  const formatRelativeTime = (dateStr: string): string => {
    const now = Date.now()
    const date = new Date(dateStr).getTime()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) {
      return 'الآن'
    }
    if (minutes < 60) {
      return `منذ ${minutes} دقيقة`
    }
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return `منذ ${hours} ساعة`
    }
    const days = Math.floor(hours / 24)
    return `منذ ${days} يوم`
  }

  return (
    <div className={cn('flex items-center gap-1 text-[10px] text-muted-foreground', className)}>
      <Clock className="h-3 w-3" />
      <span>آخر مزامنة: {formatRelativeTime(syncedAt)}</span>
    </div>
  )
}
