'use client'

import type { SyncTrackerEntry } from '../storage/database'
import { getFromStore, putInStore, deleteFromStore, getAllFromIndex, iterateStore } from '../storage/database'
import { entityStore } from '../storage/entity-store'

export class SyncTracker {
  async get(entityType: string, entityId: string): Promise<SyncTrackerEntry | undefined> {
    return getFromStore<SyncTrackerEntry>('sync_tracker', `${entityType}:${entityId}`)
  }

  async track(
    entityType: string,
    entityId: string,
    companyId: string,
    version: number,
    checksum: string,
  ): Promise<void> {
    const id = `${entityType}:${entityId}`
    const existing = await this.get(entityType, entityId)

    await putInStore('sync_tracker', {
      id,
      entity_type: entityType,
      entity_id: entityId,
      company_id: companyId,
      current_version: version,
      last_synced_at: new Date().toISOString(),
      checksum,
      dirty: false,
    })
  }

  async markDirty(entityType: string, entityId: string): Promise<void> {
    const entry = await this.get(entityType, entityId)
    if (entry) {
      await putInStore('sync_tracker', { ...entry, dirty: true })
    }
  }

  async getDirty(companyId: string): Promise<SyncTrackerEntry[]> {
    const result: SyncTrackerEntry[] = []
    await iterateStore<SyncTrackerEntry>('sync_tracker', (item) => {
      if (item.dirty && item.company_id === companyId) {
        result.push(item)
      }
    })
    return result
  }

  async getByEntityType(entityType: string, companyId: string): Promise<SyncTrackerEntry[]> {
    const all = await getAllFromIndex<SyncTrackerEntry>('sync_tracker', 'entity_type', entityType)
    return all.filter((e) => e.company_id === companyId)
  }

  async getLastSyncVersion(entityType: string, companyId: string): Promise<number> {
    const entries = await this.getByEntityType(entityType, companyId)
    return entries.reduce((max, e) => Math.max(max, e.current_version), 0)
  }

  async getAllForCompany(companyId: string): Promise<SyncTrackerEntry[]> {
    const result: SyncTrackerEntry[] = []
    await iterateStore<SyncTrackerEntry>('sync_tracker', (item) => {
      if (item.company_id === companyId) {
        result.push(item)
      }
    })
    return result
  }

  async countByEntityType(companyId: string): Promise<Record<string, number>> {
    const entries = await this.getAllForCompany(companyId)
    const counts: Record<string, number> = {}
    for (const entry of entries) {
      counts[entry.entity_type] = (counts[entry.entity_type] ?? 0) + 1
    }
    return counts
  }

  async remove(entityType: string, entityId: string): Promise<void> {
    await deleteFromStore('sync_tracker', `${entityType}:${entityId}`)
  }

  async isEntityDirty(entityType: string, entityId: string): Promise<boolean> {
    const entry = await this.get(entityType, entityId)
    return entry?.dirty ?? false
  }
}

export const syncTracker = new SyncTracker()
