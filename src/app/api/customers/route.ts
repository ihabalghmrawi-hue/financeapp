import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/tenant'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const COMPANY_ID = await getCompanyId()
    const supabase = createClient()
    const h = await headers()
    const businessType =
      (() => {
        try {
          return decodeURIComponent(h.get('x-business-type') || '')
        } catch {
          return ''
        }
      })() || 'retail'

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        company_id: COMPANY_ID,
        business_type: businessType,
        name: String(body.name || ''),
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        credit_limit: Number(body.credit_limit) || 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    return NextResponse.json({ customer })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
