import { createClient } from '@/lib/supabase/server'
import { MovementsClient } from './movements-client'
import { getCompanyId, getCurrency } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

function normalizeStockMovement(sm: any, items: any[], warehouses: any[]) {
  const item = items.find((i) => i.id === sm.item_id)
  const wh = warehouses.find((w) => w.id === sm.warehouse_id)
  return {
    id: sm.id,
    product_id: sm.item_id,
    warehouse_id: sm.warehouse_id,
    type: sm.movement_type,
    quantity: sm.direction === 'out' ? -Math.abs(sm.qty) : Math.abs(sm.qty),
    quantity_before: null,
    quantity_after: null,
    notes: sm.description,
    reference_id: sm.reference_id,
    created_at: sm.created_at,
    products: item ? { name: item.name, name_ar: item.name_ar } : null,
    warehouses: wh ? { name: wh.name, name_ar: wh.name_ar } : null,
  }
}

export default async function MovementsPage() {
  const COMPANY_ID = await getCompanyId()
  const supabase = createClient()

  const [
    { data: movements },
    { data: products },
    { data: warehouses },
    { data: stockMovements },
    { data: inventoryItems },
  ] = await Promise.all([
    supabase
      .from('inventory_movements')
      .select('*, products(name, name_ar), warehouses(name, name_ar)')
      .eq('company_id', COMPANY_ID)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('products').select('id, name, name_ar').eq('company_id', COMPANY_ID).eq('is_active', true),
    supabase.from('warehouses').select('*').eq('company_id', COMPANY_ID).eq('is_active', true),
    supabase
      .from('stock_movements')
      .select('*')
      .eq('company_id', COMPANY_ID)
      .in('source', ['transfer'])
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('inventory_items').select('id, name, name_ar').eq('company_id', COMPANY_ID),
  ])

  const transferMovements = (stockMovements || []).map((sm) =>
    normalizeStockMovement(sm, inventoryItems || [], warehouses || []),
  )
  const allMovements = [...(movements || []), ...transferMovements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <MovementsClient
      movements={allMovements}
      products={products || []}
      warehouses={warehouses || []}
      companyId={COMPANY_ID}
      currency={await getCurrency()}
    />
  )
}
