import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface Props {
  href: string
  label: string
  icon: LucideIcon
  count: string
  tour?: string
}

export function QuickLink({ href, label, icon: Icon, count, tour }: Props) {
  return (
    <Link
      href={href}
      {...(tour ? { 'data-tour': tour } : {})}
      className="premium-card p-4 hover:shadow-elevation-2 transition-all duration-300 group flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground">{count}</p>
      </div>
    </Link>
  )
}
