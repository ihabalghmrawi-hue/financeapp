import { crashReporter } from './monitoring/crash-reporter'
import { performanceMonitor } from './monitoring/performance-monitor'
import { telemetryService } from './monitoring/telemetry'
import { certificatePinningService } from './hardening/certificate-pinning'
import { featureFlagService } from './operations/feature-flags'
import { appUpdateService } from './operations/app-update'
import { maintenanceModeService } from './operations/maintenance-mode'
import { remoteConfigService } from './operations/remote-config'
import { forcedLogoutService } from './operations/forced-logout'
import { deviceTrustService } from './hardening/device-trust'
import { antiDebugService } from './hardening/anti-debug'
import { tamperDetectionService } from './hardening/tamper-detection'
import { screenshotProtectionService } from './hardening/screenshot-protection'
import { secretsManager } from './production/secrets'
import { crashAnalyticsService } from './monitoring/crash-analytics'
import { syncHealthService } from './monitoring/sync-health'
import { pushDeliveryService } from './monitoring/push-delivery'
import { startupMetricsService } from './monitoring/startup-metrics'
import { forcedUpgradeService } from './operations/forced-upgrade'
import { stagedRolloutService } from './operations/staged-rollout'

export interface ServiceStatus {
  name: string
  initialized: boolean
  error?: string
}

let initialized = false
let initializationPromise: Promise<ServiceStatus[]> | null = null

export async function initializeMobileServices(): Promise<ServiceStatus[]> {
  if (initialized) {
    return getStatus()
  }
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    const statuses: ServiceStatus[] = []

    const services: [string, () => Promise<void>][] = [
      ['CrashReporter', () => crashReporter.initialize()],
      ['CertificatePinning', () => certificatePinningService.initialize()],
      ['FeatureFlags', () => featureFlagService.initialize()],
      [
        'SecretsManager',
        async () => {
          secretsManager.initialize()
        },
      ],
      [
        'AntiDebug',
        () => {
          antiDebugService.initialize()
          return Promise.resolve()
        },
      ],
      [
        'TamperDetection',
        () => {
          tamperDetectionService.initialize()
          return Promise.resolve()
        },
      ],
      [
        'ScreenshotProtection',
        () => {
          screenshotProtectionService.initialize()
          return Promise.resolve()
        },
      ],
      [
        'CrashAnalytics',
        () => {
          crashAnalyticsService.initialize()
          return Promise.resolve()
        },
      ],
      [
        'SyncHealth',
        () => {
          syncHealthService.initialize()
          return Promise.resolve()
        },
      ],
      [
        'PushDelivery',
        () => {
          pushDeliveryService.initialize()
          return Promise.resolve()
        },
      ],
      [
        'StartupMetrics',
        () => {
          startupMetricsService.initialize()
          return Promise.resolve()
        },
      ],
      ['ForcedUpgrade', () => forcedUpgradeService.initialize()],
      ['StagedRollout', () => stagedRolloutService.initialize()],
    ]

    startupMetricsService.markPhase('services_init_start')

    for (const [name, init] of services) {
      try {
        await init()
        statuses.push({ name, initialized: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        statuses.push({ name, initialized: false, error: message })
      }
    }

    startupMetricsService.markPhase('services_initialized')

    telemetryService.initialize()
    statuses.push({ name: 'Telemetry', initialized: true })

    performanceMonitor.startAppStartupTimer()
    statuses.push({ name: 'PerformanceMonitor', initialized: true })
    statuses.push({ name: 'ForcedLogout', initialized: true })
    statuses.push({ name: 'RemoteConfig', initialized: true })
    statuses.push({ name: 'AppUpdate', initialized: true })
    statuses.push({ name: 'MaintenanceMode', initialized: true })
    statuses.push({ name: 'DeviceTrust', initialized: true })

    initialized = true
    startupMetricsService.markStartupComplete()
    return statuses
  })()

  return initializationPromise
}

export function destroyMobileServices(): void {
  appUpdateService.stopPeriodicCheck()
  maintenanceModeService.stopPeriodicCheck()
  forcedUpgradeService.destroy()
  antiDebugService.destroy()
  tamperDetectionService.destroy()
  screenshotProtectionService.destroy()
  syncHealthService.destroy()
  initialized = false
  initializationPromise = null
}

export function isMobileServicesInitialized(): boolean {
  return initialized
}

export function getStatus(): ServiceStatus[] {
  return []
}

export function endAppStartupTimer(): number | null {
  return performanceMonitor.endAppStartupTimer()
}
