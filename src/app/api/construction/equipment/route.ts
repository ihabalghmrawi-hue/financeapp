import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function GET() {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const { data, error } = await admin.from('con_equipment').select('*').eq('company_id', companyId).order('name')
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
    .from('con_equipment')
    .insert({
      company_id: companyId,
      name: body.name || '',
      type: body.type || 'other',
      model: body.model || null,
      serial_number: body.serial_number || null,
      status: body.status || 'available',
      daily_rate: Number(body.daily_rate) || 0,
      purchase_date: body.purchase_date || null,
      last_maintenance: body.last_maintenance || null,
      next_maintenance: body.next_maintenance || null,
      notes: body.notes || null,
    })
    .select()
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
