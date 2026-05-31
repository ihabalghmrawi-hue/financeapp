import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCompany, requireRole, isAuthError } from '@/lib/auth-guard'
import { ok, Errors, validationError } from '@/lib/api-response'
import { ExpenseService } from '@/services/expense.service'
import { postExpenseJournal, updateWallet } from '@/lib/accounting'

export async function GET(req: NextRequest) {
  const ctx = requireCompany(req)
  if (isAuthError(ctx)) {
    return ctx
  }

  const supabase = createClient()
  const service = new ExpenseService(supabase, ctx.companyId)
  const { searchParams } = req.nextUrl
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))
  const from = searchParams.get('from') || undefined
  const to = searchParams.get('to') || undefined
  const category_id = searchParams.get('category_id') || undefined

  const result = await service.list({ limit, offset, from, to, category_id })
  if (!result.ok) {
    return Errors.serverError(result.error)
  }

  const countResult = await service.getTotalForPeriod(from || '1970-01-01', to || '2099-12-31')
  return ok(result.data.data, {
    page: Math.floor(offset / limit) + 1,
    limit,
    total: countResult.ok ? countResult.data : result.data.count,
    totalPages: Math.ceil((countResult.ok ? countResult.data : result.data.count) / limit),
  })
}

export async function POST(req: NextRequest) {
  const ctx = requireRole(req, 'expenses:create')
  if (isAuthError(ctx)) {
    return ctx
  }

  const supabase = createClient()
  const service = new ExpenseService(supabase, ctx.companyId)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Errors.badRequest('Invalid JSON body')
  }

  const result = await service.create(body as any)
  if (!result.ok) {
    return Errors.badRequest(result.error)
  }
  const expense = result.data

  const admin = createAdminClient()
  const journalResult = await postExpenseJournal(admin, {
    company_id: ctx.companyId,
    expense_id: expense.id,
    description: expense.description,
    amount: expense.amount,
    payment_method: expense.payment_method,
    wallet_id: expense.wallet_id || undefined,
  })
  if (!journalResult.ok) {
    console.error('Expense journal entry failed:', journalResult.error)
  }

  const walletResult = await updateWallet(
    admin,
    ctx.companyId,
    -expense.amount,
    `Expense: ${expense.description}`,
    expense.id,
    'expense',
    expense.payment_method,
  )
  if (!walletResult.ok) {
    console.error('Wallet update failed:', walletResult.error)
  }

  return ok(expense, undefined, 201)
}
