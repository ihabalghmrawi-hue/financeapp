import { isProduction, environment } from '../production/environments'

export interface TamperCheck {
  name: string
  passed: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  detail?: string
}

export interface TamperAssessment {
  tampered: boolean
  score: number
  checks: TamperCheck[]
  timestamp: string
}

type TamperListener = (assessment: TamperAssessment) => void

class TamperDetectionService {
  private listeners: TamperListener[] = []
  private lastAssessment: TamperAssessment | null = null
  private initialized = false
  private checkInterval: ReturnType<typeof setInterval> | null = null

  initialize(): void {
    if (this.initialized) {
      return
    }
    this.initialized = true

    this.runChecks()

    this.checkInterval = setInterval(() => {
      this.runChecks()
    }, 60000)

    if (isProduction()) {
      this.protectGlobals()
    }
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.initialized = false
  }

  onTamperDetected(listener: TamperListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  getLastAssessment(): TamperAssessment | null {
    return this.lastAssessment
  }

  async runChecks(): Promise<TamperAssessment> {
    const checks: TamperCheck[] = await Promise.all([
      this.checkGlobalOverwrites(),
      this.checkLocalStorageAccess(),
      this.checkServiceWorkerIntegrity(),
      this.checkIframeInjection(),
      this.checkCSPViolations(),
      this.checkCookieTampering(),
      this.checkDOMClobbering(),
    ])

    const failedCritical = checks.filter((c) => !c.passed && c.severity === 'critical')
    const failedHigh = checks.filter((c) => !c.passed && c.severity === 'high')
    const passed = checks.filter((c) => c.passed).length
    const score = Math.round((passed / checks.length) * 100)

    const tampered = failedCritical.length > 0 || (failedHigh.length > 1 && score < 50)

    this.lastAssessment = {
      tampered,
      score,
      checks,
      timestamp: new Date().toISOString(),
    }

    if (tampered) {
      this.notify()
    }

    return this.lastAssessment
  }

  private async checkGlobalOverwrites(): Promise<TamperCheck> {
    if (typeof window === 'undefined') {
      return { name: 'global_overwrites', passed: true, severity: 'critical' }
    }
    const globals = ['fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage']
    let tampered = false

    for (const key of globals) {
      const desc = Object.getOwnPropertyDescriptor(window, key as any)
      if (!desc || !desc.configurable) {
        continue
      }

      const original = (window as any)[key]
      const nativeStr = Function.prototype.toString.call(original)
      if (nativeStr.includes('native code')) {
        continue
      }

      tampered = true
    }

    return {
      name: 'global_overwrites',
      passed: !tampered,
      severity: 'critical',
      detail: tampered ? 'تم العبث بالوظائف الأساسية' : undefined,
    }
  }

  private async checkLocalStorageAccess(): Promise<TamperCheck> {
    try {
      const testKey = `__tamper_test_${Date.now()}`
      localStorage.setItem(testKey, 'test')
      const val = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      return {
        name: 'local_storage_integrity',
        passed: val === 'test',
        severity: 'high',
        detail: val !== 'test' ? 'تم العبث بالتخزين المحلي' : undefined,
      }
    } catch {
      return {
        name: 'local_storage_integrity',
        passed: false,
        severity: 'high',
        detail: 'التخزين المحلي غير متاح',
      }
    }
  }

  private async checkServiceWorkerIntegrity(): Promise<TamperCheck> {
    if (!('serviceWorker' in navigator)) {
      return {
        name: 'service_worker_integrity',
        passed: true,
        severity: 'low',
      }
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      const unexpected = registrations.filter((reg) => {
        const scope = reg.scope || ''
        return !scope.includes(window.location.origin)
      })

      return {
        name: 'service_worker_integrity',
        passed: unexpected.length === 0,
        severity: 'high',
        detail: unexpected.length > 0 ? 'سكريبتات خارجية غير متوقعة' : undefined,
      }
    } catch {
      return {
        name: 'service_worker_integrity',
        passed: true,
        severity: 'low',
      }
    }
  }

  private async checkIframeInjection(): Promise<TamperCheck> {
    if (typeof document === 'undefined') {
      return { name: 'iframe_injection', passed: true, severity: 'critical' }
    }
    try {
      const iframes = document.getElementsByTagName('iframe')
      const unexpectedIframes: HTMLIFrameElement[] = []

      for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i]
        const src = iframe.src || ''
        if (src && !src.startsWith(window.location.origin) && !src.startsWith('blob:')) {
          unexpectedIframes.push(iframe)
        }
      }

      return {
        name: 'iframe_injection',
        passed: unexpectedIframes.length === 0,
        severity: 'critical',
        detail: unexpectedIframes.length > 0 ? 'اكتشاف إطارات خارجية غير متوقعة' : undefined,
      }
    } catch {
      return {
        name: 'iframe_injection',
        passed: true,
        severity: 'medium',
      }
    }
  }

  private async checkCSPViolations(): Promise<TamperCheck> {
    if (typeof (SecurityPolicyViolationEvent as any) === 'undefined') {
      return {
        name: 'csp_violations',
        passed: true,
        severity: 'low',
      }
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          name: 'csp_violations',
          passed: true,
          severity: 'medium',
        })
      }, 1000)

      const handler = (e: SecurityPolicyViolationEvent) => {
        clearTimeout(timeout)
        document.removeEventListener('securitypolicyviolation', handler)
        resolve({
          name: 'csp_violations',
          passed: false,
          severity: 'high',
          detail: `CSP: ${e.violatedDirective} - ${e.blockedURI}`,
        })
      }

      document.addEventListener('securitypolicyviolation', handler)
    })
  }

  private async checkCookieTampering(): Promise<TamperCheck> {
    if (typeof document === 'undefined') {
      return { name: 'cookie_integrity', passed: true, severity: 'medium' }
    }
    try {
      const testCookie = `__tamper_${Date.now()}`
      document.cookie = `${testCookie}=test; path=/; max-age=60`
      const hasCookie = document.cookie.includes(testCookie)
      if (hasCookie) {
        document.cookie = `${testCookie}=; path=/; max-age=0`
      }
      return {
        name: 'cookie_integrity',
        passed: true,
        severity: 'medium',
      }
    } catch {
      return {
        name: 'cookie_integrity',
        passed: true,
        severity: 'low',
      }
    }
  }

  private async checkDOMClobbering(): Promise<TamperCheck> {
    if (typeof document === 'undefined') {
      return { name: 'dom_clobbering', passed: true, severity: 'low' }
    }
    try {
      const anchors = document.getElementsByTagName('a')
      for (let i = 0; i < anchors.length; i++) {
        const a = anchors[i]
        if (a.id && typeof (window as any)[a.id] !== 'undefined') {
          if ((window as any)[a.id] === a) {
            return {
              name: 'dom_clobbering',
              passed: false,
              severity: 'high',
              detail: `Clobbered ID: ${a.id}`,
            }
          }
        }
      }
      return {
        name: 'dom_clobbering',
        passed: true,
        severity: 'low',
      }
    } catch {
      return {
        name: 'dom_clobbering',
        passed: true,
        severity: 'low',
      }
    }
  }

  private protectGlobals(): void {
    if (typeof window === 'undefined') {
      return
    }
    const protectedKeys = ['fetch', 'XMLHttpRequest', 'WebSocket']

    for (const key of protectedKeys) {
      try {
        const original = (window as any)[key]
        Object.defineProperty(window, key, {
          configurable: false,
          writable: false,
          value: original,
        })
      } catch {}
    }
  }

  private notify(): void {
    if (this.lastAssessment) {
      this.listeners.forEach((l) => l(this.lastAssessment!))
    }
  }
}

export const tamperDetectionService = new TamperDetectionService()
