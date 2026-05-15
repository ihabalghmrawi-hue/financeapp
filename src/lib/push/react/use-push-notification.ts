'use client'

import { useState, useEffect, useCallback } from 'react'
import { inAppNotificationStore } from '../notification-store'
import { badgeManager } from '../badge-manager'
import type { PushNotificationData } from '../types'

interface UsePushNotificationsOptions {
  companyId: string
  userId: string
  limit?: number
  refreshInterval?: number
}

interface UsePushNotificationsResult {
  notifications: PushNotificationData[]
  unreadCount: number
  loading: boolean
  refresh: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismiss: (id: string) => Promise<void>
}

export function usePushNotifications({
  companyId,
  userId,
  limit = 50,
  refreshInterval = 30000,
}: UsePushNotificationsOptions): UsePushNotificationsResult {
  const [notifications, setNotifications] = useState<PushNotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!companyId || !userId) {
      return
    }
    setLoading(true)
    try {
      const all = await inAppNotificationStore.getByUser(companyId, userId, limit)
      setNotifications(all)
      const count = await inAppNotificationStore.getUnreadCount(companyId, userId)
      setUnreadCount(count)
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [companyId, userId, limit])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, refreshInterval)
    return () => clearInterval(interval)
  }, [refresh, refreshInterval])

  const markAsRead = useCallback(
    async (id: string) => {
      await inAppNotificationStore.markAsRead(id)
      await badgeManager.decrement()
      await refresh()
    },
    [refresh],
  )

  const markAllAsRead = useCallback(async () => {
    await inAppNotificationStore.markAllAsRead(companyId, userId)
    await badgeManager.clear()
    await refresh()
  }, [companyId, userId, refresh])

  const dismiss = useCallback(
    async (id: string) => {
      await inAppNotificationStore.markAsDismissed(id)
      await badgeManager.decrement()
      await refresh()
    },
    [refresh],
  )

  return { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead, dismiss }
}
