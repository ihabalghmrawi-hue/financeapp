'use client'

import { retryEngine } from '../sync/retry-engine'

export type ConnectionStatus = 'online' | 'offline' | 'poor' | 'unknown'

export interface ConnectionQuality {
  status: ConnectionStatus
  latency: number
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  downlink: number
  effectiveType: string
}

export type ConnectivityCallback = (status: ConnectionStatus, quality?: ConnectionQuality) => void

export class ConnectivityMonitor {
  private _status: ConnectionStatus = typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
  private _quality: ConnectionQuality = this.getDefaultQuality()
  private listeners: Set<ConnectivityCallback> = new Set()
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private latencyCheckInterval: ReturnType<typeof setInterval> | null = null
  private capacitorPlugin: any = null

  get status(): ConnectionStatus {
    return this._status
  }
  get quality(): ConnectionQuality {
    return { ...this._quality }
  }
  get isOnline(): boolean {
    return this._status !== 'offline'
  }

  on(callback: ConnectivityCallback): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private emit(status: ConnectionStatus, quality?: ConnectionQuality) {
    this.listeners.forEach((l) => l(status, quality))
  }

  private getDefaultQuality(): ConnectionQuality {
    return {
      status: this._status,
      latency: 0,
      type: 'unknown',
      downlink: 0,
      effectiveType: '',
    }
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())

    try {
      const { Network } = await import('@capacitor/network')
      this.capacitorPlugin = Network
      await this.capacitorPlugin.addListener('networkStatusChange', (status: any) => {
        if (status.connected) {
          this.handleOnline()
        } else {
          this.handleOffline()
        }
      })
      const currentStatus = await this.capacitorPlugin.getStatus()
      if (currentStatus.connected) {
        this.handleOnline()
      } else {
        this.handleOffline()
      }
    } catch {
      if (navigator.onLine) {
        this.handleOnline()
      } else {
        this.handleOffline()
      }
    }

    this.startLatencyCheck()
  }

  private handleOnline(): void {
    if (this._status === 'online') {
      return
    }
    this._status = 'online'
    this.updateQuality()
    this.emit('online', this._quality)
  }

  private handleOffline(): void {
    if (this._status === 'offline') {
      return
    }
    this._status = 'offline'
    this._quality = { ...this._quality, status: 'offline' }
    this.emit('offline', this._quality)
  }

  private async updateQuality(): Promise<void> {
    if (typeof navigator === 'undefined') {
      return
    }

    const connection = (navigator as any).connection
    if (connection) {
      this._quality = {
        status: this._status,
        latency: 0,
        type: connection.type ?? 'unknown',
        downlink: connection.downlink ?? 0,
        effectiveType: connection.effectiveType ?? '',
      }
    }

    this._quality.latency = await this.measureLatency()
    this._quality.status = this._status

    if (this._quality.latency > 2000) {
      this._quality.status = 'poor'
    }
  }

  private async measureLatency(): Promise<number> {
    const start = Date.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      await fetch('/api/health', { method: 'HEAD', signal: controller.signal })
      clearTimeout(timeout)
      return Date.now() - start
    } catch {
      return -1
    }
  }

  private startLatencyCheck(): void {
    if (this.latencyCheckInterval) {
      clearInterval(this.latencyCheckInterval)
    }
    this.latencyCheckInterval = setInterval(() => {
      if (this._status === 'online') {
        this.updateQuality()
      }
    }, 30000)
  }

  startPeriodicCheck(intervalMs: number = 15000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    this.checkInterval = setInterval(async () => {
      const wasOnline = this._status !== 'offline'
      const isOnline = await this.ping()

      if (isOnline && !wasOnline) {
        this.handleOnline()
      } else if (!isOnline && wasOnline) {
        this.handleOffline()
      }
    }, intervalMs)
  }

  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    if (this.latencyCheckInterval) {
      clearInterval(this.latencyCheckInterval)
      this.latencyCheckInterval = null
    }
  }

  async ping(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const response = await fetch('/api/health', { method: 'HEAD', signal: controller.signal })
      clearTimeout(timeout)
      return response.ok
    } catch {
      return false
    }
  }

  destroy(): void {
    this.stopPeriodicCheck()
    this.listeners.clear()
    window.removeEventListener('online', () => this.handleOnline())
    window.removeEventListener('offline', () => this.handleOffline())
  }
}

export const connectivityMonitor = new ConnectivityMonitor()
