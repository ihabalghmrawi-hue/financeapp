'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'

interface UseVirtualizationOptions {
  itemCount: number
  itemHeight: number
  overscan?: number
  scrollContainer?: HTMLElement | null
}

export interface VirtualItem {
  index: number
  start: number
  height: number
}

export interface UseVirtualizationResult {
  virtualItems: VirtualItem[]
  totalHeight: number
  scrollContainerRef: (node: HTMLDivElement | null) => void
  scrollTo: (index: number) => void
  scrollToTop: () => void
  isScrolling: boolean
  visibleRange: { start: number; end: number }
}

export function useVirtualization({
  itemCount,
  itemHeight,
  overscan = 3,
  scrollContainer,
}: UseVirtualizationOptions): UseVirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>()
  const rafId = useRef<number>()

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
  }, [])

  useEffect(() => {
    const container = containerRef.current || scrollContainer
    if (!container) {
      return
    }

    const handleScroll = () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
      rafId.current = requestAnimationFrame(() => {
        setScrollTop(container.scrollTop)
        setIsScrolling(true)
        if (scrollTimer.current) {
          clearTimeout(scrollTimer.current)
        }
        scrollTimer.current = setTimeout(() => setIsScrolling(false), 150)
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current)
      }
    }
  }, [scrollContainer])

  const totalHeight = itemCount * itemHeight

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(
      itemCount,
      Math.ceil((scrollTop + (typeof window !== 'undefined' ? window.innerHeight : 800)) / itemHeight) + overscan,
    )
    return { start, end }
  }, [scrollTop, itemCount, itemHeight, overscan])

  const virtualItems = useMemo(() => {
    const items: VirtualItem[] = []
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        height: itemHeight,
      })
    }
    return items
  }, [visibleRange, itemHeight])

  const scrollTo = useCallback(
    (index: number) => {
      const container = containerRef.current
      if (container) {
        container.scrollTop = index * itemHeight
      }
    },
    [itemHeight],
  )

  const scrollToTop = useCallback(() => {
    const container = containerRef.current
    if (container) {
      container.scrollTop = 0
    }
  }, [])

  return {
    virtualItems,
    totalHeight,
    scrollContainerRef: setContainerRef,
    scrollTo,
    scrollToTop,
    isScrolling,
    visibleRange,
  }
}

export function useMobileListOptimization<T>(items: T[], options: { pageSize?: number; initialLoad?: number } = {}) {
  const { pageSize = 20, initialLoad = 20 } = options
  const [displayCount, setDisplayCount] = useState(initialLoad)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const visibleItems = useMemo(() => items.slice(0, displayCount), [items, displayCount])

  const loadMore = useCallback(() => {
    if (isLoadingMore || displayCount >= items.length) {
      return
    }
    setIsLoadingMore(true)
    const timer = setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + pageSize, items.length))
      setIsLoadingMore(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [displayCount, isLoadingMore, items.length, pageSize])

  const reset = useCallback(() => {
    setDisplayCount(initialLoad)
    setIsLoadingMore(false)
  }, [initialLoad])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const hasMore = displayCount < items.length

  return { visibleItems, hasMore, sentinelRef, isLoadingMore, reset }
}
