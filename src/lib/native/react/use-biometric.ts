'use client'

import { useState, useCallback } from 'react'
import { biometricAuthService } from '../biometric-auth'
import type { BiometricResult } from '../types'

export function useBiometric() {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [authenticating, setAuthenticating] = useState(false)

  const checkAvailability = useCallback(async () => {
    const result = await biometricAuthService.isAvailable()
    setAvailable(result)
    return result
  }, [])

  const authenticate = useCallback(async (reason?: string): Promise<BiometricResult> => {
    setAuthenticating(true)
    try {
      return await biometricAuthService.authenticate(reason)
    } finally {
      setAuthenticating(false)
    }
  }, [])

  const getBiometryType = useCallback(async () => {
    return biometricAuthService.getBiometryType()
  }, [])

  return { available, authenticating, checkAvailability, authenticate, getBiometryType }
}
