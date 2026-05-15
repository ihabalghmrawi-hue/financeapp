'use client'

import { cn } from '@/lib/utils'
import type { PushNotificationPriority } from '@/lib/push/types'
import { AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react'

interface PriorityIndicatorProps {
  priority: PushNotificationPriority
  className?: string
  size?: number
}

const priorityConfig: Record<PushNotificationPriority, { color: string; Icon: typeof AlertCircle; label: string }> = {
  critical: { color: 'text-destructive', Icon: AlertCircle, label: 'حرج' },
  high: { color: 'text-warning', Icon: AlertTriangle, label: 'عالي' },
  normal: { color: 'text-primary', Icon: Bell, label: 'عادي' },
  low: { color: 'text-muted-foreground', Icon: Info, label: 'منخفض' },
}

export function PriorityIndicator({ priority, className, size = 16 }: PriorityIndicatorProps) {
  const { color, Icon, label } = priorityConfig[priority]

  return (
    <span className={cn('inline-flex items-center', color, className)} title={label} aria-label={label}>
      <Icon size={size} />
    </span>
  )
}
