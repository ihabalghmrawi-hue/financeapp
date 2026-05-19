'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  AlertTriangle,
  Plus,
  Trash2,
  CheckSquare,
  DollarSign,
  Package,
  CreditCard,
  Flag,
  Clock,
  Users,
  FileText,
  Printer,
  BarChart3,
  ExternalLink,
  Upload,
} from 'lucide-react'
import { RadialProgress } from '@/components/charts/radial-progress'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  client_name: string | null
  client_phone: string | null
  location: string | null
  expected_cost: number
  actual_cost: number
  contract_value: number
  stage: string
  start_date: string
  end_date: string | null
  notes: string | null
}
interface Task {
  id: string
  title: string
  status: string
  priority: string
  progress: number
  due_date: string | null
  assigned_worker_id: string | null
  con_workers?: { name: string; job_type?: string } | null
}
interface Expense {
  id: string
  category: string
  amount: number
  description: string
  vendor: string | null
  expense_date: string
}
interface Material {
  id: string
  name: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  supplier: string | null
  purchase_date: string
}
interface Payment {
  id: string
  type: string
  amount: number
  description: string
  payment_method: string
  payment_date: string
  reference: string | null
}
interface Worker {
  id: string
  name: string
}
interface ConFile {
  id: string
  name: string
  url: string
  type: string
  size_bytes: number
  notes: string | null
  created_at: string
}

const STATUS_AR: Record<string, string> = {
  planning: 'تخطيط',
  active: 'نشط',
  on_hold: 'موقوف',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}
const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-500',
}
const TASK_STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  todo: 'للتنفيذ',
  in_progress: 'قيد التنفيذ',
  review: 'مراجعة',
  done: 'مكتمل',
  blocked: 'موقوف',
  cancelled: 'ملغي',
}
const TASK_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  review: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-500',
  cancelled: 'bg-gray-100 text-gray-400',
}
const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
}
const METHOD_AR: Record<string, string> = {
  cash: 'نقدي',
  bank_transfer: 'تحويل بنكي',
  check: 'شيك',
  online: 'إلكتروني',
}
const STAGE_AR: Record<string, string> = {
  foundation: 'الأساسات',
  structure: 'الهيكل',
  rough_plumbing: 'السباكة الأولية',
  rough_electrical: 'الكهرباء الأولية',
  plastering: 'المحارة واللياسة',
  tiling: 'البلاط والسيراميك',
  carpentry: 'النجارة',
  painting: 'الدهان',
  finishing: 'التشطيب النهائي',
  handover: 'التسليم',
}
const STAGE_ORDER = [
  'foundation',
  'structure',
  'rough_plumbing',
  'rough_electrical',
  'plastering',
  'tiling',
  'carpentry',
  'painting',
  'finishing',
  'handover',
]
const STAGE_INDEX: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s, i) => [s, i]))
const CATEGORY_AR: Record<string, string> = {
  excavation: 'حفر',
  foundation: 'أساسات',
  structure: 'هيكل خرساني',
  plumbing: 'سباكة',
  electrical: 'كهرباء',
  plastering: 'محارة',
  tiling: 'بلاط',
  carpentry: 'نجارة',
  painting: 'دهان',
  finishing: 'تشطيب',
  roofing: 'تسقيف',
  glass: 'زجاج',
  aluminum: 'ألمنيوم',
  flooring: 'أرضيات',
  demolition: 'هدم',
  materials: 'مواد بناء',
  labor: 'عمالة',
  equipment: 'معدات',
  transport: 'نقل',
  subcontract: 'مقاول باطن',
  other: 'أخرى',
}

const PROGRESS_MILESTONES = [0, 25, 50, 75, 100]

type Tab = 'overview' | 'tasks' | 'expenses' | 'materials' | 'payments' | 'files' | 'contract'

