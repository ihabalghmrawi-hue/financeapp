import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function GET() {
  const admin = createAdminClient()
  const companyId = await getCompanyId()

  const { data, error } = await admin
    .from('con_daily_logs')
    .select('*, con_projects(name)')
    .eq('company_id', companyId)
    .order('log_date', { ascending: false })

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
    .from('con_daily_logs')
    .insert({
      company_id: companyId,
      project_id: body.project_id,
      log_date: body.log_date || new Date().toISOString().slice(0, 10),
      weather: body.weather || null,
      workers_count: Number(body.workers_count) || 0,
      hours_worked: Number(body.hours_worked) || 8,
      notes: body.notes || null,
      photo_urls: body.photo_urls || [],
    })
    .select('*, con_projects(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
