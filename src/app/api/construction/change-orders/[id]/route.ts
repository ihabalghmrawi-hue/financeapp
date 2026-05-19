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
  if ('title' in body) {
    allowed.title = String(body.title)
  }
  if ('description' in body) {
    allowed.description = body.description || null
  }
  if ('amount_change' in body) {
    allowed.amount_change = Number(body.amount_change) || 0
  }
  if ('status' in body) {
    allowed.status = String(body.status)
  }
  if ('approved_by' in body) {
    allowed.approved_by = body.approved_by || null
  }
  if ('approved_at' in body) {
    allowed.approved_at = body.approved_at || null
  }

  const { data, error } = await admin
    .from('con_change_orders')
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

  const { error } = await admin.from('con_change_orders').delete().eq('id', id).eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
