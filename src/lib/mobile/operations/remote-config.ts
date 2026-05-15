export interface RemoteConfigValue {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
  group?: string
}

export interface RemoteConfig {
  [key: string]: any
}

type ConfigListener = (config: RemoteConfig) => void

class RemoteConfigService {
  private listeners: ConfigListener[] = []
  private config: RemoteConfig = {}
  private lastFetch: number = 0
  private fetchInterval = 300000
  private endpoint = '/api/mobile/config'

  onConfigChange(listener: ConfigListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  async fetchConfig(force = false): Promise<RemoteConfig> {
    const now = Date.now()
    if (!force && now - this.lastFetch < this.fetchInterval) {
      return this.config
    }

    try {
      const res = await fetch(this.endpoint)
      if (res.ok) {
        const data = await res.json()
        this.config = this.normalizeConfig(data)
        this.lastFetch = now
        this.persistConfig()
        this.notify()
      }
    } catch {
      const cached = this.loadCachedConfig()
      if (cached) {
        this.config = cached
      }
    }

    return this.config
  }

  get<T = any>(key: string, defaultValue?: T): T {
    const value = this.config[key]
    if (value === undefined || value === null) {
      return defaultValue as T
    }
    return value as T
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.config[key]
    if (typeof value === 'boolean') {
      return value
    }
    if (typeof value === 'string') {
      return value === 'true' || value === '1'
    }
    return defaultValue
  }

  getNumber(key: string, defaultValue = 0): number {
    const value = this.config[key]
    if (typeof value === 'number') {
      return value
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? defaultValue : parsed
    }
    return defaultValue
  }

  getString(key: string, defaultValue = ''): string {
    const value = this.config[key]
    return value !== null && value !== undefined ? String(value) : defaultValue
  }

  getConfig(): RemoteConfig {
    return { ...this.config }
  }

  private normalizeConfig(data: any): RemoteConfig {
    if (Array.isArray(data)) {
      const config: RemoteConfig = {}
      for (const item of data) {
        if (item.key && item.value !== undefined) {
          config[item.key] = this.parseValue(item.value, item.type)
        }
      }
      return config
    }
    return data ?? {}
  }

  private parseValue(value: string, type?: string): any {
    switch (type) {
      case 'boolean':
        return value === 'true'
      case 'number':
        return parseFloat(value)
      case 'json':
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      default:
        return value
    }
  }

  private persistConfig(): void {
    try {
      localStorage.setItem('remote_config', JSON.stringify(this.config))
      localStorage.setItem('remote_config_fetch', String(this.lastFetch))
    } catch {
      /* ignore */
    }
  }

  private loadCachedConfig(): RemoteConfig | null {
    try {
      const data = localStorage.getItem('remote_config')
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.config))
  }
}

export const remoteConfigService = new RemoteConfigService()
