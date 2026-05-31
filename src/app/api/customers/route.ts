import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireCompany, requireRole, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'
import { CustomerService } from '@/services/customer.service'

export async function POST(req: NextRequest) {
  const ctx = requireRole(req, 'customers:create')
  if (isAuthError(ctx)) {
    return ctx
  }

  const supabase = createClient()
  const service = new CustomerService(supabase, ctx.companyId)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Errors.badRequest('Invalid JSON body')
  }

  const result = await service.create(body as any)
  if (!result.ok) {
    if (result.code === 'CONFLICT') {
      return Errors.conflict(result.error)
    }
    return Errors.badRequest(result.error)
  }
  return ok(result.data, undefined, 201)
}
