'use client'

import { useState, useEffect, useCallback } from 'react'
import { deepLinkHandler } from '../deep-link-routes'
import { parseDeepLink } from '../payload-builder'
import type { DeepLinkRoute } from '../types'

interface UseDeepLinkResult {
  pendingRoute: DeepLinkRoute | null
  consumePendingRoute: () => DeepLinkRoute | null
  navigate: (route: DeepLinkRoute) => string
  parseUrl: (url: string) => DeepLinkRoute | null
}

export function useDeepLink(): UseDeepLinkResult {
  const [pendingRoute, setPendingRoute] = useState<DeepLinkRoute | null>(null)

  useEffect(() => {
    const unsub = deepLinkHandler.onRoute((route) => {
      setPendingRoute(route)
    })

    const initial = deepLinkHandler.getPendingRoute()
    if (initial) {
      setPendingRoute(initial)
    }

    return unsub
  }, [])

  const consumePendingRoute = useCallback((): DeepLinkRoute | null => {
    const route = deepLinkHandler.consumePendingRoute()
    if (route) {
      setPendingRoute(null)
    }
    return route
  }, [])

  const navigate = useCallback((route: DeepLinkRoute): string => {
    return deepLinkHandler.navigate(route)
  }, [])

  const parseUrl = useCallback((url: string): DeepLinkRoute | null => {
    return parseDeepLink(url)
  }, [])

  return { pendingRoute, consumePendingRoute, navigate, parseUrl }
}
