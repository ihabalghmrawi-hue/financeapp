import type {
  PushNotificationData,
  PushNotificationCategory,
  PushNotificationPriority,
  PushNotificationAction,
  DeepLinkRoute,
} from './types'
import { CATEGORY_ACTIONS } from './types'

export interface BuildNotificationInput {
  companyId: string
  userId: string
  category: PushNotificationCategory
  title: string
  body: string
  priority?: PushNotificationPriority
  groupKey?: string
  deepLink?: DeepLinkRoute | string
  actions?: PushNotificationAction[]
  silent?: boolean
  data?: Record<string, unknown>
  badge?: number
  ttl?: number
  metadata?: Record<string, unknown>
}

export function buildNotification(input: BuildNotificationInput): PushNotificationData {
  const actions = input.actions ?? CATEGORY_ACTIONS[input.category]
  const deepLink =
    typeof input.deepLink === 'string' ? input.deepLink : input.deepLink ? buildDeepLinkUrl(input.deepLink) : undefined

  return {
    id: crypto.randomUUID(),
    companyId: input.companyId,
    userId: input.userId,
    category: input.category,
    title: input.title,
    body: input.body,
    priority: input.priority ?? 'normal',
    groupKey: input.groupKey,
    actions,
    deepLink,
    silent: input.silent ?? false,
    data: input.data,
    badge: input.badge,
    ttl: input.ttl,
    status: 'pending',
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  }
}

export function buildDeepLinkUrl(route: DeepLinkRoute): string {
  switch (route.type) {
    case 'approval':
      return `/dashboard/approvals/${route.approvalId}`
    case 'workflow':
      return route.stepId
        ? `/dashboard/workflow/${route.workflowId}?step=${route.stepId}`
        : `/dashboard/workflow/${route.workflowId}`
    case 'invoice':
      return `/dashboard/sales/invoices/${route.invoiceId}`
    case 'order':
      return `/dashboard/sales/orders/${route.orderId}`
    case 'inventory_item':
      return `/dashboard/inventory/items/${route.itemId}`
    case 'entity':
      return `/dashboard/${route.entityType}/${route.entityId}`
    case 'report':
      return `/dashboard/reports/${route.reportType}${route.params ? `?${new URLSearchParams(route.params).toString()}` : ''}`
    case 'settings':
      return `/dashboard/settings/${route.section}`
    case 'url':
      return route.url
    default:
      return '/dashboard'
  }
}

export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const u = new URL(url, window.location.origin)
    const path = u.pathname

    const approvalMatch = path.match(/\/dashboard\/approvals\/(.+)/)
    if (approvalMatch) {
      return { type: 'approval', approvalId: approvalMatch[1] }
    }

    const invoiceMatch = path.match(/\/dashboard\/sales\/invoices\/(.+)/)
    if (invoiceMatch) {
      return { type: 'invoice', invoiceId: invoiceMatch[1] }
    }

    const orderMatch = path.match(/\/dashboard\/sales\/orders\/(.+)/)
    if (orderMatch) {
      return { type: 'order', orderId: orderMatch[1] }
    }

    const itemMatch = path.match(/\/dashboard\/inventory\/items\/(.+)/)
    if (itemMatch) {
      return { type: 'inventory_item', itemId: itemMatch[1] }
    }

    const workflowMatch = path.match(/\/dashboard\/workflow\/([^/?]+)/)
    if (workflowMatch) {
      const stepId = u.searchParams.get('step') ?? undefined
      return { type: 'workflow', workflowId: workflowMatch[1], stepId }
    }

    const reportMatch = path.match(/\/dashboard\/reports\/(.+)/)
    if (reportMatch) {
      return { type: 'report', reportType: reportMatch[1] }
    }

    const settingsMatch = path.match(/\/dashboard\/settings\/(.+)/)
    if (settingsMatch) {
      return { type: 'settings', section: settingsMatch[1] }
    }

    const entityMatch = path.match(/\/dashboard\/([^/]+)\/(.+)/)
    if (entityMatch) {
      return { type: 'entity', entityType: entityMatch[1], entityId: entityMatch[2] }
    }

    return { type: 'url', url }
  } catch {
    return { type: 'url', url }
  }
}
