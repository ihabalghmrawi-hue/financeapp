import { pluginOrchestrator } from './plugin-orchestrator'
import type { PermissionStatus, PermissionState } from './types'

class PermissionOrchestrator {
  private cache = new Map<string, PermissionState>()

  async checkAll(): Promise<PermissionStatus> {
    const [camera, storage, notifications, biometric] = await Promise.all([
      this.checkCamera(),
      this.checkStorage(),
      this.checkNotifications(),
      this.checkBiometric(),
    ])

    return {
      camera,
      storage,
      location: 'prompt',
      notifications,
      biometric,
      microphone: 'prompt',
      calendar: 'prompt',
      contacts: 'prompt',
      sensors: 'prompt',
    }
  }

  async checkCamera(): Promise<PermissionState> {
    try {
      const { Camera } = await pluginOrchestrator.getCamera()
      const result = await Camera.checkPermissions()
      return result.camera as PermissionState
    } catch {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasCamera = devices.some((d) => d.kind === 'videoinput')
        return hasCamera ? 'prompt' : 'denied'
      } catch {
        return 'denied'
      }
    }
  }

  async requestCamera(): Promise<PermissionState> {
    try {
      const { Camera } = await pluginOrchestrator.getCamera()
      const result = await Camera.requestPermissions()
      const state = result.camera as PermissionState
      this.cache.set('camera', state)
      return state
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach((t) => t.stop())
        return 'granted'
      } catch {
        return 'denied'
      }
    }
  }

  async checkStorage(): Promise<PermissionState> {
    try {
      const { Filesystem } = await pluginOrchestrator.getFilesystem()
      await Filesystem.checkPermissions()
      return 'granted'
    } catch {
      return 'prompt'
    }
  }

  async requestStorage(): Promise<PermissionState> {
    try {
      const { Filesystem } = await pluginOrchestrator.getFilesystem()
      await Filesystem.requestPermissions()
      return 'granted'
    } catch {
      return 'denied'
    }
  }

  async checkNotifications(): Promise<PermissionState> {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const result = await PushNotifications.checkPermissions()
      return (result.receive as PermissionState) ?? 'prompt'
    } catch {
      if ('Notification' in window) {
        return Notification.permission === 'granted' ? 'granted' : 'prompt'
      }
      return 'denied'
    }
  }

  async requestNotifications(): Promise<PermissionState> {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const result = await PushNotifications.requestPermissions()
      return (result.receive as PermissionState) ?? 'denied'
    } catch {
      if ('Notification' in window) {
        const result = await Notification.requestPermission()
        return result === 'granted' ? 'granted' : 'denied'
      }
      return 'denied'
    }
  }

  async checkBiometric(): Promise<PermissionState> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      const result = await NativeBiometric.isAvailable()
      return result.isAvailable ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }

  async requestBiometric(reason?: string): Promise<boolean> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      await NativeBiometric.verifyIdentity({
        reason: reason ?? 'التحقق من الهوية',
        title: 'مصادقة بيومترية',
        subtitle: 'التحقق من هويتك',
        negativeButtonText: 'إلغاء',
      })
      return true
    } catch {
      return false
    }
  }

  isGranted(state: PermissionState): boolean {
    return state === 'granted'
  }
}

export const permissionOrchestrator = new PermissionOrchestrator()
