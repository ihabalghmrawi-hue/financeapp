import type { ReactNode } from 'react'

interface Props {
  greeting: string
  staffName: string
  children: ReactNode
}

export function DashboardShell({ greeting, staffName, children }: Props) {
  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}، {staffName}
        </h1>
      </div>
      {children}
    </div>
  )
}
