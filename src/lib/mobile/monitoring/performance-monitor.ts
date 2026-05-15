import { telemetryService } from './telemetry'

export interface MetricPoint {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percent'
  tags: Record<string, string>
  timestamp: number
}

interface StartTimeMark {
  name: string
  start: number
  metadata?: Record<string, unknown>
}

class PerformanceMonitor {
  private marks: Map<string, StartTimeMark> = new Map()
  private metrics: MetricPoint[] = []
  private readonly MAX_METRICS = 200

  markStart(name: string, metadata?: Record<string, unknown>): void {
    this.marks.set(name, {
      name,
      start: performance.now(),
      metadata,
    })
  }

  markEnd(name: string): number | null {
    const mark = this.marks.get(name)
    if (!mark) {
      return null
    }

    const duration = performance.now() - mark.start
    this.recordMetric({
      name: `perf.${name}`,
      value: duration,
      unit: 'ms',
      tags: {},
      timestamp: Date.now(),
    })

    telemetryService.trackPerformance(name, duration, mark.metadata)
    this.marks.delete(name)
    return duration
  }

  measure(name: string, fn: () => Promise<void>): Promise<number>
  measure<T>(name: string, fn: () => Promise<T>): Promise<[T, number]>
  async measure(name: string, fn: () => Promise<any>): Promise<any> {
    this.markStart(name)
    try {
      const result = await fn()
      const duration = this.markEnd(name)!
      return result !== undefined ? [result, duration] : duration
    } catch (error) {
      this.markEnd(name)
      throw error
    }
  }

  recordMetric(metric: MetricPoint): void {
    this.metrics.push(metric)
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift()
    }
  }

  recordValue(name: string, value: number, unit: MetricPoint['unit'] = 'count'): void {
    this.recordMetric({ name, value, unit, tags: {}, timestamp: Date.now() })
  }

  getMetrics(): MetricPoint[] {
    return [...this.metrics]
  }

  clearMetrics(): void {
    this.metrics = []
    this.marks.clear()
  }

  private webVitalsPolyfill: Map<string, number> = new Map()

  trackWebVital(name: string, value: number): void {
    this.webVitalsPolyfill.set(name, value)
    this.recordMetric({
      name: `webvital.${name}`,
      value,
      unit: 'ms',
      tags: {},
      timestamp: Date.now(),
    })
  }

  getWebVitals(): Record<string, number> {
    const vitals: Record<string, number> = {}
    this.webVitalsPolyfill.forEach((value, key) => {
      vitals[key] = value
    })
    return vitals
  }

  startAppStartupTimer(): void {
    if (typeof performance === 'undefined') {
      return
    }

    if ((performance as any).mark) {
      try {
        ;(performance as any).mark('app-start')
      } catch {
        /* ignore */
      }
    }

    this.markStart('app.startup')
  }

  endAppStartupTimer(): number | null {
    const duration = this.markEnd('app.startup')

    if (duration !== null) {
      this.recordMetric({
        name: 'app.startup_time',
        value: duration,
        unit: 'ms',
        tags: {},
        timestamp: Date.now(),
      })
    }

    return duration
  }
}

export const performanceMonitor = new PerformanceMonitor()
