'use client'

import { cn } from '@/lib/utils'
import type { PushNotificationData, PushNotificationAction } from '@/lib/push/types'
import { PriorityIndicator } from './PriorityIndicator'
import { useNotificationActions } from '@/lib/push/react/use-notification-actions'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Check, X, RotateCcw, ArrowUpRight, Eye, UserPlus, Target } from 'lucide-react'

interface ActionableNotificationCardProps {
  notification: PushNotificationData
  onAction?: (actionId: string) => void
  onDismiss?: (id: string) => void
  className?: string
}

const actionIcons: Record<string, React.ElementType> = {
  approve: Check,
  reject: X,
  retry: RotateCcw,
  retry_workflow: RotateCcw,
  retry_integration: RotateCcw,
  escalate: ArrowUpRight,
  assign: UserPlus,
  open_entity: Eye,
  mark_resolved: Target,
  open_inventory: Eye,
  investigate: Eye,
  acknowledge: Check,
  dismiss: X,
  open: Eye,
}

export function ActionableNotificationCard({
  notification,
  onAction,
  onDismiss,
  className,
}: ActionableNotificationCardProps) {
  const actions = useNotificationActions()

  const handleAction = (action: PushNotificationAction) => {
    switch (action.action) {
      case 'approve':
        actions.approve(notification)
        break
      case 'reject':
        actions.reject(notification)
        break
      case 'retry':
      case 'retry_workflow':
      case 'retry_integration':
        actions.retry(notification)
        break
      case 'escalate':
        actions.escalate(notification)
        break
      case 'mark_resolved':
        actions.markResolved(notification)
        break
      case 'open_entity':
      case 'open_inventory':
        actions.openEntity(notification)
        break
      case 'assign':
        break
    }
    onAction?.(action.id)
  }

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })
    } catch {
      return ''
    }
  })()

  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 p-4 rounded-xl border transition-colors',
        notification.status === 'pending' || notification.status === 'delivered'
          ? 'bg-accent/30 border-accent'
          : 'bg-card border-border',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <PriorityIndicator priority={notification.priority} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'text-sm font-medium leading-snug',
                (notification.status === 'pending' || notification.status === 'delivered') && 'font-semibold',
              )}
            >
              {notification.title}
            </h4>
            {onDismiss && (
              <button
                onClick={() => onDismiss(notification.id)}
                className="shrink-0 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="تجاهل"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">{notification.body}</p>

          <time className="block text-[10px] text-muted-foreground/60 mt-1.5" dateTime={notification.createdAt}>
            {timeAgo}
          </time>
        </div>
      </div>

      {notification.actions && notification.actions.length > 0 && (
        <div className="flex items-center gap-2 mr-8 mt-1" dir="ltr">
          {notification.actions.map((action) => {
            const Icon = actionIcons[action.action] ?? Eye
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  action.destructive
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : action.action === 'approve' ||
                        action.action === 'acknowledge' ||
                        action.action === 'mark_resolved'
                      ? 'bg-success/10 text-success hover:bg-success/20'
                      : 'bg-primary/10 text-primary hover:bg-primary/20',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
