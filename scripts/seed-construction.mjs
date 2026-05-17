import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = 'https://daxignggerilzrwrhuxs.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRheGlnbmdnZXJpbHpyd3JodXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ5MzgzNiwiZXhwIjoyMDkzMDY5ODM2fQ.3MFqi6YAOaXsxDuVxV54SInC6C3sJBy_jNCxc2oXrf4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const USER_EMAIL = 'ashrafkhatab890@gmail.com'
const USER_PASSWORD = 'Ehab8798@@'

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString().split('T')[0]
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function pick(...args) {
  return args[Math.floor(Math.random() * args.length)]
}

const AR_PROJECT_NAMES = [
  'عمارة سكنية حي النزهة', 'فيلا خاصة حي العليا', 'مشروع تجاري طريق الملك',
  'مجمع سكني حي الوادي', 'تشطيب فيلا حي الفيحاء', 'مبنى إداري حي النخيل',
  'مستودع منطقة الصناعية', 'قصر أفراح حي الربيع', 'برج سكني حي الياسمين',
  'مشروع استثماري حي الورود', 'تشطيب شقة حي المروج', 'مبنى تجاري حي التضامن',
  'مجمع فلل حي النرجس', 'مركز تجاري حي القدس', 'مشروع ترميم حي العزيزية'
]

const AR_CLIENT_NAMES = [
  'شركة البناء الحديث', 'مؤسسة الإتقان', 'شركة الرفعة للمقاولات',
  'مؤسسة الأساس المتين', 'شركة البنيان', 'مؤسسة العمران',
  'شركة الجودة', 'مؤسسة البناء الأخضر'
]

const AR_LOCATIONS = [
  'حي النزهة - الرياض', 'حي العليا - الرياض', 'حي الوادي - الرياض',
  'طريق الملك فهد - الرياض', 'حي النرجس - الرياض', 'حي الياسمين - الرياض',
  'حي الورود - جدة', 'حي الشاطئ - جدة', 'حي السلامة - جدة',
  'حي النخيل - الدمام', 'حي الفيحاء - مكة', 'حي العزيزية - مكة'
]

const AR_WORKER_NAMES = [
  'أحمد محمد', 'خالد إبراهيم', 'محمود سعيد', 'محمد علي', 'عبدالله عمر',
  'إبراهيم حسن', 'يوسف أحمد', 'سليمان خالد', 'ناصر عبدالرحمن', 'فيصل سعد',
  'عمر عبدالله', 'حسن علي', 'حسين محمد', 'أيمن خالد', 'محسن أحمد',
  'رامي عبدالله', 'باسم سليمان', 'مروان إبراهيم', 'هاني ناصر', 'جمال فيصل'
]

const JOB_TYPES = ['mason', 'carpenter', 'plumber', 'electrician', 'painter', 'tiler', 'laborer', 'engineer', 'supervisor']

const EXPENSE_CATEGORIES = ['labor', 'materials', 'equipment', 'transport', 'subcontract', 'other']
const EXPENSE_DESCRIPTIONS = [
  'أجور عمال يومية', 'إيجار معدات', 'مواد بناء', 'نقل مواد',
  'أعمال مقاول باطن', 'صيانة معدات', 'أعمال حفر', 'أعمال خرسانة',
  'أعمال حدادة', 'أعمال نجارة', 'أعمال سباكة', 'أعمال كهرباء',
  'أعمال تلييس', 'أعمال بلاط', 'أعمال دهان', 'أعمال زجاج',
  'أعمال ألمنيوم', 'أعمال تكسير', 'أعمال عزل', 'أعمال سيراميك'
]

const MATERIAL_NAMES = [
  'أسمنت بورتلاند', 'رمل أبيض', 'حديد تسليح', 'بلوك أسمنتي', 'خرسانة جاهزة',
  'بلاط سيراميك', 'دهان جدران', 'مواسير بلاستيك', 'أسلاك كهربائية', 'جبس بورد',
  'عازل حراري', 'قرميد', 'برويطة', 'خشب موسكي', 'زجاج دبل',
  'ألمنيوم نوافذ', 'بوية زيت', 'معجون جدران', 'مواد لاصقة', 'مواسير حديد'
]

const MATERIAL_UNITS = ['unit', 'kg', 'ton', 'm', 'm2', 'm3', 'liter', 'box', 'bag', 'roll']

const PAYMENT_DESCRIPTIONS = [
  'دفعة أولى حسب العقد', 'دفعة ثانية', 'دفعة ثالثة', 'مستخلص شهر ١',
  'مستخلص شهر ٢', 'مستخلص شهر ٣', 'دفعة نهائية', 'عربون حجز',
  'دفعة مواد', 'أجور عمال'
]

