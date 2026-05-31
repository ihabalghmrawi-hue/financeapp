import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireCompany, requireRole, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'
import { ExpenseService } from '@/services/expense.service'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = requireRole(req, 'expenses:update')
  if (isAuthError(ctx)) {
    return ctx
  }

  const { id } = await params
  const supabase = createClient()
  const service = new ExpenseService(supabase, ctx.companyId)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Errors.badRequest('Invalid JSON body')
  }

  const result = await service.update(id, body as any)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') {
      return Errors.notFound('المصروف')
    }
    return Errors.badRequest(result.error)
  }
  return ok(result.data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = requireRole(_req, 'expenses:delete')
  if (isAuthError(ctx)) {
    return ctx
  }

  const { id } = await params
  const supabase = createClient()
  const service = new ExpenseService(supabase, ctx.companyId)

  const result = await service.delete(id)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') {
      return Errors.notFound('المصروف')
    }
    return Errors.serverError(result.error)
  }
  return ok({ success: true })
}
