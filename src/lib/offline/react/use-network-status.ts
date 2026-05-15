'use client'

import { useState, useEffect } from 'react'
import { connectivityMonitor, type ConnectionStatus, type ConnectionQuality } from '../network/connectivity'

interface NetworkStatusInfo {
  status: ConnectionStatus
  quality: ConnectionQuality
  isOnline: boolean
  wasOffline: boolean
}

export function useNetworkStatus(): NetworkStatusInfo {
  const [info, setInfo] = useState<NetworkStatusInfo>({
    status: connectivityMonitor.status,
    quality: connectivityMonitor.quality,
    isOnline: connectivityMonitor.status !== 'offline',
    wasOffline: false,
  })

  useEffect(() => {
    const unsub = connectivityMonitor.on((status, quality) => {
      setInfo((prev) => ({
        status,
        quality: quality ?? prev.quality,
        isOnline: status !== 'offline',
        wasOffline: status === 'online' ? prev.wasOffline : true,
      }))
    })

    const interval = setInterval(() => {
      const status = connectivityMonitor.status
      setInfo((prev) => ({
        ...prev,
        status,
        quality: connectivityMonitor.quality,
        isOnline: status !== 'offline',
      }))
    }, 3000)

    return () => {
      unsub()
      clearInterval(interval)
    }
  }, [])

  return info
}
