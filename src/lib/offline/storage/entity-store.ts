'use client'

import type { StoredEntity } from './database'
import {
  openDatabase,
  getAllFromIndex,
  getFromStore,
  putInStore,
  deleteFromStore,
  countByIndex,
  iterateStore,
} from './database'

function computeChecksum(data: Record<string, unknown>): string {
  let hash = 0
  const str = JSON.stringify(data, Object.keys(data).sort())
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export class EntityStore {
  async get(entityType: string, id: string): Promise<StoredEntity | undefined> {
    return getFromStore<StoredEntity>('entities', `${entityType}:${id}`)
  }

  async getAll(entityType: string, companyId: string): Promise<StoredEntity[]> {
    const all = await getAllFromIndex<StoredEntity>('entities', 'entity_type', entityType)
    return all.filter((e) => e.company_id === companyId)
  }

  async put(entity: Omit<StoredEntity, 'checksum'>): Promise<void> {
    const checksum = computeChecksum(entity.data)
    const key = `${entity.entity_type}:${entity.id}`
    const existing = await this.get(entity.entity_type, entity.id)

    await putInStore('entities', {
      ...entity,
      checksum,
      updated_at: entity.updated_at || new Date().toISOString(),
      synced_at: entity.synced_at || existing?.synced_at || null,
      dirty: entity.dirty ?? true,
    })
  }

  async delete(entityType: string, id: string): Promise<void> {
    await deleteFromStore('entities', `${entityType}:${id}`)
  }

  async count(entityType: string, companyId: string): Promise<number> {
    return countByIndex('entities', 'entity_type', entityType)
  }

  async getDirty(entityType?: string): Promise<StoredEntity[]> {
    const result: StoredEntity[] = []
    await iterateStore<StoredEntity>(
      'entities',
      (item) => {
        if (item.dirty && (!entityType || item.entity_type === entityType)) {
          result.push(item)
        }
      },
      entityType ? 'entity_type' : undefined,
      entityType ? entityType : undefined,
    )
    return result
  }

  async markSynced(entityType: string, id: string, version: number): Promise<void> {
    const key = `${entityType}:${id}`
    const existing = await getFromStore<StoredEntity>('entities', key)
    if (existing) {
      await putInStore('entities', {
        ...existing,
        dirty: false,
        version,
        synced_at: new Date().toISOString(),
      })
    }
  }

  async bulkPut(entities: Array<Omit<StoredEntity, 'checksum'>>): Promise<void> {
    const db = await openDatabase()
    const transaction = db.transaction('entities', 'readwrite')
    const store = transaction.objectStore('entities')

    return new Promise((resolve, reject) => {
      for (const entity of entities) {
        const checksum = computeChecksum(entity.data)
        store.put({ ...entity, checksum })
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async bulkDelete(entityType: string, ids: string[]): Promise<void> {
    const db = await openDatabase()
    const transaction = db.transaction('entities', 'readwrite')
    const store = transaction.objectStore('entities')

    return new Promise((resolve, reject) => {
      for (const id of ids) {
        store.delete(`${entityType}:${id}`)
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async getByVersion(entityType: string, sinceVersion: number): Promise<StoredEntity[]> {
    const result: StoredEntity[] = []
    await iterateStore<StoredEntity>(
      'entities',
      (item) => {
        if (item.version > sinceVersion) {
          result.push(item)
        }
      },
      'entity_type',
      entityType,
    )
    return result
  }
}

export const entityStore = new EntityStore()
