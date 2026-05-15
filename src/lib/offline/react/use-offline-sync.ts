'use client'

import { useState, useEffect, useCallback } from 'react'
import { offlineService } from '../services/offline-service'
import { syncEngine } from '../sync/sync-engine'

interface OfflineSyncOptions {
  companyId: string
  mode?: 'incremental' | 'full' | 'push_only'
  autoSync?: boolean
  interval?: number
}

interface OfflineSyncResult {
  syncing: boolean
  lastSyncAt: Date | null
  syncProgress: { total: number; completed: number; failed: number }
  startSync: () => Promise<void>
  cancelSync: () => Promise<void>
  retryFailed: () => Promise<number>
}

export function useOfflineSync({
  companyId,
  mode = 'incremental',
  autoSync = false,
  interval = 30000,
}: OfflineSyncOptions): OfflineSyncResult {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [syncProgress, setSyncProgress] = useState({ total: 0, completed: 0, failed: 0 })

  useEffect(() => {
    const unsub = syncEngine.on((event) => {
      switch (event.type) {
        case 'sync_start':
          setSyncing(true)
          setSyncProgress({ total: 0, completed: 0, failed: 0 })
          break
        case 'sync_complete':
          setSyncing(false)
          setLastSyncAt(new Date())
          break
        case 'sync_error':
          setSyncing(false)
          break
        case 'item_complete':
          setSyncProgress((prev) => ({ ...prev, completed: prev.completed + 1 }))
          break
        case 'item_failed':
          setSyncProgress((prev) => ({ ...prev, failed: prev.failed + 1 }))
          break
      }
    })

    if (autoSync) {
      syncEngine.startAutoSync(interval, companyId)
    }

    return () => {
      unsub()
      if (autoSync) {
        syncEngine.stopAutoSync()
      }
    }
  }, [companyId, autoSync, interval])

  const startSync = useCallback(async () => {
    await syncEngine.startSync(mode, companyId)
  }, [mode, companyId])

  const cancelSync = useCallback(async () => {
    await syncEngine.cancelSync()
    setSyncing(false)
  }, [])

  const retryFailed = useCallback(async () => {
    return syncEngine.retryFailedOperations()
  }, [])

  return { syncing, lastSyncAt, syncProgress, startSync, cancelSync, retryFailed }
}
