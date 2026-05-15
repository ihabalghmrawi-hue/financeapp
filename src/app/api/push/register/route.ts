import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, companyId, userId, token, platform, deviceName, deviceId, osVersion, appVersion } = body

    if (!token || !companyId || !userId) {
      return NextResponse.json({ error: 'Missing required fields: token, companyId, userId' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: existing } = await supabase
      .from('push_devices')
      .select('id')
      .eq('token', token)
      .eq('company_id', companyId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('push_devices')
        .update({
          platform,
          device_name: deviceName,
          device_id: deviceId,
          os_version: osVersion,
          app_version: appVersion,
          is_active: true,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      return NextResponse.json({ registered: true, deviceId: existing.id })
    }

    const { data, error } = await supabase
      .from('push_devices')
      .insert({
        company_id: companyId,
        user_id: userId,
        token,
        platform,
        device_name: deviceName,
        device_id: deviceId,
        os_version: osVersion,
        app_version: appVersion,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ registered: true, deviceId: data.id })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
