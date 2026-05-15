import type { StorageInfo } from './types'

class StorageMonitor {
  private listeners: Set<(info: StorageInfo) => void> = new Set()
  private interval: ReturnType<typeof setInterval> | null = null
  private currentInfo: StorageInfo | null = null

  on(callback: (info: StorageInfo) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  async startMonitoring(intervalMs = 60000): Promise<void> {
    await this.check()
    if (this.interval) {
      clearInterval(this.interval)
    }
    this.interval = setInterval(() => this.check(), intervalMs)
  }

  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  async check(): Promise<StorageInfo> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate()
        const total = estimate.quota ?? 0
        const used = estimate.usage ?? 0
        const free = total - used

        this.currentInfo = {
          free,
          total,
          used,
          percentage: total > 0 ? Math.round((used / total) * 100) : 0,
          cacheSize: await this.getCacheSize(),
          dataSize: used,
        }
      } else {
        this.currentInfo = {
          free: 0,
          total: 0,
          used: 0,
          percentage: 0,
          cacheSize: 0,
          dataSize: 0,
        }
      }
    } catch {
      this.currentInfo = {
        free: 0,
        total: 0,
        used: 0,
        percentage: 0,
        cacheSize: 0,
        dataSize: 0,
      }
    }

    if (this.currentInfo) {
      this.listeners.forEach((l) => l(this.currentInfo!))
    }
    return this.currentInfo!
  }

  async isLowStorage(thresholdPercent = 90): Promise<boolean> {
    const info = await this.check()
    return info.percentage >= thresholdPercent
  }

  async getAvailableSpace(): Promise<number> {
    const info = await this.check()
    return info.free
  }

  private async getCacheSize(): Promise<number> {
    if ('caches' in window) {
      try {
        const keys = await caches.keys()
        let total = 0
        for (const key of keys) {
          const cache = await caches.open(key)
          const requests = await cache.keys()
          for (const request of requests) {
            const response = await cache.match(request)
            if (response) {
              const blob = await response.blob()
              total += blob.size
            }
          }
        }
        return total
      } catch {
        return 0
      }
    }
    return 0
  }

  getLastInfo(): StorageInfo | null {
    return this.currentInfo
  }
}

export const storageMonitor = new StorageMonitor()
