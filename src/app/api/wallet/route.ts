import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCompany, requireRole, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'
import { TreasuryService } from '@/services/treasury.service'

export async function GET(req: NextRequest) {
  const ctx = requireCompany(req)
  if (isAuthError(ctx)) {
    return ctx
  }

  const supabase = createClient()
  const service = new TreasuryService(supabase, ctx.companyId)

  const result = await service.listWallets()
  if (!result.ok) {
    return Errors.serverError(result.error)
  }
  return ok(result.data)
}

export async function POST(req: NextRequest) {
  const ctx = requireRole(req, 'treasury:transfer')
  if (isAuthError(ctx)) {
    return ctx
  }

  const supabase = createClient()
  const service = new TreasuryService(supabase, ctx.companyId)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Errors.badRequest('Invalid JSON body')
  }

  const input = body as any
  const { action } = input

  if (!action || action === 'create') {
    const result = await service.createWallet(input)
    if (!result.ok) {
      return Errors.badRequest(result.error)
    }
    return ok(result.data, undefined, 201)
  }

  if (action === 'deposit') {
    if (!input.wallet_id) {
      return Errors.badRequest('wallet_id is required')
    }
    const amt = parseFloat(input.amount)
    if (!amt || amt <= 0) {
      return Errors.badRequest('Amount must be greater than zero')
    }
    const result = await service.recordIncome({
      wallet_id: input.wallet_id,
      amount: amt,
      description: input.description || 'Deposit',
    })
    if (!result.ok) {
      return Errors.serverError(result.error)
    }
    return ok({ ok: true })
  }

  if (action === 'withdrawal') {
    if (!input.wallet_id) {
      return Errors.badRequest('wallet_id is required')
    }
    const amt = parseFloat(input.amount)
    if (!amt || amt <= 0) {
      return Errors.badRequest('Amount must be greater than zero')
    }
    const result = await service.recordExpense({
      wallet_id: input.wallet_id,
      amount: amt,
      description: input.description || 'Withdrawal',
    })
    if (!result.ok) {
      return Errors.serverError(result.error)
    }
    return ok({ ok: true })
  }

  if (action === 'set_default') {
    if (!input.wallet_id) {
      return Errors.badRequest('wallet_id is required')
    }
    const admin = createAdminClient()
    await admin.from('wallets').update({ is_default: false }).eq('company_id', ctx.companyId)
    await admin.from('wallets').update({ is_default: true }).eq('id', input.wallet_id).eq('company_id', ctx.companyId)
    return ok({ ok: true })
  }

  return Errors.badRequest('Unknown action')
}

export async function DELETE(req: NextRequest) {
  const ctx = requireRole(req, 'treasury:transfer')
  if (isAuthError(ctx)) {
    return ctx
  }

  const admin = createAdminClient()
  const { id } = await req.json()
  if (!id) {
    return Errors.badRequest('ID is required')
  }

  const { count } = await admin
    .from('wallets')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', ctx.companyId)
    .eq('is_active', true)
  if ((count ?? 0) <= 1) {
    return Errors.badRequest('Cannot delete the only wallet')
  }

  const { error } = await admin
    .from('wallets')
    .update({ is_active: false })
    .eq('id', id)
    .eq('company_id', ctx.companyId)
  if (error) {
    return Errors.serverError(error.message)
  }
  return ok({ ok: true })
}
