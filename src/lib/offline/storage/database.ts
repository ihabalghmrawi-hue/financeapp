'use client'

const DB_NAME = 'erp-offline'
const DB_VERSION = 1

export type StoreName =
  | 'entities'
  | 'queries'
  | 'sync_queue'
  | 'sync_tracker'
  | 'drafts'
  | 'workspace'
  | 'audit_log'
  | 'pending_ops'
  | 'sync_state'
  | 'encrypted'
  | 'conflicts'

export interface DBSchema {
  entities: { key: string; value: StoredEntity; indexes: ['entity_type', 'company_id', 'updated_at'] }
  queries: { key: string; value: StoredQuery; indexes: ['company_id', 'entity_type', 'expires_at'] }
  sync_queue: { key: string; value: SyncQueueItem; indexes: ['status', 'entity_type', 'priority', 'created_at'] }
  sync_tracker: { key: string; value: SyncTrackerEntry; indexes: ['entity_type', 'company_id'] }
  drafts: { key: string; value: StoredDraft; indexes: ['entity_type', 'company_id', 'created_at'] }
  workspace: { key: string; value: StoredWorkspace; indexes: ['workspace_id'] }
  audit_log: { key: string; value: AuditEntry; indexes: ['entity_type', 'company_id', 'created_at', 'status'] }
  pending_ops: { key: string; value: PendingOperation; indexes: ['entity_type', 'company_id', 'status'] }
  sync_state: { key: string; value: SyncState; indexes: ['company_id'] }
  encrypted: { key: string; value: EncryptedBlob; indexes: ['namespace'] }
  conflicts: { key: string; value: ConflictEntry; indexes: ['entity_type', 'company_id', 'status'] }
}

export interface StoredEntity {
  id: string
  entity_type: string
  company_id: string
  data: Record<string, unknown>
  version: number
  updated_at: string
  created_at: string
  synced_at: string | null
  dirty: boolean
  checksum: string
}

export interface StoredQuery {
  id: string
  company_id: string
  entity_type: string
  query_key: string
  result: unknown[]
  total: number
  filters: Record<string, unknown>
  expires_at: number
  created_at: number
}

export interface SyncQueueItem {
  id: string
  entity_type: string
  entity_id: string
  company_id: string
  operation: 'create' | 'update' | 'delete'
  payload: Record<string, unknown>
  previous_version: number | null
  status: 'pending' | 'processing' | 'failed' | 'completed'
  priority: number
  retry_count: number
  max_retries: number
  last_error: string | null
  created_at: number
  updated_at: number
  batch_id: string | null
}

export interface SyncTrackerEntry {
  id: string
  entity_type: string
  entity_id: string
  company_id: string
  current_version: number
  last_synced_at: string | null
  checksum: string
  dirty: boolean
}

export interface StoredDraft {
  id: string
  entity_type: string
  company_id: string
  data: Record<string, unknown>
  title: string
  created_at: number
  updated_at: number
  synced: boolean
  parent_id: string | null
}

export interface StoredWorkspace {
  id: string
  workspace_id: string
  company_id: string
  state: Record<string, unknown>
  updated_at: number
}

export interface AuditEntry {
  id: string
  entity_type: string
  entity_id: string
  company_id: string
  operation: string
  payload: Record<string, unknown>
  status: 'pending' | 'synced' | 'failed'
  created_at: number
  synced_at: number | null
}

export interface PendingOperation {
  id: string
  entity_type: string
  entity_id: string
  company_id: string
  operation: string
  payload: Record<string, unknown>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: number
  updated_at: number
}

export interface SyncState {
  id: string
  company_id: string
  last_full_sync: string | null
  last_incremental_sync: string | null
  is_syncing: boolean
  pending_count: number
  failed_count: number
  last_error: string | null
  updated_at: number
}

export interface EncryptedBlob {
  id: string
  namespace: string
  iv: string
  data: string
  created_at: number
}

export interface ConflictEntry {
  id: string
  entity_type: string
  entity_id: string
  company_id: string
  local_version: number
  remote_version: number
  local_data: Record<string, unknown>
  remote_data: Record<string, unknown>
  strategy: 'local_wins' | 'remote_wins' | 'manual' | null
  status: 'pending' | 'resolved' | 'ignored'
  created_at: number
  resolved_at: number | null
}

type IndexConfig = { name: string; keyPath: string | string[]; unique?: boolean }

