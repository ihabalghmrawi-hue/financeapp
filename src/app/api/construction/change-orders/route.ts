import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function GET() {
  const admin = createAdminClient()
  const companyId = await getCompanyId()

  const { data, error } = await admin
    .from('con_change_orders')
    .select('*, con_projects(name)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

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
    .from('con_change_orders')
    .insert({
      company_id: companyId,
      project_id: body.project_id,
      title: String(body.title || ''),
      description: body.description || null,
      amount_change: Number(body.amount_change) || 0,
      status: body.status || 'pending',
      approved_by: body.approved_by || null,
      approved_at: body.approved_at || null,
    })
    .select('*, con_projects(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
