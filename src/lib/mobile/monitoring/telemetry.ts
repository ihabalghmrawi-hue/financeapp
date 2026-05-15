import { environment, isProduction } from '../production/environments'

export interface TelemetryEvent {
  name: string
  category: 'performance' | 'sync' | 'notification' | 'navigation' | 'error' | 'user_action'
  duration?: number
  metadata?: Record<string, unknown>
  timestamp: string
  sessionId: string
}

export interface TelemetryConfig {
  enabled: boolean
  sampleRate: number
  flushInterval: number
  maxQueueSize: number
}

class TelemetryService {
  private events: TelemetryEvent[] = []
  private sessionId: string = this.generateSessionId()
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private config: TelemetryConfig = {
    enabled: environment.enableTelemetry,
    sampleRate: isProduction() ? 0.1 : 1.0,
    flushInterval: 30000,
    maxQueueSize: 100,
  }

  initialize(): void {
    if (!this.config.enabled) {
      return
    }

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)

    window.addEventListener('beforeunload', () => {
      this.flush(true)
    })
  }

  track(event: Omit<TelemetryEvent, 'timestamp' | 'sessionId'>): void {
    if (!this.config.enabled) {
      return
    }
    if (Math.random() > this.config.sampleRate) {
      return
    }

    this.events.push({
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    })

    if (this.events.length >= this.config.maxQueueSize) {
      this.flush()
    }
  }

  trackPerformance(name: string, duration: number, metadata?: Record<string, unknown>): void {
    this.track({ name, category: 'performance', duration, metadata })
  }

  trackSync(name: string, metadata?: Record<string, unknown>): void {
    this.track({ name, category: 'sync', metadata })
  }

  trackNotification(name: string, metadata?: Record<string, unknown>): void {
    this.track({ name, category: 'notification', metadata })
  }

  trackNavigation(name: string, metadata?: Record<string, unknown>): void {
    this.track({ name, category: 'navigation', metadata })
  }

  trackError(name: string, metadata?: Record<string, unknown>): void {
    this.track({ name, category: 'error', metadata })
  }

  trackUserAction(name: string, metadata?: Record<string, unknown>): void {
    this.track({ name, category: 'user_action', metadata })
  }

  startTimer(): () => number {
    const start = performance.now()
    return () => performance.now() - start
  }

  private async flush(keepalive = false): Promise<void> {
    if (this.events.length === 0) {
      return
    }

    const batch = this.events.splice(0, this.config.maxQueueSize)

    try {
      await fetch('/api/mobile/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch, sessionId: this.sessionId }),
        keepalive,
      })
    } catch {
      this.events.unshift(...batch)
    }
  }

  private generateSessionId(): string {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  getSessionId(): string {
    return this.sessionId
  }
}

export const telemetryService = new TelemetryService()
