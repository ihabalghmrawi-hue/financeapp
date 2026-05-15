import { pluginOrchestrator } from './plugin-orchestrator'
import type { DeviceInfo, NetworkStatus, NativePlatform } from './types'

class DeviceService {
  async getInfo(): Promise<DeviceInfo> {
    try {
      const { Device } = await pluginOrchestrator.getDevice()
      const [info, batteryInfo, languageInfo] = await Promise.all([
        Device.getInfo(),
        Device.getBatteryInfo().catch(() => ({ batteryLevel: -1, isCharging: false })),
        Device.getLanguageCode().catch(() => ({ value: 'ar', valueDisplay: 'Arabic' })),
      ])

      return {
        platform: info.platform as NativePlatform,
        osVersion: info.osVersion ?? '',
        model: info.model ?? '',
        manufacturer: info.manufacturer ?? '',
        appVersion: '',
        appBuild: '',
        isVirtual: info.isVirtual ?? false,
        isCharging: batteryInfo.isCharging ?? false,
        batteryLevel: batteryInfo.batteryLevel ?? -1,
        language: (languageInfo as any).valueDisplay ?? 'Arabic',
        languageCode: languageInfo.value ?? 'ar',
        orientation: this.getOrientation(),
      }
    } catch {
      return this.webFallback()
    }
  }

  async getBatteryLevel(): Promise<number> {
    try {
      const { Device } = await pluginOrchestrator.getDevice()
      const info = await Device.getBatteryInfo()
      return info.batteryLevel ?? -1
    } catch {
      return -1
    }
  }

  async isCharging(): Promise<boolean> {
    try {
      const { Device } = await pluginOrchestrator.getDevice()
      const info = await Device.getBatteryInfo()
      return info.isCharging ?? false
    } catch {
      return false
    }
  }

  async getLanguage(): Promise<string> {
    try {
      const { Device } = await pluginOrchestrator.getDevice()
      const info = await Device.getLanguageCode()
      return info.value ?? 'ar'
    } catch {
      return navigator.language?.split('-')[0] ?? 'ar'
    }
  }

  async isNativePlatform(): Promise<boolean> {
    try {
      const { Device } = await pluginOrchestrator.getDevice()
      const info = await Device.getInfo()
      return info.platform === 'android' || info.platform === 'ios'
    } catch {
      return false
    }
  }

  async isTablet(): Promise<boolean> {
    try {
      const { Device } = await pluginOrchestrator.getDevice()
      const info = await Device.getInfo()
      return info.model?.toLowerCase().includes('tab') ?? false
    } catch {
      return false
    }
  }

  private getOrientation(): 'portrait' | 'landscape' {
    if (typeof window === 'undefined') {
      return 'portrait'
    }
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }

  private webFallback(): DeviceInfo {
    const ua = navigator.userAgent
    let platform: NativePlatform = 'web'
    if (/android/i.test(ua)) {
      platform = 'android'
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      platform = 'ios'
    }

    return {
      platform,
      osVersion: '',
      model: '',
      manufacturer: '',
      appVersion: '1.0.0',
      appBuild: '1',
      isVirtual: false,
      isCharging: false,
      batteryLevel: -1,
      language: 'Arabic',
      languageCode: 'ar',
      orientation: this.getOrientation(),
    }
  }
}

export const deviceService = new DeviceService()
