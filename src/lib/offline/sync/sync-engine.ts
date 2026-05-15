'use client'

import { syncQueue } from './queue'
import { retryEngine } from './retry-engine'
import { conflictResolver } from './conflict-resolver'
import { deltaSync, type DeltaSyncResult } from './delta-sync'
import { batchSync } from './batch-sync'
import { entityStore, queryCache } from '../storage'
import { syncTracker } from './sync-tracker'
import type { SyncQueueItem, SyncState } from '../storage/database'
import { getFromStore, putInStore, iterateStore } from '../storage/database'

export type SyncStatus = 'idle' | 'syncing' | 'paused' | 'error' | 'offline'
export type SyncMode = 'full' | 'incremental' | 'push_only'

export interface SyncProgress {
  total: number
  completed: number
  failed: number
  current: string | null
}

export type SyncEventCallback = (event: {
  type:
    | 'sync_start'
    | 'sync_complete'
    | 'sync_error'
    | 'item_complete'
    | 'item_failed'
    | 'status_change'
    | 'offline'
    | 'online'
  data?: any
}) => void

export class SyncEngine {
  private _status: SyncStatus = 'idle'
  private _progress: SyncProgress = { total: 0, completed: 0, failed: 0, current: null }
  private listeners: Set<SyncEventCallback> = new Set()
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private currentMode: SyncMode = 'incremental'
  private abortController: AbortController | null = null

  get status(): SyncStatus {
    return this._status
  }
  get progress(): SyncProgress {
    return { ...this._progress }
  }
  get isSyncing(): boolean {
    return this._status === 'syncing'
  }
  get mode(): SyncMode {
    return this.currentMode
  }

  on(callback: SyncEventCallback): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private emit(type: string, data?: any) {
    const event = { type, data }
    this.listeners.forEach((l) => l(event as any))
  }

  private setStatus(status: SyncStatus) {
    this._status = status
    this.emit('status_change', status)
  }

  private setProgress(progress: Partial<SyncProgress>) {
    this._progress = { ...this._progress, ...progress }
  }

