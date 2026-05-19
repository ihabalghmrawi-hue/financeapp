import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const days = Number(req.nextUrl.searchParams.get('days') || '30')
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const [projects, expenses, materials, payments, workers] = await Promise.all([
    admin
      .from('con_projects')
      .select('id, name, type, status, expected_cost, actual_cost, start_date, end_date, contract_value')
      .eq('company_id', companyId),

    admin
      .from('con_expenses')
      .select('project_id, amount, category, expense_date')
      .eq('company_id', companyId)
      .gte('expense_date', since),

    admin
      .from('con_materials')
      .select('project_id, quantity, unit_price, purchase_date')
      .eq('company_id', companyId)
      .gte('purchase_date', since),

    admin
      .from('con_payments')
      .select('project_id, type, amount, payment_date')
      .eq('company_id', companyId)
      .gte('payment_date', since),

    admin.from('con_workers').select('id, name, job_type, daily_rate, status').eq('company_id', companyId),
  ])

  if (projects.error) {
    return NextResponse.json({ error: projects.error.message }, { status: 500 })
  }

  const projectMap: Record<string, { name: string; income: number; expenses: number; materials: number }> = {}
  for (const p of projects.data || []) {
    projectMap[p.id] = { name: p.name, income: 0, expenses: 0, materials: 0 }
  }

  for (const e of expenses.data || []) {
    if (e.project_id && projectMap[e.project_id]) {
      projectMap[e.project_id].expenses += Number(e.amount)
    }
  }
  for (const m of materials.data || []) {
    if (m.project_id && projectMap[m.project_id]) {
      projectMap[m.project_id].materials += Number(m.quantity) * Number(m.unit_price)
    }
  }
  for (const p of payments.data || []) {
    if (p.project_id && projectMap[p.project_id]) {
      if (p.type === 'incoming') {
        projectMap[p.project_id].income += Number(p.amount)
      }
    }
  }

  const totalIncoming = (payments.data || [])
    .filter((p) => p.type === 'incoming')
    .reduce((s, p) => s + Number(p.amount), 0)

  const totalOutgoing = (payments.data || [])
    .filter((p) => p.type === 'outgoing')
    .reduce((s, p) => s + Number(p.amount), 0)

  const totalExpenses = (expenses.data || []).reduce((s, e) => s + Number(e.amount), 0)
  const totalMaterials = (materials.data || []).reduce((s, m) => s + Number(m.quantity) * Number(m.unit_price), 0)

  const expensesByCategory: Record<string, number> = {}
  for (const e of expenses.data || []) {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount)
  }
  if (totalMaterials > 0) {
    expensesByCategory['materials'] = (expensesByCategory['materials'] || 0) + totalMaterials
  }

  const projectById = Object.fromEntries((projects.data || []).map((p) => [p.id, p]))

  const projectSummary = Object.entries(projectMap).map(([id, v]) => ({
    id,
    name: v.name,
    type: projectById[id]?.type || 'other',
    status: projectById[id]?.status || 'unknown',
    income: v.income,
    costs: v.expenses + v.materials,
    profit: v.income - v.expenses - v.materials,
    contract_value: projectById[id]?.contract_value || 0,
  }))

  const statusCounts = { planning: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 }
  for (const p of projects.data || []) {
    const s = p.status as keyof typeof statusCounts
    if (s in statusCounts) {
      statusCounts[s]++
    }
  }

  const profitabilityByType: Record<
    string,
    { count: number; totalIncome: number; totalCosts: number; totalProfit: number }
  > = {}
  for (const p of projectSummary) {
    const t = p.type || 'other'
    if (!profitabilityByType[t]) {
      profitabilityByType[t] = { count: 0, totalIncome: 0, totalCosts: 0, totalProfit: 0 }
    }
    profitabilityByType[t].count++
    profitabilityByType[t].totalIncome += p.income
    profitabilityByType[t].totalCosts += p.costs
    profitabilityByType[t].totalProfit += p.profit
  }

  return NextResponse.json({
    summary: {
      totalIncoming,
      totalOutgoing,
      totalExpenses,
      totalMaterials,
      netProfit: totalIncoming - totalOutgoing - totalExpenses - totalMaterials,
      totalProjects: projects.data?.length || 0,
      statusCounts,
      workerCount: workers.data?.length || 0,
    },
    projectSummary,
    expensesByCategory,
    profitabilityByType,
    workers: workers.data || [],
  })
}
