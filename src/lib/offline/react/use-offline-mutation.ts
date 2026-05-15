'use client'

import { useState, useCallback, useRef } from 'react'
import { offlineService } from '../services/offline-service'
import { retryEngine } from '../sync/retry-engine'

interface OfflineMutationOptions {
  entityType: string
  companyId: string
  optimistic?: boolean
  retry?: boolean
}

interface OfflineMutationResult<T> {
  execute: (operation: 'create' | 'update' | 'delete', payload: T, entityId?: string) => Promise<string>
  executing: boolean
  lastError: string | null
  lastQueueId: string | null
  reset: () => void
}

export function useOfflineMutation<T = Record<string, unknown>>(
  options: OfflineMutationOptions,
): OfflineMutationResult<T> {
  const [executing, setExecuting] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastQueueId, setLastQueueId] = useState<string | null>(null)
  const lastOpRef = useRef<AbortController | null>(null)

  const execute = useCallback(
    async (operation: 'create' | 'update' | 'delete', payload: T, entityId?: string): Promise<string> => {
      if (lastOpRef.current) {
        lastOpRef.current.abort()
      }
      const controller = new AbortController()
      lastOpRef.current = controller

      setExecuting(true)
      setLastError(null)

      try {
        const id = entityId ?? String((payload as any)?.id ?? crypto.randomUUID())
        const queueId = await offlineService.sync.queueOfflineOperation(
          options.entityType,
          id,
          options.companyId,
          operation,
          payload as unknown as Record<string, unknown>,
        )

        if (options.optimistic) {
          await offlineService.entities.put({
            id,
            entity_type: options.entityType,
            company_id: options.companyId,
            data: payload as unknown as Record<string, unknown>,
            version: 0,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            synced_at: null,
            dirty: true,
          })
        }

        setLastQueueId(queueId)
        return queueId
      } catch (error: any) {
        setLastError(error.message)
        throw error
      } finally {
        if (!controller.signal.aborted) {
          setExecuting(false)
        }
      }
    },
    [options.entityType, options.companyId, options.optimistic],
  )

  const reset = useCallback(() => {
    setLastError(null)
    setLastQueueId(null)
    setExecuting(false)
  }, [])

  return { execute, executing, lastError, lastQueueId, reset }
}
