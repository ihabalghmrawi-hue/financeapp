'use client'

import { useState, useEffect, useCallback } from 'react'
import { draftStore } from '../storage/draft-store'
import type { StoredDraft } from '../storage/database'

interface OfflineDraftOptions {
  entityType: string
  companyId: string
}

interface OfflineDraftResult {
  drafts: StoredDraft[]
  loading: boolean
  saveDraft: (id: string, data: Record<string, unknown>, title: string) => Promise<void>
  updateDraft: (id: string, data: Record<string, unknown>) => Promise<void>
  deleteDraft: (id: string) => Promise<void>
  getDraft: (id: string) => Promise<StoredDraft | undefined>
  clearAll: () => Promise<number>
}

export function useOfflineDraft({ entityType, companyId }: OfflineDraftOptions): OfflineDraftResult {
  const [drafts, setDrafts] = useState<StoredDraft[]>([])
  const [loading, setLoading] = useState(true)

  const loadDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const all = await draftStore.getAll(entityType, companyId)
      setDrafts(all)
    } finally {
      setLoading(false)
    }
  }, [entityType, companyId])

  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  const saveDraft = useCallback(
    async (id: string, data: Record<string, unknown>, title: string) => {
      await draftStore.save({
        id,
        entity_type: entityType,
        company_id: companyId,
        data,
        title,
        created_at: Date.now(),
        synced: false,
        parent_id: null,
      })
      await loadDrafts()
    },
    [entityType, companyId, loadDrafts],
  )

  const updateDraft = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      await draftStore.updateData(id, data)
      await loadDrafts()
    },
    [loadDrafts],
  )

  const deleteDraft = useCallback(
    async (id: string) => {
      await draftStore.delete(id)
      await loadDrafts()
    },
    [loadDrafts],
  )

  const getDraft = useCallback(async (id: string) => {
    return draftStore.get(id)
  }, [])

  const clearAll = useCallback(async () => {
    const count = await draftStore.clearAll(companyId)
    await loadDrafts()
    return count
  }, [companyId, loadDrafts])

  return { drafts, loading, saveDraft, updateDraft, deleteDraft, getDraft, clearAll }
}
