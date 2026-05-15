import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const userId = searchParams.get('userId')

    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Missing companyId or userId' }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        companyId,
        userId,
        enabled: true,
        quietHoursEnabled: false,
        categoryPreferences: {},
        priorityThreshold: 'low',
        badgeEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      companyId: data.company_id,
      userId: data.user_id,
      enabled: data.enabled,
      quietHoursEnabled: data.quiet_hours_enabled,
      quietHoursStart: data.quiet_hours_start,
      quietHoursEnd: data.quiet_hours_end,
      categoryPreferences: data.category_preferences ?? {},
      priorityThreshold: data.priority_threshold ?? 'low',
      badgeEnabled: data.badge_enabled ?? true,
      soundEnabled: data.sound_enabled ?? true,
      vibrationEnabled: data.vibration_enabled ?? true,
      updatedAt: data.updated_at,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { companyId, userId, ...prefs } = body

    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Missing companyId or userId' }, { status: 400 })
    }

    const supabase = createClient()

    const { error } = await supabase.from('notification_preferences').upsert(
      {
        company_id: companyId,
        user_id: userId,
        enabled: prefs.enabled ?? true,
        quiet_hours_enabled: prefs.quietHoursEnabled ?? false,
        quiet_hours_start: prefs.quietHoursStart ?? null,
        quiet_hours_end: prefs.quietHoursEnd ?? null,
        category_preferences: prefs.categoryPreferences ?? {},
        priority_threshold: prefs.priorityThreshold ?? 'low',
        badge_enabled: prefs.badgeEnabled ?? true,
        sound_enabled: prefs.soundEnabled ?? true,
        vibration_enabled: prefs.vibrationEnabled ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'company_id,user_id' },
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ saved: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
