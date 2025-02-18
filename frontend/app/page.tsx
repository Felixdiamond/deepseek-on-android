'use client'

import { ResponsiveShell } from '@/components/layout/responsive-shell'
import { ChatContainer } from '@/components/chat/chat-container'
import { StatsDashboard } from '@/components/system/stats-dashboard'
import { ModelSelector } from '@/components/models/model-selector'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { useWebSocket } from '@/hooks/use-websocket'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useLocalStorage } from '@/hooks/use-local-storage'

export default function Home() {
  // Initialize hooks
  useWebSocket()
  useKeyboardShortcuts()
  useLocalStorage()

  return (
    <ResponsiveShell
      header={
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">DeepSeek Android</h1>
          <div className="ml-auto flex items-center gap-2">
            <KeyboardShortcuts />
            <SettingsPanel />
          </div>
        </div>
      }
      sidebar={
        <div className="space-y-4">
          <StatsDashboard />
          <ModelSelector />
        </div>
      }
      content={<ChatContainer />}
    />
  )
}
