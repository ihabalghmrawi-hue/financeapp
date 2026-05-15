'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { pushRegistrationService } from '../push-registration'
import { deviceRegistry } from '../device-registry'
import { badgeManager } from '../badge-manager'
import { deliveryEngine } from '../delivery-engine'
import { inAppNotificationStore } from '../notification-store'
import { foregroundHandler } from '../lifecycle/foreground-handler'
import { backgroundHandler } from '../lifecycle/background-handler'
import { resumeSyncService } from '../lifecycle/resume-sync'
import { deepLinkHandler } from '../deep-link-routes'
import { notificationPreferences } from '../notification-preferences'
import type {
  PushNotificationData,
  NotificationGroup,
  PushNotificationCategory,
  NotificationPreferences,
} from '../types'

interface PushContextValue {
  initialized: boolean
  registered: boolean
  hasPermission: boolean
  deviceToken: string | null
  unreadCount: number
  notifications: PushNotificationData[]
  groups: NotificationGroup[]
  preferences: NotificationPreferences | null
  register: (companyId: string, userId: string) => Promise<boolean>
  unregister: (companyId: string, userId: string) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismissNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
  refreshBadge: () => Promise<void>
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>
  updateCategoryPreference: (category: PushNotificationCategory, enabled: boolean) => Promise<void>
  onNotificationAction: (actionId: string, notificationId: string) => Promise<void>
  handleDeepLink: (notification?: PushNotificationData) => void
}

const PushContext = createContext<PushContextValue | null>(null)

export function usePush(): PushContextValue {
  const ctx = useContext(PushContext)
  if (!ctx) {
    throw new Error('usePush must be used within PushProvider')
  }
  return ctx
}

interface PushProviderProps {
  children: ReactNode
  companyId?: string
  userId?: string
  autoRegister?: boolean
}

export function PushProvider({ children, companyId, userId, autoRegister = true }: PushProviderProps) {
  const [initialized, setInitialized] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [deviceToken, setDeviceToken] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<PushNotificationData[]>([])
  const [groups, setGroups] = useState<NotificationGroup[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const initRef = useRef(false)

  const refreshNotifications = useCallback(async () => {
    if (!companyId || !userId) {
      return
    }
    const all = await inAppNotificationStore.getByUser(companyId, userId, 50)
    setNotifications(all)
    const g = await inAppNotificationStore.getGroups(companyId, userId)
    setGroups(g)
  }, [companyId, userId])

  const refreshBadge = useCallback(async () => {
    if (!companyId || !userId) {
      return
    }
    const count = await badgeManager.refreshFromStore(companyId, userId)
    setUnreadCount(count)
  }, [companyId, userId])

  const handleDeepLink = useCallback((notification?: PushNotificationData) => {
    const route = notification?.deepLink
    if (route) {
      const routeObj = deepLinkHandler['navigate'] ?? ((r: string) => r)
      window.location.href = route
    }
  }, [])

  const onNotificationAction = useCallback(
    async (actionId: string, notificationId: string) => {
      const notification = await inAppNotificationStore.getById(notificationId)
      if (!notification) {
        return
      }

      switch (actionId) {
        case 'approve':
        case 'reject':
          try {
            await fetch(`/api/approvals/${notification.data?.approvalId}/decide`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ decision: actionId === 'approve' ? 'approved' : 'rejected' }),
            })
          } catch {
            /* offline */
          }
          break
        case 'retry':
        case 'retry_workflow':
          try {
            await fetch(`/api/workflows/${notification.data?.workflowId}/retry`, { method: 'POST' })
          } catch {
            /* offline */
          }
          break
        case 'escalate':
          try {
            await fetch('/api/escalations/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                entityType: notification.data?.entityType,
                entityId: notification.data?.entityId,
              }),
            })
          } catch {
            /* offline */
          }
          break
        case 'mark_resolved':
          await deliveryEngine.markAsDismissed(notificationId)
          break
        case 'open_entity':
          handleDeepLink(notification)
          break
      }

      await deliveryEngine.markAsRead(notificationId)
      await refreshBadge()
      await refreshNotifications()
    },
    [handleDeepLink, refreshBadge, refreshNotifications],
  )

  useEffect(() => {
    if (initRef.current) {
      return
    }
    initRef.current = true

    const init = async () => {
      await deviceRegistry.initialize()
      await badgeManager.initialize()
      await backgroundHandler.initialize()

      deepLinkHandler.initialize()

      if (companyId && userId && autoRegister) {
        const result = await pushRegistrationService.register(companyId, userId)
        if (result) {
          setRegistered(true)
          setHasPermission(pushRegistrationService.hasPermission)
          setDeviceToken(pushRegistrationService.token)
        }

        const prefs = await notificationPreferences.get(companyId, userId)
        setPreferences(prefs)

        await resumeSyncService.onColdStart(companyId, userId)
        await refreshNotifications()
        await refreshBadge()
      }

      const unsubForeground = foregroundHandler.onNotification((notification) => {
        refreshNotifications()
        refreshBadge()
      })

      const unsubDeepLink = deepLinkHandler.onRoute((route) => {
        const path = deepLinkHandler.navigate(route)
        window.location.href = path
      })

      setInitialized(true)

      return () => {
        unsubForeground()
        unsubDeepLink()
      }
    }

    init()
  }, [companyId, userId, autoRegister, refreshNotifications, refreshBadge])

  const register = useCallback(async (cId: string, uId: string): Promise<boolean> => {
    const result = await pushRegistrationService.register(cId, uId)
    if (result) {
      setRegistered(true)
      setHasPermission(pushRegistrationService.hasPermission)
      setDeviceToken(pushRegistrationService.token)
    }
    return result !== null
  }, [])

  const unregister = useCallback(async (cId: string, uId: string) => {
    await pushRegistrationService.unregister(cId, uId)
    setRegistered(false)
    setHasPermission(false)
    setDeviceToken(null)
  }, [])

  const markAsRead = useCallback(
    async (id: string) => {
      await deliveryEngine.markAsRead(id)
      await refreshBadge()
      await refreshNotifications()
    },
    [refreshBadge, refreshNotifications],
  )

  const markAllAsRead = useCallback(async () => {
    if (!companyId || !userId) {
      return
    }
    await inAppNotificationStore.markAllAsRead(companyId, userId)
    await badgeManager.clear()
    setUnreadCount(0)
    await refreshNotifications()
  }, [companyId, userId, refreshNotifications])

  const dismissNotification = useCallback(
    async (id: string) => {
      await deliveryEngine.markAsDismissed(id)
      await refreshBadge()
      await refreshNotifications()
    },
    [refreshBadge, refreshNotifications],
  )

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!companyId || !userId) {
        return
      }
      const updated = await notificationPreferences.update(companyId, userId, updates)
      setPreferences(updated)
    },
    [companyId, userId],
  )

  const updateCategoryPreference = useCallback(
    async (category: PushNotificationCategory, enabled: boolean) => {
      if (!companyId || !userId) {
        return
      }
      const updated = await notificationPreferences.updateCategory(companyId, userId, category, { enabled })
      setPreferences(updated)
    },
    [companyId, userId],
  )

  return (
    <PushContext.Provider
      value={{
        initialized,
        registered,
        hasPermission,
        deviceToken,
        unreadCount,
        notifications,
        groups,
        preferences,
        register,
        unregister,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        refreshNotifications,
        refreshBadge,
        updatePreferences,
        updateCategoryPreference,
        onNotificationAction,
        handleDeepLink,
      }}
    >
      {children}
    </PushContext.Provider>
  )
}
