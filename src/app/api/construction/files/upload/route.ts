import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const companyId = await getCompanyId()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const projectId = formData.get('project_id') as string | null
  const type = (formData.get('type') as string) || 'document'
  const notes = (formData.get('notes') as string) || null

  if (!file) {
    return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 })
  }

  const bucket = 'construction-files'

  const { data: bucketData, error: bucketError } = await admin.storage.getBucket(bucket)
  if (bucketError || !bucketData) {
    const { error: createError } = await admin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
      ],
    })
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
  }

  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${companyId}/${Date.now()}_${sanitized}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path)
  const url = urlData.publicUrl

  const { data, error: insertError } = await admin
    .from('con_files')
    .insert({
      company_id: companyId,
      project_id: projectId || null,
      name: file.name,
      url,
      type,
      size_bytes: file.size,
      notes,
    })
    .select('*, con_projects(name)')
    .single()

  if (insertError) {
    await admin.storage.from(bucket).remove([path])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
