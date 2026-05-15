import { remoteConfigService } from './remote-config'

export interface FeatureFlag {
  key: string
  enabled: boolean
  description: string
  group: string
  rolloutPercentage?: number
  dependencies?: string[]
}

type FlagListener = (flags: Record<string, boolean>) => void

class FeatureFlagService {
  private listeners: FlagListener[] = []
  private flags: Record<string, boolean> = {}
  private initialized = false

  private defaultFlags: Record<string, FeatureFlag> = {
    offline_mode: {
      key: 'offline_mode',
      enabled: true,
      description: 'دعم العمل دون اتصال',
      group: 'core',
      rolloutPercentage: 100,
    },
    barcode_scanning: {
      key: 'barcode_scanning',
      enabled: true,
      description: 'مسح الباركود',
      group: 'inventory',
      rolloutPercentage: 100,
    },
    push_notifications: {
      key: 'push_notifications',
      enabled: true,
      description: 'الإشعارات الفورية',
      group: 'core',
      rolloutPercentage: 100,
    },
    biometric_auth: {
      key: 'biometric_auth',
      enabled: true,
      description: 'المصادقة البيومترية',
      group: 'security',
      rolloutPercentage: 100,
    },
    offline_drafts: {
      key: 'offline_drafts',
      enabled: true,
      description: 'المسودات دون اتصال',
      group: 'offline',
      rolloutPercentage: 100,
    },
    sync_on_wifi: {
      key: 'sync_on_wifi',
      enabled: false,
      description: 'المزامنة على الواي فاي فقط',
      group: 'offline',
      rolloutPercentage: 50,
    },
    qr_navigation: {
      key: 'qr_navigation',
      enabled: true,
      description: 'التنقل عبر QR',
      group: 'navigation',
      rolloutPercentage: 100,
    },
    signature_capture: {
      key: 'signature_capture',
      enabled: true,
      description: 'التوقيع الإلكتروني',
      group: 'workflow',
      rolloutPercentage: 100,
    },
    document_scan: {
      key: 'document_scan',
      enabled: true,
      description: 'مسح المستندات',
      group: 'documents',
      rolloutPercentage: 100,
    },
    advanced_analytics: {
      key: 'advanced_analytics',
      enabled: false,
      description: 'تحليلات متقدمة',
      group: 'reports',
      rolloutPercentage: 25,
    },
    emergency_alerts: {
      key: 'emergency_alerts',
      enabled: true,
      description: 'تنبيهات الطوارئ',
      group: 'core',
      rolloutPercentage: 100,
    },
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    this.initialized = true

    await remoteConfigService.fetchConfig()
    this.syncFromRemote()
    this.listen()
  }

  private syncFromRemote(): void {
    for (const [key, flag] of Object.entries(this.defaultFlags)) {
      const remoteEnabled = remoteConfigService.getBoolean(`flag_${key}`, flag.enabled)
      this.flags[key] = this.evaluateRollout(key, remoteEnabled)
    }
  }

  private evaluateRollout(key: string, remoteEnabled: boolean): boolean {
    if (!remoteEnabled) {
      return false
    }

    const flag = this.defaultFlags[key]
    if (!flag || flag.rolloutPercentage === undefined || flag.rolloutPercentage >= 100) {
      return remoteEnabled
    }

    const userId = this.getUserId()
    if (!userId) {
      return remoteEnabled
    }

    const hash = this.hashString(`${key}:${userId}`)
    return hash % 100 < flag.rolloutPercentage
  }

  isEnabled(key: string): boolean {
    return this.flags[key] ?? this.defaultFlags[key]?.enabled ?? false
  }

  isDisabled(key: string): boolean {
    return !this.isEnabled(key)
  }

  getAllFlags(): Record<string, boolean> {
    return { ...this.flags }
  }

  getFlagDefinitions(): FeatureFlag[] {
    return Object.values(this.defaultFlags)
  }

  onFlagChange(listener: FlagListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private listen(): void {
    remoteConfigService.onConfigChange(() => {
      this.syncFromRemote()
      this.listeners.forEach((l) => l(this.flags))
    })
  }

  private getUserId(): string | null {
    try {
      return localStorage.getItem('user_id')
    } catch {
      return null
    }
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0
    }
    return Math.abs(hash)
  }
}

export const featureFlagService = new FeatureFlagService()
