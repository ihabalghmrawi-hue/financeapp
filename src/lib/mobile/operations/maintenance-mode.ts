export interface MaintenanceState {
  active: boolean
  message?: string
  estimatedEnd?: string
  type?: 'scheduled' | 'emergency' | 'deployment'
  allowedRoles?: string[]
}

type MaintenanceListener = (state: MaintenanceState) => void

class MaintenanceModeService {
  private listeners: MaintenanceListener[] = []
  private currentState: MaintenanceState = { active: false }
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private endpoint = '/api/mobile/maintenance'

  onMaintenanceChange(listener: MaintenanceListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  startPeriodicCheck(intervalMs = 60000): void {
    this.checkStatus()
    this.checkInterval = setInterval(() => this.checkStatus(), intervalMs)
  }

  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  async checkStatus(): Promise<MaintenanceState> {
    try {
      const res = await fetch(this.endpoint)
      if (res.status === 503) {
        const data = await res.json().catch(() => ({}))
        this.currentState = {
          active: true,
          message: data.message,
          estimatedEnd: data.estimatedEnd,
          type: data.type,
          allowedRoles: data.allowedRoles,
        }
      } else if (res.ok) {
        this.currentState = { active: false }
      }
    } catch {
      if (this.currentState.active) {
        this.currentState = this.currentState
      }
    }

    this.notify()
    return this.currentState
  }

  isUnderMaintenance(): boolean {
    return this.currentState.active
  }

  getState(): MaintenanceState {
    return { ...this.currentState }
  }

  canAccess(role?: string): boolean {
    if (!this.currentState.active) {
      return true
    }
    if (!this.currentState.allowedRoles || this.currentState.allowedRoles.length === 0) {
      return false
    }
    if (!role) {
      return false
    }
    return this.currentState.allowedRoles.includes(role)
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.currentState))
  }
}

export const maintenanceModeService = new MaintenanceModeService()
