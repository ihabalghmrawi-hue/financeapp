import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCompany, requireRole, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'
import { ExpenseService } from '@/services/expense.service'

const DEFAULT_CATEGORIES = [
  { name: 'salaries', name_ar: 'مرتبات وأجور', color: '#3b82f6', icon: 'users' },
  { name: 'rent', name_ar: 'إيجار', color: '#8b5cf6', icon: 'home' },
  { name: 'utilities', name_ar: 'فواتير وخدمات', color: '#f59e0b', icon: 'zap' },
  { name: 'supplies', name_ar: 'مستلزمات', color: '#10b981', icon: 'package' },
  { name: 'marketing', name_ar: 'تسويق وإعلان', color: '#ec4899', icon: 'megaphone' },
  { name: 'transport', name_ar: 'نقل ومواصلات', color: '#6366f1', icon: 'truck' },
  { name: 'maintenance', name_ar: 'صيانة وإصلاح', color: '#f97316', icon: 'wrench' },
  { name: 'other', name_ar: 'مصروفات أخرى', color: '#94a3b8', icon: 'more-horizontal' },
]

export async function GET(req: NextRequest) {
  const ctx = requireCompany(req)
  if (isAuthError(ctx)) {
    return ctx
  }

  const supabase = createClient()
  const service = new ExpenseService(supabase, ctx.companyId)

  const result = await service.getCategories()
  if (!result.ok) {
    return Errors.serverError(result.error)
  }
  return ok(result.data)
}

export async function POST(req: NextRequest) {
  const ctx = requireRole(req, 'expenses:create')
  if (isAuthError(ctx)) {
    return ctx
  }

  const admin = createAdminClient()
  const body = await req.json()

  if (body.action === 'seed') {
    const { data: existing } = await admin.from('expense_categories').select('name').eq('company_id', ctx.companyId)
    const existingNames = new Set((existing || []).map((c: any) => c.name))
    const toInsert = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name)).map((c) => ({
      ...c,
      company_id: ctx.companyId,
    }))
    if (toInsert.length > 0) {
      await admin.from('expense_categories').insert(toInsert)
    }
    return ok({ seeded: toInsert.length })
  }

  if (!body.name_ar) {
    return Errors.badRequest('Category name is required')
  }

  const { data, error } = await admin
    .from('expense_categories')
    .insert({
      company_id: ctx.companyId,
      name: body.name || body.name_ar.toLowerCase().replace(/\s+/g, '_'),
      name_ar: body.name_ar.trim(),
      color: body.color || '#6366f1',
      icon: body.icon || 'tag',
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return Errors.serverError(error.message)
  }
  return ok(data, undefined, 201)
}

export async function DELETE(req: NextRequest) {
  const ctx = requireRole(req, 'expenses:delete')
  if (isAuthError(ctx)) {
    return ctx
  }

  const admin = createAdminClient()
  const { id } = await req.json()

  const { error } = await admin
    .from('expense_categories')
    .update({ is_active: false })
    .eq('id', id)
    .eq('company_id', ctx.companyId)

  if (error) {
    return Errors.serverError(error.message)
  }
  return ok({ ok: true })
}
