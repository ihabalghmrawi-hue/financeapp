import { biometricAuthService } from '../biometric-auth'
import { hapticsService } from '../haptics-service'

export interface ApprovalConfirmationResult {
  success: boolean
  decision: 'approved' | 'rejected' | null
  biometricConfirmed: boolean
  error?: string
}

class ApprovalConfirmationWorkflow {
  async confirmApproval(approvalId: string, reason?: string): Promise<ApprovalConfirmationResult> {
    const biometric = await biometricAuthService.authenticate(reason ?? 'تأكيد الموافقة بيومترياً')

    if (!biometric.success) {
      await hapticsService.error()
      return {
        success: false,
        decision: null,
        biometricConfirmed: false,
        error: biometric.error ?? 'فشلت المصادقة البيومترية',
      }
    }

    await hapticsService.success()

    try {
      const response = await fetch(`/api/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'approved',
          biometricConfirmed: true,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          decision: 'approved',
          biometricConfirmed: true,
          error: 'فشل إرسال الموافقة للخادم',
        }
      }

      return {
        success: true,
        decision: 'approved',
        biometricConfirmed: true,
      }
    } catch {
      return {
        success: false,
        decision: 'approved',
        biometricConfirmed: true,
        error: 'لا يوجد اتصال بالخادم. سيتم المزامنة لاحقاً',
      }
    }
  }

  async confirmRejection(approvalId: string, reason?: string): Promise<ApprovalConfirmationResult> {
    const biometric = await biometricAuthService.authenticate(reason ?? 'تأكيد الرفض بيومترياً')

    if (!biometric.success) {
      await hapticsService.error()
      return {
        success: false,
        decision: null,
        biometricConfirmed: false,
        error: biometric.error ?? 'فشلت المصادقة البيومترية',
      }
    }

    await hapticsService.selection()

    try {
      const response = await fetch(`/api/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'rejected',
          biometricConfirmed: true,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          decision: 'rejected',
          biometricConfirmed: true,
          error: 'فشل إرسال الرفض للخادم',
        }
      }

      return {
        success: true,
        decision: 'rejected',
        biometricConfirmed: true,
      }
    } catch {
      return {
        success: false,
        decision: 'rejected',
        biometricConfirmed: true,
        error: 'لا يوجد اتصال بالخادم. سيتم المزامنة لاحقاً',
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    return biometricAuthService.isAvailable()
  }

  async getBiometryType(): Promise<string> {
    const type = await biometricAuthService.getBiometryType()
    const labels: Record<string, string> = {
      fingerprint: 'بصمة الإصبع',
      face: 'التعرف على الوجه',
      iris: 'القزحية',
      generic: 'البيومترية',
    }
    return labels[type] ?? 'البيومترية'
  }
}

export const approvalConfirmationWorkflow = new ApprovalConfirmationWorkflow()
