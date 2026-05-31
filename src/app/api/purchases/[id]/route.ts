import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = requireRole(req, 'purchases:create')
  if (isAuthError(ctx)) {
    return ctx
  }

  const { id } = await params
  const supabase = createClient()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Errors.badRequest('Invalid JSON body')
  }

  const input = body as any
  const allowed: Record<string, unknown> = {}

  if ('supplier_id' in input) {
    allowed.supplier_id = input.supplier_id ?? null
  }
  if ('warehouse_id' in input) {
    allowed.warehouse_id = input.warehouse_id ?? null
  }
  if ('purchase_date' in input) {
    allowed.purchase_date = input.purchase_date
  }
  if ('notes' in input) {
    allowed.notes = input.notes || null
  }
  if ('payment_status' in input) {
    allowed.payment_status = input.payment_status
  }
  if ('paid_amount' in input) {
    allowed.paid_amount = Number(input.paid_amount) || 0
  }
  if ('due_amount' in input) {
    allowed.due_amount = Number(input.due_amount) || 0
  }

  if ('total' in input) {
    allowed.total = Number(input.total) || 0
  }
  if ('subtotal' in input) {
    allowed.subtotal = Number(input.subtotal) || 0
  }

  if (Object.keys(allowed).length === 0) {
    return Errors.badRequest('No valid fields to update')
  }

  allowed.updated_at = new Date().toISOString()

  const { data: purchase, error } = await supabase
    .from('purchases')
    .update(allowed)
    .eq('id', id)
    .eq('company_id', ctx.companyId)
    .select()
    .single()

  if (error) {
    return Errors.badRequest(error.message)
  }

  return ok({ purchase })
}
