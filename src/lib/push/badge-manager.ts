import { inAppNotificationStore } from './notification-store'

class BadgeManager {
  private currentCount = 0

  async initialize(): Promise<void> {
    this.updateFromLocal()
  }

  async setCount(count: number): Promise<void> {
    this.currentCount = Math.max(0, count)
    await this.updateBadge()
  }

  async increment(by = 1): Promise<void> {
    this.currentCount += by
    await this.updateBadge()
  }

  async decrement(by = 1): Promise<void> {
    this.currentCount = Math.max(0, this.currentCount - by)
    await this.updateBadge()
  }

  async clear(): Promise<void> {
    this.currentCount = 0
    await this.updateBadge()
  }

  getCount(): number {
    return this.currentCount
  }

  async refreshFromStore(companyId: string, userId: string): Promise<number> {
    const count = await inAppNotificationStore.getUnreadCount(companyId, userId)
    this.currentCount = count
    await this.updateBadge()
    return count
  }

  private updateFromLocal(): void {
    try {
      const stored = localStorage.getItem('push_badge_count')
      if (stored) {
        this.currentCount = parseInt(stored, 10) || 0
      }
    } catch {
      /* ignore */
    }
  }

  private async updateBadge(): Promise<void> {
    try {
      localStorage.setItem('push_badge_count', String(this.currentCount))
    } catch {
      /* ignore */
    }
  }
}

export const badgeManager = new BadgeManager()
