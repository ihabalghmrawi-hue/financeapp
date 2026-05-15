'use client'

import { useEffect, useRef, useState, createContext, useContext, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { initializeMobileServices, destroyMobileServices, endAppStartupTimer } from './bootstrap'
import { forcedLogoutService } from './operations/forced-logout'
import { maintenanceModeService } from './operations/maintenance-mode'
import { appUpdateService } from './operations/app-update'
import { forcedUpgradeService, type UpgradeStatus } from './operations/forced-upgrade'
import { deviceTrustService, type DeviceTrustAssessment } from './hardening/device-trust'
import { antiDebugService } from './hardening/anti-debug'
import { tamperDetectionService, type TamperAssessment } from './hardening/tamper-detection'
import { screenshotProtectionService } from './hardening/screenshot-protection'
import { telemetryService } from './monitoring/telemetry'
import { startupMetricsService } from './monitoring/startup-metrics'
import { useAuth } from '@/lib/auth'

export interface MobileContextValue {
  isInitialized: boolean
  isUnderMaintenance: boolean
  trustScore: number | null
  deviceTrust: DeviceTrustAssessment | null
  upgradeStatus: UpgradeStatus | null
  tamperAssessment: TamperAssessment | null
}

const MobileContext = createContext<MobileContextValue>({
  isInitialized: false,
  isUnderMaintenance: false,
  trustScore: null,
  deviceTrust: null,
  upgradeStatus: null,
  tamperAssessment: null,
})

export function useMobile(): MobileContextValue {
  return useContext(MobileContext)
}

export function MobileProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false)
  const [trustScore, setTrustScore] = useState<number | null>(null)
  const [deviceTrust, setDeviceTrust] = useState<DeviceTrustAssessment | null>(null)
  const [upgradeStatus, setUpgradeStatus] = useState<UpgradeStatus | null>(null)
  const [tamperAssessment, setTamperAssessment] = useState<TamperAssessment | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logoutUnsubscribeRef = useRef<(() => void) | null>(null)
  const initRan = useRef(false)

  useEffect(() => {
    if (initRan.current) {
      return
    }
    initRan.current = true

    startupMetricsService.setAppLaunchTime(performance.now())
    startupMetricsService.markPhase('render_start')

    initializeMobileServices().then(() => {
      setIsInitialized(true)
      endAppStartupTimer()
      startupMetricsService.markPhase('first_render')

      deviceTrustService.assessTrust().then((assessment) => {
        setDeviceTrust(assessment)
        setTrustScore(assessment.score)
        telemetryService.trackPerformance('device_trust', 0, {
          trusted: assessment.trusted,
          score: assessment.score,
        })
      })

      forcedUpgradeService.checkUpgradeStatus().then((status) => {
        setUpgradeStatus(status)
        if (status.blocked) {
          telemetryService.track({
            name: 'upgrade_blocked',
            category: 'error',
            metadata: {
              currentVersion: status.currentVersion,
              requiredVersion: status.requiredVersion,
            },
          })
        }
      })

      tamperDetectionService.onTamperDetected((assessment) => {
        setTamperAssessment(assessment)
        telemetryService.trackError('tamper_detected', {
          score: assessment.score,
          failedChecks: assessment.checks.filter((c) => !c.passed).map((c) => c.name),
        })
      })

      antiDebugService.onDetection((state) => {
        if (state.debuggerDetected || state.devToolsOpen) {
          telemetryService.trackError('debugger_detected', state as unknown as Record<string, unknown>)
        }
      })
    })

    const unsubLogout = forcedLogoutService.onForcedLogout(async (reason) => {
      telemetryService.track({
        name: 'forced_logout',
        category: 'error',
        metadata: { code: reason.code, message: reason.message },
      })
      try {
        await supabase.auth.signOut()
      } catch {
        /* ignore */
      }
      try {
        localStorage.clear()
      } catch {
        /* ignore */
      }
      router.push('/auth/login')
    })
    logoutUnsubscribeRef.current = unsubLogout

    const unsubMaintenance = maintenanceModeService.onMaintenanceChange((state) => {
      setIsUnderMaintenance(state.active)
    })
    maintenanceModeService.startPeriodicCheck()

    return () => {
      unsubLogout()
      unsubMaintenance()
      destroyMobileServices()
    }
  }, [router, supabase.auth])

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = (() => {
        try {
          return localStorage.getItem('session_token') ?? ''
        } catch {
          return ''
        }
      })()

      forcedLogoutService.pollForLogout(user.id, token)
      pollingRef.current = setInterval(() => {
        const t = (() => {
          try {
            return localStorage.getItem('session_token') ?? ''
          } catch {
            return ''
          }
        })()
        forcedLogoutService.pollForLogout(user.id, t)
      }, 30000)

      appUpdateService.startPeriodicCheck()
      deviceTrustService.assessTrust().then((assessment) => {
        setDeviceTrust(assessment)
        setTrustScore(assessment.score)
      })
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      appUpdateService.stopPeriodicCheck()
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      appUpdateService.stopPeriodicCheck()
    }
  }, [isAuthenticated, user])

  return (
    <MobileContext.Provider
      value={{
        isInitialized,
        isUnderMaintenance,
        trustScore,
        deviceTrust,
        upgradeStatus,
        tamperAssessment,
      }}
    >
      {children}
    </MobileContext.Provider>
  )
}
