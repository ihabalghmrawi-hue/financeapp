'use client'

import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Building2, Printer, FileText } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

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

const STATUS_AR: Record<string, string> = {
  planning: 'تخطيط',
  active: 'نشط',
  on_hold: 'موقوف',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}

export function ConstructionReportsClient({ currency }: { currency: string }) {
  const [days, setDays] = useState(365)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/construction/reports?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [days])

  const fmt = (n: number) => formatCurrency(n, currency)

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-center text-muted-foreground">فشل تحميل التقارير</div>
  }

  const { summary, projectSummary, expensesByCategory, workers } = data

  const catData = Object.entries(expensesByCategory as Record<string, number>).map(([key, value]) => ({
    name: CATEGORY_AR[key] || key,
    value,
  }))

  const projectChartData = (projectSummary as any[]).slice(0, 8).map((p: any) => ({
    name: (p.name || 'مشروع بدون اسم').slice(0, 12),
    income: p.income,
    costs: p.costs,
    profit: p.profit,
  }))

  const statusColors: Record<string, string> = {
    planning: '#3b82f6',
    active: '#10b981',
    on_hold: '#f59e0b',
    completed: '#6b7280',
    cancelled: '#ef4444',
  }

  const statusCounts = (summary.statusCounts as Record<string, number>) || {}
  const statusDistData = Object.entries(statusCounts)
    .filter(([, count]) => (count as number) > 0)
    .map(([key, count]) => ({
      name: STATUS_AR[key] || key,
      value: count as number,
    }))

  return (
    <div className="p-6 space-y-6" ref={reportRef}>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-report,
          #print-report * {
            visibility: visible;
          }
          #print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

      <div className="flex items-center justify-between no-print">
        <h1 className="text-xl font-bold">تقارير البناء والتشطيبات</h1>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value={7}>آخر 7 أيام</option>
            <option value={30}>آخر 30 يوم</option>
            <option value={90}>آخر 3 أشهر</option>
            <option value={180}>آخر 6 أشهر</option>
            <option value={365}>آخر سنة</option>
          </select>
          <button
            onClick={handlePrint}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            طباعة التقرير
          </button>
        </div>
      </div>

      <div id="print-report">
        {/* Print Header */}
        <div className="print-only text-center mb-6">
          <h1 className="text-2xl font-bold">تقرير مشاريع البناء والتشطيبات</h1>
          <p className="text-muted-foreground">تقرير شامل للمشاريع والمصروفات والعمال</p>
          <hr className="my-3" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">إجمالي الإيرادات</span>
            </div>
            <p className="text-xl font-bold text-green-800 dark:text-green-300">{fmt(summary.totalIncoming)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs">إجمالي التكاليف</span>
            </div>
            <p className="text-xl font-bold text-red-800 dark:text-red-300">
              {fmt(summary.totalExpenses + summary.totalMaterials + summary.totalOutgoing)}
            </p>
          </div>
          <div
            className={`border rounded-xl p-4 ${
              summary.netProfit >= 0
                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
            }`}
          >
            <div
              className={`flex items-center gap-2 mb-1 ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">صافي الربح</span>
            </div>
            <p
              className={`text-xl font-bold ${
                summary.netProfit >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-orange-800 dark:text-orange-300'
              }`}
            >
              {fmt(summary.netProfit)}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-xs">المشاريع</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-xl font-bold text-purple-800 dark:text-purple-300">{summary.totalProjects}</p>
              <p className="text-xs text-muted-foreground mb-0.5">({summary.statusCounts.active} نشط)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {statusDistData.length > 0 && (
            <div className="bg-card border rounded-xl p-4">
              <h2 className="font-semibold text-sm mb-4">حالة المشاريع</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusDistData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusDistData.map((entry, i) => {
                      const statusKey = Object.keys(statusCounts).find((k) => STATUS_AR[k] === entry.name) || 'planning'
                      return <Cell key={i} fill={statusColors[statusKey] || COLORS[i % COLORS.length]} />
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {Object.entries(statusCounts)
                  .filter(([, c]) => (c as number) > 0)
                  .map(([key, count]) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: statusColors[key] || '#999' }}
                      />
                      <span>
                        {STATUS_AR[key] || key}: <strong>{count as number}</strong>
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {projectChartData.length > 0 && (
            <div className="bg-card border rounded-xl p-4">
              <h2 className="font-semibold text-sm mb-4">ربح المشاريع</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={projectChartData} margin={{ top: 0, right: 0, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="income" name="الإيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costs" name="التكاليف" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="الربح" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {catData.length > 0 && (
          <div className="bg-card border rounded-xl p-4">
            <h2 className="font-semibold text-sm mb-4">المصروفات حسب الفئة</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {catData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Project Summary Table */}
        <div className="bg-card border rounded-xl overflow-x-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-sm">ملخص المشاريع</h2>
            <span className="text-xs text-muted-foreground">{projectSummary.length} مشروع</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المشروع</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">الإيرادات</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">التكاليف</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">الربح</th>
              </tr>
            </thead>
            <tbody>
              {(projectSummary as any[]).map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : p.status === 'completed'
                            ? 'bg-gray-100 text-gray-600'
                            : p.status === 'on_hold'
                              ? 'bg-yellow-100 text-yellow-700'
                              : p.status === 'cancelled'
                                ? 'bg-red-100 text-red-500'
                                : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {STATUS_AR[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-left text-green-600 font-medium">{fmt(p.income)}</td>
                  <td className="px-4 py-3 text-left text-red-500 font-medium">{fmt(p.costs)}</td>
                  <td
                    className={`px-4 py-3 text-left font-bold ${p.profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}
                  >
                    {fmt(p.profit)}
                  </td>
                </tr>
              ))}
              {projectSummary.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    لا توجد بيانات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {workers.length > 0 && (
          <div className="bg-card border rounded-xl p-4">
            <h2 className="font-semibold text-sm mb-3">العمال</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {(workers as any[]).map((w: any) => (
                <div key={w.id} className="border rounded-xl p-3 text-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold mx-auto mb-2">
                    {(w.name || 'عامل')[0]}
                  </div>
                  <p className="text-sm font-medium">{w.name || 'عامل'}</p>
                  <p className="text-xs text-muted-foreground">{w.job_type}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      w.status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : w.status === 'busy'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {w.status === 'available' ? 'متاح' : w.status === 'busy' ? 'مشغول' : 'غير نشط'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Footer */}
        <div className="print-only text-center mt-8 text-xs text-muted-foreground">
          <hr className="mb-2" />
          <p>تم إنشاء هذا التقرير في {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>
    </div>
  )
}
