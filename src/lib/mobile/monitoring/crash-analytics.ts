import { crashReporter } from './crash-reporter'
import { telemetryService } from './telemetry'
import { isProduction, environment } from '../production/environments'

export interface CrashAnalyticsReport {
  totalCrashes: number
  crashFreeRate: number
  topErrors: Array<{ message: string; count: number; severity: string }>
  crashRatePerSession: number
  timeRange: { start: string; end: string }
  affectedUsers: number
}

export interface SessionCrashData {
  crashCount: number
  lastCrash: string | null
  breadcrumbs: string[]
}

class CrashAnalyticsService {
  private crashes: SessionCrashData = {
    crashCount: 0,
    lastCrash: null,
    breadcrumbs: [],
  }
  private sessionStart: string = new Date().toISOString()
  private maxBreadcrumbs = 50
  private initialized = false

  initialize(): void {
    if (this.initialized) {
      return
    }
    this.initialized = true

    this.installGlobalHandlers()
    this.startHeartbeat()
  }

  leaveBreadcrumb(message: string, data?: Record<string, unknown>): void {
    const entry = `[${new Date().toISOString()}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}`
    this.crashes.breadcrumbs.push(entry)
    if (this.crashes.breadcrumbs.length > this.maxBreadcrumbs) {
      this.crashes.breadcrumbs.shift()
    }
  }

  getSessionData(): SessionCrashData {
    return { ...this.crashes, breadcrumbs: [...this.crashes.breadcrumbs] }
  }

  getCrashAnalytics(timeRangeMs = 3600000): CrashAnalyticsReport {
    const end = new Date().toISOString()
    const start = new Date(Date.now() - timeRangeMs).toISOString()

    return {
      totalCrashes: this.crashes.crashCount,
      crashFreeRate: this.crashes.crashCount === 0 ? 100 : Math.max(0, 100 - (this.crashes.crashCount / 100) * 100),
      topErrors: [],
      crashRatePerSession:
        this.crashes.crashCount / Math.max(1, (Date.now() - new Date(this.sessionStart).getTime()) / 3600000),
      timeRange: { start, end },
      affectedUsers: this.crashes.crashCount > 0 ? 1 : 0,
    }
  }

  getBreadcrumbs(): string[] {
    return [...this.crashes.breadcrumbs]
  }

  private installGlobalHandlers(): void {
    if (typeof window === 'undefined') {
      return
    }
    const originalOnError = window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      this.crashes.crashCount++
      this.crashes.lastCrash = new Date().toISOString()
      this.leaveBreadcrumb('Global error', { source, lineno, colno })

      telemetryService.trackError('global_error', {
        message,
        source,
        lineno,
        colno,
        breadcrumbs: this.crashes.breadcrumbs.slice(-10),
      })

      if (isProduction()) {
        crashReporter.captureException(error || String(message), {
          context: { source, lineno, colno, breadcrumbs: this.crashes.breadcrumbs.slice(-10) },
          severity: 'error',
          tags: { handler: 'global_onerror' },
        })
      }

      if (typeof originalOnError === 'function') {
        originalOnError.call(window, message, source, lineno, colno, error)
      }
      return true
    }

    const originalOnRejection = window.onunhandledrejection
    if (typeof window === 'undefined') {
      return
    }
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      this.crashes.crashCount++
      this.crashes.lastCrash = new Date().toISOString()
      this.leaveBreadcrumb('Unhandled rejection', { reason: String(event.reason) })

      telemetryService.trackError('unhandled_rejection', {
        reason: String(event.reason),
        breadcrumbs: this.crashes.breadcrumbs.slice(-10),
      })

      if (isProduction()) {
        crashReporter.captureException(event.reason?.message || String(event.reason), {
          context: { breadcrumbs: this.crashes.breadcrumbs.slice(-10) },
          severity: 'error',
          tags: { handler: 'unhandledrejection' },
        })
      }

      if (typeof originalOnRejection === 'function') {
        originalOnRejection.call(window, event)
      }
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.crashes.crashCount > 0) {
        telemetryService.track({
          name: 'session_health',
          category: 'performance',
          metadata: {
            crashCount: this.crashes.crashCount,
            uptime: Date.now() - new Date(this.sessionStart).getTime(),
            breadcrumbs: this.crashes.breadcrumbs.length,
          },
        })
      }
    }, 300000)
  }
}

export const crashAnalyticsService = new CrashAnalyticsService()
