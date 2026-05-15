import { telemetryService } from './telemetry'
import { isProduction } from '../production/environments'

export interface PushDeliveryMetrics {
  totalReceived: number
  totalDisplayed: number
  totalTapped: number
  totalDismissed: number
  tapRate: number
  deliveryRate: number
  averageDeliveryDelay: number
  lastReceived: string | null
  pushCategories: Record<string, number>
}

export interface PushEvent {
  id: string
  type: 'received' | 'displayed' | 'tapped' | 'dismissed'
  category?: string
  timestamp: string
  delay?: number
  metadata?: Record<string, unknown>
}

type PushListener = (event: PushEvent) => void

class PushDeliveryService {
  private listeners: PushListener[] = []
  private events: PushEvent[] = []
  private maxEvents = 200
  private metrics: PushDeliveryMetrics = {
    totalReceived: 0,
    totalDisplayed: 0,
    totalTapped: 0,
    totalDismissed: 0,
    tapRate: 0,
    deliveryRate: 0,
    averageDeliveryDelay: 0,
    lastReceived: null,
    pushCategories: {},
  }
  private receivedTimestamps: Map<string, number> = new Map()
  private initialized = false

  initialize(): void {
    if (this.initialized) {
      return
    }
    this.initialized = true

    this.trackSystemEvents()
  }

  trackReceived(pushId: string, category?: string, metadata?: Record<string, unknown>): void {
    const now = Date.now()
    this.receivedTimestamps.set(pushId, now)

    const event: PushEvent = {
      id: pushId,
      type: 'received',
      category,
      timestamp: new Date(now).toISOString(),
      metadata,
    }

    this.recordEvent(event)
    this.metrics.totalReceived++
    this.metrics.lastReceived = event.timestamp

    if (category) {
      this.metrics.pushCategories[category] = (this.metrics.pushCategories[category] || 0) + 1
    }

    telemetryService.trackNotification('push_received', {
      pushId,
      category,
      ...metadata,
    })

    this.notify(event)
  }

  trackDisplayed(pushId: string): void {
    const received = this.receivedTimestamps.get(pushId)
    const delay = received ? Date.now() - received : undefined

    const event: PushEvent = {
      id: pushId,
      type: 'displayed',
      timestamp: new Date().toISOString(),
      delay,
    }

    this.recordEvent(event)
    this.metrics.totalDisplayed++
    this.updateDeliveryMetrics()

    telemetryService.trackNotification('push_displayed', {
      pushId,
      delay,
    })
  }

  trackTapped(pushId: string, metadata?: Record<string, unknown>): void {
    const received = this.receivedTimestamps.get(pushId)
    const delay = received ? Date.now() - received : undefined

    const event: PushEvent = {
      id: pushId,
      type: 'tapped',
      timestamp: new Date().toISOString(),
      delay,
      metadata,
    }

    this.recordEvent(event)
    this.metrics.totalTapped++
    this.metrics.tapRate =
      this.metrics.totalReceived > 0
        ? Math.round((this.metrics.totalTapped / this.metrics.totalReceived) * 100) / 100
        : 0

    telemetryService.trackNotification('push_tapped', {
      pushId,
      delay,
      ...metadata,
    })

    this.notify(event)
  }

  trackDismissed(pushId: string): void {
    const event: PushEvent = {
      id: pushId,
      type: 'dismissed',
      timestamp: new Date().toISOString(),
    }

    this.recordEvent(event)
    this.metrics.totalDismissed++

    telemetryService.trackNotification('push_dismissed', { pushId })
  }

  getMetrics(): PushDeliveryMetrics {
    return { ...this.metrics }
  }

  onPushEvent(listener: PushListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  getDeliveryHealthScore(): number {
    if (this.metrics.totalReceived === 0) {
      return 100
    }
    const displayRate = this.metrics.totalDisplayed / Math.max(1, this.metrics.totalReceived)
    const tapRate = this.metrics.tapRate
    return Math.round((displayRate * 60 + tapRate * 40) * 100) / 100
  }

  private trackSystemEvents(): void {
    if (isProduction()) {
      setInterval(() => {
        telemetryService.track({
          name: 'push_health',
          category: 'notification',
          metadata: {
            ...this.metrics,
            healthScore: this.getDeliveryHealthScore(),
          },
        })
      }, 300000)
    }
  }

  private recordEvent(event: PushEvent): void {
    this.events.unshift(event)
    if (this.events.length > this.maxEvents) {
      this.events.pop()
    }
  }

  private updateDeliveryMetrics(): void {
    this.metrics.deliveryRate =
      this.metrics.totalReceived > 0
        ? Math.round((this.metrics.totalDisplayed / this.metrics.totalReceived) * 100) / 100
        : 0

    const displayedEvents = this.events.filter((e) => e.type === 'displayed' && e.delay !== undefined)
    if (displayedEvents.length > 0) {
      const totalDelay = displayedEvents.reduce((sum, e) => sum + (e.delay || 0), 0)
      this.metrics.averageDeliveryDelay = Math.round(totalDelay / displayedEvents.length)
    }
  }

  private notify(event: PushEvent): void {
    this.listeners.forEach((l) => l(event))
  }
}

export const pushDeliveryService = new PushDeliveryService()
