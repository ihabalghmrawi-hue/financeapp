import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'
import { FilesClient } from './files-client'

export const revalidate = 60

export default async function FilesPage() {
  const admin = createAdminClient()
  const COMPANY = await getCompanyId()

  const [{ data: files }, { data: projects }] = await Promise.all([
    admin
      .from('con_files')
      .select('*, con_projects(name)')
      .eq('company_id', COMPANY)
      .order('uploaded_at', { ascending: false }),
    admin.from('con_projects').select('id, name').eq('company_id', COMPANY).neq('status', 'cancelled').order('name'),
  ])

  return <FilesClient files={files || []} projects={projects || []} />
}
