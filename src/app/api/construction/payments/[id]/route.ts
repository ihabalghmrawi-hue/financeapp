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
  if ('type' in body) {
    allowed.type = String(body.type)
  }
  if ('amount' in body) {
    allowed.amount = Number(body.amount) || 0
  }
  if ('description' in body) {
    allowed.description = String(body.description)
  }
  if ('payment_method' in body) {
    allowed.payment_method = String(body.payment_method)
  }
  if ('payment_date' in body) {
    allowed.payment_date = body.payment_date
  }
  if ('reference' in body) {
    allowed.reference = body.reference || null
  }
  if ('notes' in body) {
    allowed.notes = body.notes || null
  }

  const { data, error } = await admin
    .from('con_payments')
    .update({ ...allowed, updated_at: new Date().toISOString() })
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

  const { error } = await admin.from('con_payments').delete().eq('id', id).eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
