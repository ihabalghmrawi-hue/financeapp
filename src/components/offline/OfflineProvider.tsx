'use client'

import type { ReactNode } from 'react'
import { OfflineProvider as LibOfflineProvider } from '@/lib/offline/react/offline-provider'
import { OfflineBanner } from './OfflineBanner'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { PendingOperationsBadge } from './PendingOperationsBadge'

interface OfflineProviderProps {
  children: ReactNode
  companyId?: string
  showUI?: boolean
}

export function OfflineProvider({ children, companyId, showUI = true }: OfflineProviderProps) {
  return (
    <LibOfflineProvider companyId={companyId} autoSync autoInitialize>
      {showUI && (
        <>
          <OfflineBanner />
          <SyncStatusIndicator />
          <PendingOperationsBadge />
        </>
      )}
      {children}
    </LibOfflineProvider>
  )
}

export { useOffline } from '@/lib/offline/react/offline-provider'
