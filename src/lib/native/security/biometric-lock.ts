import { biometricAuthService } from '../biometric-auth'
import { pluginOrchestrator } from '../plugin-orchestrator'

class BiometricLockService {
  private locked = false
  private lockTimeout: ReturnType<typeof setTimeout> | null = null
  private listeners: Set<(locked: boolean) => void> = new Set()
  private lockAfterMs = 300000
  private lastActivity = Date.now()

  on(callback: (locked: boolean) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  get isLocked(): boolean {
    return this.locked
  }

  async enable(autoLockMinutes = 5): Promise<boolean> {
    const available = await biometricAuthService.isAvailable()
    if (!available) {
      return false
    }

    this.lockAfterMs = autoLockMinutes * 60 * 1000
    this.trackActivity()

    try {
      const { App } = await pluginOrchestrator.getApp()
      App.addListener('appStateChange', (state: any) => {
        if (!state.isActive) {
          this.startLockTimer()
        } else {
          this.cancelLockTimer()
        }
      })
    } catch {
      /* ignore */
    }

    return true
  }

  async lock(): Promise<void> {
    if (this.locked) {
      return
    }
    this.locked = true
    this.notify()
  }

  async unlock(reason?: string): Promise<boolean> {
    if (!this.locked) {
      return true
    }

    const result = await biometricAuthService.authenticate(reason ?? 'فتح التطبيق')
    if (result.success) {
      this.locked = false
      this.lastActivity = Date.now()
      this.cancelLockTimer()
      this.notify()
      return true
    }
    return false
  }

  async ensureUnlocked(reason?: string): Promise<boolean> {
    if (!(await biometricAuthService.isAvailable())) {
      return true
    }
    if (this.locked) {
      return this.unlock(reason)
    }
    return true
  }

  async disable(): Promise<void> {
    this.locked = false
    this.cancelLockTimer()
    this.notify()
  }

  private trackActivity(): void {
    const events = ['touchstart', 'mousedown', 'keydown', 'scroll']
    const handler = () => {
      this.lastActivity = Date.now()
      this.cancelLockTimer()
    }
    events.forEach((e) => window.addEventListener(e, handler))

    try {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', (state: any) => {
          if (state.isActive) {
            this.lastActivity = Date.now()
          }
        })
      })
    } catch {
      /* ignore */
    }
  }

  private startLockTimer(): void {
    if (this.lockTimeout) {
      return
    }
    this.lockTimeout = setTimeout(() => {
      if (Date.now() - this.lastActivity >= this.lockAfterMs) {
        this.lock()
      }
    }, this.lockAfterMs)
  }

  private cancelLockTimer(): void {
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout)
      this.lockTimeout = null
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.locked))
  }
}

export const biometricLockService = new BiometricLockService()
