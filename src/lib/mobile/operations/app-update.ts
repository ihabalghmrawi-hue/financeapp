import { versionManager, type VersionCheckResult } from '../production/version'

export interface UpdateState {
  checking: boolean
  available: boolean
  required: boolean
  skipped?: string
  latestVersion: string
  downloadUrl?: string
  releaseNotes?: string
}

type UpdateListener = (state: UpdateState) => void

class AppUpdateService {
  private listeners: UpdateListener[] = []
  private state: UpdateState = {
    checking: false,
    available: false,
    required: false,
    latestVersion: '',
  }
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private updateUrl = '/api/mobile/version'

  onUpdate(listener: UpdateListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  startPeriodicCheck(intervalMs = 3600000): void {
    this.checkForUpdates()
    this.checkInterval = setInterval(() => this.checkForUpdates(), intervalMs)
  }

  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  async checkForUpdates(): Promise<UpdateState> {
    this.state = { ...this.state, checking: true }
    this.notify()

    try {
      const result = await versionManager.checkForUpdate()
      if (result) {
        this.state = {
          checking: false,
          available: result.updateAvailable,
          required: result.required,
          latestVersion: result.latestVersion,
          downloadUrl: result.downloadUrl,
          releaseNotes: result.releaseNotes,
          skipped: this.state.skipped,
        }
      } else {
        this.state = { ...this.state, checking: false }
      }
    } catch {
      this.state = { ...this.state, checking: false }
    }

    this.notify()
    return this.state
  }

  skipVersion(version: string): void {
    this.state = { ...this.state, skipped: version }
    try {
      localStorage.setItem('skipped_version', version)
    } catch {
      /* ignore */
    }
  }

  getSkippedVersion(): string | null {
    try {
      return localStorage.getItem('skipped_version')
    } catch {
      return null
    }
  }

  isVersionSkipped(version: string): boolean {
    return this.state.skipped === version
  }

  async downloadUpdate(url?: string): Promise<boolean> {
    const downloadUrl = url ?? this.state.downloadUrl
    if (!downloadUrl) {
      return false
    }

    try {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = 'ezy-erp-update.apk'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return true
    } catch {
      try {
        if (typeof window !== 'undefined') {
          window.open(downloadUrl, '_blank', 'noopener,noreferrer')
          return true
        }
      } catch {
        /* ignore */
      }
      return false
    }
  }

  getState(): UpdateState {
    return { ...this.state }
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state))
  }
}

export const appUpdateService = new AppUpdateService()
