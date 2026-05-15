import { versionManager } from '../production/version'
import { environment, isProduction } from '../production/environments'

export interface UpgradePolicy {
  minimumVersion: string
  minimumBuild: number
  gracePeriodMs: number
  blockAccess: boolean
  message?: string
  updateUrl?: string
}

export interface UpgradeStatus {
  eligible: boolean
  blocked: boolean
  currentVersion: string
  requiredVersion: string
  gracePeriodEnds: string | null
  daysRemaining: number | null
  message: string
}

type UpgradeListener = (status: UpgradeStatus) => void

class ForcedUpgradeService {
  private listeners: UpgradeListener[] = []
  private policy: UpgradePolicy = {
    minimumVersion: '1.0.0',
    minimumBuild: 1,
    gracePeriodMs: 7 * 24 * 3600000,
    blockAccess: false,
  }
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private initialized = false
  private endpoint = '/api/mobile/upgrade-policy'

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    this.initialized = true

    try {
      await this.fetchPolicy()
    } catch {}

    this.startPeriodicCheck()
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.initialized = false
  }

  onUpgradeRequired(listener: UpgradeListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  async checkUpgradeStatus(): Promise<UpgradeStatus> {
    try {
      const current = await versionManager.getCurrentVersion()
      const comparison = versionManager.compareVersions(current.current, this.policy.minimumVersion)
      const isOld = comparison === -1 || (comparison === 0 && current.build < this.policy.minimumBuild)

      const firstSeen = this.getFirstSeen()
      const graceStart = firstSeen ? new Date(firstSeen).getTime() : Date.now()
      const graceEnd = graceStart + this.policy.gracePeriodMs
      const now = Date.now()
      const daysRemaining = Math.max(0, Math.ceil((graceEnd - now) / 86400000))
      const graceExpired = now >= graceEnd

      const blocked = isOld && (graceExpired || this.policy.blockAccess)

      const status: UpgradeStatus = {
        eligible: !isOld,
        blocked,
        currentVersion: current.current,
        requiredVersion: this.policy.minimumVersion,
        gracePeriodEnds: isOld ? new Date(graceEnd).toISOString() : null,
        daysRemaining: isOld ? daysRemaining : null,
        message: this.getUpgradeMessage(isOld, graceExpired, blocked),
      }

      return status
    } catch {
      return {
        eligible: true,
        blocked: false,
        currentVersion: '1.0.0',
        requiredVersion: this.policy.minimumVersion,
        gracePeriodEnds: null,
        daysRemaining: null,
        message: '',
      }
    }
  }

  getPolicy(): UpgradePolicy {
    return { ...this.policy }
  }

  private async fetchPolicy(): Promise<void> {
    try {
      const res = await fetch(this.endpoint)
      if (res.ok) {
        const data = await res.json()
        this.policy = {
          minimumVersion: data.minimumVersion || this.policy.minimumVersion,
          minimumBuild: data.minimumBuild || this.policy.minimumBuild,
          gracePeriodMs: data.gracePeriodDays ? data.gracePeriodDays * 24 * 3600000 : this.policy.gracePeriodMs,
          blockAccess: data.blockAccess ?? this.policy.blockAccess,
          message: data.message,
          updateUrl: data.updateUrl,
        }
        this.persistPolicy()
      }
    } catch {
      this.loadCachedPolicy()
    }
  }

  private startPeriodicCheck(): void {
    this.checkInterval = setInterval(async () => {
      await this.fetchPolicy()
      const status = await this.checkUpgradeStatus()
      if (status.blocked || status.daysRemaining !== null) {
        this.listeners.forEach((l) => l(status))
      }
    }, 3600000)
  }

  private getFirstSeen(): string | null {
    try {
      return localStorage.getItem('first_version_seen')
    } catch {
      return null
    }
  }

  private getUpgradeMessage(isOld: boolean, graceExpired: boolean, blocked: boolean): string {
    if (!isOld) {
      return ''
    }
    if (blocked) {
      return 'هذا الإصدار قديم جداً. يرجى تحديث التطبيق للمتابعة.'
    }
    if (graceExpired) {
      return 'انتهت المهلة. يرجى تحديث التطبيق.'
    }
    return 'يوجد إصدار أحدث. يرجى التحديث قريباً.'
  }

  private persistPolicy(): void {
    try {
      localStorage.setItem('upgrade_policy', JSON.stringify(this.policy))
    } catch {}
  }

  private loadCachedPolicy(): void {
    try {
      const cached = localStorage.getItem('upgrade_policy')
      if (cached) {
        this.policy = JSON.parse(cached)
      }
    } catch {}
  }
}

export const forcedUpgradeService = new ForcedUpgradeService()
