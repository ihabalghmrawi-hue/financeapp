import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const body = await req.json()
  const { name, name_ar, color, icon } = body
  if (!name && !name_ar) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  const { data, error } = await admin
    .from('product_categories')
    .update({ name: name || name_ar, name_ar: name_ar || name, color: color || '#78716c', icon: icon || 'package' })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
