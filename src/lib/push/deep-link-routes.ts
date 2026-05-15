import { parseDeepLink, buildDeepLinkUrl } from './payload-builder'
import type { DeepLinkRoute } from './types'

class DeepLinkHandler {
  private pendingRoute: DeepLinkRoute | null = null
  private listeners: Set<(route: DeepLinkRoute) => void> = new Set()
  private initialized = false

  initialize(): void {
    if (this.initialized) {
      return
    }
    this.initialized = true

    const url = window.location.href
    const route = parseDeepLink(url)
    if (route && route.type !== 'url') {
      this.pendingRoute = route
    }

    try {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', (data: any) => {
          const route = parseDeepLink(data.url)
          if (route) {
            this.pendingRoute = route
            this.notify(route)
          }
        })
      })
    } catch {
      /* not in capacitor */
    }
  }

  onRoute(callback: (route: DeepLinkRoute) => void): () => void {
    this.listeners.add(callback)
    if (this.pendingRoute) {
      callback(this.pendingRoute)
      this.pendingRoute = null
    }
    return () => this.listeners.delete(callback)
  }

  getPendingRoute(): DeepLinkRoute | null {
    return this.pendingRoute
  }

  consumePendingRoute(): DeepLinkRoute | null {
    const route = this.pendingRoute
    this.pendingRoute = null
    return route
  }

  navigate(route: DeepLinkRoute): string {
    return buildDeepLinkUrl(route)
  }

  private notify(route: DeepLinkRoute): void {
    this.listeners.forEach((l) => l(route))
  }
}

export const deepLinkHandler = new DeepLinkHandler()
