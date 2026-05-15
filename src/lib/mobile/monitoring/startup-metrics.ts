import { telemetryService } from './telemetry'
import { performanceMonitor } from './performance-monitor'
import { isProduction } from '../production/environments'

export interface StartupMetrics {
  appLaunchTime: number | null
  serviceInitTime: number | null
  firstRenderTime: number | null
  apiReadyTime: number | null
  totalStartupTime: number | null
  startupCompleted: boolean
  coldStart: boolean
  timestamp: string
}

export interface StartupPhase {
  name: string
  duration: number
  status: 'success' | 'failed' | 'skipped'
}

type StartupListener = (metrics: StartupMetrics) => void

class StartupMetricsService {
  private listeners: StartupListener[] = []
  private metrics: StartupMetrics = {
    appLaunchTime: null,
    serviceInitTime: null,
    firstRenderTime: null,
    apiReadyTime: null,
    totalStartupTime: null,
    startupCompleted: false,
    coldStart: true,
    timestamp: new Date().toISOString(),
  }
  private phases: StartupPhase[] = []
  private marks: Map<string, number> = new Map()
  private initialized = false

  initialize(): void {
    if (this.initialized) {
      return
    }
    this.initialized = true

    this.marks.set('app_launch', performance.now())

    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', () => {
        this.markPhase('dom_ready')
      })

      window.addEventListener('load', () => {
        this.markPhase('window_loaded')
      })
    }

    this.detectColdStart()
    this.startPerformanceObserver()
  }

  markPhase(name: string, status: StartupPhase['status'] = 'success'): void {
    const now = performance.now()
    this.marks.set(name, now)

    const previousMark = this.getPreviousMark(name)
    const duration = previousMark !== null ? now - previousMark : 0

    this.phases.push({ name, duration, status })

    if (name === 'services_initialized') {
      this.metrics.serviceInitTime = now - (this.marks.get('app_launch') || now)
    }
    if (name === 'first_render') {
      this.metrics.firstRenderTime = now - (this.marks.get('app_launch') || now)
    }
    if (name === 'api_ready') {
      this.metrics.apiReadyTime = now - (this.marks.get('app_launch') || now)
    }

    this.checkStartupComplete()

    telemetryService.trackPerformance(name, duration, { phase: name, status })
  }

  setAppLaunchTime(time: number): void {
    this.metrics.appLaunchTime = time
    this.marks.set('app_launch', time)
  }

  markStartupComplete(): void {
    const now = performance.now()
    const launchTime = this.marks.get('app_launch')
    if (launchTime) {
      this.metrics.totalStartupTime = now - launchTime
    }
    this.metrics.startupCompleted = true
    this.metrics.timestamp = new Date().toISOString()

    if (isProduction() && this.metrics.totalStartupTime !== null) {
      telemetryService.trackPerformance('total_startup', this.metrics.totalStartupTime, {
        coldStart: this.metrics.coldStart,
        phaseCount: this.phases.length,
      })

      performanceMonitor.recordMetric({
        name: 'startup_time',
        value: this.metrics.totalStartupTime,
        unit: 'ms',
        tags: {},
        timestamp: Date.now(),
      })
    }

    this.markPhase('startup_complete')
    this.notify()
  }

  getMetrics(): StartupMetrics {
    return { ...this.metrics }
  }

  getPhases(): StartupPhase[] {
    return [...this.phases]
  }

  getTotalStartupTime(): number | null {
    return this.metrics.totalStartupTime
  }

  onStartupComplete(listener: StartupListener): () => void {
    if (this.metrics.startupCompleted) {
      listener(this.metrics)
    }
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  isColdStart(): boolean {
    return this.metrics.coldStart
  }

  generatePerformanceReport(): Record<string, unknown> {
    const report: Record<string, unknown> = {
      totalStartupTime: this.metrics.totalStartupTime,
      phases: this.phases,
      coldStart: this.metrics.coldStart,
      completed: this.metrics.startupCompleted,
    }

    if (this.phases.length > 0) {
      const slowPhases = this.phases.filter((p) => p.duration > 1000)
      if (slowPhases.length > 0) {
        report.slowPhases = slowPhases
      }
    }

    return report
  }

  private detectColdStart(): void {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navEntry) {
        this.metrics.coldStart = navEntry.type === 'navigate'
      }
    } catch {
      try {
        const nav = performance.navigation
        this.metrics.coldStart = nav.type === nav.TYPE_NAVIGATE
      } catch {}
    }
  }

  private startPerformanceObserver(): void {
    try {
      if (typeof PerformanceObserver === 'undefined') {
        return
      }

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        for (const entry of entries) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.metrics.firstRenderTime = entry.startTime
            this.markPhase('first_paint')
          }
        }
      })

      observer.observe({ entryTypes: ['largest-contentful-paint', 'paint'] })
    } catch {}
  }

  private getPreviousMark(currentName: string): number | null {
    let previousMark: number | null = null
    const entries = Array.from(this.marks.entries())
    for (let i = 0; i < entries.length; i++) {
      if (entries[i][0] === currentName) {
        break
      }
      if (i > 0) {
        previousMark = entries[i - 1][1]
      }
    }
    return previousMark || this.marks.get('app_launch') || null
  }

  private checkStartupComplete(): void {
    if (
      this.metrics.serviceInitTime !== null &&
      this.metrics.firstRenderTime !== null &&
      this.metrics.apiReadyTime !== null &&
      !this.metrics.startupCompleted
    ) {
      this.markStartupComplete()
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.metrics))
  }
}

export const startupMetricsService = new StartupMetricsService()