export function ProjectDetailClient({
  project,
  tasks: initTasks,
  expenses: initExpenses,
  materials: initMaterials,
  payments: initPayments,
  workers,
  files: initFiles,
  currency,
}: {
  project: Project
  tasks: Task[]
  expenses: Expense[]
  materials: Material[]
  payments: Payment[]
  workers: Worker[]
  files: ConFile[]
  currency: string
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [tasks, setTasks] = useState(initTasks)
  const [expenses, setExpenses] = useState(initExpenses)
  const [materials, setMaterials] = useState(initMaterials)
  const [payments, setPayments] = useState(initPayments)
  const [files, setFiles] = useState(initFiles)

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showExpForm, setShowExpForm] = useState(false)
  const [showMatForm, setShowMatForm] = useState(false)
  const [showPayForm, setShowPayForm] = useState(false)
  const [showFileForm, setShowFileForm] = useState(false)

  const [taskForm, setTaskForm] = useState({
    title: '',
    priority: 'medium',
    status: 'pending',
    progress: 0,
    worker_id: '',
    due_date: '',
  })
  const [expForm, setExpForm] = useState({
    category: 'labor',
    amount: '',
    description: '',
    vendor: '',
    expense_date: new Date().toISOString().slice(0, 10),
  })
  const [matForm, setMatForm] = useState({
    name: '',
    supplier: '',
    unit: 'unit',
    quantity: '',
    unit_price: '',
    purchase_date: new Date().toISOString().slice(0, 10),
  })
  const [payForm, setPayForm] = useState({
    type: 'incoming',
    amount: '',
    description: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().slice(0, 10),
    reference: '',
  })
  const [fileForm, setFileForm] = useState({
    type: 'document',
    notes: '',
  })
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [fileUploadProgress, setFileUploadProgress] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fmt = (n: number) => formatCurrency(n, currency)

  const totalIncome = payments.filter((p) => p.type === 'incoming').reduce((s, p) => s + Number(p.amount), 0)
  const totalExpenseAmt = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalMaterialAmt = materials.reduce(
    (s, m) => s + Number(m.total_price || Number(m.quantity) * Number(m.unit_price)),
    0,
  )
  const overrun = Number(project.actual_cost) > Number(project.expected_cost)
  const pct =
    Number(project.expected_cost) > 0
      ? Math.min(100, Math.round((Number(project.actual_cost) / Number(project.expected_cost)) * 100))
      : 0

  const contractValue = Number(project.contract_value) || 0
  const totalReceived = payments.filter((p) => p.type === 'incoming').reduce((s, p) => s + Number(p.amount), 0)
  const totalSpent =
    expenses.reduce((s, e) => s + Number(e.amount), 0) +
    materials.reduce((s, m) => s + Number(m.total_price || Number(m.quantity) * Number(m.unit_price)), 0)
  const refundedAmount = Number((project as any).refunded_amount) || 0
  const remainingBalance = contractValue - totalReceived + refundedAmount

  const currentStageIndex = STAGE_INDEX[(project as any).stage] ?? 0
  const stageProgress = ((currentStageIndex + 1) / STAGE_ORDER.length) * 100

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of expenses) {
      const cat = e.category || 'other'
      map[cat] = (map[cat] || 0) + Number(e.amount)
    }
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted
  }, [expenses])

  const activeWorkers = useMemo(() => {
    const assigned = new Set<string>()
    for (const t of tasks) {
      if (t.con_workers?.name && (t.status === 'in_progress' || t.status === 'pending' || t.status === 'todo')) {
        assigned.add(t.con_workers.name)
      }
    }
    return Array.from(assigned)
  }, [tasks])

  const taskProgressAvg = useMemo(() => {
    if (tasks.length === 0) {
      return 0
    }
    return Math.round(tasks.reduce((s, t) => s + (Number(t.progress) || 0), 0) / tasks.length)
  }, [tasks])

  const quickProgress = async (taskId: string, progress: number, status?: string) => {
    const body: Record<string, unknown> = { progress }
    if (status) {
      body.status = status
    }
    if (progress >= 100) {
      body.status = 'done'
    }
    const res = await fetch(`/api/construction/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, ...data } : x)))
    }
  }

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/construction/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          project_id: project.id,
          worker_id: taskForm.worker_id || null,
          due_date: taskForm.due_date || null,
          progress: Number(taskForm.progress) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }
      setTasks((prev) => [data, ...prev])
      setShowTaskForm(false)
      setTaskForm({ title: '', priority: 'medium', status: 'pending', progress: 0, worker_id: '', due_date: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/construction/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expForm,
          amount: Number(expForm.amount),
          project_id: project.id,
          vendor: expForm.vendor || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }
      setExpenses((prev) => [data, ...prev])
      setShowExpForm(false)
      setExpForm({
        category: 'عمالة',
        amount: '',
        description: '',
        vendor: '',
        expense_date: new Date().toISOString().slice(0, 10),
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/construction/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...matForm,
          quantity: Number(matForm.quantity),
          unit_price: Number(matForm.unit_price),
          project_id: project.id,
          supplier: matForm.supplier || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }
      setMaterials((prev) => [data, ...prev])
      setShowMatForm(false)
      setMatForm({
        name: '',
        supplier: '',
        unit: 'وحدة',
        quantity: '',
        unit_price: '',
        purchase_date: new Date().toISOString().slice(0, 10),
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const savePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/construction/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payForm,
          amount: Number(payForm.amount),
          project_id: project.id,
          reference: payForm.reference || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }
      setPayments((prev) => [data, ...prev])
      setShowPayForm(false)
      setPayForm({
        type: 'incoming',
        amount: '',
        description: '',
        payment_method: 'cash',
        payment_date: new Date().toISOString().slice(0, 10),
        reference: '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/construction/tasks/${id}`, { method: 'DELETE' })
    setTasks((p) => p.filter((x) => x.id !== id))
  }
  const deleteExpense = async (id: string) => {
    await fetch(`/api/construction/expenses/${id}`, { method: 'DELETE' })
    setExpenses((p) => p.filter((x) => x.id !== id))
  }
  const deleteMat = async (id: string) => {
    await fetch(`/api/construction/materials/${id}`, { method: 'DELETE' })
    setMaterials((p) => p.filter((x) => x.id !== id))
  }
  const deletePay = async (id: string) => {
    await fetch(`/api/construction/payments/${id}`, { method: 'DELETE' })
    setPayments((p) => p.filter((x) => x.id !== id))
  }

  const saveFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileToUpload) {
      setError('يرجى اختيار ملف للرفع')
      return
    }
    setLoading(true)
    setFileUploadProgress(0)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', fileToUpload)
      fd.append('project_id', project.id)
      fd.append('type', fileForm.type)
      if (fileForm.notes) {
        fd.append('notes', fileForm.notes)
      }

      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setFileUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      const data = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              reject(new Error(JSON.parse(xhr.responseText).error))
            } catch {
              reject(new Error('فشل رفع الملف'))
            }
          }
        }
        xhr.onerror = () => reject(new Error('فشل الاتصال'))
        xhr.open('POST', '/api/construction/files/upload')
        xhr.send(fd)
      })

      setFiles((prev) => [data, ...prev])
      setShowFileForm(false)
      setFileForm({ type: 'document', notes: '' })
      setFileToUpload(null)
      setFileUploadProgress(0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (id: string) => {
    await fetch(`/api/construction/files/${id}`, { method: 'DELETE' })
    setFiles((p) => p.filter((x) => x.id !== id))
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'نظرة عامة' },
    { key: 'tasks', label: 'المهام', count: tasks.length },
    { key: 'expenses', label: 'المصروفات', count: expenses.length },
    { key: 'materials', label: 'المواد', count: materials.length },
    { key: 'payments', label: 'التدفقات', count: payments.length },
    { key: 'files', label: 'الملفات', count: files.length },
    { key: 'contract', label: 'العقد والماليات' },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/dashboard/construction/projects"
          className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{project.name}</h1>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-600'}`}
            >
              {STATUS_AR[project.status] || project.status}
            </span>
            {overrun && (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                تجاوز الميزانية
              </span>
            )}
          </div>
          {project.client_name && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {project.client_name}
              {project.location ? ` — ${project.location}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Budget Bar */}
      <div className="bg-card border rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">الميزانية المستهلكة ({pct}%)</span>
          <span className={overrun ? 'text-red-500 font-medium' : 'text-foreground'}>
            {fmt(Number(project.actual_cost))} / {fmt(Number(project.expected_cost))}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${overrun ? 'bg-red-500' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 pt-1 text-center">
          <div>
            <p className="text-xs text-muted-foreground">الإيرادات</p>
            <p className="font-semibold text-green-600">{fmt(totalIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">التكاليف</p>
            <p className="font-semibold text-red-500">{fmt(totalExpenseAmt + totalMaterialAmt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">الربح</p>
            <p
              className={`font-semibold ${totalIncome - totalExpenseAmt - totalMaterialAmt >= 0 ? 'text-blue-600' : 'text-orange-500'}`}
            >
              {fmt(totalIncome - totalExpenseAmt - totalMaterialAmt)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="mr-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Info + Stage Progress Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-xl p-4 space-y-3">
              {[
                ['تاريخ البداية', project.start_date],
                ['تاريخ النهاية', project.end_date || '—'],
                ['العميل', project.client_name || '—'],
                ['الهاتف', project.client_phone || '—'],
                ['الموقع', project.location || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>

            {/* Stage Progress */}
            <div className="bg-card border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-3">مرحلة المشروع</p>
              <div className="flex items-center gap-4">
                <RadialProgress
                  value={currentStageIndex + 1}
                  max={STAGE_ORDER.length}
                  size={90}
                  strokeWidth={6}
                  label={STAGE_AR[(project as any).stage] || '—'}
                  subtitle={`المرحلة ${currentStageIndex + 1} من ${STAGE_ORDER.length}`}
                />
              </div>
              <div className="mt-3 space-y-1">
                {STAGE_ORDER.slice(0, 5).map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${i <= currentStageIndex ? 'bg-primary' : 'bg-muted'}`} />
                    <span className={i <= currentStageIndex ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {STAGE_AR[s]}
                    </span>
                  </div>
                ))}
                {STAGE_ORDER.length > 5 && (
                  <details className="text-xs">
                    <summary className="text-primary cursor-pointer mt-1">عرض الكل</summary>
                    {STAGE_ORDER.slice(5).map((s, i) => (
                      <div key={s} className="flex items-center gap-2 text-xs mt-1">
                        <div
                          className={`w-2 h-2 rounded-full ${i + 5 <= currentStageIndex ? 'bg-primary' : 'bg-muted'}`}
                        />
                        <span
                          className={
                            i + 5 <= currentStageIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }
                        >
                          {STAGE_AR[s]}
                        </span>
                      </div>
                    ))}
                  </details>
                )}
              </div>
            </div>

            {/* Active Workers */}
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">العمال المسند إليهم مهام</p>
              </div>
              {activeWorkers.length > 0 ? (
                <div className="space-y-2">
                  {activeWorkers.map((name) => (
                    <div key={name} className="flex items-center gap-2 bg-accent/50 rounded-lg px-3 py-2">
                      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                        {name[0]}
                      </div>
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">لا يوجد عمال نشطون</p>
              )}
            </div>
          </div>

          {project.description && (
            <div className="bg-card border rounded-xl p-4">
              <p className="text-muted-foreground text-xs mb-1">الوصف</p>
              <p className="text-sm">{project.description}</p>
            </div>
          )}

          {/* Task Progress */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">تقدم المهام</p>
              <p className="text-sm font-bold">{taskProgressAvg}%</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${taskProgressAvg}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{tasks.filter((t) => t.status === 'done').length} مكتملة</span>
              <span>{tasks.length} مهمة</span>
            </div>
          </div>

          {/* Expenses by Category */}
          {expensesByCategory.length > 0 && (
            <div className="bg-card border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-3">المصروفات حسب النوع</p>
              <div className="space-y-2">
                {expensesByCategory.slice(0, 8).map(([cat, amount]) => {
                  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
                  const pct = total > 0 ? Math.round((amount / total) * 100) : 0
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span>{CATEGORY_AR[cat] || cat}</span>
                        <span className="font-medium">
                          {fmt(amount)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="text-left text-sm font-bold mt-2 pt-2 border-t">
                الإجمالي: {fmt(expenses.reduce((s, e) => s + Number(e.amount), 0))}
              </div>
            </div>
          )}

          {project.notes && (
            <div className="bg-card border rounded-xl p-4">
              <p className="text-muted-foreground text-xs mb-1">ملاحظات</p>
              <p className="text-sm">{project.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowTaskForm(true)}
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> مهمة جديدة
            </button>
          </div>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="bg-card border rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <Flag className={`w-4 h-4 shrink-0 ${PRIORITY_COLORS[t.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${TASK_STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {TASK_STATUS_AR[t.status] || t.status}
                      </span>
                      {t.con_workers && <span className="text-xs text-muted-foreground">👤 {t.con_workers.name}</span>}
                      {t.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${(t.progress || 0) >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${t.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-8 text-left">{t.progress || 0}%</span>
                </div>
                {/* Quick Progress Buttons */}
                <div className="flex gap-1">
                  {PROGRESS_MILESTONES.filter(
                    (m) => m > (t.progress || 0) || (m === 0 && t.progress === undefined),
                  ).map((m) => (
                    <button
                      key={m}
                      onClick={() => quickProgress(t.id, m, m >= 100 ? 'done' : m > 0 ? 'in_progress' : 'pending')}
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                        (t.progress || 0) >= m
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {m === 0 ? 'بدء' : m === 100 ? 'إتمام' : `${m}%`}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد مهام</p>}
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowExpForm(true)}
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> مصروف جديد
            </button>
          </div>
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">التاريخ</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">الوصف</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">الفئة</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">المبلغ</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{e.expense_date}</td>
                    <td className="px-4 py-2.5">{e.description}</td>
                    <td className="px-4 py-2.5">
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-left">{fmt(Number(e.amount))}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteExpense(e.id)}
                        className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      لا توجد مصروفات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {tab === 'materials' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowMatForm(true)}
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة مواد
            </button>
          </div>
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">المادة</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">الكمية</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">سعر الوحدة</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">الإجمالي</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{m.name}</td>
                    <td className="px-4 py-2.5">
                      {Number(m.quantity)} {m.unit}
                    </td>
                    <td className="px-4 py-2.5">{fmt(Number(m.unit_price))}</td>
                    <td className="px-4 py-2.5 font-medium text-left">
                      {fmt(Number(m.total_price || Number(m.quantity) * Number(m.unit_price)))}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteMat(m.id)}
                        className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      لا توجد مواد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowPayForm(true)}
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> دفعة جديدة
            </button>
          </div>
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">التاريخ</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">النوع</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">الوصف</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">الطريقة</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">المبلغ</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{p.payment_date}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs font-medium ${p.type === 'incoming' ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {p.type === 'incoming' ? 'وارد' : 'صادر'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{p.description}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {METHOD_AR[p.payment_method] || p.payment_method}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-bold text-left ${p.type === 'incoming' ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {p.type === 'incoming' ? '+' : '-'}
                      {fmt(Number(p.amount))}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deletePay(p.id)}
                        className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      لا توجد تدفقات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Files Tab */}
      {tab === 'files' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setFileToUpload(null)
                setFileUploadProgress(0)
                setShowFileForm(true)
              }}
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> إضافة ملف
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((f) => (
              <div key={f.id} className="bg-card border rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFile(f.id)}
                    className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  فتح الملف
                </a>
                <p className="text-xs text-muted-foreground">{f.created_at?.slice(0, 10)}</p>
              </div>
            ))}
            {files.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>لا توجد ملفات</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl pb-safe-bottom max-h-[92vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm">مهمة جديدة</h2>
            </div>
            <form onSubmit={saveTask} className="p-4 space-y-3">
              <input
                required
                placeholder="عنوان المهمة *"
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="low">منخفض</option>
                  <option value="medium">متوسط</option>
                  <option value="high">عالي</option>
                  <option value="urgent">عاجل</option>
                </select>
                <select
                  value={taskForm.worker_id}
                  onChange={(e) => setTaskForm((f) => ({ ...f, worker_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— عامل —</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(TASK_STATUS_AR).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <select
                  value={taskForm.progress}
                  onChange={(e) => setTaskForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {PROGRESS_MILESTONES.map((m) => (
                    <option key={m} value={m}>
                      {m === 0 ? '0% - لم يبدأ' : m === 100 ? '100% - مكتمل' : `${m}%`}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? '...' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl pb-safe-bottom max-h-[92vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm">مصروف جديد</h2>
            </div>
            <form onSubmit={saveExpense} className="p-4 space-y-3">
              <input
                required
                placeholder="الوصف *"
                value={expForm.description}
                onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={expForm.category}
                  onChange={(e) => setExpForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="labor">عمالة</option>
                  <option value="materials">مواد بناء</option>
                  <option value="equipment">معدات</option>
                  <option value="transport">نقل</option>
                  <option value="subcontract">مقاول من الباطن</option>
                  <option value="other">أخرى</option>
                </select>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="المبلغ *"
                  value={expForm.amount}
                  onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="المورد / الجهة"
                  value={expForm.vendor}
                  onChange={(e) => setExpForm((f) => ({ ...f, vendor: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="date"
                  value={expForm.expense_date}
                  onChange={(e) => setExpForm((f) => ({ ...f, expense_date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? '...' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpForm(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Form Modal */}
      {showMatForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl pb-safe-bottom max-h-[92vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm">إضافة مواد</h2>
            </div>
            <form onSubmit={saveMaterial} className="p-4 space-y-3">
              <input
                required
                placeholder="اسم المادة *"
                value={matForm.name}
                onChange={(e) => setMatForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="الكمية *"
                  value={matForm.quantity}
                  onChange={(e) => setMatForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={matForm.unit}
                  onChange={(e) => setMatForm((f) => ({ ...f, unit: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="unit">وحدة</option>
                  <option value="m">متر</option>
                  <option value="m2">متر مربع</option>
                  <option value="m3">متر مكعب</option>
                  <option value="kg">كيلو</option>
                  <option value="ton">طن</option>
                  <option value="liter">لتر</option>
                  <option value="box">صندوق</option>
                  <option value="bag">كيس</option>
                  <option value="roll">رول</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="سعر الوحدة *"
                  value={matForm.unit_price}
                  onChange={(e) => setMatForm((f) => ({ ...f, unit_price: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  placeholder="المورد"
                  value={matForm.supplier}
                  onChange={(e) => setMatForm((f) => ({ ...f, supplier: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {matForm.quantity && matForm.unit_price && (
                <p className="text-sm text-primary font-medium">
                  الإجمالي: {fmt(Number(matForm.quantity) * Number(matForm.unit_price))}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? '...' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMatForm(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Tab */}
      {tab === 'contract' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">قيمة العقد</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{fmt(contractValue)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1">المبلغ المستلم</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-300">{fmt(totalReceived)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">المبلغ المنصرف</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-300">{fmt(totalSpent)}</p>
            </div>
            <div
              className={`border rounded-xl p-4 ${remainingBalance >= 0 ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'}`}
            >
              <p
                className={`text-xs mb-1 ${remainingBalance >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'}`}
              >
                الرصيد المتبقي
              </p>
              <p
                className={`text-2xl font-bold ${remainingBalance >= 0 ? 'text-purple-800 dark:text-purple-300' : 'text-orange-800 dark:text-orange-300'}`}
              >
                {fmt(remainingBalance)}
              </p>
            </div>
          </div>

          {/* Budget vs Actual Chart */}
          <div className="bg-card border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">الميزانية مقابل المنصرف</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { name: 'الميزانية', value: Number(project.expected_cost), fill: '#3b82f6' },
                  { name: 'المنصرف', value: Number(project.actual_cost), fill: overrun ? '#ef4444' : '#22c55e' },
                  {
                    name: 'المتبقي',
                    value: Math.max(0, Number(project.expected_cost) - Number(project.actual_cost)),
                    fill: '#a855f7',
                  },
                ]}
                barSize={60}
              >
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                <Tooltip
                  formatter={(value: number) => [fmt(value), '']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {['#3b82f6', overrun ? '#ef4444' : '#22c55e', '#a855f7'].map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Contract Progress Bar */}
          {contractValue > 0 && (
            <div className="bg-card border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">نسبة التحصيل</p>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((totalReceived / contractValue) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{Math.min(100, Math.round((totalReceived / contractValue) * 100))}% محصل</span>
                <span>
                  {fmt(totalReceived)} / {fmt(contractValue)}
                </span>
              </div>
            </div>
          )}

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                التدفقات المستلمة
              </h3>
              <div className="space-y-2">
                {payments
                  .filter((p) => p.type === 'incoming')
                  .map((p) => (
                    <div key={p.id} className="flex justify-between text-sm py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{p.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.payment_date} - {p.reference || ''}
                        </p>
                      </div>
                      <span className="font-bold text-green-600">{fmt(Number(p.amount))}</span>
                    </div>
                  ))}
                {payments.filter((p) => p.type === 'incoming').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد تدفقات مستلمة</p>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t">
                  <span>الإجمالي</span>
                  <span className="text-green-600">{fmt(totalReceived)}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-500" />
                المصروفات
              </h3>
              <div className="space-y-2">
                {expensesByCategory.map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between text-sm py-1.5">
                    <span className="text-muted-foreground">{CATEGORY_AR[cat] || cat}</span>
                    <span className="font-medium">{fmt(amount)}</span>
                  </div>
                ))}
                {expensesByCategory.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد مصروفات</p>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t">
                  <span>إجمالي المصروفات</span>
                  <span className="text-red-500">{fmt(totalSpent)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Refund tracking */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">المبلغ المسترد للعميل</p>
                <p className="text-xl font-bold text-orange-500">{fmt(refundedAmount)}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">صافي العقد</p>
                <p className="text-xl font-bold">{fmt(contractValue - refundedAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Form Modal */}
      {showFileForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl pb-safe-bottom max-h-[92vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm">إضافة ملف</h2>
            </div>
            <form onSubmit={saveFile} className="p-4 space-y-3">
              <input
                required
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-medium hover:file:bg-primary/90 cursor-pointer"
              />
              {fileToUpload && (
                <p className="text-xs text-muted-foreground">
                  {fileToUpload.name} ({(fileToUpload.size / 1024).toFixed(1)} KB)
                </p>
              )}
              {fileUploadProgress > 0 && (
                <div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${fileUploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{fileUploadProgress}%</p>
                </div>
              )}
              <select
                value={fileForm.type}
                onChange={(e) => setFileForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="document">مستند</option>
                <option value="image">صورة</option>
                <option value="drawing">مخطط</option>
                <option value="contract">عقد</option>
                <option value="invoice">فاتورة</option>
                <option value="report">تقرير</option>
                <option value="other">أخرى</option>
              </select>
              <input
                placeholder="ملاحظات"
                value={fileForm.notes}
                onChange={(e) => setFileForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? '...' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFileForm(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPayForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl pb-safe-bottom max-h-[92vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm">دفعة جديدة</h2>
            </div>
            <form onSubmit={savePayment} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={payForm.type}
                  onChange={(e) => setPayForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="incoming">وارد</option>
                  <option value="outgoing">صادر</option>
                </select>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="المبلغ *"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <input
                required
                placeholder="الوصف *"
                value={payForm.description}
                onChange={(e) => setPayForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm((f) => ({ ...f, payment_method: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="cash">نقدي</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="check">شيك</option>
                  <option value="online">إلكتروني</option>
                </select>
                <input
                  type="date"
                  value={payForm.payment_date}
                  onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? '...' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayForm(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
