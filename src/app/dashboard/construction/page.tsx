import { getCurrency } from '@/lib/tenant'
import { getDashboardData } from '@/lib/construction/dashboard-data'
import { ConstructionDashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function ConstructionPage() {
  const CURRENCY = await getCurrency()
  const data = await getDashboardData()

  return (
    <ConstructionDashboardClient
      projects={data.projects}
      workers={data.workers}
      tasks={data.tasks}
      payments={data.payments}
      expenses={data.expenses}
      currency={CURRENCY}
    />
  )
}
