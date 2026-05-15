import { deviceRegistry } from '../device-registry'
import { badgeManager } from '../badge-manager'
import { inAppNotificationStore } from '../notification-store'
import { pushRegistrationService } from '../push-registration'
import { syncEngine } from '@/lib/offline/sync/sync-engine'

class ResumeSyncService {
  private synced = false

  async onResume(companyId: string, userId: string): Promise<void> {
    if (this.synced) {
      return
    }
    this.synced = true

    try {
      if (!pushRegistrationService.isRegistered) {
        await pushRegistrationService.register(companyId, userId)
      }

      const device = deviceRegistry.getActiveDevices(companyId, userId)[0]
      if (device) {
        device.lastSeenAt = new Date().toISOString()
      }

      await badgeManager.refreshFromStore(companyId, userId)
      await inAppNotificationStore.dismissOld(30)
      await deviceRegistry.invalidateStaleTokens(90)
    } catch {
      /* ignore */
    }

    try {
      const isOnline = await checkConnectivity()
      if (isOnline) {
        await syncEngine.startSync('incremental', companyId)
      }
    } catch {
      /* ignore */
    }
  }

  async onColdStart(companyId: string, userId: string): Promise<void> {
    try {
      await inAppNotificationStore.dismissOld(30)
      await deviceRegistry.invalidateStaleTokens(90)
      await deviceRegistry.cleanupInactive()
      await badgeManager.refreshFromStore(companyId, userId)
    } catch {
      /* ignore */
    }
  }

  reset(): void {
    this.synced = false
  }
}

async function checkConnectivity(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    return response.ok
  } catch {
    return false
  }
}

export const resumeSyncService = new ResumeSyncService()
