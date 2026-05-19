import { NextResponse } from 'next/server'
import { getCompanyId } from '@/lib/tenant'
import { getDashboardData, invalidateDashboardCache } from '@/lib/construction/dashboard-data'

export async function GET() {
  try {
    const companyId = await getCompanyId()
    const data = await getDashboardData(companyId)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const companyId = await getCompanyId()
    await invalidateDashboardCache(companyId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 })
  }
}
