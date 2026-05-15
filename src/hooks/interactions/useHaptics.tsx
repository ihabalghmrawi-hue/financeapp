'use client'

import { useCallback } from 'react'
import { Capacitor } from '@capacitor/core'

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'

export function useHaptics() {
  const isNative = Capacitor.isNativePlatform()

  const haptic = useCallback(
    async (type: HapticType = 'selection') => {
      if (!isNative) {
        return
      }
      try {
        const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics')
        switch (type) {
          case 'light':
            await Haptics.impact({ style: ImpactStyle.Light })
            break
          case 'medium':
            await Haptics.impact({ style: ImpactStyle.Medium })
            break
          case 'heavy':
            await Haptics.impact({ style: ImpactStyle.Heavy })
            break
          case 'selection':
            await Haptics.selectionStart()
            await Haptics.selectionChanged()
            await Haptics.selectionEnd()
            break
          case 'success':
            await Haptics.notification({ type: NotificationType.Success })
            break
          case 'warning':
            await Haptics.notification({ type: NotificationType.Warning })
            break
          case 'error':
            await Haptics.notification({ type: NotificationType.Error })
            break
        }
      } catch {
        // Haptics not available
      }
    },
    [isNative],
  )

  return { haptic }
}

export function HapticButton({
  children,
  hapticType = 'light',
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { hapticType?: HapticType }) {
  const { haptic } = useHaptics()

  return (
    <button
      onClick={(e) => {
        haptic(hapticType)
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
