'use client'

import { syncQueue, PRIORITY_HIGH, PRIORITY_NORMAL, PRIORITY_LOW } from './queue'
import type { SyncQueueItem } from '../storage/database'

export const BATCH_SIZE_DEFAULT = 25

export interface BatchableOperation {
  entity_type: string
  entity_id: string
  company_id: string
  operation: 'create' | 'update' | 'delete'
  payload: Record<string, unknown>
  previous_version: number | null
  priority: number
  max_retries: number
  batch_id: string | null
  last_error?: string | null
}

export class BatchSync {
  async createBatch(operations: BatchableOperation[]): Promise<string> {
    const batchId = `batch:${Date.now()}:${crypto.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`

    for (const op of operations) {
      await syncQueue.enqueue({ ...op, batch_id: batchId })
    }

    return batchId
  }

  async createPrioritizedBatch(operations: BatchableOperation[], priority: number = PRIORITY_NORMAL): Promise<string> {
    const prioritized = operations.map((op) => ({ ...op, priority, last_error: op.last_error ?? null }))
    return this.createBatch(prioritized)
  }

  async getBatchOperations(batchId: string): Promise<SyncQueueItem[]> {
    const all = await syncQueue.getAll()
    return all.filter((item) => item.batch_id === batchId)
  }

  async getBatchStatus(batchId: string): Promise<{
    total: number
    completed: number
    failed: number
    pending: number
  }> {
    const operations = await this.getBatchOperations(batchId)
    return {
      total: operations.length,
      completed: operations.filter((o) => o.status === 'completed').length,
      failed: operations.filter((o) => o.status === 'failed').length,
      pending: operations.filter((o) => o.status === 'pending').length,
    }
  }

  async retryBatch(batchId: string): Promise<number> {
    const operations = await this.getBatchOperations(batchId)
    let count = 0
    for (const op of operations) {
      if (op.status === 'failed') {
        await syncQueue.enqueue({
          entity_type: op.entity_type,
          entity_id: op.entity_id,
          company_id: op.company_id,
          operation: op.operation,
          payload: op.payload,
          previous_version: op.previous_version,
          priority: op.priority,
          max_retries: op.max_retries,
          batch_id: batchId,
        })
        await syncQueue.remove(op.id)
        count++
      }
    }
    return count
  }

  priorityForEntityType(entityType: string): number {
    switch (entityType) {
      case 'journal_entries':
      case 'invoices':
      case 'sales_orders':
        return PRIORITY_HIGH
      case 'inventory_items':
      case 'stock_movements':
      case 'purchase_orders':
      case 'approval_requests':
        return PRIORITY_NORMAL
      case 'activity_entries':
      case 'workflow_events':
        return PRIORITY_LOW
      default:
        return PRIORITY_NORMAL
    }
  }
}

export const batchSync = new BatchSync()
