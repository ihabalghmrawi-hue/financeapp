'use client'

import type { StoredQuery } from './database'
import { getFromStore, putInStore, deleteFromStore, getAllFromIndex, clearStore } from './database'

const DEFAULT_TTL = 5 * 60 * 1000

export class QueryCache {
  private generateKey(entityType: string, filters: Record<string, unknown>): string {
    const stable = JSON.stringify(filters, Object.keys(filters).sort())
    let hash = 0
    for (let i = 0; i < stable.length; i++) {
      hash = (hash << 5) - hash + stable.charCodeAt(i)
      hash = hash & hash
    }
    return `${entityType}:${Math.abs(hash).toString(36)}`
  }

  async get<T>(entityType: string, filters: Record<string, unknown>): Promise<{ data: T[]; total: number } | null> {
    const key = this.generateKey(entityType, filters)
    const cached = await getFromStore<StoredQuery>('queries', key)

    if (!cached) {
      return null
    }
    if (Date.now() > cached.expires_at) {
      await deleteFromStore('queries', key)
      return null
    }

    return { data: cached.result as T[], total: cached.total }
  }

  async set<T>(
    entityType: string,
    filters: Record<string, unknown>,
    data: T[],
    total: number,
    companyId: string,
    ttl: number = DEFAULT_TTL,
  ): Promise<void> {
    const key = this.generateKey(entityType, filters)
    const entry: StoredQuery = {
      id: key,
      company_id: companyId,
      entity_type: entityType,
      query_key: key,
      result: data as unknown[],
      total,
      filters,
      expires_at: Date.now() + ttl,
      created_at: Date.now(),
    }
    await putInStore('queries', entry)
  }

  async invalidate(entityType: string): Promise<void> {
    const entries = await getAllFromIndex<StoredQuery>('queries', 'entity_type', entityType)
    for (const entry of entries) {
      await deleteFromStore('queries', entry.id)
    }
  }

  async invalidateAll(): Promise<void> {
    await clearStore('queries')
  }

  async cleanup(): Promise<number> {
    const now = Date.now()
    const entries = await getAllFromIndex<StoredQuery>('queries', 'expires_at', IDBKeyRange.upperBound(now))
    let count = 0
    for (const entry of entries) {
      await deleteFromStore('queries', entry.id)
      count++
    }
    return count
  }
}

export const queryCache = new QueryCache()
