import { createClient } from '@/lib/supabase/server'
import { CategoriesClient } from './categories-client'
import { getCompanyId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export default async function ProductCategoriesPage() {
  const COMPANY_ID = await getCompanyId()
  const supabase = createClient()

  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .eq('company_id', COMPANY_ID)
    .is('is_active', true)
    .order('name_ar')

  return <CategoriesClient categories={categories || []} companyId={COMPANY_ID} />
}
