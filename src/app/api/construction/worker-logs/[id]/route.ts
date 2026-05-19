import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const body = await req.json()

  const allowed: Record<string, unknown> = {}
  if ('project_id' in body) {
    allowed.project_id = body.project_id || null
  }
  if ('worker_id' in body) {
    allowed.worker_id = body.worker_id
  }
  if ('log_date' in body) {
    allowed.log_date = body.log_date
  }
  if ('days_worked' in body) {
    allowed.days_worked = Number(body.days_worked) || 1
  }
  if ('amount_paid' in body) {
    allowed.amount_paid = Number(body.amount_paid) || 0
  }
  if ('notes' in body) {
    allowed.notes = body.notes || null
  }

  const { data, error } = await admin
    .from('con_worker_logs')
    .update(allowed)
    .eq('id', id)
    .eq('company_id', companyId)
    .select('*, con_workers(name, daily_rate, job_type), con_projects(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const admin = createAdminClient()
  const companyId = await getCompanyId()

  const { error } = await admin.from('con_worker_logs').delete().eq('id', id).eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
