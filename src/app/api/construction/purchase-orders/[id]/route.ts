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
  if ('supplier' in body) {
    allowed.supplier = String(body.supplier)
  }
  if ('order_date' in body) {
    allowed.order_date = body.order_date
  }
  if ('status' in body) {
    allowed.status = String(body.status)
  }
  if ('total' in body) {
    allowed.total = Number(body.total)
  }
  if ('notes' in body) {
    allowed.notes = body.notes || null
  }

  const { data, error } = await admin
    .from('con_purchase_orders')
    .update(allowed)
    .eq('id', id)
    .eq('company_id', companyId)
    .select('*, con_projects(name), con_purchase_order_items(*)')
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

  const { error } = await admin.from('con_purchase_orders').delete().eq('id', id).eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
