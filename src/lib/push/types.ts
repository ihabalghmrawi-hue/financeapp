export type PushPlatform = 'android' | 'ios' | 'web'

export interface PushDevice {
  id: string
  companyId: string
  userId: string
  token: string
  platform: PushPlatform
  deviceName?: string
  deviceId?: string
  osVersion?: string
  appVersion?: string
  isActive: boolean
  lastSeenAt: string
  createdAt: string
  updatedAt: string
}

export type PushNotificationCategory =
  | 'approval'
  | 'sla_breach'
  | 'workflow_failed'
  | 'inventory'
  | 'payment'
  | 'accounting_anomaly'
  | 'integration'
  | 'escalation'
  | 'security'
  | 'system'
  | 'sync'
  | 'reminder'

export type PushNotificationPriority = 'low' | 'normal' | 'high' | 'critical'

export type NotificationStatus = 'pending' | 'delivered' | 'failed' | 'read' | 'dismissed'

export interface PushNotificationAction {
  id: string
  label: string
  action: string
  destructive?: boolean
  authenticationRequired?: boolean
  foreground?: boolean
}

export interface PushNotificationData {
  id: string
  companyId: string
  userId: string
  category: PushNotificationCategory
  title: string
  body: string
  data?: Record<string, unknown>
  priority: PushNotificationPriority
  groupKey?: string
  actions?: PushNotificationAction[]
  deepLink?: string
  badge?: number
  silent?: boolean
  ttl?: number
  status: NotificationStatus
  createdAt: string
  deliveredAt?: string
  readAt?: string
  error?: string
  metadata?: Record<string, unknown>
}

export type DeepLinkRoute =
  | { type: 'entity'; entityType: string; entityId: string }
  | { type: 'approval'; approvalId: string }
  | { type: 'workflow'; workflowId: string; stepId?: string }
  | { type: 'invoice'; invoiceId: string }
  | { type: 'order'; orderId: string }
  | { type: 'inventory_item'; itemId: string }
  | { type: 'report'; reportType: string; params?: Record<string, string> }
  | { type: 'settings'; section: string }
  | { type: 'url'; url: string }

export interface NotificationGroup {
  key: string
  category: PushNotificationCategory
  title: string
  count: number
  lastNotification: PushNotificationData
  unread: boolean
  priority: PushNotificationPriority
}

export interface NotificationPreferences {
  companyId: string
  userId: string
  enabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  categoryPreferences: Record<PushNotificationCategory, CategoryPreference>
  priorityThreshold: PushNotificationPriority
  badgeEnabled: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  updatedAt: string
}

export interface CategoryPreference {
  enabled: boolean
  sound?: boolean
  vibration?: boolean
  priority?: PushNotificationPriority
  group?: boolean
}

export const DEFAULT_CATEGORY_PREFERENCE: CategoryPreference = {
  enabled: true,
  sound: true,
  vibration: true,
  group: true,
}

export const CATEGORY_LABELS: Record<PushNotificationCategory, { title: string; description: string }> = {
  approval: { title: 'الموافقات', description: 'طلبات الموافقة على المعاملات' },
  sla_breach: { title: 'انتهاك SLA', description: 'تجاوز المهلة الزمنية للخدمة' },
  workflow_failed: { title: 'فشل سير العمل', description: 'فشل في إحدى خطوات سير العمل' },
  inventory: { title: 'المخزون', description: 'تنبيهات المخزون والمستودعات' },
  payment: { title: 'المدفوعات', description: 'تنبيهات المدفوعات والفواتير' },
  accounting_anomaly: { title: 'شذوذ محاسبي', description: 'كشف حالات شاذة في القيود المحاسبية' },
  integration: { title: 'التكامل', description: 'تنبيهات فشل التكامل مع الأنظمة الخارجية' },
  escalation: { title: 'تصعيد', description: 'تصعيد الطلبات للمستوى الأعلى' },
  security: { title: 'أمان', description: 'تنبيهات أمنية ومحاولات وصول غير مصرح بها' },
  system: { title: 'النظام', description: 'إشعارات النظام العامة' },
  sync: { title: 'المزامنة', description: 'حالة مزامنة البيانات مع الخادم' },
  reminder: { title: 'تذكير', description: 'تذكير بالمهام والمواعيد' },
}

export const CATEGORY_ACTIONS: Record<PushNotificationCategory, PushNotificationAction[]> = {
  approval: [
    { id: 'approve', label: 'موافقة', action: 'approve', foreground: true, authenticationRequired: true },
    { id: 'reject', label: 'رفض', action: 'reject', destructive: true, foreground: true, authenticationRequired: true },
    { id: 'open', label: 'عرض', action: 'open_entity', foreground: true },
  ],
  sla_breach: [
    { id: 'escalate', label: 'تصعيد', action: 'escalate', foreground: true },
    { id: 'open', label: 'عرض', action: 'open_entity', foreground: true },
  ],
  workflow_failed: [
    { id: 'retry', label: 'إعادة محاولة', action: 'retry_workflow', foreground: true },
    { id: 'open', label: 'تفاصيل', action: 'open_entity', foreground: true },
  ],
  inventory: [{ id: 'open', label: 'عرض المخزون', action: 'open_inventory', foreground: true }],
  payment: [
    { id: 'resolve', label: 'تأكيد', action: 'mark_resolved', foreground: true, authenticationRequired: true },
    { id: 'open', label: 'عرض', action: 'open_entity', foreground: true },
  ],
  accounting_anomaly: [
    { id: 'investigate', label: 'تحقيق', action: 'open_entity', foreground: true },
    { id: 'dismiss', label: 'تجاهل', action: 'mark_resolved', foreground: true },
  ],
  integration: [
    { id: 'retry', label: 'إعادة محاولة', action: 'retry_integration', foreground: true },
    { id: 'open', label: 'تفاصيل', action: 'open_entity', foreground: true },
  ],
  escalation: [
    { id: 'assign', label: 'تسليم', action: 'assign', foreground: true, authenticationRequired: true },
    { id: 'open', label: 'عرض', action: 'open_entity', foreground: true },
  ],
  security: [
    { id: 'investigate', label: 'تحقيق', action: 'open_entity', foreground: true, authenticationRequired: true },
    { id: 'acknowledge', label: 'إقرار', action: 'mark_resolved', foreground: true },
  ],
  system: [],
  sync: [],
  reminder: [
    { id: 'open', label: 'عرض', action: 'open_entity', foreground: true },
    { id: 'dismiss', label: 'تجاهل', action: 'dismiss', destructive: false },
  ],
}
