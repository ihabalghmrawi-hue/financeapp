import { buildNotification } from '../payload-builder'
import { deliveryEngine } from '../delivery-engine'
import { notificationPreferences } from '../notification-preferences'

class EscalationAlertService {
  async notifyEscalation(
    companyId: string,
    userId: string,
    data: {
      escalationId: string
      entityType: string
      entityId: string
      entityName: string
      level: number
      previousAssignee: string
      reason: string
      slaMinutes?: number
    },
  ): Promise<boolean> {
    const enabled = await notificationPreferences.isCategoryEnabled(companyId, userId, 'escalation')
    if (!enabled) {
      return false
    }

    const levelLabel = this.getLevelLabel(data.level)

    const notification = buildNotification({
      companyId,
      userId,
      category: 'escalation',
      title: `تصعيد: ${data.entityName}`,
      body: `المستوى ${data.level} - ${levelLabel}\nالسبب: ${data.reason}\nمحول من: ${data.previousAssignee}`,
      priority: data.level >= 3 ? 'critical' : data.level >= 2 ? 'high' : 'normal',
      groupKey: 'escalations',
      deepLink: { type: 'entity', entityType: data.entityType, entityId: data.entityId },
      actions: [
        { id: 'assign', label: 'تسليم', action: 'assign', foreground: true, authenticationRequired: true },
        { id: 'open', label: 'عرض', action: 'open_entity', foreground: true },
      ],
      data: {
        escalationId: data.escalationId,
        level: data.level,
        reason: data.reason,
        entityType: data.entityType,
        entityId: data.entityId,
      },
      metadata: { escalationLevel: data.level, slaMinutes: data.slaMinutes },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyManagerEscalation(
    companyId: string,
    userId: string,
    data: {
      escalationId: string
      entityName: string
      employeeName: string
      level: number
      pendingDuration: number
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'escalation',
      title: `تصعيد للمشرف: ${data.entityName}`,
      body: `${data.employeeName} - معلق منذ ${Math.round(data.pendingDuration / 60)} دقيقة\nالمستوى: ${data.level}`,
      priority: data.level >= 3 ? 'critical' : 'high',
      groupKey: 'escalations',
      deepLink: { type: 'entity', entityType: 'escalations', entityId: data.escalationId },
      actions: [
        { id: 'assign', label: 'تسليم', action: 'assign', foreground: true, authenticationRequired: true },
        { id: 'escalate', label: 'تصعيد لأعلى', action: 'escalate', foreground: true },
      ],
      data: { escalationId: data.escalationId, level: data.level, employeeName: data.employeeName },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyEscalationResolved(
    companyId: string,
    userId: string,
    data: {
      escalationId: string
      entityName: string
      resolvedBy: string
      resolution: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'escalation',
      title: 'تم حل التصعيد',
      body: `${data.entityName}\nتم الحل بواسطة: ${data.resolvedBy}\nالإجراء: ${data.resolution}`,
      priority: 'normal',
      deepLink: { type: 'entity', entityType: 'escalations', entityId: data.escalationId },
      data: { escalationId: data.escalationId, resolvedBy: data.resolvedBy, resolution: data.resolution },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  private getLevelLabel(level: number): string {
    const labels: Record<number, string> = {
      1: 'المشرف المباشر',
      2: 'مدير القسم',
      3: 'الإدارة التنفيذية',
      4: 'الإدارة العليا',
    }
    return labels[level] ?? `المستوى ${level}`
  }
}

export const escalationAlertService = new EscalationAlertService()
