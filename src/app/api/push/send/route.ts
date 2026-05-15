import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SendRequest {
  token: string
  platform: string
  notification: {
    title: string
    body: string
    data?: Record<string, unknown>
    category?: string
    priority?: string
    sound?: string
    badge?: number
    actions?: Array<{
      action: string
      title: string
      destructive?: boolean
      authenticationRequired?: boolean
      foreground?: boolean
    }>
    groupKey?: string
    deepLink?: string
    silent?: boolean
  }
  notificationId?: string
}

export async function POST(request: Request) {
  try {
    const body: SendRequest = await request.json()
    const { token, platform, notification, notificationId } = body

    if (!token || !notification?.title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const fcmServerKey = process.env.FCM_SERVER_KEY

    if (!fcmServerKey) {
      return NextResponse.json({ error: 'FCM not configured on server' }, { status: 501 })
    }

    const message: any = {
      to: token,
      priority: notification.priority === 'high' || notification.priority === 'critical' ? 'high' : 'normal',
      content_available: true,
    }

    if (platform === 'android' || platform === 'ios') {
      message.notification = {
        title: notification.title,
        body: notification.body,
        sound: notification.sound ?? 'default',
        badge: notification.badge ?? 1,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      }

      message.data = {
        ...(notification.data ?? {}),
        notificationId: notificationId ?? '',
        category: notification.category ?? '',
        priority: notification.priority ?? 'normal',
        deepLink: notification.deepLink ?? '',
        groupKey: notification.groupKey ?? '',
        actions: JSON.stringify(notification.actions ?? []),
      }

      if (platform === 'android') {
        message.android = {
          priority: notification.priority === 'high' || notification.priority === 'critical' ? 'high' : 'normal',
          ttl: notification.priority === 'critical' ? '0s' : '86400s',
          notification: {
            channel_id: notification.category ?? 'general',
            tag: notification.groupKey,
            click_action: 'OPEN_MAIN_ACTIVITY',
            color: '#2563eb',
          },
        }

        if (notification.actions && notification.actions.length > 0) {
          message.android.notification.actions = notification.actions.map((a: any) => a.action)
        }
      }

      if (platform === 'ios') {
        message.apns = {
          payload: {
            aps: {
              alert: { title: notification.title, body: notification.body },
              sound: notification.sound ?? 'default',
              badge: notification.badge ?? 1,
              'content-available': notification.silent ? 1 : 0,
              'mutable-content': 1,
              category: notification.category,
              'thread-id': notification.groupKey,
            },
          },
        }
      }
    } else {
      message.notification = { title: notification.title, body: notification.body }
      message.data = { ...(notification.data ?? {}), notificationId: notificationId ?? '' }
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${fcmServerKey}`,
      },
      body: JSON.stringify(message),
    })

    const result = await response.text()

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        return NextResponse.json({ error: 'Invalid token - should be unregistered', result }, { status: 410 })
      }
      return NextResponse.json({ error: 'FCM delivery failed', result }, { status: 502 })
    }

    await logDelivery(notificationId, 'sent')

    return NextResponse.json({ sent: true, result })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function logDelivery(notificationId?: string, status?: string) {
  if (!notificationId) {
    return
  }
  try {
    const supabase = createClient()
    await supabase.from('notification_delivery').insert({
      notification_id: notificationId,
      channel: 'push',
      delivered_at: status === 'sent' ? new Date().toISOString() : null,
      error: status === 'sent' ? null : 'delivery_failed',
    })
  } catch {
    /* ignore */
  }
}
