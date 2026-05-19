import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function GET() {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const { data, error } = await admin
    .from('con_safety_incidents')
    .select('*, con_projects(name)')
    .eq('company_id', companyId)
    .order('incident_date', { ascending: false })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const body = await req.json()
  const { data, error } = await admin
    .from('con_safety_incidents')
    .insert({
      company_id: companyId,
      project_id: body.project_id || null,
      incident_date: body.incident_date || new Date().toISOString().slice(0, 10),
      type: body.type || 'other',
      severity: body.severity || 'low',
      description: body.description || '',
      location: body.location || null,
      reported_by: body.reported_by || null,
      actions_taken: body.actions_taken || null,
      status: 'open',
      notes: body.notes || null,
    })
    .select('*, con_projects(name)')
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
