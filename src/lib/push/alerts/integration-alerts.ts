import { buildNotification } from '../payload-builder'
import { deliveryEngine } from '../delivery-engine'
import { notificationPreferences } from '../notification-preferences'

class IntegrationAlertService {
  async notifyIntegrationFailed(
    companyId: string,
    userId: string,
    data: {
      integrationName: string
      endpoint?: string
      errorMessage: string
      timestamp: string
      retryCount?: number
    },
  ): Promise<boolean> {
    const enabled = await notificationPreferences.isCategoryEnabled(companyId, userId, 'integration')
    if (!enabled) {
      return false
    }

    const notification = buildNotification({
      companyId,
      userId,
      category: 'integration',
      title: `فشل تكامل: ${data.integrationName}`,
      body: `${data.errorMessage}${data.endpoint ? `\nالنقطة: ${data.endpoint}` : ''}${data.retryCount ? `\nمحاولات: ${data.retryCount}` : ''}`,
      priority: data.retryCount && data.retryCount >= 3 ? 'critical' : 'high',
      groupKey: 'integration_failures',
      deepLink: { type: 'settings', section: 'integrations' },
      actions: [
        { id: 'retry', label: 'إعادة محاولة', action: 'retry_integration', foreground: true },
        { id: 'open', label: 'الإعدادات', action: 'open_entity', foreground: true },
      ],
      data: { integrationName: data.integrationName, errorMessage: data.errorMessage, retryCount: data.retryCount },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyIntegrationRecovered(
    companyId: string,
    userId: string,
    data: {
      integrationName: string
      downtime: number
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'integration',
      title: 'تم استعادة التكامل',
      body: `${data.integrationName} - عاد للعمل بعد ${Math.round(data.downtime / 60)} دقيقة من التوقف`,
      priority: 'normal',
      deepLink: { type: 'settings', section: 'integrations' },
      data: { integrationName: data.integrationName, recovered: true },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifySyncCompleted(
    companyId: string,
    userId: string,
    data: {
      integrationName: string
      recordsSynced: number
      duration: number
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'integration',
      title: 'اكتملت المزامنة',
      body: `${data.integrationName} - تمت مزامنة ${data.recordsSynced} سجل في ${data.duration} ثانية`,
      priority: 'low',
      data: { integrationName: data.integrationName, recordsSynced: data.recordsSynced },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }
}

export const integrationAlertService = new IntegrationAlertService()
