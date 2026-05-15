import { inAppNotificationStore } from './notification-store'
import { badgeManager } from './badge-manager'
import { notificationPreferences } from './notification-preferences'
import { deviceRegistry } from './device-registry'
import { pushRegistrationService } from './push-registration'
import type {
  PushNotificationData,
  PushNotificationCategory,
  PushNotificationPriority,
  NotificationStatus,
} from './types'

interface DeliveryRecord {
  notificationId: string
  deviceId: string
  status: 'sent' | 'delivered' | 'failed' | 'read' | 'dismissed'
  timestamp: string
  error?: string
  retryCount: number
}

class DeliveryEngine {
  private auditLog: DeliveryRecord[] = []
  private deliveryInProgress = false
  private maxRetries = 5
  private baseRetryDelayMs = 1000

  async deliver(notification: PushNotificationData, companyId: string, userId: string): Promise<boolean> {
    const prefs = await notificationPreferences.get(companyId, userId)

    if (!notificationPreferences.shouldDeliver(prefs, notification.category, notification.priority)) {
      await this.logDelivery(
        notification.id,
        'device',
        'failed',
        new Date().toISOString(),
        0,
        'Suppressed by preferences',
      )
      return false
    }

    await inAppNotificationStore.push(notification)
    await badgeManager.increment()

    if (notification.silent) {
      return true
    }

    const devices = deviceRegistry.getActiveDevices(companyId, userId)
    if (devices.length === 0) {
      return false
    }

    let allFailed = true
    for (const device of devices) {
      const sent = await this.sendToDevice(notification, device.id, device.token, device.platform)
      if (sent) {
        allFailed = false
      }
    }

    return !allFailed
  }

  async deliverToAll(
    notification: Omit<PushNotificationData, 'id' | 'status' | 'createdAt'>,
    companyId: string,
    userIds: string[],
  ): Promise<number> {
    let sent = 0
    for (const userId of userIds) {
      const full: PushNotificationData = {
        ...notification,
        id: crypto.randomUUID(),
        companyId,
        userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      const success = await this.deliver(full, companyId, userId)
      if (success) {
        sent++
      }
    }
    return sent
  }

  private async sendToDevice(
    notification: PushNotificationData,
    deviceId: string,
    token: string,
    platform: string,
  ): Promise<boolean> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            platform,
            notification: {
              title: notification.title,
              body: notification.body,
              data: notification.data ?? {},
              category: notification.category,
              priority: notification.priority,
              sound: notification.priority === 'critical' ? 'default' : undefined,
              badge: notification.badge ?? 1,
              actions: notification.actions?.map((a) => ({
                action: a.id,
                title: a.label,
                destructive: a.destructive,
                authenticationRequired: a.authenticationRequired,
                foreground: a.foreground,
              })),
              groupKey: notification.groupKey,
              deepLink: notification.deepLink,
              silent: notification.silent,
            },
            notificationId: notification.id,
          }),
        })

        if (response.ok) {
          await this.logDelivery(notification.id, deviceId, 'delivered', new Date().toISOString(), attempt)
          await this.updateNotificationStatus(notification.id, 'delivered')
          return true
        }

        const errorBody = await response.text()
        await this.logDelivery(notification.id, deviceId, 'failed', new Date().toISOString(), attempt, errorBody)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await this.logDelivery(notification.id, deviceId, 'failed', new Date().toISOString(), attempt, msg)

        if (attempt < this.maxRetries - 1) {
          await this.delay(this.baseRetryDelayMs * Math.pow(2, attempt))
        }
      }
    }

    await this.updateNotificationStatus(notification.id, 'failed')
    return false
  }

  async retryFailed(companyId: string, userId: string, maxItems = 20): Promise<number> {
    const failedRecords = this.auditLog
      .filter((r) => r.status === 'failed' && r.retryCount < this.maxRetries)
      .slice(0, maxItems)

    let retried = 0
    for (const record of failedRecords) {
      const notification = await inAppNotificationStore.getById(record.notificationId)
      if (!notification) {
        continue
      }

      const devices = deviceRegistry.getActiveDevices(companyId, userId)
      for (const device of devices) {
        const success = await this.sendToDevice(notification, device.id, device.token, device.platform)
        if (success) {
          retried++
          break
        }
      }
    }
    return retried
  }

  async sendByServer(
    notification: PushNotificationData,
    devices: { id: string; token: string; platform: string }[],
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    for (const device of devices) {
      try {
        const response = await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: device.token,
            platform: device.platform,
            notification: {
              title: notification.title,
              body: notification.body,
              data: {},
            },
            notificationId: notification.id,
          }),
        })

        if (response.ok) {
          sent++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    return { sent, failed }
  }

  async markAsRead(notificationId: string): Promise<void> {
    await inAppNotificationStore.markAsRead(notificationId)
    await badgeManager.decrement()
    this.auditLog
      .filter((r) => r.notificationId === notificationId && r.status === 'delivered')
      .forEach((r) => {
        r.status = 'read'
      })
  }

  async markAsDismissed(notificationId: string): Promise<void> {
    await inAppNotificationStore.markAsDismissed(notificationId)
    await badgeManager.decrement()
  }

  async getAuditLog(companyId: string, limit = 100): Promise<DeliveryRecord[]> {
    return this.auditLog.slice(-limit)
  }

  async getDeliveryStats(notificationId: string): Promise<DeliveryRecord[]> {
    return this.auditLog.filter((r) => r.notificationId === notificationId)
  }

  async cleanupAuditLog(maxAgeDays = 30): Promise<number> {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    const before = this.auditLog.length
    this.auditLog = this.auditLog.filter((r) => new Date(r.timestamp).getTime() > cutoff)
    return before - this.auditLog.length
  }

  private async logDelivery(
    notificationId: string,
    deviceId: string,
    status: DeliveryRecord['status'],
    timestamp: string,
    retryCount: number,
    error?: string,
  ): Promise<void> {
    this.auditLog.push({ notificationId, deviceId, status, timestamp, retryCount, error })
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000)
    }
  }

  private async updateNotificationStatus(id: string, status: NotificationStatus): Promise<void> {
    const notification = await inAppNotificationStore.getById(id)
    if (notification) {
      notification.status = status
      if (status === 'delivered') {
        notification.deliveredAt = new Date().toISOString()
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const deliveryEngine = new DeliveryEngine()
