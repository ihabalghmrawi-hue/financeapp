import { deviceRegistry } from './device-registry'
import type { PushPlatform } from './types'

class PushRegistrationService {
  private registered = false
  private permissionGranted = false
  private currentToken: string | null = null

  get isRegistered(): boolean {
    return this.registered
  }
  get hasPermission(): boolean {
    return this.permissionGranted
  }
  get token(): string | null {
    return this.currentToken
  }

  async register(companyId: string, userId: string): Promise<{ token: string; platform: PushPlatform } | null> {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const permResult = await PushNotifications.requestPermissions()
      this.permissionGranted = permResult.receive === 'granted'

      if (!this.permissionGranted) {
        console.warn('[PushRegistration] Permission not granted')
        return null
      }

      await PushNotifications.register()

      return new Promise((resolve) => {
        const registrationTimeout = setTimeout(() => {
          PushNotifications.removeAllListeners()
          resolve(this.fallbackRegistration(companyId, userId))
        }, 10000)

        PushNotifications.addListener('registration', (tokenResult: any) => {
          clearTimeout(registrationTimeout)
          this.currentToken = tokenResult.value
          this.registered = true

          const platform = this.detectPlatform()

          deviceRegistry
            .registerDevice(this.currentToken!, platform, companyId, userId, { appVersion: this.getAppVersion() })
            .then(() => {
              this.setupTokenRefresh(companyId, userId)
            })

          resolve({ token: this.currentToken!, platform })
        })

        PushNotifications.addListener('registrationError', () => {
          clearTimeout(registrationTimeout)
          resolve(this.fallbackRegistration(companyId, userId))
        })
      })
    } catch {
      return this.fallbackRegistration(companyId, userId)
    }
  }

  async unregister(companyId: string, userId: string): Promise<void> {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      await PushNotifications.unregister()
      this.registered = false
      this.currentToken = null
      this.permissionGranted = false
    } catch {
      /* ignore */
    }

    const devices = deviceRegistry.getActiveDevices(companyId, userId)
    for (const device of devices) {
      await deviceRegistry.unregisterDevice(device.id)
    }
  }

  private async fallbackRegistration(
    companyId: string,
    userId: string,
  ): Promise<{ token: string; platform: PushPlatform } | null> {
    const platform = this.detectPlatform()
    if (platform === 'android' || platform === 'ios') {
      console.warn('[PushRegistration] Capacitor push registration failed')
      return null
    }

    return this.registerWebPush(companyId, userId)
  }

  private async registerWebPush(
    companyId: string,
    userId: string,
  ): Promise<{ token: string; platform: PushPlatform } | null> {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        return null
      }

      const swRegistration = await navigator.serviceWorker.ready

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicVapidKey) {
        return null
      }

      const key = this.urlBase64ToUint8Array(publicVapidKey)
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer as ArrayBuffer,
      })

      this.currentToken = JSON.stringify(subscription)
      this.registered = true
      this.permissionGranted = true

      await deviceRegistry.registerDevice(this.currentToken, 'web', companyId, userId, {
        appVersion: this.getAppVersion(),
      })

      return { token: this.currentToken, platform: 'web' }
    } catch {
      return null
    }
  }

  private setupTokenRefresh(companyId: string, userId: string): void {
    try {
      import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.addListener('registration', (tokenResult: any) => {
          const newToken = tokenResult.value
          if (newToken !== this.currentToken) {
            this.currentToken = newToken
            const platform = this.detectPlatform()
            deviceRegistry.registerDevice(newToken, platform, companyId, userId, {
              appVersion: this.getAppVersion(),
            })
          }
        })
      })
    } catch {
      /* ignore */
    }
  }

  private detectPlatform(): PushPlatform {
    if (typeof navigator === 'undefined') {
      return 'web'
    }
    const ua = navigator.userAgent
    if (/android/i.test(ua)) {
      return 'android'
    }
    if (/iphone|ipad|ipod/i.test(ua)) {
      return 'ios'
    }
    return 'web'
  }

  private getAppVersion(): string {
    return '1.0.0'
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const bytes = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) {
      bytes[i] = rawData.charCodeAt(i)
    }
    return bytes
  }
}

export const pushRegistrationService = new PushRegistrationService()
