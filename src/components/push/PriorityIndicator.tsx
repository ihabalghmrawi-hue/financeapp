'use client'

import { cn } from '@/lib/utils'
import type { PushNotificationPriority } from '@/lib/push/types'
import { AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react'
import { useT } from '@/lib/i18n/language-provider'

interface PriorityIndicatorProps {
  priority: PushNotificationPriority
  className?: string
  size?: number
}

const priorityConfig: Record<PushNotificationPriority, { color: string; Icon: typeof AlertCircle }> = {
  critical: { color: 'text-destructive', Icon: AlertCircle },
  high: { color: 'text-warning', Icon: AlertTriangle },
  normal: { color: 'text-primary', Icon: Bell },
  low: { color: 'text-muted-foreground', Icon: Info },
}

const priorityLabelKey: Record<PushNotificationPriority, string> = {
  critical: 'notification.priority.critical',
  high: 'notification.priority.high',
  normal: 'notification.priority.normal',
  low: 'notification.priority.low',
}

export function PriorityIndicator({ priority, className, size = 16 }: PriorityIndicatorProps) {
  const { t } = useT()
  const { color, Icon } = priorityConfig[priority]
  const label = t(priorityLabelKey[priority])

  return (
    <span className={cn('inline-flex items-center', color, className)} title={label} aria-label={label}>
      <Icon size={size} />
    </span>
  )
}
