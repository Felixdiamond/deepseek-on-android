'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MenuIcon, XIcon } from 'lucide-react'

interface ResponsiveShellProps {
  sidebar: React.ReactNode
  content: React.ReactNode
  header?: React.ReactNode
}

export function ResponsiveShell({
  sidebar,
  content,
  header,
}: ResponsiveShellProps) {
  const { sidebarOpen, setSidebarOpen } = useStore()

  // Close sidebar on mobile when clicking outside
  const handleContentClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 z-50 flex h-16 w-full items-center border-b bg-background px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <XIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </Button>
        {header}
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 z-40 flex w-80 flex-col border-r bg-background transition-transform lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center border-b px-4">
          {header}
        </div>
        <div className="flex-1 overflow-auto p-4">{sidebar}</div>
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div
        className="flex-1 overflow-auto pt-16 lg:pt-0"
        onClick={handleContentClick}
      >
        <div className="mx-auto h-full max-w-5xl p-4">{content}</div>
      </div>
    </div>
  )
} 