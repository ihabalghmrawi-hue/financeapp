import { pluginOrchestrator } from '../plugin-orchestrator'
import { deviceService } from '../device-service'

export interface DeviceTrustResult {
  trusted: boolean
  score: number
  checks: DeviceTrustCheck[]
}

export interface DeviceTrustCheck {
  name: string
  passed: boolean
  severity: 'low' | 'medium' | 'high'
  details?: string
}

class DeviceTrustService {
  async validate(): Promise<DeviceTrustResult> {
    const checks: DeviceTrustCheck[] = []

    const rootCheck = await this.checkRootStatus()
    checks.push(rootCheck)

    const debugCheck = this.checkDebugMode()
    checks.push(debugCheck)

    const emulatorCheck = this.checkEmulator()
    checks.push(emulatorCheck)

    const screenLockCheck = await this.checkScreenLock()
    checks.push(screenLockCheck)

    const installSourceCheck = this.checkInstallSource()
    checks.push(installSourceCheck)

    const passed = checks.filter((c) => c.passed).length
    const score = Math.round((passed / checks.length) * 100)

    return {
      trusted: score >= 60 && !checks.some((c) => !c.passed && c.severity === 'high'),
      score,
      checks,
    }
  }

  async isTrusted(): Promise<boolean> {
    const result = await this.validate()
    return result.trusted
  }

  private async checkRootStatus(): Promise<DeviceTrustCheck> {
    try {
      const { Device } = await pluginOrchestrator.getDevice()
      const info = await Device.getInfo()
      if (info.isVirtual) {
        return { name: 'الجهاز الجذري', passed: true, severity: 'medium', details: 'جهاز افتراضي' }
      }
      return { name: 'الجهاز الجذري', passed: true, severity: 'high' }
    } catch {
      return { name: 'الجهاز الجذري', passed: false, severity: 'high', details: 'تعذر التحقق' }
    }
  }

  private checkDebugMode(): DeviceTrustCheck {
    try {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return { name: 'وضع التصحيح', passed: false, severity: 'medium', details: 'وضع المطور نشط' }
      }
      return { name: 'وضع التصحيح', passed: true, severity: 'medium' }
    } catch {
      return { name: 'وضع التصحيح', passed: false, severity: 'medium', details: 'تعذر التحقق' }
    }
  }

  private checkEmulator(): DeviceTrustCheck {
    const ua = navigator.userAgent.toLowerCase()
    const isEmulator =
      ua.includes('android studio') ||
      ua.includes('genymotion') ||
      ua.includes('sdk') ||
      document.querySelector('meta[name="viewport"]')?.getAttribute('content')?.includes('emu') ||
      false

    return {
      name: 'المحاكي',
      passed: !isEmulator,
      severity: 'medium',
      details: isEmulator ? 'يتم تشغيل التطبيق على محاكي' : undefined,
    }
  }

  private async checkScreenLock(): Promise<DeviceTrustCheck> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      const result = await NativeBiometric.isAvailable()
      return {
        name: 'قفل الشاشة',
        passed: result.isAvailable,
        severity: 'low',
        details: result.isAvailable ? undefined : 'الجهاز غير محمي بقفل شاشة',
      }
    } catch {
      return { name: 'قفل الشاشة', passed: false, severity: 'low', details: 'تعذر التحقق' }
    }
  }

  private checkInstallSource(): DeviceTrustCheck {
    const isHttps = window.location.protocol === 'https:'
    return {
      name: 'مصدر التثبيت',
      passed: isHttps || window.location.hostname === 'localhost',
      severity: 'high',
      details: isHttps ? undefined : 'اتصال غير آمن',
    }
  }
}

export const deviceTrustService = new DeviceTrustService()
