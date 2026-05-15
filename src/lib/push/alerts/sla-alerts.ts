import { buildNotification } from '../payload-builder'
import { deliveryEngine } from '../delivery-engine'
import { notificationPreferences } from '../notification-preferences'
import type { PushNotificationData } from '../types'

class SLAAlertService {
  async notifySLABreach(
    companyId: string,
    userId: string,
    data: {
      entityType: string
      entityId: string
      entityName: string
      slaMinutes: number
      elapsedMinutes: number
      assignee?: string
    },
  ): Promise<boolean> {
    const enabled = await notificationPreferences.isCategoryEnabled(companyId, userId, 'sla_breach')
    if (!enabled) {
      return false
    }

    const notification = buildNotification({
      companyId,
      userId,
      category: 'sla_breach',
      title: 'انتهاك المهلة الزمنية',
      body: `${data.entityName} - تجاوز المهلة المحددة (${data.slaMinutes} دقيقة) بمقدار ${data.elapsedMinutes - data.slaMinutes} دقيقة`,
      priority: 'critical',
      groupKey: 'sla_breaches',
      deepLink: { type: 'entity', entityType: data.entityType, entityId: data.entityId },
      actions: [
        { id: 'escalate', label: 'تصعيد', action: 'escalate', foreground: true },
        { id: 'open', label: 'عرض', action: 'open_entity', foreground: true },
      ],
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        elapsedMinutes: data.elapsedMinutes,
        slaMinutes: data.slaMinutes,
      },
      metadata: { assignee: data.assignee },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifySLAWarning(
    companyId: string,
    userId: string,
    data: {
      entityType: string
      entityId: string
      entityName: string
      slaMinutes: number
      remainingMinutes: number
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'sla_breach',
      title: 'تنبيه: اقتراب انتهاء المهلة',
      body: `${data.entityName} - متبقي ${data.remainingMinutes} دقيقة من أصل ${data.slaMinutes}`,
      priority: 'high',
      groupKey: 'sla_breaches',
      deepLink: { type: 'entity', entityType: data.entityType, entityId: data.entityId },
      data: { entityType: data.entityType, entityId: data.entityId, remainingMinutes: data.remainingMinutes },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifySLACritical(
    companyId: string,
    userId: string,
    data: {
      entityType: string
      entityId: string
      entityName: string
      slaMinutes: number
      remainingMinutes: number
      escalationLevel: number
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'sla_breach',
      title: `تصعيد: ${data.entityName}`,
      body: `المستوى ${data.escalationLevel} - متبقي ${data.remainingMinutes} دقيقة`,
      priority: 'critical',
      groupKey: 'sla_breaches',
      deepLink: { type: 'entity', entityType: data.entityType, entityId: data.entityId },
      actions: [
        { id: 'escalate', label: 'تصعيد', action: 'escalate', foreground: true },
        { id: 'assign', label: 'تسليم', action: 'assign', foreground: true, authenticationRequired: true },
      ],
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        remainingMinutes: data.remainingMinutes,
        escalationLevel: data.escalationLevel,
      },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }
}

export const slaAlertService = new SLAAlertService()
