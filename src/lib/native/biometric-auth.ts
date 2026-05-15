import { pluginOrchestrator } from './plugin-orchestrator'
import type { BiometricResult, BiometricType } from './types'

class BiometricAuthService {
  async authenticate(reason?: string): Promise<BiometricResult> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      await NativeBiometric.verifyIdentity({
        reason: reason ?? 'التحقق من الهوية',
        title: 'مصادقة',
        subtitle: 'التحقق من هويتك',
        negativeButtonText: 'إلغاء',
      })
      return { success: true, type: 'generic' }
    } catch (err: any) {
      if (err?.code === 'BIOMETRIC_LOCKOUT' || err?.code === 'BIOMETRIC_LOCKOUT_PERMANENT') {
        return { success: false, error: 'تم قفل المصادقة البيومترية', type: 'generic' }
      }
      if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) {
        return { success: false, error: 'تم الإلغاء', type: 'generic' }
      }
      return { success: false, error: err?.message ?? 'فشلت المصادقة', type: 'generic' }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      const result = await NativeBiometric.isAvailable()
      return result.isAvailable
    } catch {
      return false
    }
  }

  async getBiometryType(): Promise<BiometricType> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      const result = await NativeBiometric.isAvailable()
      const type = result.biometryType
      if (type === 3 || type === 1) {
        return 'fingerprint'
      }
      if (type === 2 || type === 4) {
        return 'face'
      }
      if (type === 5) {
        return 'iris'
      }
      return 'generic'
    } catch {
      return 'generic'
    }
  }

  async setBiometricCredentials(server: string, username: string, password: string): Promise<boolean> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      await NativeBiometric.setCredentials({ server, username, password })
      return true
    } catch {
      return false
    }
  }

  async getBiometricCredentials(server: string): Promise<{ username: string; password: string } | null> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      const result = await NativeBiometric.getCredentials({ server })
      return { username: result.username, password: result.password }
    } catch {
      return null
    }
  }

  async deleteBiometricCredentials(server: string): Promise<boolean> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      await NativeBiometric.deleteCredentials({ server })
      return true
    } catch {
      return false
    }
  }

  async lockWithBiometric(reason: string): Promise<boolean> {
    const result = await this.authenticate(reason)
    return result.success
  }
}

export const biometricAuthService = new BiometricAuthService()
