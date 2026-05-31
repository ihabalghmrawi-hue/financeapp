import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireCompany, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'
import { InventoryDomain } from '@/domains/inventory'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = requireCompany(req)
  if (isAuthError(ctx)) {
    return ctx
  }
  const { id } = await params
  const supabase = createClient()

  const { data, error } = await supabase
    .from('inventory_transfers')
    .select('*, transfer_lines(*)')
    .eq('id', id)
    .eq('company_id', ctx.companyId)
    .single()

  if (error) {
    return Errors.notFound('التحويل')
  }
  return ok(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = requireCompany(req)
  if (isAuthError(ctx)) {
    return ctx
  }
  const { id } = await params
  const supabase = createClient()
  const domain = new InventoryDomain(supabase, ctx.companyId)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Errors.badRequest('طلب غير صالح')
  }
  const { action } = body as Record<string, unknown>

  let result
  if (action === 'approve') {
    result = await domain.engines.transfer.approve(id)
  } else if (action === 'receive') {
    result = await domain.engines.transfer.receive(id)
  } else if (action === 'cancel') {
    result = await domain.engines.transfer.cancel(id)
  } else if (action === 'reverse') {
    result = await domain.engines.transfer.reverse(id)
  } else {
    return Errors.badRequest('إجراء غير صالح. استخدم approve, receive, cancel, أو reverse')
  }

  if (result && !result.ok) {
    return Errors.badRequest(result.error)
  }
  return ok(result?.data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = requireCompany(req)
  if (isAuthError(ctx)) {
    return ctx
  }
  const { id } = await params
  const supabase = createClient()
  const domain = new InventoryDomain(supabase, ctx.companyId)

  const result = await domain.engines.transfer.delete(id)
  if (!result.ok) {
    return Errors.badRequest(result.error)
  }
  return ok({ deleted: true })
}
