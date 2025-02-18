'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MonitorIcon,
  MoonIcon,
  SunIcon,
  LaptopIcon,
  SaveIcon,
  TrashIcon,
  InfoIcon,
  Settings2Icon,
} from 'lucide-react'
import { useTheme } from 'next-themes'

export function SettingsPanel() {
  const {
    isMonitoring,
    setIsMonitoring,
    conversations,
    setConversations,
    settingsOpen,
    setSettingsOpen,
  } = useStore()

  const { theme, setTheme } = useTheme()

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      setConversations([])
    }
  }

  const handleExportData = () => {
    const data = {
      conversations,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deepseek-export-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.conversations) {
          setConversations(data.conversations)
        }
      } catch (error) {
        console.error('Error importing data:', error)
        alert('Failed to import data. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings2Icon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your DeepSeek experience
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Appearance */}
          <Card className="p-4">
            <h3 className="mb-4 font-semibold">Appearance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" className="w-32">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <SunIcon className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <MoonIcon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <LaptopIcon className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Performance */}
          <Card className="p-4">
            <h3 className="mb-4 font-semibold">Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="monitoring">System Monitoring</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Enable real-time monitoring of system resources
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="monitoring"
                  checked={isMonitoring}
                  onCheckedChange={setIsMonitoring}
                />
              </div>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="p-4">
            <h3 className="mb-4 font-semibold">Data Management</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label>Export Data</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportData}
                    disabled={conversations.length === 0}
                  >
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="import">Import Data</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="import"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('import')?.click()}
                    >
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Clear History</Label>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearHistory}
                    disabled={conversations.length === 0}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card className="p-4">
            <h3 className="mb-4 font-semibold">About</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>DeepSeek Android</p>
              <p>Version: 1.0.0</p>
              <p>
                <a
                  href="https://github.com/Felixdiamond/deepseek-on-android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub Repository
                </a>
              </p>
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
} 