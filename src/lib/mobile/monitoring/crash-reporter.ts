import { environment, isProduction } from '../production/environments'

export interface CrashReport {
  id: string
  timestamp: string
  message: string
  stack?: string
  context: Record<string, unknown>
  deviceInfo?: Record<string, unknown>
  userInfo?: Record<string, unknown>
  environment: string
  version: string
  build: number
  severity: 'fatal' | 'error' | 'warning'
  tags: Record<string, string>
}

class CrashReporter {
  private reports: CrashReport[] = []
  private initialized = false
  private endpoint = '/api/mobile/crash-report'

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    this.initialized = true

    if (isProduction() && environment.enableCrashReporting) {
      window.addEventListener('error', (event) => {
        this.captureException(event.error ?? event.message, {
          context: { filename: event.filename, lineno: event.lineno, colno: event.colno },
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(event.reason?.message ?? 'Unhandled Promise Rejection', {
          context: { reason: event.reason },
        })
      })

      if (environment.sentryDsn) {
        await this.initSentry()
      }
    }
  }

  private async initSentry(): Promise<void> {
    try {
      // Optional peer dep — resolved at runtime only when installed.
      // The variable indirection prevents the bundler from trying to
      // resolve the module at build time.
      const sentryModule = '@sentry/browser'
      // @ts-ignore - optional dependency, caught by try/catch
      const Sentry: any = await import(/* webpackIgnore: true */ /* @vite-ignore */ sentryModule)
      Sentry.init({
        dsn: environment.sentryDsn,
        environment: environment.apiUrl,
        release: `${environment.appVersion} (${environment.buildNumber})`,
        tracesSampleRate: 0.2,
        beforeSend: (event: any) => {
          if (!isProduction()) {
            return null
          }
          return event
        },
      })
    } catch {
      /* sentry not installed */
    }
  }

  captureException(error: Error | string, context?: Partial<CrashReport>): void {
    const report: CrashReport = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context: context?.context ?? {},
      deviceInfo: context?.deviceInfo,
      userInfo: context?.userInfo,
      environment: environment.apiUrl,
      version: environment.appVersion,
      build: environment.buildNumber,
      severity: context?.severity ?? 'error',
      tags: context?.tags ?? {},
    }

    this.reports.push(report)
    this.sendReport(report)
  }

  captureWarning(message: string, context?: Record<string, unknown>): void {
    this.captureException(message, {
      severity: 'warning',
      context,
    } as any)
  }

  private async sendReport(report: CrashReport): Promise<void> {
    if (!isProduction()) {
      console.warn('[CrashReporter] Would send:', report.message)
      return
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true,
      })
    } catch {
      /* queue for later */
      this.queueReport(report)
    }
  }

  private queueReport(report: CrashReport): void {
    try {
      const queue = JSON.parse(localStorage.getItem('crash_queue') || '[]')
      queue.push(report)
      localStorage.setItem('crash_queue', JSON.stringify(queue.slice(-50)))
    } catch {
      /* ignore */
    }
  }

  async flushQueue(): Promise<void> {
    try {
      const queue = JSON.parse(localStorage.getItem('crash_queue') || '[]')
      if (queue.length === 0) {
        return
      }

      await fetch(`${this.endpoint}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: queue }),
        keepalive: true,
      })
      localStorage.removeItem('crash_queue')
    } catch {
      /* ignore */
    }
  }

  setUser(id: string, email?: string, name?: string): void {
    try {
      if ((window as any).Sentry) {
        ;(window as any).Sentry.setUser({ id, email, username: name })
      }
    } catch {
      /* ignore */
    }
  }

  private generateId(): string {
    return `cr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}

export const crashReporter = new CrashReporter()
