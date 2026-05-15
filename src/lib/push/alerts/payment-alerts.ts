import { buildNotification } from '../payload-builder'
import { deliveryEngine } from '../delivery-engine'
import { notificationPreferences } from '../notification-preferences'

class PaymentAlertService {
  async notifyOverduePayment(
    companyId: string,
    userId: string,
    data: {
      invoiceId: string
      invoiceNumber: string
      amount: number
      currency: string
      dueDate: string
      daysOverdue: number
      customerName?: string
      supplierName?: string
    },
  ): Promise<boolean> {
    const enabled = await notificationPreferences.isCategoryEnabled(companyId, userId, 'payment')
    if (!enabled) {
      return false
    }

    const party = data.customerName ?? data.supplierName ?? ''
    const title = data.customerName ? 'فاتورة عميل متأخرة' : 'فاتورة مورد متأخرة'

    const notification = buildNotification({
      companyId,
      userId,
      category: 'payment',
      title,
      body: `${data.invoiceNumber} - ${data.amount.toLocaleString('ar-SA')} ${data.currency}${party ? `\n${party}` : ''}\nمتأخرة ${data.daysOverdue} يوم`,
      priority: data.daysOverdue > 30 ? 'critical' : data.daysOverdue > 15 ? 'high' : 'normal',
      groupKey: 'overdue_payments',
      deepLink: { type: 'invoice', invoiceId: data.invoiceId },
      actions: [
        {
          id: 'resolve',
          label: 'تأكيد الدفع',
          action: 'mark_resolved',
          foreground: true,
          authenticationRequired: true,
        },
        { id: 'open', label: 'عرض الفاتورة', action: 'open_entity', foreground: true },
      ],
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        daysOverdue: data.daysOverdue,
        invoiceNumber: data.invoiceNumber,
      },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyPaymentReceived(
    companyId: string,
    userId: string,
    data: {
      invoiceId: string
      amount: number
      currency: string
      customerName: string
      paymentMethod?: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'payment',
      title: 'تم استلام الدفع',
      body: `${data.amount.toLocaleString('ar-SA')} ${data.currency} من ${data.customerName}${data.paymentMethod ? ` عبر ${data.paymentMethod}` : ''}`,
      priority: 'normal',
      deepLink: { type: 'invoice', invoiceId: data.invoiceId },
      data: { invoiceId: data.invoiceId, amount: data.amount, paymentReceived: true },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyPaymentFailed(
    companyId: string,
    userId: string,
    data: {
      invoiceId: string
      amount: number
      currency: string
      reason: string
      customerName?: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'payment',
      title: 'فشل عملية الدفع',
      body: `${data.amount.toLocaleString('ar-SA')} ${data.currency}${data.customerName ? ` - ${data.customerName}` : ''}\nالسبب: ${data.reason}`,
      priority: 'high',
      groupKey: 'payment_failures',
      deepLink: { type: 'invoice', invoiceId: data.invoiceId },
      actions: [
        { id: 'retry', label: 'إعادة المحاولة', action: 'retry_workflow', foreground: true },
        { id: 'open', label: 'تفاصيل', action: 'open_entity', foreground: true },
      ],
      data: { invoiceId: data.invoiceId, amount: data.amount, reason: data.reason },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyCreditLimitExceeded(
    companyId: string,
    userId: string,
    data: {
      customerId: string
      customerName: string
      currentBalance: number
      creditLimit: number
      currency: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'payment',
      title: 'تجاوز الحد الائتماني',
      body: `${data.customerName} - الرصيد الحالي: ${data.currentBalance.toLocaleString('ar-SA')} ${data.currency}\nالحد: ${data.creditLimit.toLocaleString('ar-SA')} ${data.currency}`,
      priority: 'critical',
      groupKey: 'credit_alerts',
      deepLink: { type: 'entity', entityType: 'customers', entityId: data.customerId },
      data: { customerId: data.customerId, currentBalance: data.currentBalance, creditLimit: data.creditLimit },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }
}

export const paymentAlertService = new PaymentAlertService()
