import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'

const BUCKET = 'dress-images'

export async function POST(req: NextRequest) {
  const COMPANY_ID = await getCompanyId()
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File
    if (!file) {
      return NextResponse.json({ error: 'لا يوجد ملف' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. الأنواع المسموحة: PNG, JPG, WEBP' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'الحجم الأقصى 5MB' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: buckets } = await admin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === BUCKET)
    if (!bucketExists) {
      const { error: bucketErr } = await admin.storage.createBucket(BUCKET, { public: true })
      if (bucketErr) {
        throw new Error(`فشل إنشاء مخزن الملفات: ${bucketErr.message}`)
      }
    }

    const path = `${COMPANY_ID}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
