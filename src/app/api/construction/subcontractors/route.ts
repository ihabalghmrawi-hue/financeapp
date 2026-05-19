import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function GET() {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const { data, error } = await admin.from('con_subcontractors').select('*').eq('company_id', companyId).order('name')
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
    .from('con_subcontractors')
    .insert({
      company_id: companyId,
      name: body.name || '',
      phone: body.phone || null,
      specialty: body.specialty || 'general',
      contract_value: Number(body.contract_value) || 0,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      status: body.status || 'active',
      rating: body.rating !== undefined && body.rating !== '' ? Number(body.rating) : null,
      notes: body.notes || null,
    })
    .select()
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
