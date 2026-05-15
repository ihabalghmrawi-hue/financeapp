'use client'

import { useState, useCallback } from 'react'
import { shareService } from '../share-service'
import type { NativeShareOptions } from '../types'

export function useNativeShare() {
  const [sharing, setSharing] = useState(false)
  const [lastResult, setLastResult] = useState<boolean | null>(null)

  const share = useCallback(async (options: NativeShareOptions) => {
    setSharing(true)
    const result = await shareService.share(options)
    setLastResult(result)
    setSharing(false)
    return result
  }, [])

  const shareText = useCallback(
    async (text: string, title?: string) => {
      return share({ text, title })
    },
    [share],
  )

  const shareUrl = useCallback(
    async (url: string, title?: string) => {
      return share({ url, title })
    },
    [share],
  )

  return { share, shareText, shareUrl, sharing, lastResult }
}
