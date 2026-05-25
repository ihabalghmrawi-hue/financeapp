import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/tenant'
import { headers } from 'next/headers'
import { WarehousesClient } from './warehouses-client'

export const dynamic = 'force-dynamic'

export default async function WarehousesPage() {
  const companyId = await getCompanyId()
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

  const [{ data: warehouses }, { data: inventorySummary }] = await Promise.all([
    supabase
      .from('warehouses')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name'),
    supabase
      .from('inventory')
      .select('warehouse_id, quantity')
      .eq('company_id', companyId)
      .eq('business_type', businessType),
  ])

  // Aggregate quantity per warehouse
  const qtyByWarehouse: Record<string, number> = {}
  for (const row of inventorySummary || []) {
    if (row.warehouse_id) {
      qtyByWarehouse[row.warehouse_id] = (qtyByWarehouse[row.warehouse_id] || 0) + row.quantity
    }
  }

  const enriched = (warehouses || []).map((w) => ({
    ...w,
    total_qty: qtyByWarehouse[w.id] || 0,
  }))

  return <WarehousesClient warehouses={enriched} companyId={companyId} />
}
