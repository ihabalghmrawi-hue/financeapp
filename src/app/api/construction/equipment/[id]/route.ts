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
    'name',
    'type',
    'model',
    'serial_number',
    'status',
    'daily_rate',
    'purchase_date',
    'last_maintenance',
    'next_maintenance',
    'notes',
  ]
  for (const f of fields) {
    if (f in body) {
      allowed[f] = body[f]
    }
  }
  if ('daily_rate' in body) {
    allowed.daily_rate = Number(body.daily_rate) || 0
  }
  const { data, error } = await admin
    .from('con_equipment')
    .update(allowed)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
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
  const { error } = await admin.from('con_equipment').delete().eq('id', id).eq('company_id', companyId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
