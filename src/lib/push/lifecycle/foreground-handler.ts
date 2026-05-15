import { inAppNotificationStore } from '../notification-store'
import { badgeManager } from '../badge-manager'
import { deliveryEngine } from '../delivery-engine'
import { deepLinkHandler } from '../deep-link-routes'
import { parseDeepLink } from '../payload-builder'
import type { PushNotificationData } from '../types'

class ForegroundHandler {
  private listeners: Set<(notification: PushNotificationData) => void> = new Set()

  onNotification(callback: (notification: PushNotificationData) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  async handleForegroundNotification(data: any, companyId: string, userId: string): Promise<void> {
    const notification: PushNotificationData = {
      id: data.id ?? crypto.randomUUID(),
      companyId: data.companyId ?? companyId,
      userId: data.userId ?? userId,
      category: data.category ?? 'system',
      title: data.title ?? '',
      body: data.body ?? '',
      data: data.data ?? data.additionalData ?? {},
      priority: data.priority ?? 'normal',
      groupKey: data.groupKey ?? data.group ?? undefined,
      actions: data.actions,
      deepLink: data.deepLink ?? data.deepLinkUrl ?? undefined,
      badge: data.badge,
      silent: data.silent ?? false,
      status: 'delivered',
      createdAt: data.createdAt ?? new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
    }

    await inAppNotificationStore.push(notification)
    await badgeManager.refreshFromStore(companyId, userId)

    this.listeners.forEach((l) => l(notification))
  }

  async handleNotificationTap(data: any): Promise<void> {
    const deepLink = data.deepLink ?? data.deepLinkUrl
    if (deepLink) {
      const path = typeof deepLink === 'string' ? deepLink : (data as any).url
      if (typeof path === 'string') {
        window.location.href = path
      }
    }

    const notificationId = data.id
    if (notificationId) {
      await deliveryEngine.markAsRead(notificationId)
    }
  }
}

export const foregroundHandler = new ForegroundHandler()
