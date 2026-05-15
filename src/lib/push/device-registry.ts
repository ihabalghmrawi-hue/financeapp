import type { PushDevice, PushPlatform } from './types'

const STORAGE_KEY = 'push_device_registry'
const API_REGISTER = '/api/push/register'
const API_UNREGISTER = '/api/push/unregister'

class DeviceRegistry {
  private devices: Map<string, PushDevice> = new Map()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const list: PushDevice[] = JSON.parse(raw)
        for (const d of list) {
          this.devices.set(d.id, d)
        }
      }
    } catch {
      /* ignore */
    }
    this.initialized = true
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.devices.values())))
    } catch {
      /* ignore */
    }
  }

  async registerDevice(
    token: string,
    platform: PushPlatform,
    companyId: string,
    userId: string,
    deviceInfo?: { deviceName?: string; deviceId?: string; osVersion?: string; appVersion?: string },
  ): Promise<PushDevice> {
    await this.initialize()

    const existing = Array.from(this.devices.values()).find((d) => d.token === token && d.companyId === companyId)

    if (existing) {
      existing.lastSeenAt = new Date().toISOString()
      existing.isActive = true
      existing.platform = platform
      existing.osVersion = deviceInfo?.osVersion ?? existing.osVersion
      existing.appVersion = deviceInfo?.appVersion ?? existing.appVersion
      existing.deviceName = deviceInfo?.deviceName ?? existing.deviceName
      existing.updatedAt = new Date().toISOString()
      this.persist()
      this.syncToServer(existing)
      return existing
    }

    const device: PushDevice = {
      id: crypto.randomUUID(),
      companyId,
      userId,
      token,
      platform,
      isActive: true,
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...deviceInfo,
    }

    this.devices.set(device.id, device)
    this.persist()
    this.syncToServer(device)
    return device
  }

  async unregisterDevice(deviceId: string): Promise<void> {
    await this.initialize()
    const device = this.devices.get(deviceId)
    if (device) {
      device.isActive = false
      device.updatedAt = new Date().toISOString()
      this.persist()
      try {
        await fetch(API_UNREGISTER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, token: device.token }),
        })
      } catch {
        /* offline */
      }
    }
  }

  async unregisterToken(token: string): Promise<void> {
    await this.initialize()
    for (const [id, device] of this.devices) {
      if (device.token === token) {
        device.isActive = false
        device.updatedAt = new Date().toISOString()
        this.persist()
      }
    }
    try {
      await fetch(API_UNREGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    } catch {
      /* offline */
    }
  }

  getActiveDevices(companyId: string, userId: string): PushDevice[] {
    return Array.from(this.devices.values()).filter(
      (d) => d.isActive && d.companyId === companyId && d.userId === userId,
    )
  }

  getAllDevices(companyId: string): PushDevice[] {
    return Array.from(this.devices.values()).filter((d) => d.isActive && d.companyId === companyId)
  }

  getDeviceByToken(token: string): PushDevice | undefined {
    return Array.from(this.devices.values()).find((d) => d.token === token)
  }

  async invalidateStaleTokens(maxAgeDays: number = 90): Promise<number> {
    await this.initialize()
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    let count = 0
    for (const [id, device] of this.devices) {
      if (new Date(device.lastSeenAt).getTime() < cutoff) {
        device.isActive = false
        device.updatedAt = new Date().toISOString()
        count++
      }
    }
    if (count > 0) {
      this.persist()
    }
    return count
  }

  async cleanupInactive(): Promise<number> {
    await this.initialize()
    let count = 0
    for (const [id, device] of this.devices) {
      if (!device.isActive) {
        this.devices.delete(id)
        count++
      }
    }
    if (count > 0) {
      this.persist()
    }
    return count
  }

  getDeviceCount(companyId: string): number {
    return Array.from(this.devices.values()).filter((d) => d.isActive && d.companyId === companyId).length
  }

  private async syncToServer(device: PushDevice): Promise<void> {
    try {
      await fetch(API_REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device),
      })
    } catch {
      /* offline - will sync later */
    }
  }
}

export const deviceRegistry = new DeviceRegistry()
