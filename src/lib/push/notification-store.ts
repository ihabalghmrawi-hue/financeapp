import { openDB, type IDBPDatabase } from 'idb'
import type { PushNotificationData, NotificationGroup, PushNotificationCategory } from './types'

const DB_NAME = 'push_notification_store'
const DB_VERSION = 1
const STORE_NAME = 'notifications'

interface NotificationStoreSchema {
  [STORE_NAME]: {
    key: string
    value: PushNotificationData
    indexes: {
      by_company: string
      by_user: string
      by_category: PushNotificationCategory
      by_status: string
      by_created: string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<NotificationStoreSchema>> | null = null

function getDb(): Promise<IDBPDatabase<NotificationStoreSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<NotificationStoreSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('by_company', 'companyId')
          store.createIndex('by_user', 'userId')
          store.createIndex('by_category', 'category')
          store.createIndex('by_status', 'status')
          store.createIndex('by_created', 'createdAt')
        }
      },
    })
  }
  return dbPromise
}

class InAppNotificationStore {
  async push(notification: PushNotificationData): Promise<void> {
    const db = await getDb()
    const existing = await db.get(STORE_NAME, notification.id)
    if (existing) {
      return
    }
    await db.put(STORE_NAME, notification)
  }

  async pushBatch(notifications: PushNotificationData[]): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    for (const n of notifications) {
      const existing = await tx.store.get(n.id)
      if (!existing) {
        await tx.store.put(n)
      }
    }
    await tx.done
  }

  async getById(id: string): Promise<PushNotificationData | undefined> {
    const db = await getDb()
    return db.get(STORE_NAME, id)
  }

  async getByUser(companyId: string, userId: string, limit = 50, offset = 0): Promise<PushNotificationData[]> {
    const db = await getDb()
    const all = await db.getAllFromIndex(STORE_NAME, 'by_user', userId)
    const filtered = all.filter((n) => n.companyId === companyId)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return filtered.slice(offset, offset + limit)
  }

  async getByCategory(
    companyId: string,
    userId: string,
    category: PushNotificationCategory,
    limit = 20,
  ): Promise<PushNotificationData[]> {
    const db = await getDb()
    const all = await db.getAllFromIndex(STORE_NAME, 'by_category', category)
    const filtered = all.filter((n) => n.companyId === companyId && n.userId === userId)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return filtered.slice(0, limit)
  }

  async getUnreadCount(companyId: string, userId: string): Promise<number> {
    const db = await getDb()
    const all = await db.getAllFromIndex(STORE_NAME, 'by_user', userId)
    return all.filter((n) => n.companyId === companyId && (n.status === 'pending' || n.status === 'delivered')).length
  }

  async getRecent(companyId: string, userId: string, minutes = 5): Promise<PushNotificationData[]> {
    const cutoff = Date.now() - minutes * 60 * 1000
    const db = await getDb()
    const all = await db.getAllFromIndex(STORE_NAME, 'by_user', userId)
    return all.filter((n) => n.companyId === companyId && new Date(n.createdAt).getTime() > cutoff)
  }

  async markAsRead(id: string): Promise<void> {
    const db = await getDb()
    const notification = await db.get(STORE_NAME, id)
    if (notification) {
      notification.status = 'read'
      notification.readAt = new Date().toISOString()
      await db.put(STORE_NAME, notification)
    }
  }

  async markAllAsRead(companyId: string, userId: string): Promise<number> {
    const db = await getDb()
    const all = await db.getAllFromIndex(STORE_NAME, 'by_user', userId)
    let count = 0
    const tx = db.transaction(STORE_NAME, 'readwrite')
    for (const n of all) {
      if (n.companyId === companyId && (n.status === 'pending' || n.status === 'delivered')) {
        n.status = 'read'
        n.readAt = new Date().toISOString()
        await tx.store.put(n)
        count++
      }
    }
    await tx.done
    return count
  }

  async markAsDismissed(id: string): Promise<void> {
    const db = await getDb()
    const notification = await db.get(STORE_NAME, id)
    if (notification) {
      notification.status = 'dismissed'
      await db.put(STORE_NAME, notification)
    }
  }

  async dismissOld(maxAgeDays = 30): Promise<number> {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    const db = await getDb()
    const all = await db.getAll(STORE_NAME)
    let count = 0
    const tx = db.transaction(STORE_NAME, 'readwrite')
    for (const n of all) {
      if (new Date(n.createdAt).getTime() < cutoff) {
        if (n.status === 'read' || n.status === 'dismissed') {
          await tx.store.delete(n.id)
          count++
        }
      }
    }
    await tx.done
    return count
  }

  async getGroups(companyId: string, userId: string): Promise<NotificationGroup[]> {
    const all = await this.getByUser(companyId, userId, 200)
    const groups = new Map<string, PushNotificationData[]>()

    for (const n of all) {
      const key = n.groupKey ?? n.category
      const list = groups.get(key) ?? []
      list.push(n)
      groups.set(key, list)
    }

    return Array.from(groups.entries())
      .map(([key, notifications]) => {
        const sorted = notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const latest = sorted[0]
        return {
          key,
          category: latest.category,
          title: latest.groupKey ? latest.title : (CATEGORY_GROUP_TITLES[latest.category] ?? latest.title),
          count: sorted.length,
          lastNotification: latest,
          unread: sorted.some((n) => n.status === 'pending' || n.status === 'delivered'),
          priority: highestPriority(sorted.map((n) => n.priority)),
        }
      })
      .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority])
  }

  async clearAll(): Promise<void> {
    const db = await getDb()
    await db.clear(STORE_NAME)
  }
}

const CATEGORY_GROUP_TITLES: Partial<Record<PushNotificationCategory, string>> = {
  approval: 'الموافقات',
  sla_breach: 'انتهاكات SLA',
  workflow_failed: 'إخفاقات سير العمل',
  inventory: 'المخزون',
  payment: 'المدفوعات',
  accounting_anomaly: 'شذوذ محاسبي',
  integration: 'التكامل',
  escalation: 'التصعيدات',
  security: 'الأمان',
  system: 'النظام',
  sync: 'المزامنة',
  reminder: 'التذكيرات',
}

const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
}

function highestPriority(priorities: string[]): 'critical' | 'high' | 'normal' | 'low' {
  let highest = 0
  let result: 'critical' | 'high' | 'normal' | 'low' = 'low'
  for (const p of priorities) {
    const order = PRIORITY_ORDER[p] ?? 0
    if (order > highest) {
      highest = order
      result = p as 'critical' | 'high' | 'normal' | 'low'
    }
  }
  return result
}

export const inAppNotificationStore = new InAppNotificationStore()
