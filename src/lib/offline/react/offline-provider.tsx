'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { offlineService, type OfflineTelemetry } from '../services/offline-service'
import { syncEngine, type SyncStatus } from '../sync/sync-engine'
import { connectivityMonitor, type ConnectionStatus } from '../network/connectivity'

interface OfflineContextValue {
  initialized: boolean
  isOnline: boolean
  networkStatus: ConnectionStatus
  syncStatus: SyncStatus
  telemetry: OfflineTelemetry
  pendingCount: number
  failedCount: number
  conflictCount: number
  startSync: (mode?: 'full' | 'incremental' | 'push_only') => Promise<void>
  retryFailed: () => Promise<number>
  clearAllData: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext)
  if (!ctx) {
    throw new Error('useOffline must be used within OfflineProvider')
  }
  return ctx
}

interface OfflineProviderProps {
  children: ReactNode
  companyId?: string
  autoSync?: boolean
  autoInitialize?: boolean
}

export function OfflineProvider({ children, companyId, autoSync = true, autoInitialize = true }: OfflineProviderProps) {
  const [initialized, setInitialized] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus>('unknown')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [telemetry, setTelemetry] = useState<OfflineTelemetry>(offlineService.telemetry)
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [conflictCount, setConflictCount] = useState(0)
  const initRef = useRef(false)

  useEffect(() => {
    if (!autoInitialize || initRef.current) {
      return
    }
    initRef.current = true

    offlineService.initialize(companyId).then(() => {
      setInitialized(true)
      refreshMetrics()
    })

    const unsubSync = syncEngine.on((event) => {
      setSyncStatus(syncEngine.status)
      if (event.type === 'sync_complete' || event.type === 'item_complete' || event.type === 'item_failed') {
        refreshMetrics()
      }
    })

    const unsubNet = connectivityMonitor.on((status) => {
      setNetworkStatus(status)
    })

    const interval = setInterval(refreshMetrics, 10000)

    return () => {
      unsubSync()
      unsubNet()
      clearInterval(interval)
    }
  }, [autoInitialize, companyId])

  const refreshMetrics = useCallback(async () => {
    try {
      await offlineService.updateTelemetry()
      const t = offlineService.telemetry
      setTelemetry(t)
      setPendingCount(t.pendingOps)
      setFailedCount(t.failedOps)
      setConflictCount(t.conflictCount)
    } catch {}
  }, [])

  const startSync = useCallback(
    async (mode: 'full' | 'incremental' | 'push_only' = 'incremental') => {
      await syncEngine.startSync(mode, companyId)
      refreshMetrics()
    },
    [companyId, refreshMetrics],
  )

  const retryFailed = useCallback(async () => {
    const count = await syncEngine.retryFailedOperations()
    refreshMetrics()
    return count
  }, [refreshMetrics])

  const clearAllData = useCallback(async () => {
    await offlineService.clearAllData()
    refreshMetrics()
  }, [refreshMetrics])

  return (
    <OfflineContext.Provider
      value={{
        initialized,
        isOnline: networkStatus !== 'offline',
        networkStatus,
        syncStatus,
        telemetry,
        pendingCount,
        failedCount,
        conflictCount,
        startSync,
        retryFailed,
        clearAllData,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}
