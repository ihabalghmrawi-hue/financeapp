import { getCurrency } from '@/lib/tenant'
import { EquipmentClient } from './equipment-client'

export const revalidate = 120

export default async function EquipmentPage() {
  const currency = await getCurrency()
  return <EquipmentClient currency={currency} />
}
