'use client'

import { useState, useEffect } from 'react'
import { syncEngine, type SyncStatus } from '../sync/sync-engine'
import { syncQueue } from '../sync/queue'
import { connectivityMonitor } from '../network/connectivity'

interface SyncStatusInfo {
  status: SyncStatus
  pendingCount: number
  failedCount: number
  isOnline: boolean
  isSyncing: boolean
  lastSyncedAt: Date | null
}

export function useSyncStatus(refreshInterval: number = 5000): SyncStatusInfo {
  const [info, setInfo] = useState<SyncStatusInfo>({
    status: syncEngine.status,
    pendingCount: 0,
    failedCount: 0,
    isOnline: connectivityMonitor.status !== 'offline',
    isSyncing: syncEngine.isSyncing,
    lastSyncedAt: null,
  })

  useEffect(() => {
    const update = async () => {
      const [pending, failed] = await Promise.all([
        syncQueue.countByStatus('pending'),
        syncQueue.countByStatus('failed'),
      ])

      setInfo({
        status: syncEngine.status,
        pendingCount: pending,
        failedCount: failed,
        isOnline: connectivityMonitor.status !== 'offline',
        isSyncing: syncEngine.isSyncing,
        lastSyncedAt: null,
      })
    }

    update()
    const interval = setInterval(update, refreshInterval)

    const unsubSync = syncEngine.on(() => {
      update()
    })
    const unsubNet = connectivityMonitor.on(() => {
      update()
    })

    return () => {
      clearInterval(interval)
      unsubSync()
      unsubNet()
    }
  }, [refreshInterval])

  return info
}
