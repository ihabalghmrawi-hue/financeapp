import { buildNotification } from '../payload-builder'
import { deliveryEngine } from '../delivery-engine'
import { notificationPreferences } from '../notification-preferences'

class AccountingAlertService {
  async notifyAnomalyDetected(
    companyId: string,
    userId: string,
    data: {
      anomalyId: string
      description: string
      amount: number
      currency: string
      accountName?: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      anomalyType: string
    },
  ): Promise<boolean> {
    const enabled = await notificationPreferences.isCategoryEnabled(companyId, userId, 'accounting_anomaly')
    if (!enabled) {
      return false
    }

    const notification = buildNotification({
      companyId,
      userId,
      category: 'accounting_anomaly',
      title: `شذوذ محاسبي: ${data.anomalyType}`,
      body: `${data.description}\nالمبلغ: ${data.amount.toLocaleString('ar-SA')} ${data.currency}${data.accountName ? `\nالحساب: ${data.accountName}` : ''}`,
      priority: data.severity === 'critical' ? 'critical' : data.severity === 'high' ? 'high' : 'normal',
      groupKey: 'accounting_anomalies',
      deepLink: { type: 'entity', entityType: 'accounting/anomalies', entityId: data.anomalyId },
      actions: [
        { id: 'investigate', label: 'تحقيق', action: 'open_entity', foreground: true },
        { id: 'dismiss', label: 'تجاهل', action: 'mark_resolved', foreground: true },
      ],
      data: { anomalyId: data.anomalyId, anomalyType: data.anomalyType, amount: data.amount, severity: data.severity },
      metadata: { severity: data.severity },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyUnreconciledEntries(
    companyId: string,
    userId: string,
    data: {
      count: number
      totalAmount: number
      currency: string
      period: string
      daysOpen: number
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'accounting_anomaly',
      title: 'قيود غير مطابقة',
      body: `${data.count} قيد بمبلغ ${data.totalAmount.toLocaleString('ar-SA')} ${data.currency}\nللفترة: ${data.period} (مفتوح منذ ${data.daysOpen} يوم)`,
      priority: data.daysOpen > 30 ? 'high' : 'normal',
      groupKey: 'reconciliation',
      deepLink: { type: 'entity', entityType: 'accounting/reconciliation', entityId: data.period },
      data: { period: data.period, count: data.count, totalAmount: data.totalAmount, daysOpen: data.daysOpen },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyJournalIntegrityFailure(
    companyId: string,
    userId: string,
    data: {
      journalId: string
      description: string
      imbalanceAmount: number
      currency: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'accounting_anomaly',
      title: 'خلل في قيد اليومية',
      body: `${data.description}\nفارغ: ${data.imbalanceAmount.toLocaleString('ar-SA')} ${data.currency}`,
      priority: 'high',
      groupKey: 'integrity_issues',
      deepLink: { type: 'entity', entityType: 'accounting/journal', entityId: data.journalId },
      data: { journalId: data.journalId, imbalanceAmount: data.imbalanceAmount },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyPeriodCloseReminder(
    companyId: string,
    userId: string,
    data: {
      periodName: string
      dueDate: string
      pendingTasks: number
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'accounting_anomaly',
      title: 'تذكير بإقفال الفترة',
      body: `الفترة: ${data.periodName}\nتاريخ الإقفال: ${data.dueDate}\nالمهام المتبقية: ${data.pendingTasks}`,
      priority: 'normal',
      groupKey: 'period_close',
      deepLink: { type: 'entity', entityType: 'accounting/periods', entityId: data.periodName },
      data: { periodName: data.periodName, pendingTasks: data.pendingTasks },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }
}

export const accountingAlertService = new AccountingAlertService()
