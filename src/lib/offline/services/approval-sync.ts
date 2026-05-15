'use client'

import { entityStore } from '../storage/entity-store'
import { syncEngine } from '../sync/sync-engine'

export class ApprovalSyncService {
  async cacheApprovalRequest(request: Record<string, unknown>, companyId: string): Promise<void> {
    await entityStore.put({
      id: String(request.id),
      entity_type: 'approval_requests',
      company_id: companyId,
      data: request,
      version: (request as any).version ?? 0,
      updated_at: (request as any).updated_at ?? new Date().toISOString(),
      created_at: (request as any).created_at ?? new Date().toISOString(),
      synced_at: new Date().toISOString(),
      dirty: false,
    })
  }

  async submitApproval(
    approvalData: { entity_type: string; entity_id: string; action: string; comments?: string; reviewer_id: string },
    companyId: string,
  ): Promise<string> {
    await entityStore.put({
      id: `${approvalData.entity_type}:${approvalData.entity_id}:${Date.now()}`,
      entity_type: 'approval_requests',
      company_id: companyId,
      data: approvalData as unknown as Record<string, unknown>,
      version: 0,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      synced_at: null,
      dirty: true,
    })

    return syncEngine.queueOfflineOperation(
      'approval_requests',
      String(crypto.randomUUID()),
      companyId,
      'create',
      approvalData as unknown as Record<string, unknown>,
      10,
    )
  }

  async getCachedApprovals(companyId: string): Promise<Record<string, unknown>[]> {
    const items = await entityStore.getAll('approval_requests', companyId)
    return items.map((i) => i.data)
  }

  async getPendingApprovals(companyId: string): Promise<Record<string, unknown>[]> {
    const items = await entityStore.getAll('approval_requests', companyId)
    return items
      .filter((i) => (i.data as any).status === 'pending' || (i.data as any).status === 'pending')
      .map((i) => i.data)
  }
}

export const approvalSyncService = new ApprovalSyncService()
