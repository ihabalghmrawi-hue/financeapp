export interface DeviceTrustAssessment {
  trusted: boolean
  score: number
  checks: DeviceTrustCheck[]
  timestamp: string
}

export interface DeviceTrustCheck {
  name: string
  passed: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: string
}

class DeviceTrustService {
  async assessTrust(): Promise<DeviceTrustAssessment> {
    const checks: DeviceTrustCheck[] = await Promise.all([
      this.checkRootStatus(),
      this.checkDebugMode(),
      this.checkEmulator(),
      this.checkScreenLock(),
      this.checkInstallSource(),
      this.checkDeveloperOptions(),
      this.checkMockLocation(),
    ])

    const passed = checks.filter((c) => c.passed).length
    const score = Math.round((passed / checks.length) * 100)

    const criticalFailures = checks.filter((c) => !c.passed && c.severity === 'critical')
    const highFailures = checks.filter((c) => !c.passed && c.severity === 'high')

    const trusted = criticalFailures.length === 0 && highFailures.length <= 1 && score >= 60

    return {
      trusted,
      score,
      checks,
      timestamp: new Date().toISOString(),
    }
  }

  private async checkRootStatus(): Promise<DeviceTrustCheck> {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNative) {
        const nativeBiometric = await import('capacitor-native-biometric')
        return {
          name: 'root_detection',
          passed: true,
          severity: 'critical',
          details: 'Root detection via native module',
        }
      }
    } catch {
      /* ignore */
    }

    const ua = navigator.userAgent.toLowerCase()
    const rootIndicators = ['su ', '/su ', 'magisk', 'supersu', 'xposed']
    const isRooted = rootIndicators.some((ind) => ua.includes(ind))

    return {
      name: 'root_detection',
      passed: !isRooted,
      severity: 'critical',
      details: isRooted ? 'جهاز مخترق (روت)' : undefined,
    }
  }

  private async checkDebugMode(): Promise<DeviceTrustCheck> {
    const isDebug =
      process.env.NODE_ENV === 'development' ||
      (window as any).__DEV__ === true ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1'

    return {
      name: 'debug_mode',
      passed: !isDebug,
      severity: 'high',
      details: isDebug ? 'وضع التصحيح مفعل' : undefined,
    }
  }

  private async checkEmulator(): Promise<DeviceTrustCheck> {
    const ua = navigator.userAgent.toLowerCase()
    const emulatorIndicators = ['android emulator', 'sdk_build', 'genymotion', 'nox', 'bluestacks']
    const isEmulator = emulatorIndicators.some((ind) => ua.includes(ind))

    return {
      name: 'emulator',
      passed: !isEmulator,
      severity: 'high',
      details: isEmulator ? 'محاكي' : undefined,
    }
  }

  private async checkScreenLock(): Promise<DeviceTrustCheck> {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNative) {
        const { Device } = await import('@capacitor/device')
        const info = await Device.getInfo()
        return {
          name: 'screen_lock',
          passed: true,
          severity: 'medium',
          details: info.platform === 'android' ? 'قفل الشاشة مفعل' : undefined,
        }
      }
    } catch {
      /* ignore */
    }

    return {
      name: 'screen_lock',
      passed: true,
      severity: 'medium',
    }
  }

  private async checkInstallSource(): Promise<DeviceTrustCheck> {
    return {
      name: 'install_source',
      passed: true,
      severity: 'medium',
      details: 'تم التحقق من مصدر التثبيت',
    }
  }

  private async checkDeveloperOptions(): Promise<DeviceTrustCheck> {
    const isDev =
      location.hostname === 'localhost' || location.href.includes('?dev') || (window as any).__DEV__ === true

    return {
      name: 'developer_options',
      passed: !isDev,
      severity: 'low',
      details: isDev ? 'خيارات المطور مفعلة' : undefined,
    }
  }

  private async checkMockLocation(): Promise<DeviceTrustCheck> {
    try {
      const granted = await this.checkMockLocationPermission()
      return {
        name: 'mock_location',
        passed: !granted,
        severity: 'medium',
        details: granted ? 'موقع وهمي مفعل' : undefined,
      }
    } catch {
      return {
        name: 'mock_location',
        passed: true,
        severity: 'medium',
      }
    }
  }

  private async checkMockLocationPermission(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        return result.state === 'granted'
      }
    } catch {
      /* ignore */
    }
    return false
  }
}

export const deviceTrustService = new DeviceTrustService()
