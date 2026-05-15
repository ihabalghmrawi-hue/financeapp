import { buildNotification } from '../payload-builder'
import { deliveryEngine } from '../delivery-engine'
import { notificationPreferences } from '../notification-preferences'

class SecurityAlertService {
  async notifyUnauthorizedAccess(
    companyId: string,
    userId: string,
    data: {
      userId: string
      userName: string
      resource: string
      action: string
      ipAddress?: string
      timestamp: string
      userAgent?: string
    },
  ): Promise<boolean> {
    const enabled = await notificationPreferences.isCategoryEnabled(companyId, userId, 'security')
    if (!enabled) {
      return false
    }

    const notification = buildNotification({
      companyId,
      userId,
      category: 'security',
      title: 'محاولة وصول غير مصرح بها',
      body: `${data.userName}\nالموارد: ${data.resource}\nالإجراء: ${data.action}${data.ipAddress ? `\nIP: ${data.ipAddress}` : ''}`,
      priority: 'critical',
      groupKey: 'security_alerts',
      actions: [
        { id: 'investigate', label: 'تحقيق', action: 'open_entity', foreground: true, authenticationRequired: true },
        { id: 'acknowledge', label: 'إقرار', action: 'mark_resolved', foreground: true },
      ],
      data: { alertUserId: data.userId, resource: data.resource, action: data.action, ipAddress: data.ipAddress },
      metadata: { securityAlert: true },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifySuspiciousActivity(
    companyId: string,
    userId: string,
    data: {
      activityType: string
      description: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      ipAddress?: string
      location?: string
      timestamp: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'security',
      title: `نشاط مشبوه: ${data.activityType}`,
      body: `${data.description}${data.location ? `\nالموقع: ${data.location}` : ''}${data.ipAddress ? `\nIP: ${data.ipAddress}` : ''}`,
      priority: data.severity === 'critical' ? 'critical' : data.severity === 'high' ? 'high' : 'normal',
      groupKey: 'security_alerts',
      actions: [
        { id: 'investigate', label: 'تحقيق', action: 'open_entity', foreground: true, authenticationRequired: true },
      ],
      data: { activityType: data.activityType, severity: data.severity, ipAddress: data.ipAddress },
      metadata: { severity: data.severity, securityAlert: true },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyPasswordChange(
    companyId: string,
    userId: string,
    data: {
      changedBy: string
      timestamp: string
      isAdminChange: boolean
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'security',
      title: 'تغيير كلمة المرور',
      body: data.isAdminChange
        ? `تم تغيير كلمة المرور بواسطة المشرف (${data.changedBy})`
        : `تم تغيير كلمة المرور بواسطة ${data.changedBy}`,
      priority: 'high',
      data: { changedBy: data.changedBy, isAdminChange: data.isAdminChange },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyNewDeviceLogin(
    companyId: string,
    userId: string,
    data: {
      deviceName: string
      browser?: string
      location?: string
      ipAddress: string
      timestamp: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'security',
      title: 'تسجيل دخول من جهاز جديد',
      body: `${data.deviceName}${data.location ? ` - ${data.location}` : ''}\nIP: ${data.ipAddress}`,
      priority: 'high',
      groupKey: 'new_devices',
      actions: [
        { id: 'acknowledge', label: 'هذا أنا', action: 'mark_resolved', foreground: true },
        { id: 'investigate', label: 'ليس أنا', action: 'open_entity', foreground: true, destructive: true },
      ],
      data: { deviceName: data.deviceName, ipAddress: data.ipAddress, location: data.location },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyPermissionChange(
    companyId: string,
    userId: string,
    data: {
      staffId: string
      staffName: string
      changedBy: string
      changes: string[]
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'security',
      title: 'تغيير صلاحيات',
      body: `${data.staffName}\nتم التغيير بواسطة: ${data.changedBy}\nالتغييرات: ${data.changes.join('، ')}`,
      priority: 'high',
      groupKey: 'permission_changes',
      deepLink: { type: 'entity', entityType: 'admin/staff', entityId: data.staffId },
      data: { staffId: data.staffId, changes: data.changes },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }
}

export const securityAlertService = new SecurityAlertService()
