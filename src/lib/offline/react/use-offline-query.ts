'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { entityStore } from '../storage/entity-store'
import { queryCache } from '../storage/query-cache'
import { offlineService } from '../services/offline-service'
import { syncEngine } from '../sync/sync-engine'

interface OfflineQueryOptions {
  entityType: string
  companyId: string
  filters?: Record<string, unknown>
  ttl?: number
  enabled?: boolean
}

interface OfflineQueryResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  isStale: boolean
  isFromCache: boolean
  refetch: () => Promise<void>
}

export function useOfflineQuery<T = Record<string, unknown>>(options: OfflineQueryOptions): OfflineQueryResult<T> {
  const { entityType, companyId, filters = {}, ttl, enabled = true } = options
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [isFromCache, setIsFromCache] = useState(false)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!enabled) {
      return
    }
    setLoading(true)
    setError(null)

    try {
      const cached = await queryCache.get<T>(entityType, filters)
      if (cached && cached.data.length > 0) {
        setData(cached.data)
        setIsFromCache(true)
        setLoading(false)
        setIsStale(true)
      }

      const stored = await entityStore.getAll(entityType, companyId)
      const entityData = stored.map((s) => s.data as T)

      if (entityData.length > 0) {
        setData(entityData)
        setIsFromCache(true)
        setLoading(false)
        setIsStale(stored.some((s) => s.dirty))

        await queryCache.set(entityType, filters, entityData, entityData.length, companyId, ttl)
      }

      if (entityData.length === 0 && (!cached || cached.data.length === 0)) {
        const isOnline = await offlineService.isOnline()
        if (isOnline) {
          setLoading(true)
          await syncEngine.startSync('incremental', companyId)
          const refreshed = await entityStore.getAll(entityType, companyId)
          setData(refreshed.map((s) => s.data as T))
          setIsFromCache(true)
          setIsStale(false)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [entityType, companyId, JSON.stringify(filters), enabled, ttl])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  return { data, loading, error, isStale, isFromCache, refetch }
}
