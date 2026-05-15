'use client'

import { entityStore } from '../storage/entity-store'
import { draftStore } from '../storage/draft-store'
import { syncEngine } from '../sync/sync-engine'

export class FinancialSyncService {
  async cacheJournalEntry(entry: Record<string, unknown>, companyId: string): Promise<void> {
    await entityStore.put({
      id: String(entry.id),
      entity_type: 'journal_entries',
      company_id: companyId,
      data: entry,
      version: (entry as any).version ?? 0,
      updated_at: (entry as any).updated_at ?? new Date().toISOString(),
      created_at: (entry as any).created_at ?? new Date().toISOString(),
      synced_at: new Date().toISOString(),
      dirty: false,
    })
  }

  async saveDraft(draftId: string, companyId: string, data: Record<string, unknown>, title: string): Promise<void> {
    await draftStore.save({
      id: draftId,
      entity_type: 'journal_entries',
      company_id: companyId,
      data,
      title,
      created_at: Date.now(),
      synced: false,
      parent_id: null,
    })
  }

  async submitJournalEntry(entryData: Record<string, unknown>, companyId: string): Promise<string> {
    await entityStore.put({
      id: String(entryData.id ?? crypto.randomUUID()),
      entity_type: 'journal_entries',
      company_id: companyId,
      data: entryData,
      version: 0,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      synced_at: null,
      dirty: true,
    })

    return syncEngine.queueOfflineOperation(
      'journal_entries',
      String(entryData.id ?? crypto.randomUUID()),
      companyId,
      'create',
      entryData,
      10,
    )
  }

  async cacheAccount(account: Record<string, unknown>, companyId: string): Promise<void> {
    await entityStore.put({
      id: String(account.id),
      entity_type: 'accounts',
      company_id: companyId,
      data: account,
      version: (account as any).version ?? 0,
      updated_at: (account as any).updated_at ?? new Date().toISOString(),
      created_at: (account as any).created_at ?? new Date().toISOString(),
      synced_at: new Date().toISOString(),
      dirty: false,
    })
  }

  async getCachedJournalEntries(companyId: string): Promise<Record<string, unknown>[]> {
    const items = await entityStore.getAll('journal_entries', companyId)
    return items.map((i) => i.data)
  }

  async getCachedAccounts(companyId: string): Promise<Record<string, unknown>[]> {
    const items = await entityStore.getAll('accounts', companyId)
    return items.map((i) => i.data)
  }

  async getDrafts(companyId: string): Promise<import('../storage/database').StoredDraft[]> {
    return draftStore.getAll('journal_entries', companyId)
  }

  async deleteDraft(draftId: string): Promise<void> {
    await draftStore.delete(draftId)
  }

  async submitDraftAsJournalEntry(draftId: string, companyId: string): Promise<string | null> {
    const draft = await draftStore.get(draftId)
    if (!draft) {
      return null
    }

    const queueId = await this.submitJournalEntry(draft.data, companyId)
    await draftStore.delete(draftId)
    return queueId
  }
}

export const financialSyncService = new FinancialSyncService()
