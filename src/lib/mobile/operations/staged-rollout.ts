import { environment, isProduction } from '../production/environments'
import { versionManager } from '../production/version'

export interface StagedRolloutConfig {
  version: string
  build: number
  targetPercentage: number
  targetGroups: string[]
  startTime: string
  endTime: string
  paused: boolean
  rollbackVersion?: string
}

export interface RolloutAssignment {
  included: boolean
  version: string
  percentage: number
  group: string | null
  reason: string
}

type RolloutListener = (assignment: RolloutAssignment) => void

class StagedRolloutService {
  private listeners: RolloutListener[] = []
  private config: StagedRolloutConfig | null = null
  private initialized = false
  private endpoint = '/api/mobile/rollout'

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    this.initialized = true

    try {
      await this.fetchConfig()
    } catch {
      this.loadCachedConfig()
    }
  }

  destroy(): void {
    this.initialized = false
  }

  onRollout(listener: RolloutListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  async checkAssignment(): Promise<RolloutAssignment> {
    const userId = this.getUserId()
    const currentVersion = await versionManager.getCurrentVersion()

    if (!this.config || !this.isRolloutActive()) {
      return {
        included: true,
        version: currentVersion.current,
        percentage: 100,
        group: null,
        reason: 'لا يوجد طرح تدريجي نشط',
      }
    }

    if (this.config.paused) {
      return {
        included: false,
        version: this.config.version,
        percentage: 0,
        group: null,
        reason: 'الطرح التدريجي متوقف مؤقتاً',
      }
    }

    const userGroup = this.determineUserGroup(userId)
    const inTargetGroup = this.config.targetGroups.length === 0 || this.config.targetGroups.includes(userGroup)

    if (!inTargetGroup) {
      return {
        included: false,
        version: this.config.version,
        percentage: this.config.targetPercentage,
        group: userGroup,
        reason: `المجموعة ${userGroup} غير مشمولة في الطرح`,
      }
    }

    const userHash = this.hashUserId(userId)
    const included = userHash < this.config.targetPercentage

    return {
      included,
      version: this.config.version,
      percentage: this.config.targetPercentage,
      group: userGroup,
      reason: included
        ? `مشمول في الطرح (${this.config.targetPercentage}%)`
        : `غير مشمول في الطرح (${this.config.targetPercentage}%)`,
    }
  }

  isInRollout(): boolean {
    return this.config !== null && this.isRolloutActive() && !this.config.paused
  }

  getConfig(): StagedRolloutConfig | null {
    return this.config ? { ...this.config } : null
  }

  private async fetchConfig(): Promise<void> {
    try {
      const res = await fetch(this.endpoint)
      if (res.ok) {
        this.config = await res.json()
        this.persistConfig()
      }
    } catch {
      this.loadCachedConfig()
    }
  }

  private isRolloutActive(): boolean {
    if (!this.config) {
      return false
    }
    const now = Date.now()
    const start = new Date(this.config.startTime).getTime()
    const end = new Date(this.config.endTime).getTime()
    return now >= start && now <= end
  }

  private determineUserGroup(userId: string | null): string {
    if (!userId) {
      return 'anonymous'
    }
    try {
      const stored = localStorage.getItem('user_group')
      if (stored) {
        return stored
      }
    } catch {}
    const hash = this.hashUserId(userId)
    if (hash < 20) {
      return 'early_adopters'
    }
    if (hash < 50) {
      return 'general'
    }
    return 'late_adopters'
  }

  private hashUserId(userId: string | null): number {
    if (!userId) {
      return 0
    }
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0
    }
    return Math.abs(hash) % 100
  }

  private getUserId(): string | null {
    try {
      return localStorage.getItem('user_id')
    } catch {
      return null
    }
  }

  private persistConfig(): void {
    try {
      if (this.config) {
        localStorage.setItem('rollout_config', JSON.stringify(this.config))
      }
    } catch {}
  }

  private loadCachedConfig(): void {
    try {
      const cached = localStorage.getItem('rollout_config')
      if (cached) {
        this.config = JSON.parse(cached)
      }
    } catch {}
  }
}

export const stagedRolloutService = new StagedRolloutService()
