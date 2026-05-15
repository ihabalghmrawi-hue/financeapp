'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useWorkspaceActions, useGlobalWorkspaceActions } from '@/lib/workspace/provider'
import { useMobileLayout } from './MobileLayoutProvider'

interface ResponsiveWorkspaceConfig {
  workspaceId: string
  defaultTab?: string
  mobileView?: 'list' | 'card' | 'compact'
  tabletView?: 'list' | 'card' | 'split'
  desktopView?: 'list' | 'detail' | 'split'
}

export function useResponsiveWorkspace(config: ResponsiveWorkspaceConfig) {
  const { isMobile, isTablet, isDesktop } = useMobileLayout()
  const actions = useWorkspaceActions(config.workspaceId)
  const global = useGlobalWorkspaceActions()

  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'card' | 'compact' | 'split'>(
    isMobile
      ? (config.mobileView ?? 'card')
      : isTablet
        ? (config.tabletView ?? 'list')
        : (config.desktopView ?? 'list'),
  )

  useEffect(() => {
    if (isMobile) {
      setViewMode(config.mobileView ?? 'card')
    } else if (isTablet) {
      setViewMode(config.tabletView ?? 'list')
    } else {
      setViewMode(config.desktopView ?? 'list')
    }
  }, [isMobile, isTablet, isDesktop, config.mobileView, config.tabletView, config.desktopView])

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      if (isMobile) {
        return prev === 'card' ? 'compact' : 'card'
      }
      if (isTablet) {
        return prev === 'list' ? 'card' : 'list'
      }
      return prev === 'list' ? 'detail' : 'list'
    })
  }, [isMobile, isTablet])

  const openDetail = useCallback(
    (tabId: string, tabTitle: string) => {
      actions.openTab({ id: tabId, title: tabTitle, createdAt: Date.now() })
      if (isMobile || isTablet) {
        global.openCommandPalette()
      }
    },
    [actions, isMobile, isTablet, global],
  )

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
    isMobile,
    isTablet,
    isDesktop,
    actions,
    global,
    openDetail,
  }
}

export function useResponsivePersistence(workspaceId: string) {
  const storageKey = `erp-workspace-mobile-${workspaceId}`
  const { isMobile } = useMobileLayout()

  const save = useCallback(
    (data: Record<string, any>) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data))
      } catch {}
    },
    [storageKey],
  )

  const restore = useCallback((): Record<string, any> | null => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [storageKey])

  return { save, restore, isMobile }
}
