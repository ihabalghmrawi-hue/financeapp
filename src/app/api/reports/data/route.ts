import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireCompany, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const ctx = requireCompany(req)
  if (isAuthError(ctx)) {
    return ctx
  }

  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const businessType = req.nextUrl.searchParams.get('business_type') || 'retail'
  const supabase = createClient()

  const [{ data: sales }, { data: saleItems }, { data: customers }, { data: products }, { data: expenses }] =
    await Promise.all([
      supabase
        .from('sales')
        .select('id, total, discount_amount, created_at, payment_status, customer_id')
        .eq('company_id', ctx.companyId)
        .eq('business_type', businessType)
        .neq('status', 'cancelled')
        .gte('created_at', since)
        .order('created_at'),
      supabase
        .from('sale_items')
        .select(
          'product_id, quantity, unit_price, cost_price, total, products(name, name_ar, category_id), sales!inner(company_id)',
        )
        .eq('sales.company_id', ctx.companyId)
        .eq('sales.business_type', businessType)
        .gte('sales.created_at', since),
      supabase.from('customers').select('id, name, balance').eq('company_id', ctx.companyId).eq('is_active', true),
      supabase
        .from('products')
        .select('id, name, name_ar, cost_price, sale_price, category_id, is_active, inventory(quantity)')
        .eq('company_id', ctx.companyId)
        .eq('business_type', businessType)
        .eq('is_active', true),
      supabase.from('expenses').select('amount, created_at').eq('company_id', ctx.companyId).gte('created_at', since),
    ])

  if (!sales || !saleItems) {
    return Errors.serverError('Failed to fetch sales data')
  }

  const dailyMap: Record<string, { revenue: number; count: number }> = {}
  for (const s of sales) {
    const day = s.created_at.slice(0, 10)
    if (!dailyMap[day]) {
      dailyMap[day] = { revenue: 0, count: 0 }
    }
    dailyMap[day].revenue += Number(s.total)
    dailyMap[day].count += 1
  }
  const dailySales = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({
      day: new Date(day).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
      revenue: v.revenue,
      count: v.count,
    }))

  const productMap: Record<string, { name: string; qty: number; revenue: number; cost: number }> = {}
  for (const item of saleItems || []) {
    const p = (item as any).products
    const key = item.product_id
    if (!productMap[key]) {
      productMap[key] = { name: p?.name_ar || p?.name || '؟', qty: 0, revenue: 0, cost: 0 }
    }
    productMap[key].qty += Number(item.quantity)
    productMap[key].revenue += Number(item.total)
    productMap[key].cost += Number(item.cost_price || 0) * Number(item.quantity)
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((p) => ({
      ...p,
      profit: p.revenue - p.cost,
      margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
    }))

  const soldProductIds = new Set(Object.keys(productMap))
  const deadStock = (products || [])
    .filter((p) => {
      const stock = (p.inventory as any[])?.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0) || 0
      return !soldProductIds.has(p.id) && stock > 0
    })
    .slice(0, 10)
    .map((p) => ({
      name: p.name_ar || p.name,
      stock: (p.inventory as any[])?.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0) || 0,
      value:
        ((p.inventory as any[])?.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0) || 0) *
        Number(p.cost_price),
    }))

  const lowStock = (products || [])
    .map((p) => {
      const stock = (p.inventory as any[])?.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0) || 0
      return { name: p.name_ar || p.name, stock, cost: Number(p.cost_price), sale: Number(p.sale_price) }
    })
    .filter((p) => p.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10)

  const customerSalesMap: Record<string, number> = {}
  for (const s of sales || []) {
    if (s.customer_id) {
      customerSalesMap[s.customer_id] = (customerSalesMap[s.customer_id] || 0) + Number(s.total)
    }
  }
  const topCustomers = (customers || [])
    .map((c) => ({ name: c.name, spent: customerSalesMap[c.id] || 0, debt: Number(c.balance || 0) }))
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10)
  const highDebt = (customers || [])
    .map((c) => ({ name: c.name, debt: Number(c.balance || 0) }))
    .filter((c) => c.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, 10)

  const totalRevenue = (sales || []).reduce((s, sale) => s + Number(sale.total), 0)
  const totalCost = Object.values(productMap).reduce((s, p) => s + p.cost, 0)
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount), 0)
  const grossProfit = totalRevenue - totalCost
  const netProfit = grossProfit - totalExpenses
  const totalOrders = (sales || []).length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const insights: { type: 'warning' | 'danger' | 'info'; message: string }[] = []
  if (deadStock.length > 0) {
    insights.push({ type: 'warning', message: `${deadStock.length} product(s) not sold in ${days} days` })
  }
  if (lowStock.length > 0) {
    insights.push({ type: 'danger', message: `${lowStock.length} product(s) running low` })
  }
  const losingProducts = topProducts.filter((p) => p.margin < 0)
  if (losingProducts.length > 0) {
    insights.push({ type: 'danger', message: `Losing money on ${losingProducts.length} product(s)` })
  }
  if (highDebt.length > 0 && highDebt[0].debt > 1000) {
    insights.push({ type: 'warning', message: `${highDebt[0].name} has debt ${highDebt[0].debt.toFixed(0)}` })
  }
  if (netProfit < 0) {
    insights.push({ type: 'danger', message: 'Net profit is negative this period' })
  }
  if (totalRevenue > 0 && grossProfit / totalRevenue > 0.4) {
    insights.push({ type: 'info', message: `Gross margin ${((grossProfit / totalRevenue) * 100).toFixed(1)}%` })
  }

  return ok({
    days,
    totals: {
      revenue: totalRevenue,
      cost: totalCost,
      expenses: totalExpenses,
      grossProfit,
      netProfit,
      orders: totalOrders,
      avgOrder: avgOrderValue,
    },
    dailySales,
    topProducts,
    topCustomers,
    highDebt,
    lowStock,
    deadStock,
    insights,
  })
}
