import Link from 'next/link'
import {
  Building2,
  HardHat,
  CheckSquare,
  DollarSign,
  PackageOpen,
  CreditCard,
  BarChart3,
  Users,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  CircleDot,
  Sparkles,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { InsightsWidget } from '@/components/insights-widget'

interface ProjectRow {
  id: string
  name: string
  status: string
  progress_pct: number | null
  client_name: string | null
  engineer_name: string | null
  contract_value: number | string | null
  actual_cost: number | string | null
  start_date: string | null
  end_date: string | null
}

interface TaskRow {
  id: string
  title: string
  status: string
  project_id: string | null
  con_workers?: { name: string; job_type: string } | null
}

interface ConstructionDashboardProps {
  greeting: string
  staffName: string
  currency: string
  projects: ProjectRow[]
  tasks: TaskRow[]
  workersTotal: number
  workersBusy: number
  customersCount: number
  aiInsights: any[]
}

const STATUS_AR: Record<string, string> = {
  planning: 'تخطيط',
  active: 'نشط',
  on_hold: 'موقوف',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
}

// Generic construction stages used as a default progress map when a project
// doesn't carry an explicit stage. Index = stage rank.
const STAGES = [
  { key: 'foundation', label: 'الأساسات والقواعد', min: 0 },
  { key: 'structure', label: 'الهيكل والبناء', min: 15 },
  { key: 'plaster', label: 'المحارة', min: 40 },
  { key: 'mep', label: 'الكهرباء والسباكة', min: 55 },
  { key: 'flooring', label: 'الأرضيات والسيراميك', min: 70 },
  { key: 'finishing', label: 'التشطيبات النهائية', min: 85 },
  { key: 'handover', label: 'التسليم', min: 100 },
]

function currentStage(pct: number) {
  // The active stage is the latest one whose `min` is ≤ the project progress.
  let current = STAGES[0]
  for (const s of STAGES) {
    if (pct >= s.min) {
      current = s
    }
  }
  return current
}

const QUICK_ACTIONS: { label: string; href: string; icon: any; color: string }[] = [
  { label: 'المشاريع', href: '/dashboard/construction/projects', icon: Building2, color: 'blue' },
  { label: 'العمال', href: '/dashboard/construction/workers', icon: Users, color: 'amber' },
  { label: 'المهام', href: '/dashboard/construction/tasks', icon: CheckSquare, color: 'green' },
  { label: 'المصروفات', href: '/dashboard/construction/expenses', icon: DollarSign, color: 'red' },
  { label: 'المواد', href: '/dashboard/construction/materials', icon: PackageOpen, color: 'purple' },
  { label: 'المدفوعات', href: '/dashboard/construction/payments', icon: CreditCard, color: 'emerald' },
  { label: 'التقارير', href: '/dashboard/construction/reports', icon: BarChart3, color: 'sky' },
  { label: 'العملاء', href: '/dashboard/customers', icon: Users, color: 'pink' },
]

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600 dark:text-amber-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600 dark:text-green-400' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600 dark:text-red-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', icon: 'text-sky-600 dark:text-sky-400' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', icon: 'text-pink-600 dark:text-pink-400' },
}

