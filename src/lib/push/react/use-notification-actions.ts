'use client'

import { useCallback } from 'react'
import { deliveryEngine } from '../delivery-engine'
import { inAppNotificationStore } from '../notification-store'
import type { PushNotificationData, DeepLinkRoute } from '../types'

interface NotificationActions {
  approve: (notification: PushNotificationData) => Promise<void>
  reject: (notification: PushNotificationData) => Promise<void>
  retry: (notification: PushNotificationData) => Promise<void>
  escalate: (notification: PushNotificationData) => Promise<void>
  assign: (notification: PushNotificationData, assigneeId: string) => Promise<void>
  markResolved: (notification: PushNotificationData) => Promise<void>
  openEntity: (notification: PushNotificationData) => void
  openLink: (url: string) => void
}

export function useNotificationActions(): NotificationActions {
  const approve = useCallback(async (notification: PushNotificationData) => {
    const approvalId = notification.data?.approvalId as string | undefined
    if (approvalId) {
      try {
        await fetch(`/api/approvals/${approvalId}/decide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'approved' }),
        })
      } catch {
        /* offline */
      }
    }
    await deliveryEngine.markAsRead(notification.id)
  }, [])

  const reject = useCallback(async (notification: PushNotificationData) => {
    const approvalId = notification.data?.approvalId as string | undefined
    if (approvalId) {
      try {
        await fetch(`/api/approvals/${approvalId}/decide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'rejected' }),
        })
      } catch {
        /* offline */
      }
    }
    await deliveryEngine.markAsRead(notification.id)
  }, [])

  const retry = useCallback(async (notification: PushNotificationData) => {
    const workflowId = notification.data?.workflowId as string | undefined
    if (workflowId) {
      try {
        await fetch(`/api/workflows/${workflowId}/retry`, { method: 'POST' })
      } catch {
        /* offline */
      }
    }
  }, [])

  const escalate = useCallback(async (notification: PushNotificationData) => {
    const entityType = notification.data?.entityType as string | undefined
    const entityId = notification.data?.entityId as string | undefined
    if (entityType && entityId) {
      try {
        await fetch('/api/escalations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType, entityId }),
        })
      } catch {
        /* offline */
      }
    }
  }, [])

  const assign = useCallback(async (notification: PushNotificationData, assigneeId: string) => {
    const entityType = notification.data?.entityType as string | undefined
    const entityId = notification.data?.entityId as string | undefined
    if (entityType && entityId) {
      try {
        await fetch(`/api/entity/${entityType}/${entityId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigneeId }),
        })
      } catch {
        /* offline */
      }
    }
  }, [])

  const markResolved = useCallback(async (notification: PushNotificationData) => {
    await deliveryEngine.markAsDismissed(notification.id)
  }, [])

  const openEntity = useCallback((notification: PushNotificationData) => {
    const url = notification.deepLink
    if (url) {
      window.location.href = url
    }
  }, [])

  const openLink = useCallback((url: string) => {
    window.location.href = url
  }, [])

  return { approve, reject, retry, escalate, assign, markResolved, openEntity, openLink }
}
