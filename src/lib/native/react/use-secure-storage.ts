'use client'

import { useState, useCallback } from 'react'
import { secureStorageService } from '../security/secure-storage'

export function useSecureStorage() {
  const [loading, setLoading] = useState(false)

  const get = useCallback(async <T = string>(key: string): Promise<T | null> => {
    setLoading(true)
    try {
      return await secureStorageService.getJSON<T>(key)
    } finally {
      setLoading(false)
    }
  }, [])

  const set = useCallback(async (key: string, value: any): Promise<boolean> => {
    setLoading(true)
    try {
      return await secureStorageService.setJSON(key, value)
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(async (key: string): Promise<boolean> => {
    return secureStorageService.remove(key)
  }, [])

  const setCredentials = useCallback(async (account: string, username: string, password: string) => {
    return secureStorageService.setSecureCredentials(account, { username, password })
  }, [])

  const getCredentials = useCallback(async (account: string) => {
    return secureStorageService.getSecureCredentials(account)
  }, [])

  const clear = useCallback(async () => {
    return secureStorageService.clear()
  }, [])

  return { get, set, remove, setCredentials, getCredentials, clear, loading }
}
