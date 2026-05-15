import { deliveryEngine } from '../delivery-engine'
import { deviceRegistry } from '../device-registry'
import { buildNotification } from '../payload-builder'
import type { PushNotificationCategory, PushNotificationPriority } from '../types'

class NotificationBridge {
  async onNotificationCreated(data: {
    id: string
    companyId: string
    type: string
    title: string
    body?: string
    severity?: string
    userId?: string
    metadata?: Record<string, unknown>
    actionUrl?: string
  }): Promise<void> {
    const category = this.mapTypeToCategory(data.type)
    const priority = this.mapSeverityToPriority(data.severity)

    const userIds = data.userId ? [data.userId] : deviceRegistry.getAllDevices(data.companyId).map((d) => d.userId)

    const uniqueUserIds = [...new Set(userIds)]

    for (const userId of uniqueUserIds) {
      const notification = buildNotification({
        companyId: data.companyId,
        userId,
        category,
        title: data.title,
        body: data.body ?? '',
        priority,
        deepLink: data.actionUrl ? { type: 'url', url: data.actionUrl } : undefined,
        data: { originalNotificationId: data.id, ...data.metadata },
        metadata: data.metadata,
      })

      await deliveryEngine.deliver(notification, data.companyId, userId)
    }
  }

  private mapTypeToCategory(type: string): PushNotificationCategory {
    const categoryMap: Record<string, PushNotificationCategory> = {
      approval: 'approval',
      approval_reminder: 'approval',
      sla_breach: 'sla_breach',
      sla_warning: 'sla_breach',
      workflow_failed: 'workflow_failed',
      workflow_completed: 'workflow_failed',
      low_stock: 'inventory',
      stock_out: 'inventory',
      expiry_warning: 'inventory',
      overdue_payment: 'payment',
      payment_received: 'payment',
      payment_failed: 'payment',
      anomaly: 'accounting_anomaly',
      integration_failed: 'integration',
      integration_recovered: 'integration',
      escalation: 'escalation',
      escalation_resolved: 'escalation',
      security: 'security',
      suspicious_activity: 'security',
      reminder: 'reminder',
      sync_complete: 'sync',
      sync_failed: 'sync',
    }
    return categoryMap[type] ?? 'system'
  }

  private mapSeverityToPriority(severity?: string): PushNotificationPriority {
    switch (severity) {
      case 'critical':
        return 'critical'
      case 'error':
        return 'high'
      case 'warning':
        return 'normal'
      default:
        return 'low'
    }
  }
}

export const notificationBridge = new NotificationBridge()
