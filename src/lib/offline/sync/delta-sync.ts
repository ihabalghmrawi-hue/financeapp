'use client'

import { entityStore } from '../storage/entity-store'
import { syncTracker } from './sync-tracker'

export interface DeltaSyncResult {
  entityType: string
  inserted: number
  updated: number
  deleted: number
  errors: string[]
  newVersion: number
}

export interface DeltaChangeset {
  inserts: Array<{ id: string; data: Record<string, unknown>; version: number }>
  updates: Array<{ id: string; data: Record<string, unknown>; version: number }>
  deletes: string[]
}

export class DeltaSync {
  async computeChangeset(
    entityType: string,
    companyId: string,
    remoteData: Array<{ id: string; data: Record<string, unknown>; version: number }>,
    remoteDeletes: string[],
    sinceVersion: number,
  ): Promise<DeltaChangeset> {
    const localEntities = await entityStore.getAll(entityType, companyId)
    const localMap = new Map(localEntities.map((e) => [e.id, e]))
    const remoteMap = new Map(remoteData.map((r) => [r.id, r]))

    const inserts: DeltaChangeset['inserts'] = []
    const updates: DeltaChangeset['updates'] = []

    for (const remote of remoteData) {
      const local = localMap.get(remote.id)
      if (!local) {
        inserts.push(remote)
      } else if (remote.version > local.version && !local.dirty) {
        updates.push(remote)
      }
    }

    const deletes = remoteDeletes.filter((id) => localMap.has(id))

    return { inserts, updates, deletes }
  }

  async applyChangeset(entityType: string, companyId: string, changeset: DeltaChangeset): Promise<DeltaSyncResult> {
    const errors: string[] = []
    let inserted = 0
    let updated = 0
    let deleted = 0

    for (const insert of changeset.inserts) {
      try {
        await entityStore.put({
          id: insert.id,
          entity_type: entityType,
          company_id: companyId,
          data: insert.data as Record<string, unknown>,
          version: insert.version,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          synced_at: new Date().toISOString(),
          dirty: false,
        })
        await syncTracker.track(entityType, insert.id, companyId, insert.version, '')
        inserted++
      } catch (e: any) {
        errors.push(`insert:${insert.id}:${e.message}`)
      }
    }

    for (const update of changeset.updates) {
      try {
        await entityStore.put({
          id: update.id,
          entity_type: entityType,
          company_id: companyId,
          data: update.data as Record<string, unknown>,
          version: update.version,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          synced_at: new Date().toISOString(),
          dirty: false,
        })
        await syncTracker.track(entityType, update.id, companyId, update.version, '')
        updated++
      } catch (e: any) {
        errors.push(`update:${update.id}:${e.message}`)
      }
    }

    for (const id of changeset.deletes) {
      try {
        await entityStore.delete(entityType, id)
        await syncTracker.remove(entityType, id)
        deleted++
      } catch (e: any) {
        errors.push(`delete:${id}:${e.message}`)
      }
    }

    const newVersion = changeset.updates.reduce(
      (max, u) => Math.max(max, u.version),
      changeset.inserts.reduce((max, i) => Math.max(max, i.version), 0),
    )

    return { entityType, inserted, updated, deleted, errors, newVersion }
  }
}

export const deltaSync = new DeltaSync()