function storeConfig(name: StoreName): { keyPath: string; indexes: IndexConfig[] } {
  switch (name) {
    case 'entities':
      return {
        keyPath: 'id',
        indexes: [
          { name: 'entity_type', keyPath: 'entity_type' },
          { name: 'company_id', keyPath: 'company_id' },
          { name: 'updated_at', keyPath: 'updated_at' },
        ],
      }
    case 'queries':
      return {
        keyPath: 'id',
        indexes: [
          { name: 'company_id', keyPath: 'company_id' },
          { name: 'entity_type', keyPath: 'entity_type' },
          { name: 'expires_at', keyPath: 'expires_at' },
        ],
      }
    case 'sync_queue':
      return {
        keyPath: 'id',
        indexes: [
          { name: 'status', keyPath: 'status' },
          { name: 'entity_type', keyPath: 'entity_type' },
          { name: 'priority', keyPath: 'priority' },
          { name: 'created_at', keyPath: 'created_at' },
        ],
      }
    case 'sync_tracker':
      return {
        keyPath: 'id',
        indexes: [
          { name: 'entity_type', keyPath: 'entity_type' },
          { name: 'company_id', keyPath: 'company_id' },
        ],
      }
    case 'drafts':
      return {
        keyPath: 'id',
        indexes: [
          { name: 'entity_type', keyPath: 'entity_type' },
          { name: 'company_id', keyPath: 'company_id' },
          { name: 'created_at', keyPath: 'created_at' },
        ],
      }
    case 'workspace':
      return { keyPath: 'id', indexes: [{ name: 'workspace_id', keyPath: 'workspace_id' }] }
    case 'audit_log':
      return {
        keyPath: 'id',
        indexes: [
          { name: 'entity_type', keyPath: 'entity_type' },
          { name: 'company_id', keyPath: 'company_id' },
          { name: 'created_at', keyPath: 'created_at' },
          { name: 'status', keyPath: 'status' },
        ],
      }
    case 'pending_ops':
      return {
        keyPath: 'id',
        indexes: [
          { name: 'entity_type', keyPath: 'entity_type' },
          { name: 'company_id', keyPath: 'company_id' },
          { name: 'status', keyPath: 'status' },
        ],
      }
    case 'sync_state':
      return { keyPath: 'id', indexes: [{ name: 'company_id', keyPath: 'company_id' }] }
    case 'encrypted':
      return { keyPath: 'id', indexes: [{ name: 'namespace', keyPath: 'namespace' }] }
    case 'conflicts':
      return {
        keyPath: 'id',
        indexes: [
          { name: 'entity_type', keyPath: 'entity_type' },
          { name: 'company_id', keyPath: 'company_id' },
          { name: 'status', keyPath: 'status' },
        ],
      }
  }
}

let dbInstance: IDBDatabase | null = null
let openPromise: Promise<IDBDatabase> | null = null

export async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }
  if (openPromise) {
    return openPromise
  }

  openPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const existing = Array.from(db.objectStoreNames)

      const allStores: StoreName[] = [
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

      for (const store of allStores) {
        if (!existing.includes(store)) {
          const cfg = storeConfig(store)
          const objectStore = db.createObjectStore(store, { keyPath: cfg.keyPath })
          for (const idx of cfg.indexes) {
            objectStore.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false })
          }
        }
      }
    }

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      dbInstance.onversionchange = () => {
        dbInstance?.close()
        dbInstance = null
      }
      resolve(dbInstance)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })

  return openPromise
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    openPromise = null
  }
}

export async function withStore<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<T>[],
): Promise<T[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(name, mode)
    const store = transaction.objectStore(name)
    const requests = callback(store)
    const reqArray = Array.isArray(requests) ? requests : [requests]

    const results: T[] = []
    let completed = 0

    for (const req of reqArray) {
      req.onsuccess = (event) => {
        results.push((event.target as IDBRequest<T>).result)
        completed++
        if (completed === reqArray.length) {
          resolve(results)
        }
      }
      req.onerror = (event) => {
        reject((event.target as IDBRequest).error)
      }
    }

    transaction.onerror = (event) => {
      reject((event.target as IDBTransaction).error)
    }
  })
}

export async function getAllFromIndex<T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey | IDBKeyRange,
): Promise<T[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)

    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

export async function getFromStore<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)

    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

export async function putInStore<T>(storeName: StoreName, value: T): Promise<IDBValidKey> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(value)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteFromStore(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function countInStore(storeName: StoreName, query?: IDBValidKey | IDBKeyRange): Promise<number> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = query ? store.count(query) : store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function countByIndex(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey | IDBKeyRange,
): Promise<number> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.count(value)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function iterateStore<T>(
  storeName: StoreName,
  callback: (item: T) => void,
  indexName?: string,
  range?: IDBValidKey | IDBKeyRange,
): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const source = indexName ? store.index(indexName) : store
    const request = source.openCursor(range)

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        callback(cursor.value as T)
        cursor.continue()
      } else {
        resolve()
      }
    }
    request.onerror = () => reject(request.error)
  })
}
