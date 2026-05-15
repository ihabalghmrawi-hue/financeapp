'use client'

import { memo, type ComponentType } from 'react'

export function optimizeComponent<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prev: P, next: P) => boolean,
) {
  return memo(Component, propsAreEqual)
}

export function withStableKey<P extends object>(Component: ComponentType<P & { stableKey?: string }>) {
  return Component
}

export function createRenderBounding<P extends object>(
  shouldRender: (props: P) => boolean,
  Component: ComponentType<P>,
) {
  return function ConditionalRender(props: P) {
    if (!shouldRender(props)) {
      return null
    }
    return <Component {...props} />
  }
}
