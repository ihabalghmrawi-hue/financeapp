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
  const fields = ['name', 'phone', 'specialty', 'contract_value', 'start_date', 'end_date', 'status', 'rating', 'notes']
  for (const f of fields) {
    if (f in body) {
      allowed[f] = body[f]
    }
  }
  if ('contract_value' in body) {
    allowed.contract_value = Number(body.contract_value) || 0
  }
  if ('rating' in body) {
    allowed.rating = body.rating !== '' ? Number(body.rating) : null
  }
  const { data, error } = await admin
    .from('con_subcontractors')
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
  const { error } = await admin.from('con_subcontractors').delete().eq('id', id).eq('company_id', companyId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
