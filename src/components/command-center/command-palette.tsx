'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Search,
  Command,
  FileText,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  Settings,
  LayoutDashboard,
  TrendingUp,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: LucideIcon
  shortcut?: string
  action: () => void
  keywords?: string[]
  category?: string
}

interface CommandGroup {
  name: string
  items: CommandItem[]
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const navigate = useCallback(
    (path: string) => {
      router.push(path)
      setOpen(false)
    },
    [router],
  )

  const commandGroups: CommandGroup[] = [
    {
      name: 'التنقل',
      items: [
        {
          id: 'dashboard',
          label: 'لوحة التحكم',
          description: 'الذهاب إلى لوحة التحكم الرئيسية',
          icon: LayoutDashboard,
          action: () => navigate('/dashboard'),
          keywords: ['الرئيسية', 'الصفحة الرئيسية'],
          category: 'navigation',
        },
        {
          id: 'sales',
          label: 'المبيعات',
          description: 'إدارة الفواتير والمبيعات',
          icon: ShoppingCart,
          action: () => navigate('/dashboard/sales'),
          keywords: ['فواتير', 'مبيعات', 'زبائن'],
          category: 'navigation',
        },
        {
          id: 'inventory',
          label: 'المخزون',
          description: 'إدارة المنتجات والمخزون',
          icon: Package,
          action: () => navigate('/dashboard/inventory'),
          keywords: ['منتجات', 'مخزون', 'أصناف'],
          category: 'navigation',
        },
        {
          id: 'customers',
          label: 'العملاء',
          description: 'إدارة العملاء والموردين',
          icon: Users,
          action: () => navigate('/dashboard/customers'),
          keywords: ['زبائن', 'عملاء', 'موردين'],
          category: 'navigation',
        },
        {
          id: 'expenses',
          label: 'المصروفات',
          description: 'تسجيل المصروفات',
          icon: Wallet,
          action: () => navigate('/dashboard/expenses'),
          keywords: ['مصروفات', 'نفقات'],
          category: 'navigation',
        },
        {
          id: 'reports',
          label: 'التقارير',
          description: 'التقارير المالية',
          icon: TrendingUp,
          action: () => navigate('/dashboard/reports'),
          keywords: ['تقارير', 'أرباح', 'خسائر'],
          category: 'navigation',
        },
        {
          id: 'settings',
          label: 'الإعدادات',
          description: 'إعدادات النظام',
          icon: Settings,
          action: () => navigate('/dashboard/settings'),
          keywords: ['إعدادات', 'ضبط'],
          category: 'navigation',
        },
      ],
    },
    {
      name: 'الإجراءات السريعة',
      items: [
        {
          id: 'new-sale',
          label: 'فاتورة جديدة',
          description: 'إنشاء فاتورة مبيعات جديدة',
          icon: FileText,
          action: () => navigate('/dashboard/sales/invoices/new'),
          keywords: ['إنشاء', 'إضافة', 'فاتورة'],
          category: 'actions',
        },
        {
          id: 'new-customer',
          label: 'عميل جديد',
          description: 'إضافة عميل جديد',
          icon: Users,
          action: () => navigate('/dashboard/customers/new'),
          keywords: ['إنشاء', 'إضافة', 'زبون'],
          category: 'actions',
        },
        {
          id: 'new-product',
          label: 'منتج جديد',
          description: 'إضافة منتج جديد',
          icon: Package,
          action: () => navigate('/dashboard/inventory/items/new'),
          keywords: ['إنشاء', 'إضافة', 'صنف'],
          category: 'actions',
        },
        {
          id: 'new-expense',
          label: 'مصروف جديد',
          description: 'تسجيل مصروف جديد',
          icon: Wallet,
          action: () => navigate('/dashboard/expenses/new'),
          keywords: ['إنشاء', 'إضافة', 'نفقة'],
          category: 'actions',
        },
      ],
    },
  ]

  const allItems = commandGroups.flatMap((g) => g.items)

  const filteredGroups = commandGroups
    .map((group) => ({
      ...group,
      items: query
        ? group.items.filter(
            (item) =>
              item.label.toLowerCase().includes(query.toLowerCase()) ||
              item.keywords?.some((k) => k.includes(query.toLowerCase())) ||
              item.description?.toLowerCase().includes(query.toLowerCase()),
          )
        : group.items,
    }))
    .filter((group) => group.items.length > 0)

  const flatFiltered = filteredGroups.flatMap((g) => g.items)

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      }
      if (e.key === 'Enter' && flatFiltered[selectedIndex]) {
        e.preventDefault()
        flatFiltered[selectedIndex].action()
      }
    },
    [flatFiltered, selectedIndex],
  )

  const currentIndexRef = useRef(0)
  currentIndexRef.current = 0

  let globalIndex = 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="فتح الأوامر"
      >
        <Command className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline">Ctrl+K</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[900] flex items-start justify-center pt-[15vh]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-popover/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
              style={{ maxHeight: 'min(600px, 80vh)' }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="ابحث عن صفحة، إجراء، أو أمر..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none"
                  dir="auto"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border/50">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(min(600px, 80vh) - 52px)' }}>
                {filteredGroups.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredGroups.map((group) => (
                      <div key={group.name}>
                        <div className="px-2 py-1.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {group.name}
                          </span>
                        </div>
                        {group.items.map((item) => {
                          const currentGlobal = globalIndex++
                          const Icon = item.icon
                          return (
                            <button
                              key={item.id}
                              onClick={() => item.action()}
                              onMouseEnter={() => setSelectedIndex(currentGlobal)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-all duration-150',
                                currentGlobal === selectedIndex
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground hover:bg-muted',
                              )}
                            >
                              {Icon && (
                                <div
                                  className={cn(
                                    'p-1.5 rounded-lg',
                                    currentGlobal === selectedIndex ? 'bg-primary/10' : 'bg-muted',
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0 text-right">
                                <div className="text-sm font-medium truncate">{item.label}</div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                                )}
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-foreground">لا توجد نتائج</p>
                    <p className="text-xs text-muted-foreground mt-1">حاول البحث بكلمات مختلفة</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
