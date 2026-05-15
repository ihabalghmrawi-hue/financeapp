'use client'

import { useState, useCallback } from 'react'
import { barcodeScannerService } from '../barcode-scanner'
import type { ScanResult, BarcodeFormat } from '../types'

export function useBarcode() {
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async (formats?: BarcodeFormat[]) => {
    setScanning(true)
    setError(null)
    try {
      const result = await barcodeScannerService.scan({ formats })
      setLastResult(result)
      return result
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setScanning(false)
    }
  }, [])

  const scanFromImage = useCallback(async (base64: string, formats?: BarcodeFormat[]) => {
    setScanning(true)
    setError(null)
    try {
      const result = await barcodeScannerService.scanFromImage(base64, formats)
      setLastResult(result)
      return result
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setScanning(false)
    }
  }, [])

  const stop = useCallback(async () => {
    await barcodeScannerService.stopScan()
    setScanning(false)
  }, [])

  const reset = useCallback(() => {
    setLastResult(null)
    setError(null)
  }, [])

  return { scan, scanFromImage, stop, scanning, lastResult, error, reset }
}
