import { getCurrency } from '@/lib/tenant'
import { SubcontractorsClient } from './subcontractors-client'

export const revalidate = 120

export default async function SubcontractorsPage() {
  const currency = await getCurrency()
  return <SubcontractorsClient currency={currency} />
}
