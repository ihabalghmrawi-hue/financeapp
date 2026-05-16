'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { NotificationGroup as NotificationGroupType } from '@/lib/push/types'
import { ActionableNotificationCard } from './ActionableNotificationCard'
import { UnreadBadge } from './UnreadBadge'
import { PriorityIndicator } from './PriorityIndicator'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { useT } from '@/lib/i18n/language-provider'

interface NotificationGroupProps {
  group: NotificationGroupType
  onAction?: (actionId: string, notificationId: string) => void
  onDismiss?: (notificationId: string) => void
  className?: string
}

export function NotificationGroupComponent({ group, onAction, onDismiss, className }: NotificationGroupProps) {
  const { t } = useT()
  const [expanded, setExpanded] = useState(true)

  const unreadCount =
    group.lastNotification.status === 'pending' || group.lastNotification.status === 'delivered' ? group.count : 0

  return (
    <div className={cn('space-y-1', className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-right"
      >
        <PriorityIndicator priority={group.priority} size={14} />
        <span className="flex-1 text-sm font-medium">{group.title}</span>
        <UnreadBadge count={unreadCount} size="sm" />
        <span className="text-[11px] text-muted-foreground">{group.count}</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-1.5 pr-2">
          {Array.from({ length: Math.min(group.count, 5) }).map((_, i) => (
            <div key={`${group.key}-${i}`} className="relative">
              <div className="absolute right-0 top-0 bottom-0 w-px bg-border" />
              <ActionableNotificationCard
                notification={group.lastNotification}
                onAction={(actionId) => onAction?.(actionId, group.lastNotification.id)}
                onDismiss={(id) => onDismiss?.(id)}
                className="mr-3 border-0 bg-transparent p-2 rounded-lg hover:bg-accent/30"
              />
            </div>
          ))}
          {group.count > 5 && (
            <button className="text-xs text-primary hover:underline mr-3 px-2 py-1">
              {t('notification.push.showAll', { count: group.count })}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