export function ConstructionDashboard({
  greeting,
  staffName,
  currency,
  projects,
  tasks,
  workersTotal,
  workersBusy,
  customersCount,
  aiInsights,
}: ConstructionDashboardProps) {
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'planning')
  const completedProjects = projects.filter((p) => p.status === 'completed')
  const overallProgress =
    activeProjects.length > 0
      ? Math.round(activeProjects.reduce((s, p) => s + Number(p.progress_pct || 0), 0) / activeProjects.length)
      : 0

  const tasksByProject = new Map<string, TaskRow[]>()
  for (const t of tasks) {
    if (!t.project_id) {
      continue
    }
    const arr = tasksByProject.get(t.project_id) || []
    arr.push(t)
    tasksByProject.set(t.project_id, arr)
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Greeting */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            {greeting}، {staffName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">إدارة شركة التشطيبات والبناء</p>
        </div>
        <Link
          href="/dashboard/construction/projects"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 sm:px-4 h-10 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">مشروع جديد</span>
        </Link>
      </div>

      {/* Light summary KPIs (no daily/monthly sales) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryTile
          label="المشاريع النشطة"
          value={activeProjects.length}
          sub={`${completedProjects.length} مكتمل`}
          icon={Building2}
          color="blue"
          href="/dashboard/construction/projects"
        />
        <SummaryTile
          label="عدد العملاء"
          value={customersCount}
          sub="إجمالي العملاء"
          icon={Users}
          color="pink"
          href="/dashboard/customers"
        />
        <SummaryTile
          label="العمال"
          value={workersTotal}
          sub={`${workersBusy} مشغولون`}
          icon={HardHat}
          color="amber"
          href="/dashboard/construction/workers"
        />
        <SummaryTile
          label="نسبة الإنجاز الإجمالية"
          value={`${overallProgress}%`}
          sub={`من ${activeProjects.length} مشروع نشط`}
          icon={BarChart3}
          color="green"
          href="/dashboard/construction/reports"
          isText
        />
      </div>

      {/* Quick actions grid */}
      <section>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">الوصول السريع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map((a) => {
            const c = COLOR_MAP[a.color] || COLOR_MAP.blue
            const Icon = a.icon
            return (
              <Link
                key={a.href}
                href={a.href}
                className="group bg-card border rounded-xl p-3 sm:p-4 hover:shadow-md hover:border-primary/40 transition-all flex flex-col items-start gap-2 min-h-[88px]"
              >
                <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center ${c.icon}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {a.label}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Projects + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              المشاريع الحالية ({activeProjects.length})
            </h2>
            <Link
              href="/dashboard/construction/projects"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد مشاريع نشطة</p>
              <Link
                href="/dashboard/construction/projects"
                className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline"
              >
                <Plus className="w-3 h-3" /> إضافة أول مشروع
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {activeProjects.slice(0, 8).map((p) => {
                const pct = Number(p.progress_pct || 0)
                const stage = currentStage(pct)
                const contract = Number(p.contract_value || 0)
                const spent = Number(p.actual_cost || 0)
                const remaining = Math.max(0, contract - spent)
                const projectTasks = tasksByProject.get(p.id) || []
                const inProgressTask = projectTasks.find((t) => t.status === 'in_progress')
                return (
                  <li key={p.id} className="px-4 sm:px-5 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/dashboard/construction/projects/${p.id}`}
                            className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
                          >
                            {p.name}
                          </Link>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                            {STATUS_AR[p.status] || p.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                          {p.client_name && <span>العميل: {p.client_name}</span>}
                          {p.engineer_name && <span>المهندس: {p.engineer_name}</span>}
                        </div>

                        {/* Stage + progress bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <CircleDot className="w-3 h-3 text-primary" />
                              {stage.label}
                            </span>
                            <span className="font-semibold text-foreground">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-l from-primary to-primary/70 transition-all"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>

                        {/* Financial mini summary + active task */}
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                          <FinancialCell label="التعاقد" value={formatCurrency(contract, currency)} />
                          <FinancialCell label="المنصرف" value={formatCurrency(spent, currency)} tone="warning" />
                          <FinancialCell label="المتبقي" value={formatCurrency(remaining, currency)} tone="success" />
                        </div>

                        {inProgressTask && (
                          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="font-medium text-foreground">{inProgressTask.title}</span>
                            {inProgressTask.con_workers?.name && <span>· {inProgressTask.con_workers.name}</span>}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/dashboard/construction/projects/${p.id}`}
                        className="shrink-0 self-start inline-flex items-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/15 px-3 h-9 rounded-lg font-medium transition-colors"
                      >
                        فتح
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Insights side column */}
        <div className="space-y-4">
          <InsightsWidget initialInsights={(aiInsights as any) || []} compact />

          {/* Overdue / urgent strip */}
          <UpcomingDeadlines projects={activeProjects} />
        </div>
      </div>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  sub,
  icon: Icon,
  href,
  color,
  isText,
}: {
  label: string
  value: string | number
  sub: string
  icon: any
  href: string
  color: string
  isText?: boolean
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue
  return (
    <Link
      href={href}
      className="bg-card border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all relative overflow-hidden block"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center ${c.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={`font-bold text-foreground ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
    </Link>
  )
}

function FinancialCell({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warning' }) {
  const toneClass =
    tone === 'warning'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'success'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-foreground'
  return (
    <div className="bg-secondary/40 rounded-lg px-2 py-1.5 min-w-0">
      <p className="text-muted-foreground truncate">{label}</p>
      <p className={`font-semibold truncate ${toneClass}`}>{value}</p>
    </div>
  )
}

function UpcomingDeadlines({ projects }: { projects: ProjectRow[] }) {
  const now = Date.now()
  const upcoming = projects
    .filter((p) => p.end_date)
    .map((p) => ({ ...p, ends_in: (new Date(p.end_date as string).getTime() - now) / 86400000 }))
    .filter((p) => p.ends_in <= 30)
    .sort((a, b) => a.ends_in - b.ends_in)
    .slice(0, 4)

  if (upcoming.length === 0) {
    return null
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold">مواعيد قريبة</h3>
      </div>
      <ul className="divide-y divide-border/50">
        {upcoming.map((p) => {
          const days = Math.round(p.ends_in)
          const overdue = days < 0
          return (
            <li key={p.id}>
              <Link
                href={`/dashboard/construction/projects/${p.id}`}
                className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs hover:bg-secondary/30 transition-colors"
              >
                <span className="truncate">{p.name}</span>
                <span
                  className={`shrink-0 font-medium ${
                    overdue ? 'text-red-500' : days <= 7 ? 'text-amber-600' : 'text-muted-foreground'
                  }`}
                >
                  {overdue ? `متأخر ${Math.abs(days)}ي` : `بعد ${days}ي`}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
