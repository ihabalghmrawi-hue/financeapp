import { getCurrency } from '@/lib/tenant'
import { SafetyIncidentsClient } from './safety-incidents-client'

export const dynamic = 'force-dynamic'

export default async function SafetyIncidentsPage() {
  const currency = await getCurrency()
  return <SafetyIncidentsClient currency={currency} />
}
