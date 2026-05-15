export { deviceRegistry } from './device-registry'
export { pushRegistrationService } from './push-registration'
export { inAppNotificationStore } from './notification-store'
export { notificationPreferences } from './notification-preferences'
export { badgeManager } from './badge-manager'
export { deliveryEngine } from './delivery-engine'
export { deepLinkHandler } from './deep-link-routes'
export { foregroundHandler } from './lifecycle/foreground-handler'
export { backgroundHandler } from './lifecycle/background-handler'
export { resumeSyncService } from './lifecycle/resume-sync'

export { buildNotification, buildDeepLinkUrl, parseDeepLink } from './payload-builder'
export type { BuildNotificationInput } from './payload-builder'

export { PushProvider, usePush } from './react/push-provider'
export { usePushNotifications } from './react/use-push-notification'
export { useNotificationActions } from './react/use-notification-actions'
export { useDeepLink } from './react/use-deep-link'

export { approvalAlertService } from './alerts/approval-alerts'
export { slaAlertService } from './alerts/sla-alerts'
export { workflowAlertService } from './alerts/workflow-alerts'
export { inventoryAlertService } from './alerts/inventory-alerts'
export { paymentAlertService } from './alerts/payment-alerts'
export { accountingAlertService } from './alerts/accounting-alerts'
export { integrationAlertService } from './alerts/integration-alerts'
export { escalationAlertService } from './alerts/escalation-alerts'
export { securityAlertService } from './alerts/security-alerts'

export { notificationBridge } from './integrations/notification-bridge'
export { workflowBridge } from './integrations/workflow-bridge'
export { eventBusBridge } from './integrations/event-bus-bridge'

export type {
  PushDevice,
  PushNotificationCategory,
  PushNotificationPriority,
  PushNotificationAction,
  PushNotificationData,
  DeepLinkRoute,
  NotificationGroup,
  NotificationPreferences,
  CategoryPreference,
  NotificationStatus,
  PushPlatform,
} from './types'

export { CATEGORY_LABELS, CATEGORY_ACTIONS, DEFAULT_CATEGORY_PREFERENCE } from './types'
