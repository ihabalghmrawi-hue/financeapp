'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { WorkspaceProvider, useGlobalWorkspaceActions } from '@/lib/workspace/provider'
import { CommandPalette } from '@/components/workspace/CommandPalette'
import { EnterpriseSearch } from '@/components/workspace/EnterpriseSearch'
import { ActivityCenter, NotificationCenter } from '@/components/workspace/ActivityCenter'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { AICopilotSidebar } from '@/components/ai/AICopilotSidebar'
import { BottomNavigation } from '@/components/mobile/BottomNavigation'
import { SyncStatusIndicator } from '@/components/offline/SyncStatusIndicator'
import { useBreakpoint } from '@/hooks'
import { Command, Search, Bell, Activity, Bot, Menu } from 'lucide-react'

interface WorkspaceShellProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  sidebarHeader?: React.ReactNode
}

function WorkspaceShellInner({ children, sidebar, sidebarHeader }: WorkspaceShellProps) {
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false)
  const { state, openCommandPalette, openSearch, toggleActivityCenter, toggleNotificationCenter } =
    useGlobalWorkspaceActions()
  const bp = useBreakpoint()
  const isMobile = bp === 'xs' || bp === 'sm'
  const isTablet = bp === 'md'
  const isDesktop = !isMobile && !isTablet
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop)
  useKeyboardShortcuts()

  useEffect(() => {
    setSidebarOpen(isDesktop)
  }, [isDesktop])

  useEffect(() => {
    const handler = () => openCommandPalette()
    window.addEventListener('open-command-palette', handler)
    return () => window.removeEventListener('open-command-palette', handler)
  }, [openCommandPalette])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Enterprise Toolbar */}
      <header
        className={cn(
          'border-b bg-card flex items-center shrink-0 z-30',
          'h-12 px-4',
          isMobile && 'h-11 px-3 gap-1',
          isTablet && 'h-12 px-4',
        )}
      >
        <div className="flex items-center gap-1 sm:gap-2 flex-1">
          {/* Mobile menu toggle */}
          {(isMobile || isTablet) && sidebar && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={openCommandPalette}
            className={cn(
              'flex items-center gap-2 h-8 text-sm text-muted-foreground bg-muted/50 border rounded-lg hover:bg-accent/50 transition-colors',
              isMobile ? 'px-2' : 'px-3',
            )}
          >
            <Command className="h-4 w-4 shrink-0" />
            {!isMobile && <span>أوامر...</span>}
            {!isMobile && <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded mr-2 hidden sm:inline">⌘K</kbd>}
          </button>

          {!isMobile && (
            <button
              onClick={openSearch}
              className="flex items-center gap-2 px-3 h-8 text-sm text-muted-foreground hover:bg-accent/50 rounded-lg transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">بحث...</span>
            </button>
          )}
        </div>

        {isMobile && (
          <button onClick={openSearch} className="p-2 hover:bg-accent rounded-lg text-muted-foreground">
            <Search className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-1">
          {!isMobile && (
            <button
              onClick={() => setAiCopilotOpen(true)}
              className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors relative"
            >
              <Bot className="h-5 w-5" />
            </button>
          )}
          <SyncStatusIndicator showLabel={false} className="mx-1" />
          <button
            onClick={toggleActivityCenter}
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <Activity className="h-5 w-5" />
            {state.activityCenter.unread > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
          <button
            onClick={toggleNotificationCenter}
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {state.notificationCenter.unread > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {sidebar && isDesktop && sidebarOpen && (
          <aside className="w-60 border-l bg-card shrink-0 overflow-y-auto">{sidebar}</aside>
        )}

        {/* Mobile/Tablet Drawer Sidebar */}
        {(isMobile || isTablet) && sidebar && (
          <MobileSidebarWrapper open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
            {sidebarHeader}
            {sidebar}
          </MobileSidebarWrapper>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation />}

      {/* Overlays */}
      <CommandPalette />
      <EnterpriseSearch />
      <ActivityCenter />
      <NotificationCenter />
      {!isMobile && <AICopilotSidebar open={aiCopilotOpen} onClose={() => setAiCopilotOpen(false)} />}
    </div>
  )
}

function MobileSidebarWrapper({
  children,
  open,
  onClose,
}: {
  children: React.ReactNode
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className={cn('fixed inset-0 z-[70]', !open && 'pointer-events-none')}>
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed top-0 bottom-0 right-0 w-[280px] max-w-[85vw] bg-card border-l shadow-2xl z-[71] transition-transform duration-300 ease-out overflow-y-auto',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function WorkspaceShell(props: WorkspaceShellProps) {
  return (
    <WorkspaceProvider>
      <WorkspaceShellInner {...props} />
    </WorkspaceProvider>
  )
}
