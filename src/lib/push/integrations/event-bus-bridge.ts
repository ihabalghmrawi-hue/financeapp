import { accountingAlertService } from '../alerts/accounting-alerts'
import { integrationAlertService } from '../alerts/integration-alerts'

class EventBusBridge {
  async onAccountingEvent(event: {
    type: string
    companyId: string
    userId?: string
    payload: {
      amount?: number
      currency?: string
      accountName?: string
      description?: string
      anomalyId?: string
      anomalyType?: string
      severity?: string
      period?: string
      journalId?: string
      imbalanceAmount?: number
    }
  }): Promise<void> {
    if (!event.userId) {
      return
    }

    if (event.type === 'anomaly_detected' || event.type === 'ai_anomaly_detected') {
      await accountingAlertService.notifyAnomalyDetected(event.companyId, event.userId, {
        anomalyId: event.payload.anomalyId ?? event.payload.journalId ?? crypto.randomUUID(),
        description: event.payload.description ?? 'شذوذ محاسبي غير محدد',
        amount: event.payload.amount ?? 0,
        currency: event.payload.currency ?? 'SAR',
        accountName: event.payload.accountName,
        severity: (event.payload.severity as any) ?? 'medium',
        anomalyType: event.payload.anomalyType ?? 'غير محدد',
      })
    }

    if (event.type === 'unreconciled_entries') {
      await accountingAlertService.notifyUnreconciledEntries(event.companyId, event.userId, {
        count: (event.payload as any).count ?? 0,
        totalAmount: event.payload.amount ?? 0,
        currency: event.payload.currency ?? 'SAR',
        period: event.payload.period ?? '',
        daysOpen: (event.payload as any).daysOpen ?? 0,
      })
    }

    if (event.type === 'integrity_failure') {
      await accountingAlertService.notifyJournalIntegrityFailure(event.companyId, event.userId, {
        journalId: event.payload.journalId ?? '',
        description: event.payload.description ?? 'خلل في التكامل المحاسبي',
        imbalanceAmount: event.payload.imbalanceAmount ?? 0,
        currency: event.payload.currency ?? 'SAR',
      })
    }
  }

  async onIntegrationEvent(event: {
    type: string
    companyId: string
    userId: string
    payload: {
      integrationName?: string
      endpoint?: string
      errorMessage?: string
      retryCount?: number
      downtime?: number
      recordsSynced?: number
      duration?: number
    }
  }): Promise<void> {
    if (event.type === 'integration_failed') {
      await integrationAlertService.notifyIntegrationFailed(event.companyId, event.userId, {
        integrationName: event.payload.integrationName ?? 'unknown',
        endpoint: event.payload.endpoint,
        errorMessage: event.payload.errorMessage ?? 'خطأ غير معروف',
        timestamp: new Date().toISOString(),
        retryCount: event.payload.retryCount,
      })
    }

    if (event.type === 'integration_recovered') {
      await integrationAlertService.notifyIntegrationRecovered(event.companyId, event.userId, {
        integrationName: event.payload.integrationName ?? 'unknown',
        downtime: event.payload.downtime ?? 0,
      })
    }

    if (event.type === 'sync_completed') {
      await integrationAlertService.notifySyncCompleted(event.companyId, event.userId, {
        integrationName: event.payload.integrationName ?? 'unknown',
        recordsSynced: event.payload.recordsSynced ?? 0,
        duration: event.payload.duration ?? 0,
      })
    }
  }
}

export const eventBusBridge = new EventBusBridge()
