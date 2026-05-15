export interface DemoDashboardData {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  netProfit: number
  incomeChange: number
  expenseChange: number
  recentSales: Array<{
    invoice_number: string
    total: number
    sale_date: string
    customers: { name: string } | null
    payment_status: string
  }>
  monthlyData: Array<{
    month: string
    income: number
    expenses: number
    profit: number
  }>
  lowStockItems: Array<{ name: string; quantity: number; minLevel: number }>
  topCustomers: Array<{ name: string; total: number }>
  recentActivity: Array<{
    id: string
    title: string
    description: string
    timestamp: string
    type: 'success' | 'info' | 'warning' | 'error'
  }>
}

const arabicMonths = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

export const demoDashboardData: DemoDashboardData = {
  totalBalance: 584_920,
  totalIncome: 187_450,
  totalExpenses: 98_230,
  netProfit: 89_220,
  incomeChange: 12.5,
  expenseChange: -3.2,
  recentSales: [
    {
      invoice_number: 'INV-001',
      total: 15200,
      sale_date: '2026-05-15',
      customers: { name: 'شركة الأفق للتجارة' },
      payment_status: 'completed',
    },
    {
      invoice_number: 'INV-002',
      total: 8900,
      sale_date: '2026-05-15',
      customers: { name: 'مؤسسة النور' },
      payment_status: 'completed',
    },
    {
      invoice_number: 'INV-003',
      total: 22300,
      sale_date: '2026-05-14',
      customers: { name: 'الخليج للإنشاءات' },
      payment_status: 'pending',
    },
    {
      invoice_number: 'INV-004',
      total: 5100,
      sale_date: '2026-05-14',
      customers: { name: 'مكتب السلام' },
      payment_status: 'completed',
    },
    {
      invoice_number: 'INV-005',
      total: 18700,
      sale_date: '2026-05-13',
      customers: { name: 'شركة التقدم' },
      payment_status: 'completed',
    },
  ],
  monthlyData: [
    { month: 'ديسمبر', income: 120_000, expenses: 72_000, profit: 48_000 },
    { month: 'يناير', income: 135_000, expenses: 68_000, profit: 67_000 },
    { month: 'فبراير', income: 142_000, expenses: 74_000, profit: 68_000 },
    { month: 'مارس', income: 158_000, expenses: 71_000, profit: 87_000 },
    { month: 'أبريل', income: 165_000, expenses: 69_000, profit: 96_000 },
    { month: 'مايو', income: 187_450, expenses: 98_230, profit: 89_220 },
  ],
  lowStockItems: [
    { name: 'حافظة نقود جلدية', quantity: 3, minLevel: 10 },
    { name: ' شنطة سفر كبيرة', quantity: 2, minLevel: 8 },
    { name: 'محفظة رجالية', quantity: 5, minLevel: 15 },
    { name: 'حزام جلدي', quantity: 1, minLevel: 10 },
  ],
  topCustomers: [
    { name: 'شركة الأفق', total: 187_500 },
    { name: 'الخليج للإنشاءات', total: 142_300 },
    { name: 'مؤسسة النور', total: 98_700 },
    { name: 'شركة التقدم', total: 76_200 },
  ],
  recentActivity: [
    {
      id: '1',
      title: 'فاتورة جديدة INV-001',
      description: 'تم إنشاء فاتورة بقيمة 15,200 ريال',
      timestamp: 'منذ 5 دقائق',
      type: 'success' as const,
    },
    {
      id: '2',
      title: 'تحديث المخزون',
      description: 'تم تحديث كمية 3 منتجات',
      timestamp: 'منذ 12 دقيقة',
      type: 'info' as const,
    },
    {
      id: '3',
      title: 'عميل جديد',
      description: 'تم إضافة عميل جديد: شركة التقدم',
      timestamp: 'منذ 20 دقيقة',
      type: 'success' as const,
    },
    {
      id: '4',
      title: 'مخزون منخفض',
      description: 'حزام جلدي: الكمية 1 (الحد الأدنى 10)',
      timestamp: 'منذ 30 دقيقة',
      type: 'warning' as const,
    },
    {
      id: '5',
      title: 'دفعة مستلمة',
      description: 'تم استلام دفعة 8,900 ريال من مؤسسة النور',
      timestamp: 'منذ ساعة',
      type: 'success' as const,
    },
  ],
}

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return (
    localStorage.getItem('demo_mode') === 'true' || new URLSearchParams(window.location.search).get('demo') === 'true'
  )
}

export function enableDemoMode() {
  localStorage.setItem('demo_mode', 'true')
}

export function disableDemoMode() {
  localStorage.removeItem('demo_mode')
}
