'use client'

import { connectivityMonitor, type ConnectionStatus } from './connectivity'
import { syncEngine, type SyncMode } from '../sync/sync-engine'
import { retryEngine } from '../sync/retry-engine'
import { syncQueue } from '../sync/queue'

export type RecoveryPhase = 'detection' | 'stabilization' | 'recovery' | 'resync' | 'complete'
export type RecoveryState = 'idle' | 'recovering' | 'completed' | 'failed'

export interface RecoveryEvent {
  type: 'recovery_start' | 'recovery_progress' | 'recovery_complete' | 'recovery_failed' | 'state_change'
  data?: any
}

type RecoveryCallback = (event: RecoveryEvent) => void

export class NetworkOrchestrator {
  private _state: RecoveryState = 'idle'
  private _phase: RecoveryPhase = 'detection'
  private listeners: Set<RecoveryCallback> = new Set()
  private recoveryAttempts = 0
  private maxRecoveryAttempts = 3
  private isRecovering = false
  private companyId: string | null = null

  get state(): RecoveryState {
    return this._state
  }
  get phase(): RecoveryPhase {
    return this._phase
  }

  on(callback: RecoveryCallback): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private emit(type: RecoveryEvent['type'], data?: any) {
    this.listeners.forEach((l) => l({ type, data }))
  }

  initialize(companyId?: string): void {
    this.companyId = companyId ?? null

    connectivityMonitor.on((status) => {
      if (status === 'online' && this._state === 'idle') {
        this.startRecovery()
      }
    })

    connectivityMonitor.initialize()
    connectivityMonitor.startPeriodicCheck(15000)

    syncEngine.on((event) => {
      if (event.type === 'offline') {
        this.handleNetworkLost()
      }
    })
  }

  private async handleNetworkLost(): Promise<void> {
    this._state = 'recovering'
    this._phase = 'detection'
    this.emit('state_change', { state: 'recovering', phase: 'detection' })
  }

  async startRecovery(): Promise<void> {
    if (this.isRecovering) {
      return
    }
    this.isRecovering = true
    this._state = 'recovering'
    this.recoveryAttempts++
    this.emit('recovery_start', { attempt: this.recoveryAttempts })

    try {
      this._phase = 'stabilization'
      this.emit('recovery_progress', { phase: 'stabilization' })
      await this.stabilizeConnection()

      this._phase = 'recovery'
      this.emit('recovery_progress', { phase: 'recovery' })
      await this.recoverSyncState()

      this._phase = 'resync'
      this.emit('recovery_progress', { phase: 'resync' })
      await this.resyncData()

      this._phase = 'complete'
      this._state = 'completed'
      this.recoveryAttempts = 0
      this.emit('recovery_complete')
    } catch (error: any) {
      if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
        this._state = 'failed'
        this.emit('recovery_failed', { error: error.message, attempts: this.recoveryAttempts })
      } else {
        this.isRecovering = false
        setTimeout(() => this.startRecovery(), 5000)
      }
    } finally {
      this.isRecovering = false
    }
  }

  private async stabilizeConnection(): Promise<void> {
    const maxWait = 10000
    const start = Date.now()

    while (Date.now() - start < maxWait) {
      const isStable = await connectivityMonitor.ping()
      if (isStable) {
        const latency = await this.measureLatency()
        if (latency < 2000) {
          return
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    if (!(await connectivityMonitor.ping())) {
      throw new Error('Connection stabilization failed')
    }
  }

  private async measureLatency(): Promise<number> {
    const start = Date.now()
    try {
      await fetch('/api/health', { method: 'HEAD' })
      return Date.now() - start
    } catch {
      return Infinity
    }
  }

  private async recoverSyncState(): Promise<void> {
    const stuckCount = await syncQueue.resetStuckProcessing()
    const failedCount = await syncQueue.countByStatus('failed')

    if (failedCount > 0) {
      await syncQueue.retryFailed()
    }
  }

  private async resyncData(): Promise<void> {
    await syncEngine.startSync('incremental', this.companyId ?? undefined)

    const pendingCount = await syncQueue.countByStatus('pending')
    if (pendingCount > 0) {
      await syncEngine.startSync('push_only', this.companyId ?? undefined)
    }
  }

  async forceRecovery(): Promise<void> {
    this.recoveryAttempts = 0
    await this.startRecovery()
  }

  async getNetworkStatus(): Promise<ConnectionStatus> {
    const isOnline = await connectivityMonitor.ping()
    return isOnline ? 'online' : 'offline'
  }

  async getDetailedStatus(): Promise<{
    network: ConnectionStatus
    sync: string
    pendingOps: number
    failedOps: number
    recovery: RecoveryState
  }> {
    const network = await this.getNetworkStatus()
    return {
      network,
      sync: syncEngine.status,
      pendingOps: await syncQueue.countByStatus('pending'),
      failedOps: await syncQueue.countByStatus('failed'),
      recovery: this._state,
    }
  }

  destroy(): void {
    connectivityMonitor.destroy()
    syncEngine.destroy()
    this.listeners.clear()
  }
}

export const networkOrchestrator = new NetworkOrchestrator()
