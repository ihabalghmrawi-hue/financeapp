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
  const fields = [
    'project_id',
    'incident_date',
    'type',
    'severity',
    'description',
    'location',
    'reported_by',
    'actions_taken',
    'status',
    'resolved_at',
    'notes',
  ]
  for (const f of fields) {
    if (f in body) {
      allowed[f] = body[f]
    }
  }
  const { data, error } = await admin
    .from('con_safety_incidents')
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

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const { error } = await admin.from('con_safety_incidents').delete().eq('id', id).eq('company_id', companyId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