  async startSync(mode: SyncMode = 'incremental', companyId?: string): Promise<void> {
    if (this._status === 'syncing') {
      return
    }

    this.currentMode = mode
    this.setStatus('syncing')
    this.abortController = new AbortController()
    this.emit('sync_start', { mode, companyId })

    try {
      if (mode === 'full') {
        await this.runFullSync(companyId)
      } else if (mode === 'push_only') {
        await this.pushPendingChanges(companyId)
      } else {
        await this.runIncrementalSync(companyId)
      }

      this.setStatus('idle')
      this.emit('sync_complete', { mode, companyId })
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        this.setStatus('idle')
        return
      }
      this.setStatus('error')
      this.emit('sync_error', { message: error.message, mode, companyId })
    }
  }

  async cancelSync(): Promise<void> {
    this.abortController?.abort()
    this.setStatus('idle')
  }

  private async runFullSync(companyId?: string): Promise<void> {
    const entityTypes = [
      'accounts',
      'journal_entries',
      'invoices',
      'inventory_items',
      'stock_movements',
      'purchase_orders',
      'sales_orders',
      'approval_requests',
      'activity_entries',
      'workflow_instances',
      'customers',
      'suppliers',
    ]

    for (const entityType of entityTypes) {
      if (this.abortController?.signal.aborted) {
        break
      }
      this.setProgress({ current: entityType })
      await this.syncEntityType(entityType, companyId, true)
    }
  }

  private async runIncrementalSync(companyId?: string): Promise<void> {
    await this.pushPendingChanges(companyId)
    await this.pullRemoteChanges(companyId)
    await queryCache.invalidateAll()
    await syncQueue.clearCompleted()
  }

  private async pushPendingChanges(companyId?: string): Promise<void> {
    const batchSize = 10
    let hasMore = true

    while (hasMore) {
      if (this.abortController?.signal.aborted) {
        break
      }
      const items = await syncQueue.dequeue(batchSize)
      if (items.length === 0) {
        hasMore = false
        break
      }

      this.setProgress({ total: items.length, completed: 0, failed: 0 })

      for (const item of items) {
        if (this.abortController?.signal.aborted) {
          break
        }
        this.setProgress({ current: item.entity_type })

        try {
          await this.processQueueItem(item)
          await syncQueue.markCompleted(item.id)
          this.setProgress({ completed: this._progress.completed + 1 })
          this.emit('item_complete', item)
        } catch (error: any) {
          if (retryEngine.isNetworkError(error)) {
            this.setStatus('offline')
            this.emit('offline')
            return
          }
          await syncQueue.markFailed(item.id, error.message)
          this.setProgress({ failed: this._progress.failed + 1 })
          this.emit('item_failed', { item, error: error.message })
        }
      }
    }
  }

  private async pullRemoteChanges(companyId?: string): Promise<void> {
    const entityTypes = [
      'accounts',
      'journal_entries',
      'invoices',
      'inventory_items',
      'stock_movements',
      'purchase_orders',
      'sales_orders',
      'approval_requests',
      'activity_entries',
    ]

    for (const entityType of entityTypes) {
      if (this.abortController?.signal.aborted) {
        break
      }
      this.setProgress({ current: entityType })
      await this.syncEntityType(entityType, companyId, false)
    }
  }

  private async syncEntityType(
    entityType: string,
    companyId?: string,
    isFullSync: boolean = false,
  ): Promise<DeltaSyncResult | null> {
    try {
      const sinceVersion = isFullSync ? 0 : await syncTracker.getLastSyncVersion(entityType, companyId ?? '')

      const repos = await import('@/lib/supabase/repositories')
      const repo = ((repos as any).repositories ?? repos) as any
      const entityRepo = repo[this.entityTypeToRepoKey(entityType)]
      if (!entityRepo) {
        return null
      }

      const remoteData = await this.fetchRemoteData(entityRepo, entityType, sinceVersion)

      if (!remoteData) {
        return null
      }

      const changeset = await deltaSync.computeChangeset(
        entityType,
        companyId ?? '',
        remoteData.data,
        remoteData.deletes,
        sinceVersion,
      )

      return deltaSync.applyChangeset(entityType, companyId ?? '', changeset)
    } catch {
      return null
    }
  }

  private async fetchRemoteData(
    repo: any,
    entityType: string,
    sinceVersion: number,
  ): Promise<{
    data: Array<{ id: string; data: Record<string, unknown>; version: number }>
    deletes: string[]
  } | null> {
    try {
      const result = await repo.getAll()
      if (!result?.data) {
        return null
      }

      const data = (result.data as any[]).map((item) => ({
        id: item.id ?? item.id?.toString() ?? '',
        data: item as Record<string, unknown>,
        version: ((item as any).version ?? (item as any).updated_at) ? Date.parse((item as any).updated_at) : 0,
      }))

      return { data, deletes: [] }
    } catch {
      return null
    }
  }

  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    await retryEngine.executeWithBackoff(
      async () => {
        const repos = await import('@/lib/supabase/repositories')
        const repo = ((repos as any).repositories ?? repos) as any
        const entityRepo = repo[this.entityTypeToRepoKey(item.entity_type)]
        if (!entityRepo) {
          throw new Error(`No repository for ${item.entity_type}`)
        }

        switch (item.operation) {
          case 'create':
            await entityRepo.create(item.payload)
            break
          case 'update':
            await entityRepo.update(item.entity_id, item.payload)
            break
          case 'delete':
            await entityRepo.delete(item.entity_id)
            break
        }
      },
      (attempt, error) => {
        this.emit('item_failed', { item, error: error.message, attempt })
      },
      { strategy: 'exponential', maxAttempts: 5 },
    )
  }

  private entityTypeToRepoKey(entityType: string): string {
    const map: Record<string, string> = {
      accounts: 'accounts',
      journal_entries: 'journalEntries',
      invoices: 'invoices',
      inventory_items: 'inventoryItems',
      stock_movements: 'stockMovements',
      purchase_orders: 'purchaseOrders',
      sales_orders: 'salesOrders',
      approval_requests: 'approvalRequests',
      activity_entries: 'activityEntries',
      workflow_instances: 'workflowInstances',
      customers: 'customers',
      suppliers: 'suppliers',
      payroll_runs: 'payrollRuns',
      payroll_employees: 'payrollEmployees',
      workflow_events: 'workflowEvents',
    }
    return map[entityType] ?? entityType
  }

  startAutoSync(intervalMs: number = 30000, companyId?: string): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
    this.syncTimer = setInterval(() => {
      if (this._status !== 'syncing' && this._status !== 'offline') {
        this.startSync('incremental', companyId)
      }
    }, intervalMs)
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  async getSyncState(companyId: string): Promise<SyncState | undefined> {
    return getFromStore<SyncState>('sync_state', companyId)
  }

  async updateSyncState(companyId: string, updates: Partial<SyncState>): Promise<void> {
    const existing = await this.getSyncState(companyId)
    const state: SyncState = {
      id: companyId,
      company_id: companyId,
      last_full_sync: updates.last_full_sync ?? existing?.last_full_sync ?? null,
      last_incremental_sync: updates.last_incremental_sync ?? existing?.last_incremental_sync ?? null,
      is_syncing: updates.is_syncing ?? existing?.is_syncing ?? false,
      pending_count: updates.pending_count ?? existing?.pending_count ?? 0,
      failed_count: updates.failed_count ?? existing?.failed_count ?? 0,
      last_error: updates.last_error ?? existing?.last_error ?? null,
      updated_at: Date.now(),
    }
    await putInStore('sync_state', state)
  }

  async retryFailedOperations(): Promise<number> {
    return syncQueue.retryFailed()
  }

  async getPendingCount(): Promise<number> {
    return syncQueue.countByStatus('pending')
  }

  async getFailedCount(): Promise<number> {
    return syncQueue.countByStatus('failed')
  }

  async queueOfflineOperation(
    entityType: string,
    entityId: string,
    companyId: string,
    operation: 'create' | 'update' | 'delete',
    payload: Record<string, unknown>,
    priority?: number,
  ): Promise<string> {
    const existing = await entityStore.get(entityType, entityId)

    return syncQueue.enqueue({
      entity_type: entityType,
      entity_id: entityId,
      company_id: companyId,
      operation,
      payload,
      previous_version: existing?.version ?? null,
      priority: priority ?? batchSync.priorityForEntityType(entityType),
      max_retries: 5,
      batch_id: null,
      last_error: null,
    })
  }

  async onNetworkRestored(companyId?: string): Promise<void> {
    this.setStatus('idle')
    this.emit('online')
    await this.retryFailedOperations()
    await this.startSync('incremental', companyId)
  }

  async onNetworkLost(): Promise<void> {
    this.setStatus('offline')
    this.emit('offline')
  }

  destroy(): void {
    this.stopAutoSync()
    this.listeners.clear()
    this.abortController?.abort()
  }
}

export const syncEngine = new SyncEngine()
