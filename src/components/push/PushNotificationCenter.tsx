'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { usePush } from '@/lib/push/react/push-provider'
import { ActionableNotificationCard } from './ActionableNotificationCard'
import { NotificationGroupComponent } from './NotificationGroup'
import { UnreadBadge } from './UnreadBadge'
import type { PushNotificationCategory } from '@/lib/push/types'
import { CATEGORY_LABELS } from '@/lib/push/types'
import { Bell, BellOff, Inbox, Settings, X, CheckCheck, RefreshCw, Filter } from 'lucide-react'
import { useT } from '@/lib/i18n/language-provider'

interface PushNotificationCenterProps {
  open: boolean
  onClose: () => void
  className?: string
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as PushNotificationCategory[]

export function PushNotificationCenter({ open, onClose, className }: PushNotificationCenterProps) {
  const { t } = useT()
  const {
    notifications,
    groups,
    unreadCount,
    markAllAsRead,
    refreshNotifications,
    onNotificationAction,
    dismissNotification,
    initialized,
    registered,
    hasPermission,
  } = usePush()

  const [viewMode, setViewMode] = useState<'groups' | 'list'>('groups')
  const [filterCategory, setFilterCategory] = useState<PushNotificationCategory | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredNotifications = useMemo(() => {
    if (filterCategory === 'all') {
      return notifications
    }
    return notifications.filter((n) => n.category === filterCategory)
  }, [notifications, filterCategory])

  if (!open) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex flex-col bg-background',
        'sm:absolute sm:inset-auto sm:top-12 sm:left-4 sm:w-[420px] sm:max-h-[75vh] sm:rounded-2xl sm:border sm:shadow-2xl',
        className,
      )}
      dir="rtl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">{t('notification.push.title')}</h2>
          <UnreadBadge count={unreadCount} size="md" />
        </div>
        <div className="flex items-center gap-1">
          {!registered && !hasPermission && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-2">
              <BellOff className="h-3 w-3" /> {t('notification.push.disabled')}
            </span>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('notification.push.ariaFilter')}
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={() => refreshNotifications()}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('notification.push.ariaRefresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('notification.push.ariaMarkAllRead')}
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('notification.push.ariaClose')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setViewMode((v) => (v === 'groups' ? 'list' : 'groups'))}
              className={cn(
                'text-xs px-2.5 py-1 rounded-lg transition-colors',
                viewMode === 'groups' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              <Inbox className="h-3 w-3 inline ml-1" />
              {t('notification.push.groupView')}
            </button>
            <button
              onClick={() => setViewMode((v) => (v === 'list' ? 'groups' : 'list'))}
              className={cn(
                'text-xs px-2.5 py-1 rounded-lg transition-colors',
                viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              <Bell className="h-3 w-3 inline ml-1" />
              {t('notification.push.listView')}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterCategory('all')}
              className={cn(
                'text-[10px] px-2 py-1 rounded-full transition-colors',
                filterCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent',
              )}
            >
              {t('notification.push.all')}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  'text-[10px] px-2 py-1 rounded-full transition-colors',
                  filterCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent',
                )}
              >
                {CATEGORY_LABELS[cat]?.title ?? cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!initialized ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">{t('notification.push.loading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BellOff className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">{t('notification.push.noNotifications')}</p>
            <p className="text-xs mt-1">{t('notification.push.emptyHint')}</p>
          </div>
        ) : viewMode === 'groups' ? (
          groups.map((group) => (
            <NotificationGroupComponent
              key={group.key}
              group={group}
              onAction={(actionId, notificationId) => onNotificationAction(actionId, notificationId)}
              onDismiss={(id) => dismissNotification(id)}
            />
          ))
        ) : (
          filteredNotifications.map((notification) => (
            <ActionableNotificationCard
              key={notification.id}
              notification={notification}
              onAction={(actionId) => onNotificationAction(actionId, notification.id)}
              onDismiss={(id) => dismissNotification(id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
