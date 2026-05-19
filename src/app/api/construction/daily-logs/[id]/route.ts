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
    allowed.project_id = body.project_id
  }
  if ('log_date' in body) {
    allowed.log_date = body.log_date
  }
  if ('weather' in body) {
    allowed.weather = body.weather || null
  }
  if ('workers_count' in body) {
    allowed.workers_count = Number(body.workers_count) || 0
  }
  if ('hours_worked' in body) {
    allowed.hours_worked = Number(body.hours_worked) || 8
  }
  if ('notes' in body) {
    allowed.notes = body.notes || null
  }
  if ('photo_urls' in body) {
    allowed.photo_urls = body.photo_urls
  }

  const { data, error } = await admin
    .from('con_daily_logs')
    .update(allowed)
    .eq('id', id)
    .eq('company_id', companyId)
    .select('*, con_projects(name)')
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

  const { error } = await admin.from('con_daily_logs').delete().eq('id', id).eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
