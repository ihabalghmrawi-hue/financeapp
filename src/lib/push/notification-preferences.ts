import type {
  NotificationPreferences,
  CategoryPreference,
  PushNotificationCategory,
  PushNotificationPriority,
} from './types'
import { DEFAULT_CATEGORY_PREFERENCE } from './types'

const STORAGE_KEY_PREFIX = 'push_preferences_'

class NotificationPreferencesManager {
  private cache = new Map<string, NotificationPreferences>()

  private storageKey(companyId: string, userId: string): string {
    return `${STORAGE_KEY_PREFIX}${companyId}_${userId}`
  }

  async get(companyId: string, userId: string): Promise<NotificationPreferences> {
    const key = `${companyId}_${userId}`
    const cached = this.cache.get(key)
    if (cached) {
      return cached
    }

    const defaults = this.defaults(companyId, userId)
    try {
      const stored = localStorage.getItem(this.storageKey(companyId, userId))
      if (stored) {
        const parsed: NotificationPreferences = JSON.parse(stored)
        this.cache.set(key, parsed)
        return parsed
      }
    } catch {
      /* ignore */
    }

    try {
      const response = await fetch(`/api/push/preferences?companyId=${companyId}&userId=${userId}`)
      if (response.ok) {
        const serverPrefs: NotificationPreferences = await response.json()
        this.cache.set(key, serverPrefs)
        localStorage.setItem(this.storageKey(companyId, userId), JSON.stringify(serverPrefs))
        return serverPrefs
      }
    } catch {
      /* offline */
    }

    this.cache.set(key, defaults)
    return defaults
  }

  async update(
    companyId: string,
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const current = await this.get(companyId, userId)
    const updated: NotificationPreferences = { ...current, ...updates, updatedAt: new Date().toISOString() }

    const key = `${companyId}_${userId}`
    this.cache.set(key, updated)
    localStorage.setItem(this.storageKey(companyId, userId), JSON.stringify(updated))

    try {
      await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch {
      /* offline */
    }

    return updated
  }

  async updateCategory(
    companyId: string,
    userId: string,
    category: PushNotificationCategory,
    prefs: Partial<CategoryPreference>,
  ): Promise<NotificationPreferences> {
    const current = await this.get(companyId, userId)
    const updated: NotificationPreferences = {
      ...current,
      categoryPreferences: {
        ...current.categoryPreferences,
        [category]: { ...current.categoryPreferences[category], ...prefs },
      },
      updatedAt: new Date().toISOString(),
    }

    const key = `${companyId}_${userId}`
    this.cache.set(key, updated)
    localStorage.setItem(this.storageKey(companyId, userId), JSON.stringify(updated))

    try {
      await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch {
      /* offline */
    }

    return updated
  }

  async isCategoryEnabled(companyId: string, userId: string, category: PushNotificationCategory): Promise<boolean> {
    const prefs = await this.get(companyId, userId)
    return prefs.enabled && (prefs.categoryPreferences[category]?.enabled ?? true)
  }

  isQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return false
    }
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const current = hours * 60 + minutes

    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number)
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number)
    const start = startH * 60 + startM
    const end = endH * 60 + endM

    if (start <= end) {
      return current >= start && current <= end
    }
    return current >= start || current <= end
  }

  shouldDeliver(
    prefs: NotificationPreferences,
    category: PushNotificationCategory,
    priority: PushNotificationPriority,
  ): boolean {
    if (!prefs.enabled) {
      return false
    }

    const catPref = prefs.categoryPreferences[category]
    if (catPref && !catPref.enabled) {
      return false
    }

    const priorityOrder: Record<string, number> = { low: 1, normal: 2, high: 3, critical: 4 }
    const threshold = priorityOrder[prefs.priorityThreshold] ?? 1
    const actual = priorityOrder[priority] ?? 1
    if (actual < threshold) {
      return false
    }

    if (this.isQuietHours(prefs) && priority !== 'critical') {
      return false
    }

    return true
  }

  resetDefaults(companyId: string, userId: string): Promise<NotificationPreferences> {
    const defaults = this.defaults(companyId, userId)
    const key = `${companyId}_${userId}`
    this.cache.set(key, defaults)
    localStorage.setItem(this.storageKey(companyId, userId), JSON.stringify(defaults))

    try {
      fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaults),
      })
    } catch {
      /* offline */
    }

    return Promise.resolve(defaults)
  }

  private defaults(companyId: string, userId: string): NotificationPreferences {
    const categories = Object.fromEntries(
      (
        [
          'approval',
          'sla_breach',
          'workflow_failed',
          'inventory',
          'payment',
          'accounting_anomaly',
          'integration',
          'escalation',
          'security',
          'system',
          'sync',
          'reminder',
        ] as PushNotificationCategory[]
      ).map((c) => [c, { ...DEFAULT_CATEGORY_PREFERENCE }]),
    ) as Record<PushNotificationCategory, CategoryPreference>

    return {
      companyId,
      userId,
      enabled: true,
      quietHoursEnabled: false,
      categoryPreferences: categories,
      priorityThreshold: 'low',
      badgeEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      updatedAt: new Date().toISOString(),
    }
  }
}

export const notificationPreferences = new NotificationPreferencesManager()
