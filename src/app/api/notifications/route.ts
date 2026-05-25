import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/tenant'
import { headers } from 'next/headers'

export async function GET() {
  const supabase = createClient()
  const company_id = await getCompanyId()
  const today = new Date().toISOString().slice(0, 10)
  const sevenDays = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10)
  const h = await headers()
  const businessType = (() => {
    try {
      return decodeURIComponent(h.get('x-business-type') || 'retail')
    } catch {
      return 'retail'
    }
  })()

  const notifications: Array<{
    id: string
    type: string
    title: string
    body: string
    severity: 'info' | 'warning' | 'error'
    created_at: string
    read: boolean
  }> = []

  // 1. Low-stock products (qty < 5)
  const { data: lowStock } = await supabase
    .from('inventory')
    .select('quantity, products(name)')
    .eq('company_id', company_id)
    .eq('business_type', businessType)
    .lt('quantity', 5)
    .gt('quantity', 0)
    .limit(5)

  for (const item of lowStock || []) {
    const name = (item.products as any)?.name || 'Product'
    notifications.push({
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
    .eq('company_id', company_id)
    .eq('business_type', businessType)
    .lte('quantity', 0)
    .limit(3)

  for (const item of outStock || []) {
    const name = (item.products as any)?.name || 'Product'
    notifications.push({
      id: `out-${name}`,
      type: 'out_of_stock',
      title: 'Out of Stock',
      body: `${name} — out of stock`,
      severity: 'error',
      created_at: new Date().toISOString(),
      read: false,
    })
  }

  // 3. Unpaid sales (due > 0) from last 7 days
  const { data: unpaidSales, count: unpaidCount } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', company_id)
    .eq('business_type', businessType)
    .eq('payment_status', 'unpaid')
    .gte('created_at', sevenDays)

  if ((unpaidCount ?? 0) > 0) {
    notifications.push({
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
    .eq('company_id', company_id)
    .eq('business_type', businessType)
    .gte('created_at', today)

  const todayTotal = (todaySales || []).reduce((s, r) => s + (r.total || 0), 0)
  if (todaySales && todaySales.length > 0) {
    notifications.push({
      id: 'today-sales',
      type: 'daily_summary',
      title: 'Today Summary',
      body: `${todaySales.length} invoice(s) · Total ${todayTotal.toFixed(2)}`,
      severity: 'info',
      created_at: new Date().toISOString(),
      read: true,
    })
  }

  // 5. Overdue customer balances
  const { data: overdueCustomers, count: overdueCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', company_id)
    .gt('balance', 0)
    .eq('is_active', true)

  if ((overdueCount ?? 0) > 0) {
    notifications.push({
      id: 'overdue-customers',
      type: 'customer_debt',
      title: 'Customer Debts',
      body: `${overdueCount} customer(s) have outstanding balances`,
      severity: 'info',
      created_at: new Date().toISOString(),
      read: true,
    })
  }

  // 6. Construction budget overruns (expenses > budget)
  if (company_id) {
    const { data: budgetOverruns } = await supabase
      .from('con_projects')
      .select('id, name, budget')
      .eq('company_id', company_id)
      .limit(5)

    for (const proj of budgetOverruns || []) {
      if (!proj.budget) {
        continue
      }
      const { data: expenseSums } = await supabase
        .from('con_expenses')
        .select('amount')
        .eq('project_id', proj.id)
        .eq('company_id', company_id)
      const totalExpenses = (expenseSums || []).reduce((s, r) => s + (r.amount || 0), 0)

      const { data: paymentSums } = await supabase
        .from('con_payments')
        .select('amount')
        .eq('project_id', proj.id)
        .eq('company_id', company_id)
      const totalPayments = (paymentSums || []).reduce((s, r) => s + (r.amount || 0), 0)

      if (totalExpenses + totalPayments > proj.budget) {
        notifications.push({
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
  }

  // 7. Construction projects nearing deadline (≤ 7 days)
  if (company_id) {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)
    const { data: nearingDeadline } = await supabase
      .from('con_projects')
      .select('id, name, end_date')
      .eq('company_id', company_id)
      .lte('end_date', sevenDaysFromNow)
      .gte('end_date', today)
      .limit(5)

    for (const proj of nearingDeadline || []) {
      notifications.push({
        id: `deadline-${proj.id}`,
        type: 'deadline_approaching',
        title: 'Approaching Deadline',
        body: `${proj.name} ends on ${proj.end_date}`,
        severity: 'warning',
        created_at: new Date().toISOString(),
        read: false,
      })
    }
  }

  return NextResponse.json({
    notifications,
    unread: notifications.filter((n) => !n.read).length,
  })
}
