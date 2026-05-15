'use client'

import { openDatabase, closeDatabase, clearStore, getFromStore, putInStore } from '../storage/database'
import { entityStore } from '../storage/entity-store'
import { queryCache } from '../storage/query-cache'
import { draftStore } from '../storage/draft-store'
import { workspaceStore } from '../storage/workspace-store'
import { encryptedStore } from '../storage/encrypted-store'
import { syncEngine, type SyncStatus, type SyncMode } from '../sync/sync-engine'
import { syncQueue } from '../sync/queue'
import { syncTracker } from '../sync/sync-tracker'
import { conflictResolver } from '../sync/conflict-resolver'
import { connectivityMonitor, type ConnectionStatus } from '../network/connectivity'
import { networkOrchestrator } from '../network/network-orchestrator'
import { retryEngine } from '../sync/retry-engine'
import { inventorySyncService } from './inventory-sync'
import { salesSyncService } from './sales-sync'
import { approvalSyncService } from './approval-sync'
import { financialSyncService } from './financial-sync'
import { activitySyncService } from './activity-sync'

export interface OfflineTelemetry {
  uptime: number
  dbSize: number
  entityCount: number
  pendingOps: number
  failedOps: number
  conflictCount: number
  draftCount: number
  lastSyncTime: string | null
  syncStatus: SyncStatus
  networkStatus: ConnectionStatus
}

class OfflineService {
  private _initialized = false
  private _telemetry: OfflineTelemetry = {
    uptime: 0,
    dbSize: 0,
    entityCount: 0,
    pendingOps: 0,
    failedOps: 0,
    conflictCount: 0,
    draftCount: 0,
    lastSyncTime: null,
    syncStatus: 'idle',
    networkStatus: 'unknown',
  }
  private startTime = 0

  get initialized(): boolean {
    return this._initialized
  }
  get telemetry(): OfflineTelemetry {
    return { ...this._telemetry }
  }

  readonly inventory = inventorySyncService
  readonly sales = salesSyncService
  readonly approvals = approvalSyncService
  readonly financial = financialSyncService
  readonly activity = activitySyncService
  readonly sync = syncEngine
  readonly network = networkOrchestrator
  readonly queue = syncQueue
  readonly tracker = syncTracker
  readonly conflicts = conflictResolver
  readonly cache = queryCache
  readonly entities = entityStore
  readonly drafts = draftStore
  readonly workspaces = workspaceStore
  readonly encrypted = encryptedStore

  async initialize(companyId?: string): Promise<void> {
    if (this._initialized) {
      return
    }
    this.startTime = Date.now()

    await openDatabase()
    await this.cleanupStaleState()

    networkOrchestrator.initialize(companyId ?? undefined)
    syncEngine.startAutoSync(30000, companyId ?? undefined)

    syncEngine.on((event) => {
      if (event.type === 'sync_complete' || event.type === 'sync_start') {
        this.updateTelemetry()
      }
    })

    this._initialized = true
    await this.updateTelemetry()
  }

  async destroy(): Promise<void> {
    syncEngine.destroy()
    networkOrchestrator.destroy()
    await closeDatabase()
    this._initialized = false
  }

  async clearAllData(): Promise<void> {
    const stores = [
      'entities',
      'queries',
      'sync_queue',
      'sync_tracker',
      'drafts',
      'workspace',
      'audit_log',
      'pending_ops',
      'sync_state',
      'encrypted',
      'conflicts',
    ]
    for (const store of stores) {
      await clearStore(store as any)
    }
  }

  async clearCompanyData(companyId: string): Promise<void> {
    const allEntities = await entityStore.getAll('', companyId)
    for (const entity of allEntities) {
      await entityStore.delete(entity.entity_type, entity.id)
    }
  }

  async getNetworkStatus(): Promise<ConnectionStatus> {
    return connectivityMonitor.status
  }

  async isOnline(): Promise<boolean> {
    return connectivityMonitor.status !== 'offline'
  }

  async startSync(mode: SyncMode = 'incremental', companyId?: string): Promise<void> {
    return syncEngine.startSync(mode, companyId)
  }

  async getQueueStats(): Promise<{ pending: number; processing: number; failed: number; completed: number }> {
    return syncQueue.getStats()
  }

  async updateTelemetry(): Promise<void> {
    const stats = await syncQueue.getStats()
    const conflictCount = await conflictResolver.countPending()

    this._telemetry = {
      uptime: Date.now() - this.startTime,
      dbSize: 0,
      entityCount: 0,
      pendingOps: stats.pending,
      failedOps: stats.failed,
      conflictCount,
      draftCount: 0,
      lastSyncTime: null,
      syncStatus: syncEngine.status,
      networkStatus: connectivityMonitor.status,
    }
  }

  private async cleanupStaleState(): Promise<void> {
    await syncQueue.resetStuckProcessing()
    await queryCache.cleanup()
  }

  onSyncEvent(callback: (event: any) => void): () => void {
    return syncEngine.on(callback)
  }

  onNetworkChange(callback: (status: ConnectionStatus) => void): () => void {
    return connectivityMonitor.on(callback)
  }
}

export const offlineService = new OfflineService()
