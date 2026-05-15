'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useIsCapacitor } from './useDeviceDetection'

interface KeyboardState {
  isOpen: boolean
  height: number
}

export function useKeyboardAware(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({ isOpen: false, height: 0 })
  const isCapacitor = useIsCapacitor()
  const initialHeight = useRef(typeof window !== 'undefined' ? window.innerHeight : 0)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (isCapacitor) {
      const handleShow = (info: any) => {
        setState({ isOpen: true, height: info.keyboardHeight ?? 0 })
      }
      const handleHide = () => {
        setState({ isOpen: false, height: 0 })
      }

      try {
        import('@capacitor/keyboard').then(({ Keyboard }) => {
          Keyboard.addListener('keyboardWillShow', handleShow)
          Keyboard.addListener('keyboardWillHide', handleHide)
          return () => {
            Keyboard.removeAllListeners()
          }
        })
      } catch {}
    }

    const handleResize = () => {
      const current = window.innerHeight
      const diff = initialHeight.current - current
      if (diff > 100) {
        setState({ isOpen: true, height: diff })
      } else {
        setState({ isOpen: false, height: 0 })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isCapacitor])

  return state
}

export function useKeyboardOffset(extraOffset = 0): number {
  const keyboard = useKeyboardAware()
  return keyboard.isOpen ? keyboard.height + extraOffset : 0
}

export function useKeyboardAwareStyle(extraOffset = 0): React.CSSProperties {
  const offset = useKeyboardOffset(extraOffset)
  return {
    transition: 'padding-bottom 0.3s ease',
    paddingBottom: offset,
  }
}

export function useScrollIntoView(options?: { block?: ScrollLogicalPosition; behavior?: ScrollBehavior }) {
  const ref = useRef<HTMLDivElement>(null)
  const { block = 'center', behavior = 'smooth' } = options ?? {}

  const scrollIntoView = useCallback(() => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ block, behavior })
    }, 300)
  }, [block, behavior])

  return { ref, scrollIntoView }
}
