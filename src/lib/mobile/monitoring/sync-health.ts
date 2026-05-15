import { telemetryService } from './telemetry'

export interface SyncMetrics {
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  pendingItems: number
  averageDuration: number
  lastSyncTime: string | null
  lastSyncStatus: 'success' | 'failed' | 'in_progress' | null
  syncsByType: Record<string, { total: number; failed: number }>
}

export interface SyncOperation {
  id: string
  type: string
  startedAt: string
  completedAt?: string
  duration?: number
  status: 'pending' | 'in_progress' | 'success' | 'failed'
  itemCount: number
  error?: string
}

type SyncHealthListener = (metrics: SyncMetrics) => void

class SyncHealthService {
  private listeners: SyncHealthListener[] = []
  private operations: SyncOperation[] = []
  private maxOperations = 100
  private metrics: SyncMetrics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    pendingItems: 0,
    averageDuration: 0,
    lastSyncTime: null,
    lastSyncStatus: null,
    syncsByType: {},
  }
  private initialized = false
  private flushInterval: ReturnType<typeof setInterval> | null = null

  initialize(): void {
    if (this.initialized) {
      return
    }
    this.initialized = true

    this.flushInterval = setInterval(() => {
      this.flushMetrics()
    }, 60000)
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.initialized = false
  }

  startSync(id: string, type: string, itemCount = 0): SyncOperation {
    const op: SyncOperation = {
      id,
      type,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      itemCount,
    }

    this.operations.unshift(op)
    if (this.operations.length > this.maxOperations) {
      this.operations.pop()
    }

    return op
  }

  completeSync(id: string, status: 'success' | 'failed', error?: string): void {
    const op = this.operations.find((o) => o.id === id)
    if (!op) {
      return
    }

    op.completedAt = new Date().toISOString()
    op.status = status
    op.duration = new Date(op.completedAt).getTime() - new Date(op.startedAt).getTime()
    op.error = error

    this.metrics.totalSyncs++
    this.metrics.lastSyncTime = op.completedAt
    this.metrics.lastSyncStatus = status

    if (!this.metrics.syncsByType[op.type]) {
      this.metrics.syncsByType[op.type] = { total: 0, failed: 0 }
    }
    this.metrics.syncsByType[op.type].total++

    if (status === 'success') {
      this.metrics.successfulSyncs++
    } else {
      this.metrics.failedSyncs++
      this.metrics.syncsByType[op.type].failed++
    }

    this.recalculateAverages()
    this.notify()

    telemetryService.trackSync('sync_complete', {
      type: op.type,
      status,
      duration: op.duration,
      itemCount: op.itemCount,
      error,
    })
  }

  setPendingItems(count: number): void {
    this.metrics.pendingItems = count
  }

  getMetrics(): SyncMetrics {
    return { ...this.metrics }
  }

  getRecentOperations(count = 10): SyncOperation[] {
    return this.operations.slice(0, count)
  }

  getFailedSyncs(): SyncOperation[] {
    return this.operations.filter((op) => op.status === 'failed')
  }

  onMetricsUpdate(listener: SyncHealthListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  getSyncHealthScore(): number {
    if (this.metrics.totalSyncs === 0) {
      return 100
    }
    const successRate = this.metrics.successfulSyncs / this.metrics.totalSyncs
    const pendingPenalty = Math.min(this.metrics.pendingItems / 100, 0.3)
    return Math.round((successRate * 70 + (1 - pendingPenalty) * 30) * 100) / 100
  }

  private recalculateAverages(): void {
    const completedOps = this.operations.filter(
      (o) => o.status !== 'pending' && o.status !== 'in_progress' && o.duration,
    )
    if (completedOps.length === 0) {
      return
    }

    const totalDuration = completedOps.reduce((sum, op) => sum + (op.duration || 0), 0)
    this.metrics.averageDuration = Math.round(totalDuration / completedOps.length)
  }

  private flushMetrics(): void {
    if (this.metrics.totalSyncs === 0) {
      return
    }

    telemetryService.track({
      name: 'sync_health',
      category: 'sync',
      metadata: {
        ...this.metrics,
        healthScore: this.getSyncHealthScore(),
      },
    })
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.metrics))
  }
}

export const syncHealthService = new SyncHealthService()
