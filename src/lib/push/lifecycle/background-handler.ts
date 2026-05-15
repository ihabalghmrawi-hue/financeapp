import { inAppNotificationStore } from '../notification-store'
import { badgeManager } from '../badge-manager'
import { deviceRegistry } from '../device-registry'

class BackgroundHandler {
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    this.initialized = true

    try {
      const { App } = await import('@capacitor/app')
      await App.addListener('appStateChange', (state: any) => {
        if (state.isActive) {
          this.onForeground()
        } else {
          this.onBackground()
        }
      })
    } catch {
      /* not in capacitor */
    }
  }

  private async onForeground(): Promise<void> {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      PushNotifications.removeAllDeliveredNotifications()
    } catch {
      /* ignore */
    }
  }

  private onBackground(): void {
    try {
      import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications
      })
    } catch {
      /* ignore */
    }
  }

  async handleBackgroundNotification(data: any, companyId: string, userId: string): Promise<void> {
    const notification = {
      id: data.id ?? crypto.randomUUID(),
      companyId: data.companyId ?? companyId,
      userId: data.userId ?? userId,
      category: data.category ?? 'system',
      title: data.title ?? '',
      body: data.body ?? '',
      data: data.data ?? data.additionalData ?? {},
      priority: data.priority ?? 'normal',
      groupKey: data.groupKey,
      actions: data.actions,
      deepLink: data.deepLink,
      badge: data.badge,
      silent: data.silent ?? false,
      status: 'delivered' as const,
      createdAt: data.createdAt ?? new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
    }

    await inAppNotificationStore.push(notification)
    await badgeManager.refreshFromStore(companyId, userId)

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      await PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
        this.handleBackgroundPush(notification, companyId, userId)
      })
    } catch {
      /* ignore */
    }
  }

  private async handleBackgroundPush(notification: any, companyId: string, userId: string): Promise<void> {
    if (notification.data) {
      await this.handleBackgroundNotification(notification.data, companyId, userId)
    }

    const { PushNotifications } = await import('@capacitor/push-notifications')
    PushNotifications.addListener('pushNotificationActionPerformed', async (action: any) => {
      const actionId = action.actionId
      const inputValue = action.inputValue
      const notificationData = action.notification?.data ?? {}

      if (actionId === 'approve' || actionId === 'reject') {
        await this.handleApprovalAction(actionId, notificationData)
      } else if (actionId === 'retry' || actionId === 'retry_workflow') {
        await this.handleRetryAction(notificationData)
      } else if (actionId === 'escalate') {
        await this.handleEscalateAction(notificationData)
      }
    })
  }

  private async handleApprovalAction(actionId: string, data: any): Promise<void> {
    const approvalId = data.approvalId
    if (!approvalId) {
      return
    }

    try {
      const response = await fetch(`/api/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: actionId === 'approve' ? 'approved' : 'rejected',
        }),
      })
      if (response.ok && data.id) {
        await badgeManager.decrement()
      }
    } catch {
      /* offline - will sync later */
    }
  }

  private async handleRetryAction(data: any): Promise<void> {
    const workflowId = data.workflowId
    if (!workflowId) {
      return
    }

    try {
      await fetch(`/api/workflows/${workflowId}/retry`, { method: 'POST' })
    } catch {
      /* offline */
    }
  }

  private async handleEscalateAction(data: any): Promise<void> {
    const entityType = data.entityType
    const entityId = data.entityId

    if (!entityType || !entityId) {
      return
    }

    try {
      await fetch(`/api/escalations/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId }),
      })
    } catch {
      /* offline */
    }
  }
}

export const backgroundHandler = new BackgroundHandler()