const FILE_NAMES = ['مخطط معماري.pdf', 'مخطط إنشائي.pdf', 'رخصة بناء.pdf', 'كروكي الموقع.pdf', 'عقد المقاولة.pdf']
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

async function main() {
  console.log('🔍 Looking up user by email...')
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) { console.error('Error listing users:', userError); return }

  const user = users.find(u => u.email === USER_EMAIL)
  if (!user) {
    console.log('❌ User not found. Creating user...')
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: USER_EMAIL,
      password: USER_PASSWORD,
      email_confirm: true
    })
    if (createError) { console.error('Error creating user:', createError); return }
    console.log('✅ User created:', newUser.user.id)
    user = newUser.user
  } else {
    console.log('✅ User found:', user.id)
  }

  console.log('🔍 Looking up company...')
  const { data: memberships, error: memError } = await supabase
    .from('memberships')
    .select('*, companies:company_id(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (memError) { console.error('Error fetching memberships:', memError); return }

  let companyId
  if (!memberships || memberships.length === 0) {
    console.log('🏢 No company found. Creating company...')
    const companyUUID = randomUUID()
    const slug = `construction-company-${Date.now()}`

    const { error: compError } = await supabase.from('companies').insert({
      id: companyUUID,
      name: 'شركة البناء الحديث للمقاولات',
      name_ar: 'شركة البناء الحديث للمقاولات',
      slug,
      email: USER_EMAIL,
      phone: '+966512345678',
      address: 'الرياض - حي النزهة',
      currency: 'SAR',
      language: 'ar',
      is_active: true
    })
    if (compError) { console.error('Error creating company:', compError); return }
    console.log('✅ Company created:', companyUUID)

    console.log('🔗 Creating membership...')
    const { error: memInsError } = await supabase.from('memberships').insert({
      user_id: user.id,
      company_id: companyUUID,
      role: 'owner',
      is_active: true
    })
    if (memInsError) { console.error('Error creating membership:', memInsError); return }
    console.log('✅ Membership created')

    companyId = companyUUID
  } else {
    companyId = memberships[0].company_id
    console.log('✅ Company found:', companyId, memberships[0].companies?.name || '')
  }

  console.log('📋 Checking company settings...')
  const { data: settings, error: setError } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (setError) { console.error('Error fetching settings:', setError); return }

  if (settings) {
    if (settings.business_type !== 'construction') {
      console.log('🔄 Updating business_type to construction...')
      const { error: updError } = await supabase
        .from('company_settings')
        .update({ business_type: 'construction' })
        .eq('company_id', companyId)
      if (updError) console.error('Error updating settings:', updError)
      else console.log('✅ Business type updated to construction')
    } else {
      console.log('✅ Business type already construction')
    }
  } else {
    console.log('🆕 Creating company settings with business_type=construction...')
    const { error: insSetError } = await supabase.from('company_settings').insert({
      company_id: companyId,
      business_type: 'construction'
    })
    if (insSetError) console.error('Error creating settings:', insSetError)
    else console.log('✅ Company settings created with construction type')
  }

  console.log('')
  console.log('🚧 ==========================================')
  console.log('🚧  SEEDING CONSTRUCTION DATA')
  console.log('🚧 ==========================================')
  console.log('')

  const truncDate = (d) => d.toISOString().split('T')[0]

  // ─── 1. PROJECTS ───────────────────────────────────────
  console.log('📌 Creating projects...')
   const projectStatuses = ['planning', 'active', 'active', 'active', 'on_hold', 'completed', 'completed', 'cancelled']
  const projectPriorities = ['low', 'medium', 'medium', 'high', 'high', 'critical']

  const projectIds = []
  const numProjects = Math.min(AR_PROJECT_NAMES.length, 8)
  for (let i = 0; i < numProjects; i++) {
    const pid = randomUUID()
    const status = pick(...projectStatuses.slice(0, 3), ...projectStatuses.slice(5, 7))
    const budget = randomFloat(200000, 5000000)
    const progress = status === 'completed' ? 100 : status === 'cancelled' ? 0 : randomBetween(10, 90)
    const startDate = new Date(2024, randomBetween(0, 11), randomBetween(1, 28))
    const endDate = status === 'completed'
      ? new Date(startDate.getTime() + randomBetween(60, 365) * 86400000)
      : new Date(startDate.getTime() + randomBetween(120, 400) * 86400000)

     const { error } = await supabase.from('con_projects').insert({
       id: pid,
       company_id: companyId,
       name: AR_PROJECT_NAMES[i],
       description: `مشروع ${AR_PROJECT_NAMES[i]} - وصف تفصيلي للمشروع`,
       client_name: pick(...AR_CLIENT_NAMES),
       client_phone: `+9665${String(randomBetween(10000000, 99999999))}`,
       location: pick(...AR_LOCATIONS),
       type: pick('apartment', 'villa', 'shop', 'office', 'other'),
       status,
       priority: pick(...projectPriorities),
       engineer_name: pick('مهندس أحمد', 'مهندس خالد', 'مهندس محمد', 'مهندس سعد'),
       start_date: truncDate(startDate),
       end_date: status === 'completed' ? truncDate(endDate) : status === 'cancelled' ? null : truncDate(endDate),
       budget,
       expected_cost: budget * randomFloat(0.8, 1.0),
       actual_cost: status === 'completed' ? budget * randomFloat(0.9, 1.1) : budget * randomFloat(0.2, 0.7),
       contract_value: budget * randomFloat(0.95, 1.15),
       total_expenses: 0,
       total_payments: 0,
       progress_pct: progress,
       notes: status === 'on_hold' ? 'المشروع متوقف بسبب ظروف الموقع' : null,
       created_by: user.id,
       created_at: truncDate(startDate)
     })
    if (error) { console.error(`Error creating project ${i}:`, error) }
    else { projectIds.push(pid); console.log(`  ✅ Project ${i + 1}: ${AR_PROJECT_NAMES[i]} (${status})`) }
  }
  console.log(`  📊 Created ${projectIds.length} projects`)
  console.log('')

  // ─── 2. WORKERS ─────────────────────────────────────────
  console.log('👷 Creating workers...')
  const workerIds = []
  const numWorkers = Math.min(AR_WORKER_NAMES.length, 15)
  for (let i = 0; i < numWorkers; i++) {
    const wid = randomUUID()
    const jobType = pick(...JOB_TYPES)
    const dailyRate = jobType === 'engineer' ? randomBetween(400, 600) 
      : jobType === 'supervisor' ? randomBetween(300, 500)
      : jobType === 'laborer' ? randomBetween(100, 200)
      : randomBetween(150, 350)

    const { error } = await supabase.from('con_workers').insert({
      id: wid,
      company_id: companyId,
      name: AR_WORKER_NAMES[i],
      phone: `+9665${String(randomBetween(50000000, 59999999))}`,
      job_type: jobType,
      daily_rate: dailyRate,
      status: pick('available', 'busy', 'busy', 'available'),
      notes: null,
      is_active: true
    })
    if (error) { console.error(`Error creating worker ${i}:`, error) }
    else { workerIds.push(wid); console.log(`  ✅ Worker ${i + 1}: ${AR_WORKER_NAMES[i]} (${jobType})`) }
  }
  console.log(`  📊 Created ${workerIds.length} workers`)
  console.log('')

  // ─── 3. TASKS ───────────────────────────────────────────
  console.log('📋 Creating tasks...')
  const taskTitles = [
    'صب الخرسانة', 'تركيب حديد التسليح', 'أعمال السباكة', 'أعمال الكهرباء',
    'تركيب البلاط', 'دهان الجدران', 'تركيب الجبس بورد', 'عزل الأسطح',
    'أعمال النجارة', 'تركيب الألمنيوم', 'أعمال التكسير', 'تركيب السيراميك',
    'أعمال التلييس', 'تركيب الزجاج', 'أعمال الحفر', 'أعمال القرميد',
    'تركيب المطابخ', 'أعمال النظافة', 'تركيب الإنارة', 'أعمال الدهانات الخارجية'
  ]
  const taskStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked']

  const taskIds = []
  for (const pid of projectIds) {
    const numTasks = randomBetween(2, 5)
    for (let t = 0; t < numTasks; t++) {
      const tid = randomUUID()
      const assignedWorker = Math.random() > 0.3 ? pick(...workerIds) : null
      const status = pick(...taskStatuses)
      const progress = status === 'done' ? 100 : status === 'todo' ? 0 : randomBetween(10, 80)

      const { error } = await supabase.from('con_tasks').insert({
        id: tid,
        company_id: companyId,
        project_id: pid,
        worker_id: assignedWorker,
        title: pick(...taskTitles),
        description: `مهمة ${pick(...taskTitles)} للمشروع`,
        status,
        priority: pick('low', 'medium', 'high', 'urgent'),
        progress,
        start_date: randomDate(new Date(2024, 0, 1), new Date(2025, 5, 1)),
        due_date: randomDate(new Date(2024, 6, 1), new Date(2025, 11, 1)),
        completed_at: status === 'done' ? new Date().toISOString() : null
      })
      if (error) { console.error('Error creating task:', error) }
      else { taskIds.push(tid) }
    }
  }
  console.log(`  📊 Created ${taskIds.length} tasks`)
  console.log('')

  // ─── 4. EXPENSES ────────────────────────────────────────
  console.log('💰 Creating expenses...')
  let expenseCount = 0
  for (const pid of projectIds) {
    const numExpenses = randomBetween(3, 8)
    for (let e = 0; e < numExpenses; e++) {
      const eid = randomUUID()
      const amount = randomFloat(500, 50000)
      const category = pick(...EXPENSE_CATEGORIES)

      const { error } = await supabase.from('con_expenses').insert({
        id: eid,
        company_id: companyId,
        project_id: pid,
        category,
        description: pick(...EXPENSE_DESCRIPTIONS),
        amount,
        expense_date: randomDate(new Date(2024, 0, 1), new Date(2025, 5, 1)),
        supplier: pick('مؤسسة مواد البناء', 'شركة المعدات', 'مخازن العمران', 'شركة النقل السريع', null, null),
        payment_method: pick('cash', 'bank_transfer', 'check', 'credit'),
        notes: null,
        created_by: user.id
      })
      if (!error) expenseCount++
    }
  }
  console.log(`  📊 Created ${expenseCount} expenses`)
  console.log('')

  // ─── 5. MATERIALS ───────────────────────────────────────
  console.log('🧱 Creating materials...')
  let materialCount = 0
  for (const pid of projectIds) {
    const numMaterials = randomBetween(3, 6)
    for (let m = 0; m < numMaterials; m++) {
      const mid = randomUUID()
      const quantity = randomFloat(10, 500, 3)
      const unitPrice = randomFloat(5, 200)

      const { error } = await supabase.from('con_materials').insert({
        id: mid,
        company_id: companyId,
        project_id: pid,
        name: pick(...MATERIAL_NAMES),
        supplier: pick('شركة مواد البناء', 'مؤسسة الإمداد', 'مخازن العمران', null),
        unit: pick(...MATERIAL_UNITS),
        quantity,
        unit_price: unitPrice,
        total_cost: parseFloat((quantity * unitPrice).toFixed(2)),
        purchase_date: randomDate(new Date(2024, 0, 1), new Date(2025, 5, 1)),
        notes: null
      })
      if (!error) materialCount++
    }
  }
  console.log(`  📊 Created ${materialCount} materials`)
  console.log('')

  // ─── 6. PAYMENTS ────────────────────────────────────────
  console.log('💵 Creating payments...')
  let paymentCount = 0
  for (const pid of projectIds) {
    const numPayments = randomBetween(2, 5)
    for (let p = 0; p < numPayments; p++) {
      const payid = randomUUID()
      const type = pick('incoming', 'incoming', 'incoming', 'outgoing')
      const amount = type === 'incoming' ? randomFloat(10000, 200000) : randomFloat(1000, 30000)

      const { error } = await supabase.from('con_payments').insert({
        id: payid,
        company_id: companyId,
        project_id: pid,
        type,
        amount,
        description: pick(...PAYMENT_DESCRIPTIONS),
        payment_method: pick('cash', 'bank_transfer', 'check', 'transfer'),
        payment_date: randomDate(new Date(2024, 0, 1), new Date(2025, 5, 1)),
        reference: `PMT-${String(Date.now()).slice(-6)}`,
        notes: null
      })
      if (!error) paymentCount++
    }
  }
  console.log(`  📊 Created ${paymentCount} payments`)
  console.log('')

  // ─── 7. FILES ───────────────────────────────────────────
  console.log('📎 Creating files...')
  let fileCount = 0
  for (const pid of projectIds.slice(0, 4)) {
    for (let f = 0; f < randomBetween(1, 3); f++) {
      const fid = randomUUID()
      const { error } = await supabase.from('con_files').insert({
        id: fid,
        company_id: companyId,
        project_id: pid,
        name: pick(...FILE_NAMES),
        url: `https://storage.example.com/construction/${pid}/${fid}`,
        type: pick(...FILE_TYPES),
        size: randomBetween(100000, 5000000),
        uploaded_by: user.id
      })
      if (!error) fileCount++
    }
  }
  console.log(`  📊 Created ${fileCount} files`)
  console.log('')
  console.log('')
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   ✅  SEEDING COMPLETE!                                ║')
  console.log('╠══════════════════════════════════════════════════════════╣')
  console.log(`║  Company:  شركة البناء الحديث للمقاولات                  ║`)
  console.log(`║  Projects: ${projectIds.length} created                           ║`)
  console.log(`║  Workers:  ${workerIds.length} created                            ║`)
  console.log(`║  Tasks:    ${taskIds.length} created                            ║`)
  console.log(`║  Expenses: ${expenseCount} created                            ║`)
  console.log(`║  Materials:${materialCount} created                            ║`)
  console.log(`║  Payments: ${paymentCount} created                            ║`)
  console.log(`║  Files:    ${fileCount} created                             ║`)
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('📧 Login with:')
  console.log(`   Email:    ${USER_EMAIL}`)
  console.log(`   Password: ${USER_PASSWORD}`)
}

main().catch(console.error)
