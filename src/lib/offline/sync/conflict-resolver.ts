'use client'

import type { ConflictEntry } from '../storage/database'
import { getFromStore, putInStore, deleteFromStore, getAllFromIndex } from '../storage/database'
import { entityStore } from '../storage/entity-store'

export type ConflictStrategy = 'local_wins' | 'remote_wins' | 'last_write_wins' | 'manual'

export interface ConflictCheckResult {
  hasConflict: boolean
  localVersion: number
  remoteVersion: number
  localData: Record<string, unknown> | null
  remoteData: Record<string, unknown> | null
}

export class ConflictResolver {
  async checkForConflict(
    entityType: string,
    entityId: string,
    remoteVersion: number,
    remoteData: Record<string, unknown>,
  ): Promise<ConflictCheckResult> {
    const stored = await entityStore.get(entityType, entityId)

    if (!stored) {
      return {
        hasConflict: false,
        localVersion: 0,
        remoteVersion,
        localData: null,
        remoteData,
      }
    }

    const hasConflict = stored.dirty && remoteVersion > stored.version

    return {
      hasConflict,
      localVersion: stored.version,
      remoteVersion,
      localData: stored.dirty ? stored.data : null,
      remoteData,
    }
  }

  async resolve(
    entityType: string,
    entityId: string,
    companyId: string,
    strategy: ConflictStrategy,
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>,
    localVersion: number,
    remoteVersion: number,
  ): Promise<{ resolved: boolean; data: Record<string, unknown> }> {
    switch (strategy) {
      case 'local_wins':
        return { resolved: true, data: localData }

      case 'remote_wins':
        return { resolved: true, data: remoteData }

      case 'last_write_wins': {
        const localTime = (localData as any)?.updated_at ?? 0
        const remoteTime = (remoteData as any)?.updated_at ?? 0
        return {
          resolved: true,
          data: localTime >= remoteTime ? localData : remoteData,
        }
      }

      case 'manual': {
        await this.recordConflict(entityType, entityId, companyId, localVersion, remoteVersion, localData, remoteData)
        return { resolved: false, data: localData }
      }

      default:
        return { resolved: false, data: localData }
    }
  }

  private async recordConflict(
    entityType: string,
    entityId: string,
    companyId: string,
    localVersion: number,
    remoteVersion: number,
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>,
  ): Promise<void> {
    const entry: ConflictEntry = {
      id: `${entityType}:${entityId}`,
      entity_type: entityType,
      entity_id: entityId,
      company_id: companyId,
      local_version: localVersion,
      remote_version: remoteVersion,
      local_data: localData,
      remote_data: remoteData,
      strategy: null,
      status: 'pending',
      created_at: Date.now(),
      resolved_at: null,
    }
    await putInStore('conflicts', entry)
  }

  async resolveConflict(entityType: string, entityId: string, strategy: 'local_wins' | 'remote_wins'): Promise<void> {
    const entry = await getFromStore<ConflictEntry>('conflicts', `${entityType}:${entityId}`)
    if (!entry) {
      return
    }

    const chosenData = strategy === 'local_wins' ? entry.local_data : entry.remote_data

    await entityStore.put({
      id: entityId,
      entity_type: entityType,
      company_id: entry.company_id,
      data: chosenData,
      version: strategy === 'remote_wins' ? entry.remote_version : entry.local_version,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      synced_at: null,
      dirty: true,
    })

    await putInStore('conflicts', {
      ...entry,
      strategy,
      status: 'resolved',
      resolved_at: Date.now(),
    })
  }

  async getPendingConflicts(companyId: string): Promise<ConflictEntry[]> {
    const conflicts = await getAllFromIndex<ConflictEntry>('conflicts', 'status', 'pending')
    return conflicts.filter((c) => c.company_id === companyId)
  }

  async getAllConflicts(companyId: string): Promise<ConflictEntry[]> {
    const conflicts = await getAllFromIndex<ConflictEntry>('conflicts', 'company_id', companyId)
    return conflicts.sort((a, b) => b.created_at - a.created_at)
  }

  async dismissConflict(entityType: string, entityId: string): Promise<void> {
    const entry = await getFromStore<ConflictEntry>('conflicts', `${entityType}:${entityId}`)
    if (entry) {
      await putInStore('conflicts', { ...entry, status: 'ignored', resolved_at: Date.now() })
    }
  }

  async countPending(): Promise<number> {
    return (await getAllFromIndex<ConflictEntry>('conflicts', 'status', 'pending')).length
  }
}

export const conflictResolver = new ConflictResolver()
