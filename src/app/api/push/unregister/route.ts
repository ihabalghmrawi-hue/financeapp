import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceId, token } = body

    if (!deviceId && !token) {
      return NextResponse.json({ error: 'Missing deviceId or token' }, { status: 400 })
    }

    const supabase = createClient()

    const query = supabase.from('push_devices').update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })

    if (deviceId) {
      query.eq('id', deviceId)
    } else if (token) {
      query.eq('token', token)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ unregistered: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
