import { getCurrency } from '@/lib/tenant'
import { ConstructionReportsClient } from './reports-client'

export const revalidate = 60

export default async function ConstructionReportsPage() {
  const currency = await getCurrency()
  return <ConstructionReportsClient currency={currency} />
}
