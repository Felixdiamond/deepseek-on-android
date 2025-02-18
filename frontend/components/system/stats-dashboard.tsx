'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  CpuIcon,
  HardDriveIcon,
  ActivityIcon,
  ServerIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from 'lucide-react'
import type { SystemStats } from '@/lib/websocket'

export function StatsDashboard() {
  const { systemStats, isMonitoring, setIsMonitoring, setSystemStats } = useStore()

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/system')
        if (!response.ok) throw new Error('Failed to fetch system stats')
        const data = await response.json()
        setSystemStats(data)
      } catch (error) {
        console.error('Error fetching system stats:', error)
      }
    }

    // Initial fetch
    fetchStats()

    // Setup streaming if monitoring is enabled
    if (isMonitoring) {
      const eventSource = new EventSource('/api/system/stream')

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as SystemStats
        setSystemStats(data)
      }

      eventSource.onerror = () => {
        console.error('EventSource failed')
        setIsMonitoring(false)
      }

      return () => {
        eventSource.close()
      }
    }
  }, [isMonitoring, setIsMonitoring, setSystemStats])

  if (!systemStats) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* RAM Usage */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">RAM Usage</h3>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{systemStats.ram.usage}%</span>
            <span className="text-sm text-muted-foreground">
              {systemStats.ram.used}MB / {systemStats.ram.total}MB
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all',
                systemStats.ram.usage > 80
                  ? 'bg-red-500'
                  : systemStats.ram.usage > 60
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              )}
              style={{ width: `${systemStats.ram.usage}%` }}
            />
          </div>
        </div>
      </Card>

      {/* CPU Temperature */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CpuIcon className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold">CPU Temperature</h3>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{systemStats.cpu.temperature}°C</span>
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs',
                systemStats.cpu.temperature > 80
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
                  : systemStats.cpu.temperature > 60
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30'
              )}
            >
              {systemStats.cpu.temperature > 80 ? (
                <>
                  <AlertTriangleIcon className="h-3 w-3" />
                  Critical
                </>
              ) : systemStats.cpu.temperature > 60 ? (
                <>
                  <AlertTriangleIcon className="h-3 w-3" />
                  Warning
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-3 w-3" />
                  Normal
                </>
              )}
            </span>
          </div>
        </div>
      </Card>

      {/* Storage */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <HardDriveIcon className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">Storage</h3>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{systemStats.storage?.usage}%</span>
            <span className="text-sm text-muted-foreground">
              {systemStats.storage?.available}GB free
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all',
                (systemStats.storage?.usage ?? 0) > 90
                  ? 'bg-red-500'
                  : (systemStats.storage?.usage ?? 0) > 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              )}
              style={{ width: `${systemStats.storage?.usage ?? 0}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Ollama Status */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <ServerIcon className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold">Ollama Status</h3>
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-3 w-3 rounded-full',
                systemStats.ollama.status === 'running' ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span className="text-lg font-medium capitalize">{systemStats.ollama.status}</span>
          </div>
        </div>
      </Card>
    </div>
  )
} 