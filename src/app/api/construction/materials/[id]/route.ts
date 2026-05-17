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
  if ('name' in body) {
    allowed.name = String(body.name)
  }
  if ('supplier' in body) {
    allowed.supplier = body.supplier || null
  }
  if ('unit' in body) {
    allowed.unit = String(body.unit)
  }
  if ('quantity' in body) {
    allowed.quantity = Number(body.quantity) || 0
  }
  if ('unit_price' in body) {
    allowed.unit_price = Number(body.unit_price) || 0
  }
  if ('purchase_date' in body) {
    allowed.purchase_date = body.purchase_date
  }
  if ('notes' in body) {
    allowed.notes = body.notes || null
  }

  const { data, error } = await admin
    .from('con_materials')
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

  const { error } = await admin.from('con_materials').delete().eq('id', id).eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
