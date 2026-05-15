'use client'

import type { StoredWorkspace } from './database'
import { getFromStore, putInStore, deleteFromStore, getAllFromIndex } from './database'

export class WorkspaceStore {
  async save(workspaceId: string, companyId: string, state: Record<string, unknown>): Promise<void> {
    const id = `${companyId}:${workspaceId}`
    const entry: StoredWorkspace = {
      id,
      workspace_id: workspaceId,
      company_id: companyId,
      state,
      updated_at: Date.now(),
    }
    await putInStore('workspace', entry)
  }

  async get(workspaceId: string, companyId: string): Promise<StoredWorkspace | undefined> {
    return getFromStore<StoredWorkspace>('workspace', `${companyId}:${workspaceId}`)
  }

  async getAllForCompany(companyId: string): Promise<StoredWorkspace[]> {
    return getAllFromIndex<StoredWorkspace>('workspace', 'workspace_id', IDBKeyRange.only(companyId))
  }

  async delete(workspaceId: string, companyId: string): Promise<void> {
    await deleteFromStore('workspace', `${companyId}:${workspaceId}`)
  }
}

export const workspaceStore = new WorkspaceStore()
