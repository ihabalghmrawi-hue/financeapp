import { buildNotification } from '../payload-builder'
import { deliveryEngine } from '../delivery-engine'
import { notificationPreferences } from '../notification-preferences'

class WorkflowAlertService {
  async notifyWorkflowFailed(
    companyId: string,
    userId: string,
    data: {
      workflowId: string
      workflowName: string
      stepName: string
      errorMessage?: string
      priority?: string
    },
  ): Promise<boolean> {
    const enabled = await notificationPreferences.isCategoryEnabled(companyId, userId, 'workflow_failed')
    if (!enabled) {
      return false
    }

    const notification = buildNotification({
      companyId,
      userId,
      category: 'workflow_failed',
      title: 'فشل سير العمل',
      body: `${data.workflowName} - الخطوة: ${data.stepName}${data.errorMessage ? `\n${data.errorMessage}` : ''}`,
      priority: (data.priority as any) === 'high' ? 'critical' : 'high',
      groupKey: 'workflow_failures',
      deepLink: { type: 'workflow', workflowId: data.workflowId },
      actions: [
        { id: 'retry', label: 'إعادة محاولة', action: 'retry_workflow', foreground: true },
        { id: 'open', label: 'تفاصيل', action: 'open_entity', foreground: true },
      ],
      data: { workflowId: data.workflowId, stepName: data.stepName, errorMessage: data.errorMessage },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyWorkflowCompleted(
    companyId: string,
    userId: string,
    data: {
      workflowId: string
      workflowName: string
      result?: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'workflow_failed',
      title: 'اكتمل سير العمل',
      body: `${data.workflowName}${data.result ? ` - ${data.result}` : ''}`,
      priority: 'normal',
      deepLink: { type: 'workflow', workflowId: data.workflowId },
      data: { workflowId: data.workflowId, completed: true },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyStepAssigned(
    companyId: string,
    userId: string,
    data: {
      workflowId: string
      workflowName: string
      stepName: string
      dueDate?: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'workflow_failed',
      title: 'مهمة جديدة في سير العمل',
      body: `${data.workflowName} - ${data.stepName}${data.dueDate ? `\nتاريخ الاستحقاق: ${data.dueDate}` : ''}`,
      priority: 'high',
      groupKey: 'workflow_tasks',
      deepLink: { type: 'workflow', workflowId: data.workflowId },
      data: { workflowId: data.workflowId, stepName: data.stepName, assigned: true },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }
}

export const workflowAlertService = new WorkflowAlertService()
