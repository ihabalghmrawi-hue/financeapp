'use client'

import { entityStore } from '../storage/entity-store'
import { syncEngine } from '../sync/sync-engine'

export class ActivitySyncService {
  async cacheActivityEntry(entry: Record<string, unknown>, companyId: string): Promise<void> {
    await entityStore.put({
      id: String(entry.id),
      entity_type: 'activity_entries',
      company_id: companyId,
      data: entry,
      version: (entry as any).version ?? 0,
      updated_at: (entry as any).updated_at ?? new Date().toISOString(),
      created_at: (entry as any).created_at ?? new Date().toISOString(),
      synced_at: new Date().toISOString(),
      dirty: false,
    })
  }

  async addNote(
    note: { entity_type: string; entity_id: string; content: string; author_id: string; author_name: string },
    companyId: string,
  ): Promise<string> {
    const noteId = `note:${Date.now()}:${crypto.randomUUID?.().slice(0, 8)}`

    await entityStore.put({
      id: noteId,
      entity_type: 'activity_entries',
      company_id: companyId,
      data: {
        id: noteId,
        ...note,
        type: 'note',
        created_at: new Date().toISOString(),
      } as unknown as Record<string, unknown>,
      version: 0,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      synced_at: null,
      dirty: true,
    })

    return syncEngine.queueOfflineOperation(
      'activity_entries',
      noteId,
      companyId,
      'create',
      { ...note, id: noteId, type: 'note' } as unknown as Record<string, unknown>,
      1,
    )
  }

  async addComment(
    comment: { entity_type: string; entity_id: string; content: string; author_id: string; author_name: string },
    companyId: string,
  ): Promise<string> {
    const commentId = `comment:${Date.now()}:${crypto.randomUUID?.().slice(0, 8)}`

    await entityStore.put({
      id: commentId,
      entity_type: 'activity_entries',
      company_id: companyId,
      data: {
        id: commentId,
        ...comment,
        type: 'comment',
        created_at: new Date().toISOString(),
      } as unknown as Record<string, unknown>,
      version: 0,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      synced_at: null,
      dirty: true,
    })

    return syncEngine.queueOfflineOperation(
      'activity_entries',
      commentId,
      companyId,
      'create',
      { ...comment, id: commentId, type: 'comment' } as unknown as Record<string, unknown>,
      1,
    )
  }

  async getCachedActivities(companyId: string): Promise<Record<string, unknown>[]> {
    const items = await entityStore.getAll('activity_entries', companyId)
    return items
      .sort((a, b) => (b.data as any)?.created_at?.localeCompare?.((a.data as any)?.created_at ?? '') ?? 0)
      .map((i) => i.data)
  }

  async getActivityForEntity(entityType: string, entityId: string): Promise<Record<string, unknown>[]> {
    const stored = await entityStore.get('activity_entries', `${entityType}:${entityId}`)
    if (!stored) {
      return []
    }
    return [stored.data]
  }
}

export const activitySyncService = new ActivitySyncService()
