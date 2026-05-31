import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCompany, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'
import { markNotificationsRead } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const ctx = requireCompany(req)
  if (isAuthError(ctx)) {
    return ctx
  }

  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)
  const sevenDays = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10)
  const businessType = (() => {
    try {
      return decodeURIComponent(req.headers.get('x-business-type') || 'retail')
    } catch {
      return 'retail'
    }
  })()

  const computed: Array<{
    id: string
    type: string
    title: string
    body: string
    severity: 'info' | 'warning' | 'error'
    created_at: string
    read: boolean
  }> = []

  // 1. Low-stock products (qty < 5 but > 0)
  const { data: lowStock } = await supabase
    .from('inventory')
    .select('quantity, products(name)')
    .eq('company_id', ctx.companyId)
    .eq('business_type', businessType)
    .lt('quantity', 5)
    .gt('quantity', 0)
    .limit(5)
  for (const item of lowStock || []) {
    const name = (item.products as any)?.name || 'Product'
    computed.push({
      id: `low-${name}`,
      type: 'low_stock',
      title: 'Low Stock',
      body: `${name} — ${item.quantity} unit(s) remaining`,
      severity: 'warning',
      created_at: new Date().toISOString(),
      read: false,
    })
  }

  // 2. Out-of-stock products
  const { data: outStock } = await supabase
    .from('inventory')
    .select('products(name)')
    .eq('company_id', ctx.companyId)
    .eq('business_type', businessType)
    .lte('quantity', 0)
    .limit(3)
  for (const item of outStock || []) {
    const name = (item.products as any)?.name || 'Product'
    computed.push({
      id: `out-${name}`,
      type: 'out_of_stock',
      title: 'Out of Stock',
      body: `${name} — out of stock`,
      severity: 'error',
      created_at: new Date().toISOString(),
      read: false,
    })
  }

  // 3. Unpaid sales
  const { count: unpaidCount } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', ctx.companyId)
    .eq('business_type', businessType)
    .eq('payment_status', 'unpaid')
    .gte('created_at', sevenDays)
  if ((unpaidCount ?? 0) > 0) {
    computed.push({
      id: 'unpaid-sales',
      type: 'unpaid_invoices',
      title: 'Unpaid Invoices',
      body: `${unpaidCount} invoice(s) pending payment this week`,
      severity: 'warning',
      created_at: new Date().toISOString(),
      read: false,
    })
  }

  // 4. Today's sales summary
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total')
    .eq('company_id', ctx.companyId)
    .eq('business_type', businessType)
    .gte('created_at', today)
  const todayTotal = (todaySales || []).reduce((s, r) => s + (r.total || 0), 0)
  if (todaySales && todaySales.length > 0) {
    computed.push({
      id: 'today-sales',
      type: 'daily_summary',
      title: 'Today Summary',
      body: `${todaySales.length} invoice(s) · Total ${todayTotal.toFixed(2)}`,
      severity: 'info',
      created_at: new Date().toISOString(),
      read: true,
    })
  }

  // 5. Customer debts
  const { count: overdueCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', ctx.companyId)
    .gt('balance', 0)
    .eq('is_active', true)
  if ((overdueCount ?? 0) > 0) {
    computed.push({
      id: 'overdue-customers',
      type: 'customer_debt',
      title: 'Customer Debts',
      body: `${overdueCount} customer(s) have outstanding balances`,
      severity: 'info',
      created_at: new Date().toISOString(),
      read: true,
    })
  }

  // 6. Budget overruns
  const { data: budgetOverruns } = await supabase
    .from('con_projects')
    .select('id, name, budget')
    .eq('company_id', ctx.companyId)
    .limit(5)
  for (const proj of budgetOverruns || []) {
    if (!proj.budget) {
      continue
    }
    const { data: expenseSums } = await supabase
      .from('con_expenses')
      .select('amount')
      .eq('project_id', proj.id)
      .eq('company_id', ctx.companyId)
    const totalExpenses = (expenseSums || []).reduce((s, r) => s + (r.amount || 0), 0)
    const { data: paymentSums } = await supabase
      .from('con_payments')
      .select('amount')
      .eq('project_id', proj.id)
      .eq('company_id', ctx.companyId)
    const totalPayments = (paymentSums || []).reduce((s, r) => s + (r.amount || 0), 0)
    if (totalExpenses + totalPayments > proj.budget) {
      computed.push({
        id: `budget-${proj.id}`,
        type: 'budget_overrun',
        title: 'Budget Overrun',
        body: `${proj.name} has exceeded its budget`,
        severity: 'error',
        created_at: new Date().toISOString(),
        read: false,
      })
    }
  }

  // 7. Approaching deadlines
  const sevenDaysFromNow = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)
  const { data: nearingDeadline } = await supabase
    .from('con_projects')
    .select('id, name, end_date')
    .eq('company_id', ctx.companyId)
    .lte('end_date', sevenDaysFromNow)
    .gte('end_date', today)
    .limit(5)
  for (const proj of nearingDeadline || []) {
    computed.push({
      id: `deadline-${proj.id}`,
      type: 'deadline_approaching',
      title: 'Approaching Deadline',
      body: `${proj.name} ends on ${proj.end_date}`,
      severity: 'warning',
      created_at: new Date().toISOString(),
      read: false,
    })
  }

  // 8. Stored notifications (from DB)
  const { data: stored } = await supabase
    .from('notifications')
    .select('*')
    .eq('company_id', ctx.companyId)
    .order('created_at', { ascending: false })
    .limit(20)

  const storedMapped = (stored || []).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    severity: n.severity as 'info' | 'warning' | 'error',
    created_at: n.created_at,
    read: n.is_read,
  }))

  const all = [...computed, ...storedMapped].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return NextResponse.json({
    notifications: all,
    unread: all.filter((n) => !n.read).length,
  })
}

// PATCH — mark notifications as read
export async function PATCH(req: NextRequest) {
  const ctx = requireCompany(req)
  if (isAuthError(ctx)) {
    return ctx
  }

  const supabase = createClient()
  let body: { ids?: string[] }
  try {
    body = await req.json()
  } catch {
    return Errors.badRequest('Invalid JSON body')
  }

  await markNotificationsRead(supabase, ctx.companyId, body.ids)
  return ok({ success: true })
}
