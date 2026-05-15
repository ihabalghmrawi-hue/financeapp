import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'
import { logAudit } from '@/lib/audit'
import { loadRolePermissions } from '@/lib/rbac'

// ── Helpers ───────────────────────────────────────────────────────────────────

function splitPermCode(code: string): { resource: string; action: string } {
  const dot = code.lastIndexOf('.')
  if (dot === -1) {
    return { resource: code, action: 'access' }
  }
  return { resource: code.slice(0, dot), action: code.slice(dot + 1) }
}

async function ensurePermissions(admin: ReturnType<typeof createAdminClient>, codes: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const code of codes) {
    const { resource, action } = splitPermCode(code)
    const { data } = await admin
      .from('permissions')
      .upsert({ resource, action }, { onConflict: 'resource,action', ignoreDuplicates: true })
      .select('id')
      .maybeSingle()
    if (data) {
      ids.push(data.id)
    } else {
      const { data: existing } = await admin
        .from('permissions')
        .select('id')
        .eq('resource', resource)
        .eq('action', action)
        .maybeSingle()
      if (existing) {
        ids.push(existing.id)
      }
    }
  }
  return ids
}

async function setRolePermissions(
  admin: ReturnType<typeof createAdminClient>,
  roleId: string,
  permissionCodes: string[],
) {
  const permIds = await ensurePermissions(admin, permissionCodes)
  await admin.from('role_permissions').delete().eq('role_id', roleId)
  if (permIds.length) {
    await admin.from('role_permissions').insert(permIds.map((pid) => ({ role_id: roleId, permission_id: pid })))
  }
}

async function fetchRoleInfo(
  admin: ReturnType<typeof createAdminClient>,
  roleId: string | null,
): Promise<{ name: string; name_ar: string; permissions: string[] } | null> {
  if (!roleId) {
    return null
  }
  const { data: role } = await admin.from('roles').select('name, name_ar').eq('id', roleId).maybeSingle()
  if (!role) {
    return null
  }
  const perms = await loadRolePermissions(admin, roleId)
  return { name: role.name, name_ar: role.name_ar, permissions: perms }
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const admin = createAdminClient()
  const companyId = await getCompanyId()

  const { data: members, error } = await admin
    .from('memberships')
    .select('user_id, role, role_id, is_active, created_at')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .neq('role', 'owner')
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!members?.length) {
    return NextResponse.json([])
  }

  const result = await Promise.all(
    members.map(async (m) => {
      let name = m.role
      let email = ''
      let lastLogin: string | null = null
      try {
        const {
          data: { user },
        } = await admin.auth.admin.getUserById(m.user_id)
        if (user) {
          name = user.user_metadata?.full_name || user.email?.split('@')[0] || name
          email = user.email || ''
          lastLogin = user.last_sign_in_at || null
        }
      } catch {
        /* fallback */
      }

      const roleInfo = await fetchRoleInfo(admin, m.role_id)
      return {
        id: m.user_id,
        name,
        email,
        last_login: lastLogin,
        staff_roles: roleInfo,
      }
    }),
  )

  return NextResponse.json(result)
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const body = await req.json()
  const { name, email, password, role_name = 'employee', role_name_ar = 'موظف', permissions = [] } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'اسم الموظف مطلوب' }, { status: 400 })
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
  }

  // 1. Create auth user
  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: name.trim() },
  })
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  const userId = authUser.user.id

  // 2. Create role in `roles` table
  const { data: role, error: roleErr } = await admin
    .from('roles')
    .insert({
      company_id: companyId,
      name: role_name,
      name_ar: role_name_ar,
      is_system: false,
    })
    .select('id')
    .single()

  if (roleErr) {
    await admin.auth.admin.deleteUser(userId).catch(() => {})
    return NextResponse.json({ error: roleErr.message }, { status: 500 })
  }

  // 3. Set role permissions
  try {
    await setRolePermissions(admin, role.id, permissions)
  } catch (permErr: any) {
    await admin.from('roles').delete().eq('id', role.id)
    await admin.auth.admin.deleteUser(userId).catch(() => {})
    return NextResponse.json({ error: permErr.message }, { status: 500 })
  }

  // 4. Create membership
  const { error: memErr } = await admin.from('memberships').insert({
    user_id: userId,
    company_id: companyId,
    role: role_name,
    role_id: role.id,
    is_active: true,
  })

  if (memErr) {
    await admin.from('roles').delete().eq('id', role.id)
    await admin.auth.admin.deleteUser(userId).catch(() => {})
    return NextResponse.json({ error: memErr.message }, { status: 500 })
  }

  await logAudit({
    action: 'staff.created',
    entityType: 'memberships',
    entityId: userId,
    newValue: { name: name.trim(), email, role: role_name_ar, permissions },
  })

  return NextResponse.json(
    {
      id: userId,
      name: name.trim(),
      email: email.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      last_login: null,
      staff_roles: { name: role_name, name_ar: role_name_ar, permissions },
    },
    { status: 201 },
  )
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const body = await req.json()
  const { id, name, email, password, permissions, role_name_ar } = body

  if (!id) {
    return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })
  }

  // Find membership
  const { data: membership } = await admin
    .from('memberships')
    .select('role_id, role')
    .eq('user_id', id)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
  }

  // Update auth user
  const authUpdates: Record<string, any> = {}
  if (name?.trim()) {
    authUpdates.user_metadata = { full_name: name.trim() }
  }
  if (email?.trim()) {
    authUpdates.email = email.trim()
  }
  if (password) {
    authUpdates.password = password
  }
  if (Object.keys(authUpdates).length > 0) {
    const { error: authErr } = await admin.auth.admin.updateUserById(id, authUpdates)
    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 })
    }
  }

  // Update role permissions
  if (membership.role_id && Array.isArray(permissions)) {
    await setRolePermissions(admin, membership.role_id, permissions)
  }

  // Update role name_ar
  if (membership.role_id && role_name_ar) {
    await admin.from('roles').update({ name_ar: role_name_ar }).eq('id', membership.role_id)
  }

  // Refetch
  const {
    data: { user },
  } = await admin.auth.admin.getUserById(id)
  const roleInfo = await fetchRoleInfo(admin, membership.role_id)

  await logAudit({
    action: 'staff.updated',
    entityType: 'memberships',
    entityId: id,
    newValue: { name: name?.trim() || user?.user_metadata?.full_name, permissions },
  })

  return NextResponse.json({
    id,
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    last_login: user?.last_sign_in_at || null,
    staff_roles: roleInfo,
  })
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const admin = createAdminClient()
  const companyId = await getCompanyId()
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })
  }

  const { data: membership } = await admin
    .from('memberships')
    .select('role')
    .eq('user_id', id)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
  }

  const { error } = await admin
    .from('memberships')
    .update({ is_active: false })
    .eq('user_id', id)
    .eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    action: 'staff.deleted',
    entityType: 'memberships',
    entityId: id,
    newValue: { userId: id },
  })
  return NextResponse.json({ ok: true })
}
