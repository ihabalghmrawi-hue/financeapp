'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { deviceService } from '../device-service'
import { appLifecycleManager } from '../lifecycle/app-lifecycle'
import { biometricLockService } from '../security/biometric-lock'
import { screenshotProtectionService } from '../security/screenshot-protection'
import { backgroundProtectionService } from '../lifecycle/background-protection'
import { deviceTrustService } from '../security/device-trust'
import { storageMonitor } from '../storage-monitor'
import { pluginOrchestrator } from '../plugin-orchestrator'
import type { DeviceInfo, StorageInfo, AppLifecycleState, PermissionStatus } from '../types'
import type { DeviceTrustResult } from '../security/device-trust'
import { permissionOrchestrator } from '../permission-orchestrator'
import { biometricAuthService } from '../biometric-auth'

interface NativeContextValue {
  initialized: boolean
  device: DeviceInfo | null
  lifecycle: AppLifecycleState
  storage: StorageInfo | null
  permissions: PermissionStatus | null
  deviceTrust: DeviceTrustResult | null
  biometricLocked: boolean
  isNative: boolean
  initialize: () => Promise<void>
  lock: () => Promise<void>
  unlock: (reason?: string) => Promise<boolean>
  checkPermissions: () => Promise<PermissionStatus>
  requestPermission: (type: keyof PermissionStatus) => Promise<boolean>
  refreshDevice: () => Promise<void>
  refreshStorage: () => Promise<void>
  validateTrust: () => Promise<DeviceTrustResult>
}

const NativeContext = createContext<NativeContextValue | null>(null)

export function useNative(): NativeContextValue {
  const ctx = useContext(NativeContext)
  if (!ctx) {
    throw new Error('useNative must be used within NativeProvider')
  }
  return ctx
}

interface NativeProviderProps {
  children: ReactNode
  enableBiometricLock?: boolean
  enableScreenshotProtection?: boolean
  enableBackgroundProtection?: boolean
  storageMonitorInterval?: number
}

export function NativeProvider({
  children,
  enableBiometricLock = false,
  enableScreenshotProtection = false,
  enableBackgroundProtection = false,
  storageMonitorInterval = 60000,
}: NativeProviderProps) {
  const [initialized, setInitialized] = useState(false)
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [lifecycle, setLifecycle] = useState<AppLifecycleState>(appLifecycleManager.currentState)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null)
  const [deviceTrust, setDeviceTrust] = useState<DeviceTrustResult | null>(null)
  const [biometricLocked, setBiometricLocked] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const initRef = useRef(false)

  const initialize = useCallback(async () => {
    if (initRef.current) {
      return
    }
    initRef.current = true

    await pluginOrchestrator.ready()

    const [deviceInfo, permStatus, trustResult, nativeFlag] = await Promise.all([
      deviceService.getInfo().catch(() => null),
      permissionOrchestrator.checkAll().catch(() => null),
      deviceTrustService.validate().catch(() => null),
      deviceService.isNativePlatform().catch(() => false),
    ])

    setDevice(deviceInfo)
    setPermissions(permStatus)
    setDeviceTrust(trustResult)
    setIsNative(nativeFlag)

    appLifecycleManager.on((state) => setLifecycle(state))
    await appLifecycleManager.initialize()

    storageMonitor.on((info) => setStorage(info))
    await storageMonitor.startMonitoring(storageMonitorInterval)

    biometricLockService.on((locked) => setBiometricLocked(locked))

    if (enableBiometricLock) {
      await biometricLockService.enable(5)
    }

    if (enableScreenshotProtection) {
      await screenshotProtectionService.enable()
    }

    if (enableBackgroundProtection) {
      await backgroundProtectionService.enable(enableBiometricLock, true)
    }

    setInitialized(true)
  }, [enableBiometricLock, enableScreenshotProtection, enableBackgroundProtection, storageMonitorInterval])

  useEffect(() => {
    initialize()
  }, [initialize])

  const lock = useCallback(async () => {
    await biometricLockService.lock()
  }, [])
  const unlock = useCallback(async (reason?: string) => biometricLockService.unlock(reason), [])

  const checkPermissions = useCallback(async () => {
    const status = await permissionOrchestrator.checkAll()
    setPermissions(status)
    return status
  }, [])

  const requestPermission = useCallback(
    async (type: keyof PermissionStatus): Promise<boolean> => {
      let result = false
      switch (type) {
        case 'camera':
          result = permissionOrchestrator.isGranted(await permissionOrchestrator.requestCamera())
          break
        case 'notifications':
          result = permissionOrchestrator.isGranted(await permissionOrchestrator.requestNotifications())
          break
        case 'biometric':
          result = await permissionOrchestrator.requestBiometric()
          break
        default:
          result = false
      }
      await checkPermissions()
      return result
    },
    [checkPermissions],
  )

  const refreshDevice = useCallback(async () => {
    const info = await deviceService.getInfo()
    setDevice(info)
  }, [])

  const refreshStorage = useCallback(async () => {
    await storageMonitor.check()
  }, [])

  const validateTrust = useCallback(async () => {
    const result = await deviceTrustService.validate()
    setDeviceTrust(result)
    return result
  }, [])

  return (
    <NativeContext.Provider
      value={{
        initialized,
        device,
        lifecycle,
        storage,
        permissions,
        deviceTrust,
        biometricLocked,
        isNative,
        initialize,
        lock,
        unlock,
        checkPermissions,
        requestPermission,
        refreshDevice,
        refreshStorage,
        validateTrust,
      }}
    >
      {children}
    </NativeContext.Provider>
  )
}
