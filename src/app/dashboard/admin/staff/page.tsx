import { createAdminClient } from '@/lib/supabase/admin'
import { StaffManagementClient } from './staff-client'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCompanyId } from '@/lib/tenant'
import { loadRolePermissions } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const COMPANY_ID = await getCompanyId()
  const h = await headers()
  const dec = (v: string | null, fb = '') => {
    try {
      return decodeURIComponent(v || fb)
    } catch {
      return v || fb
    }
  }
  const role = dec(h.get('x-staff-role'))
  const perms = dec(h.get('x-staff-permissions')).split(',').filter(Boolean)

  const isAdminOrOwner = role === 'admin' || role === 'owner'
  const hasStaffPerm = perms.includes('*') || perms.includes('admin.staff')
  if (!isAdminOrOwner && !hasStaffPerm) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  const { data: members } = await admin
    .from('memberships')
    .select('user_id, role, role_id, is_active, created_at')
    .eq('company_id', COMPANY_ID)
    .eq('is_active', true)
    .neq('role', 'owner')
    .order('created_at')

  if (!members?.length) {
    return <StaffManagementClient staff={[]} companyId={COMPANY_ID} />
  }

  const staff = await Promise.all(
    members.map(async (m) => {
      let name = m.role
      let lastLogin: string | null = null
      try {
        const {
          data: { user },
        } = await admin.auth.admin.getUserById(m.user_id)
        if (user) {
          name = user.user_metadata?.full_name || user.email?.split('@')[0] || name
          lastLogin = user.last_sign_in_at || null
        }
      } catch {
        /* fallback */
      }

      let roleInfo: { name: string; name_ar: string; permissions: string[] } | null = null
      if (m.role_id) {
        const { data: r } = await admin.from('roles').select('name, name_ar').eq('id', m.role_id).maybeSingle()
        if (r) {
          const perms = await loadRolePermissions(admin, m.role_id)
          roleInfo = { name: r.name, name_ar: r.name_ar, permissions: perms }
        }
      }

      return {
        id: m.user_id,
        name,
        last_login: lastLogin,
        staff_roles: roleInfo,
      }
    }),
  )

  return <StaffManagementClient staff={staff} companyId={COMPANY_ID} />
}
