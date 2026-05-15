'use client'

import type { StoredDraft } from './database'
import { getFromStore, putInStore, deleteFromStore, getAllFromIndex, clearStore, iterateStore } from './database'

export class DraftStore {
  async save(draft: Omit<StoredDraft, 'updated_at'>): Promise<void> {
    const entry: StoredDraft = {
      ...draft,
      updated_at: Date.now(),
    }
    await putInStore('drafts', entry)
  }

  async get(id: string): Promise<StoredDraft | undefined> {
    return getFromStore<StoredDraft>('drafts', id)
  }

  async getAll(entityType: string, companyId: string): Promise<StoredDraft[]> {
    const all = await getAllFromIndex<StoredDraft>('drafts', 'entity_type', entityType)
    return all.filter((d) => d.company_id === companyId).sort((a, b) => b.updated_at - a.updated_at)
  }

  async getAllForCompany(companyId: string): Promise<StoredDraft[]> {
    const result: StoredDraft[] = []
    await iterateStore<StoredDraft>('drafts', (item) => {
      if (item.company_id === companyId) {
        result.push(item)
      }
    })
    return result.sort((a, b) => b.updated_at - a.updated_at)
  }

  async delete(id: string): Promise<void> {
    await deleteFromStore('drafts', id)
  }

  async clearAll(companyId: string): Promise<number> {
    const drafts = await this.getAllForCompany(companyId)
    let count = 0
    for (const draft of drafts) {
      await deleteFromStore('drafts', draft.id)
      count++
    }
    return count
  }

  async markSynced(id: string): Promise<void> {
    const draft = await this.get(id)
    if (draft) {
      await putInStore('drafts', { ...draft, synced: true })
    }
  }

  async updateData(id: string, data: Record<string, unknown>): Promise<void> {
    const draft = await this.get(id)
    if (draft) {
      await putInStore('drafts', { ...draft, data, updated_at: Date.now() })
    }
  }
}

export const draftStore = new DraftStore()
