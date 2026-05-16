'use client'

import { cn } from '@/lib/utils'
import { useOffline } from './OfflineProvider'
import { useT } from '@/lib/i18n/language-provider'
import { Clock, Database, Upload, AlertTriangle, Activity } from 'lucide-react'

interface OfflineTelemetryProps {
  className?: string
  compact?: boolean
}

export function OfflineTelemetryPanel({ className, compact }: OfflineTelemetryProps) {
  const { t } = useT()
  const { telemetry, isOnline, syncStatus, pendingCount, failedCount } = useOffline()

  const formatUptime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}س ${minutes % 60}د`
    }
    return `${minutes} دقيقة`
  }

  const metrics = [
    {
      icon: Activity,
      label: t('offline.telemetry.status'),
      value: isOnline ? t('offline.telemetry.online') : t('offline.telemetry.offline'),
      color: isOnline ? 'text-success' : 'text-destructive',
    },
    { icon: Clock, label: t('offline.telemetry.uptime'), value: formatUptime(telemetry.uptime) },
    {
      icon: Database,
      label: t('offline.telemetry.sync'),
      value:
        syncStatus === 'syncing'
          ? t('offline.telemetry.syncing')
          : syncStatus === 'error'
            ? t('offline.telemetry.error')
            : t('offline.telemetry.stable'),
    },
    { icon: Upload, label: t('offline.telemetry.pending'), value: String(pendingCount) },
    {
      icon: AlertTriangle,
      label: t('offline.telemetry.failed'),
      value: String(failedCount),
      color: failedCount > 0 ? 'text-warning' : undefined,
    },
  ]

  return (
    <div className={cn(compact ? 'space-y-1' : 'bg-card border rounded-xl p-4 space-y-3', className)}>
      {!compact && <h3 className="text-sm font-semibold">{t('offline.telemetry.title')}</h3>}
      <div className={cn('grid', compact ? 'grid-cols-3 gap-1' : 'gap-2')}>
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <m.icon className={cn('h-3.5 w-3.5 shrink-0', m.color ?? 'text-muted-foreground')} />
            <div className="min-w-0">
              {!compact && <p className="text-[10px] text-muted-foreground">{m.label}</p>}
              <p className={cn('text-xs font-medium', m.color)}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
