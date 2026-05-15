import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Missing companyId or userId' }, { status: 400 })
    }

    const supabase = createClient()

    let query = supabase
      .from('push_notifications')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    if (unreadOnly) {
      query = query.in('status', ['pending', 'delivered'])
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data ?? [], total: count ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { notificationId, status } = body

    if (!notificationId || !status) {
      return NextResponse.json({ error: 'Missing notificationId or status' }, { status: 400 })
    }

    const supabase = createClient()
    const updateData: Record<string, unknown> = { status }

    if (status === 'read') {
      updateData.read_at = new Date().toISOString()
    }

    const { error } = await supabase.from('push_notifications').update(updateData).eq('id', notificationId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ updated: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
