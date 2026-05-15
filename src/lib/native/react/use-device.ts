'use client'

import { useState, useEffect, useCallback } from 'react'
import { deviceService } from '../device-service'
import { storageMonitor } from '../storage-monitor'
import type { DeviceInfo, StorageInfo } from '../types'

export function useDevice() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [dev, stor] = await Promise.all([deviceService.getInfo(), storageMonitor.check()])
      setDeviceInfo(dev)
      setStorageInfo(stor)
      setLoading(false)
    }
    load()

    const unsub = storageMonitor.on((info) => setStorageInfo(info))
    return unsub
  }, [])

  const refresh = useCallback(async () => {
    const [dev, stor] = await Promise.all([deviceService.getInfo(), storageMonitor.check()])
    setDeviceInfo(dev)
    setStorageInfo(stor)
  }, [])

  return { deviceInfo, storageInfo, loading, refresh }
}
