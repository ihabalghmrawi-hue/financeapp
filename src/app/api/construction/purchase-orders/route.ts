import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function GET() {
  const admin = createAdminClient()
  const companyId = await getCompanyId()

  const { data, error } = await admin
    .from('con_purchase_orders')
    .select('*, con_projects(name), con_purchase_order_items(*)')
    .eq('company_id', companyId)
    .order('order_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const body = await req.json()

  const items = (body.items || []) as Array<{
    material_name: string
    quantity: number
    unit: string
    unit_price: number
    total: number
  }>

  const calculatedTotal = items.reduce((s, i) => s + Number(i.total), 0)

  const { data: order, error: orderError } = await admin
    .from('con_purchase_orders')
    .insert({
      company_id: companyId,
      project_id: body.project_id || null,
      supplier: String(body.supplier || ''),
      order_date: body.order_date || new Date().toISOString().slice(0, 10),
      total: body.total || calculatedTotal,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  if (items.length > 0) {
    const { error: itemsError } = await admin.from('con_purchase_order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        material_name: item.material_name,
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'unit',
        unit_price: Number(item.unit_price) || 0,
        total: Number(item.total) || 0,
      })),
    )

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
  }

  const { data: full } = await admin
    .from('con_purchase_orders')
    .select('*, con_projects(name), con_purchase_order_items(*)')
    .eq('id', order.id)
    .single()

  return NextResponse.json(full, { status: 201 })
}
