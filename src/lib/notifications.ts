import type { SupabaseClient } from '@supabase/supabase-js'

export type NotificationType =
  | 'sale_completed'
  | 'payment_received'
  | 'expense_recorded'
  | 'purchase_created'
  | 'customer_registered'
  | 'rental_booked'
  | 'rental_returned'
  | 'low_stock_alert'
  | 'stock_out_alert'
  | 'budget_overrun'
  | 'deadline_approaching'

export type NotificationSeverity = 'info' | 'warning' | 'error'

export interface CreateNotificationInput {
  companyId: string
  type: NotificationType
  title: string
  body?: string
  severity?: NotificationSeverity
  link?: string
}

export async function createNotification(db: SupabaseClient, input: CreateNotificationInput): Promise<void> {
  try {
    await db.from('notifications').insert({
      company_id: input.companyId,
      type: input.type,
      title: input.title,
      body: input.body ?? '',
      severity: input.severity ?? 'info',
      link: input.link ?? null,
      is_read: false,
    })
  } catch (e) {
    console.error('Failed to create notification:', e)
  }
}

export async function markNotificationsRead(db: SupabaseClient, companyId: string, ids?: string[]): Promise<void> {
  try {
    let query = db.from('notifications').update({ is_read: true }).eq('company_id', companyId)

    if (ids && ids.length > 0) {
      query = query.in('id', ids)
    }

    await query
  } catch (e) {
    console.error('Failed to mark notifications read:', e)
  }
}

export async function getUnreadCount(db: SupabaseClient, companyId: string): Promise<number> {
  try {
    const { count } = await db
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_read', false)
    return count ?? 0
  } catch {
    return 0
  }
}
