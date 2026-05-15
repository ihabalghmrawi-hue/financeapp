'use client'

import { useState, useEffect, useCallback } from 'react'
import { permissionOrchestrator } from '../permission-orchestrator'
import type { PermissionStatus, PermissionState } from '../types'

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const status = await permissionOrchestrator.checkAll()
    setPermissions(status)
    setLoading(false)
    return status
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const request = useCallback(
    async (type: keyof PermissionStatus): Promise<boolean> => {
      let result = false
      switch (type) {
        case 'camera':
          result = permissionOrchestrator.isGranted(await permissionOrchestrator.requestCamera())
          break
        case 'notifications':
          result = permissionOrchestrator.isGranted(await permissionOrchestrator.requestNotifications())
          break
        case 'biometric':
          result = await permissionOrchestrator.requestBiometric()
          break
        default:
          result = false
      }
      await refresh()
      return result
    },
    [refresh],
  )

  const check = useCallback(
    async (type: keyof PermissionStatus): Promise<PermissionState> => {
      return permissions?.[type] ?? 'denied'
    },
    [permissions],
  )

  return { permissions, loading, refresh, request, check }
}
