import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireCompany, requireRole, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'
import { CustomerService } from '@/services/customer.service'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = requireRole(req, 'customers:update')
  if (isAuthError(ctx)) {
    return ctx
  }

  const { id } = await params
  const supabase = createClient()
  const service = new CustomerService(supabase, ctx.companyId)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Errors.badRequest('Invalid JSON body')
  }

  if (!body || (body as any).amount <= 0) {
    return Errors.badRequest('Invalid amount')
  }

  const result = await service.recordPayment(id, body as any)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') {
      return Errors.notFound('العميل')
    }
    return Errors.badRequest(result.error)
  }
  return ok(result.data)
}
