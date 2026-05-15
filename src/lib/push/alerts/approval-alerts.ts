import { buildNotification } from '../payload-builder'
import { deliveryEngine } from '../delivery-engine'
import { notificationPreferences } from '../notification-preferences'
import type { PushNotificationData } from '../types'

class ApprovalAlertService {
  async notifyApprovalRequired(
    companyId: string,
    userId: string,
    data: {
      approvalId: string
      title: string
      requesterName: string
      amount?: number
      currency?: string
      slaMinutes?: number
    },
  ): Promise<boolean> {
    const enabled = await notificationPreferences.isCategoryEnabled(companyId, userId, 'approval')
    if (!enabled) {
      return false
    }

    const notification = buildNotification({
      companyId,
      userId,
      category: 'approval',
      title: 'طلب موافقة جديد',
      body: `${data.title} - مقدم من ${data.requesterName}${data.amount ? ` | ${data.amount.toLocaleString('ar-SA')} ${data.currency ?? 'SAR'}` : ''}`,
      priority: data.slaMinutes && data.slaMinutes <= 60 ? 'high' : 'normal',
      groupKey: 'approvals',
      deepLink: { type: 'approval', approvalId: data.approvalId },
      data: { approvalId: data.approvalId, requesterName: data.requesterName, amount: data.amount },
      metadata: { slaMinutes: data.slaMinutes },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyApprovalCompleted(
    companyId: string,
    userId: string,
    data: {
      approvalId: string
      title: string
      decision: 'approved' | 'rejected' | 'conditional'
      decidedBy: string
      comments?: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'approval',
      title:
        data.decision === 'approved' ? 'تمت الموافقة' : data.decision === 'rejected' ? 'تم الرفض' : 'موافقة مشروطة',
      body: `${data.title} - ${data.decidedBy}${data.comments ? `: ${data.comments}` : ''}`,
      priority: 'normal',
      groupKey: 'approvals',
      deepLink: { type: 'approval', approvalId: data.approvalId },
      data: { approvalId: data.approvalId, decision: data.decision, decidedBy: data.decidedBy },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyApprovalReminder(
    companyId: string,
    userId: string,
    data: {
      approvalId: string
      title: string
      remainingMinutes: number
      slaMinutes: number
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'approval',
      title: `تذكير: طلب موافقة في انتظارك`,
      body: `${data.title} - متبقي ${data.remainingMinutes} دقيقة من أصل ${data.slaMinutes} دقيقة`,
      priority: data.remainingMinutes <= 15 ? 'critical' : data.remainingMinutes <= 60 ? 'high' : 'normal',
      groupKey: 'approvals',
      deepLink: { type: 'approval', approvalId: data.approvalId },
      actions: [
        { id: 'approve', label: 'موافقة', action: 'approve', foreground: true, authenticationRequired: true },
        {
          id: 'reject',
          label: 'رفض',
          action: 'reject',
          destructive: true,
          foreground: true,
          authenticationRequired: true,
        },
        { id: 'open', label: 'عرض', action: 'open_entity', foreground: true },
      ],
      data: { approvalId: data.approvalId, remainingMinutes: data.remainingMinutes },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }
}

export const approvalAlertService = new ApprovalAlertService()
