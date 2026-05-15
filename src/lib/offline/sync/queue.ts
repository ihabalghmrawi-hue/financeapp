'use client'

import type { SyncQueueItem } from '../storage/database'
import {
  getFromStore,
  putInStore,
  deleteFromStore,
  getAllFromIndex,
  iterateStore,
  countByIndex,
} from '../storage/database'

export const MAX_RETRIES_DEFAULT = 5
export const PRIORITY_HIGH = 10
export const PRIORITY_NORMAL = 5
export const PRIORITY_LOW = 1

export class SyncQueue {
  async enqueue(item: {
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
  }): Promise<string> {
    const id = `${item.entity_type}:${item.entity_id}:${Date.now()}:${crypto.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`
    const entry: SyncQueueItem = {
      id,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      company_id: item.company_id,
      operation: item.operation,
      payload: item.payload,
      previous_version: item.previous_version,
      status: 'pending',
      priority: item.priority,
      retry_count: 0,
      max_retries: item.max_retries ?? MAX_RETRIES_DEFAULT,
      last_error: null,
      created_at: Date.now(),
      updated_at: Date.now(),
      batch_id: item.batch_id ?? null,
    }
    await putInStore('sync_queue', entry)
    return id
  }

  async dequeue(batchSize: number = 10): Promise<SyncQueueItem[]> {
    const allPending = await getAllFromIndex<SyncQueueItem>('sync_queue', 'status', 'pending')
    const sorted = allPending.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return a.created_at - b.created_at
    })
    const batch = sorted.slice(0, batchSize)

    for (const item of batch) {
      await putInStore('sync_queue', { ...item, status: 'processing', updated_at: Date.now() })
    }

    return batch
  }

  async markCompleted(id: string): Promise<void> {
    const item = await getFromStore<SyncQueueItem>('sync_queue', id)
    if (item) {
      await putInStore('sync_queue', { ...item, status: 'completed', updated_at: Date.now() })
    }
  }

  async markFailed(id: string, error: string): Promise<void> {
    const item = await getFromStore<SyncQueueItem>('sync_queue', id)
    if (!item) {
      return
    }

    const retryCount = item.retry_count + 1
    const willRetry = retryCount < (item.max_retries ?? MAX_RETRIES_DEFAULT)

    await putInStore('sync_queue', {
      ...item,
      status: willRetry ? 'pending' : 'failed',
      retry_count: retryCount,
      last_error: error,
      updated_at: Date.now(),
    })
  }

  async remove(id: string): Promise<void> {
    await deleteFromStore('sync_queue', id)
  }

  async countByStatus(status: SyncQueueItem['status']): Promise<number> {
    return countByIndex('sync_queue', 'status', status)
  }

  async getFailed(): Promise<SyncQueueItem[]> {
    return getAllFromIndex<SyncQueueItem>('sync_queue', 'status', 'failed')
  }

  async getPending(): Promise<SyncQueueItem[]> {
    return getAllFromIndex<SyncQueueItem>('sync_queue', 'status', 'pending')
  }

  async getProcessing(): Promise<SyncQueueItem[]> {
    return getAllFromIndex<SyncQueueItem>('sync_queue', 'status', 'processing')
  }

  async getAll(): Promise<SyncQueueItem[]> {
    const result: SyncQueueItem[] = []
    await iterateStore<SyncQueueItem>('sync_queue', (item) => {
      result.push(item)
    })
    return result
  }

  async resetStuckProcessing(timeoutMs: number = 30000): Promise<number> {
    const stuck = (await getAllFromIndex<SyncQueueItem>('sync_queue', 'status', 'processing')).filter(
      (item) => Date.now() - item.updated_at > timeoutMs,
    )

    for (const item of stuck) {
      await putInStore('sync_queue', { ...item, status: 'pending', updated_at: Date.now() })
    }
    return stuck.length
  }

  async retryFailed(): Promise<number> {
    const failed = await this.getFailed()
    for (const item of failed) {
      await putInStore('sync_queue', { ...item, status: 'pending', retry_count: 0, updated_at: Date.now() })
    }
    return failed.length
  }

  async clearCompleted(): Promise<number> {
    const completed = await getAllFromIndex<SyncQueueItem>('sync_queue', 'status', 'completed')
    let count = 0
    for (const item of completed) {
      await deleteFromStore('sync_queue', item.id)
      count++
    }
    return count
  }

  async purgeAll(): Promise<void> {
    const all = await this.getAll()
    for (const item of all) {
      await deleteFromStore('sync_queue', item.id)
    }
  }

  async getStats(): Promise<{ pending: number; processing: number; failed: number; completed: number }> {
    return {
      pending: await this.countByStatus('pending'),
      processing: await this.countByStatus('processing'),
      failed: await this.countByStatus('failed'),
      completed: await this.countByStatus('completed'),
    }
  }
}

export const syncQueue = new SyncQueue()
