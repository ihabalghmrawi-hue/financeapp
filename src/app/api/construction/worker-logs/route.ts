import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function GET() {
  const admin = createAdminClient()
  const companyId = await getCompanyId()

  const { data, error } = await admin
    .from('con_worker_logs')
    .select('*, con_workers(name, daily_rate, job_type), con_projects(name)')
    .eq('company_id', companyId)
    .order('log_date', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const body = await req.json()

  const { data, error } = await admin
    .from('con_worker_logs')
    .insert({
      company_id: companyId,
      project_id: body.project_id || null,
      worker_id: body.worker_id,
      log_date: body.log_date || new Date().toISOString().slice(0, 10),
      days_worked: Number(body.days_worked) || 1,
      amount_paid: Number(body.amount_paid) || 0,
      notes: body.notes || null,
    })
    .select('*, con_workers(name, daily_rate, job_type), con_projects(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
