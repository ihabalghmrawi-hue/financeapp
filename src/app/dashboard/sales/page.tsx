import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SalesClient } from './sales-client'
import { getCompanyId, getCurrency } from '@/lib/tenant'
import type { BusinessType } from '@/types/erp'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
  const CURRENCY = await getCurrency()
  const COMPANY_ID = await getCompanyId()
  const supabase = createClient()
  const h = await headers()
  const businessType = (() => {
    try {
      return decodeURIComponent(h.get('x-business-type') || 'retail')
    } catch {
      return 'retail'
    }
  })() as BusinessType

  const [{ data: sales }, { data: customers }, { data: products }] = await Promise.all([
    supabase
      .from('sales')
      .select('*, customers(name, phone), sale_items(id), sale_payments(method, amount)')
      .eq('company_id', COMPANY_ID)
      .eq('business_type', businessType)
      .order('sale_date', { ascending: false })
      .limit(100),
    supabase
      .from('customers')
      .select('*')
      .eq('company_id', COMPANY_ID)
      .eq('business_type', businessType)
      .eq('is_active', true),
    supabase
      .from('products')
      .select('id, name, name_ar, sale_price, barcode')
      .eq('company_id', COMPANY_ID)
      .eq('business_type', businessType)
      .eq('is_active', true),
  ])

  return (
    <SalesClient
      sales={sales || []}
      customers={customers || []}
      products={products || []}
      currency={CURRENCY}
      companyId={COMPANY_ID}
    />
  )
}
