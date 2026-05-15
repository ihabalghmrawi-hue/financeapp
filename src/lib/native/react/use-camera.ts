'use client'

import { useState, useCallback } from 'react'
import { cameraService } from '../camera-service'
import type { CameraResult } from '../types'

export function useCamera() {
  const [capturing, setCapturing] = useState(false)
  const [lastPhoto, setLastPhoto] = useState<CameraResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const capture = useCallback(async (quality?: number) => {
    setCapturing(true)
    setError(null)
    try {
      const result = await cameraService.capturePhoto({ quality })
      setLastPhoto(result)
      return result
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setCapturing(false)
    }
  }, [])

  const pickFromGallery = useCallback(async (quality?: number) => {
    setCapturing(true)
    setError(null)
    try {
      const result = await cameraService.pickFromGallery({ quality })
      setLastPhoto(result)
      return result
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setCapturing(false)
    }
  }, [])

  const captureDocument = useCallback(async (quality?: number) => {
    setCapturing(true)
    setError(null)
    try {
      const result = await cameraService.captureDocument({ quality })
      setLastPhoto(result)
      return result
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setCapturing(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLastPhoto(null)
    setError(null)
  }, [])

  return { capture, pickFromGallery, captureDocument, capturing, lastPhoto, error, reset }
}
