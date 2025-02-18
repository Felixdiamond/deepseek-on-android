import { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get RAM usage
    const { stdout: memInfo } = await execAsync('free -m')
    const memLines = memInfo.split('\n')
    const memValues = memLines[1].split(/\s+/)
    const totalRam = parseInt(memValues[1])
    const usedRam = parseInt(memValues[2])
    const ramUsage = Math.round((usedRam / totalRam) * 100)

    // Get CPU temperature
    let cpuTemp = 0
    try {
      const { stdout: tempInfo } = await execAsync('cat /sys/class/thermal/thermal_zone0/temp')
      cpuTemp = Math.round(parseInt(tempInfo) / 1000)
    } catch (error) {
      console.error('Failed to get CPU temperature:', error)
    }

    // Get storage info
    const { stdout: storageInfo } = await execAsync('df -h /data')
    const storageLines = storageInfo.split('\n')
    const storageValues = storageLines[1].split(/\s+/)
    const totalStorage = storageValues[1].replace('G', '')
    const usedStorage = storageValues[2].replace('G', '')
    const availableStorage = storageValues[3].replace('G', '')
    const storageUsage = Math.round((parseInt(usedStorage) / parseInt(totalStorage)) * 100)

    // Check if Ollama is running
    let ollamaStatus = 'stopped'
    try {
      await execAsync('pgrep ollama')
      ollamaStatus = 'running'
    } catch {
      // Ollama is not running
    }

    return new Response(JSON.stringify({
      ram: {
        total: totalRam,
        used: usedRam,
        usage: ramUsage
      },
      cpu: {
        temperature: cpuTemp
      },
      storage: {
        total: parseFloat(totalStorage),
        used: parseFloat(usedStorage),
        available: parseFloat(availableStorage),
        usage: storageUsage
      },
      ollama: {
        status: ollamaStatus
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Streaming system stats
export async function POST(req: NextRequest) {
  const { interval = 5000 } = await req.json() // Default to 5 seconds

  // Create a transform stream for server-sent events
  const encoder = new TextEncoder()
  const stream = new TransformStream({
    async transform(chunk, controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
    },
  })

  const writer = stream.writable.getWriter()

  // Function to get system stats
  async function getStats() {
    try {
      const { stdout: memInfo } = await execAsync('free -m')
      const memLines = memInfo.split('\n')
      const memValues = memLines[1].split(/\s+/)
      const ramUsage = Math.round((parseInt(memValues[2]) / parseInt(memValues[1])) * 100)

      let cpuTemp = 0
      try {
        const { stdout: tempInfo } = await execAsync('cat /sys/class/thermal/thermal_zone0/temp')
        cpuTemp = Math.round(parseInt(tempInfo) / 1000)
      } catch (error) {
        console.error('Failed to get CPU temperature:', error)
      }

      return {
        timestamp: new Date().toISOString(),
        ram: { usage: ramUsage },
        cpu: { temperature: cpuTemp }
      }
    } catch (error) {
      console.error('Failed to get system stats:', error)
      return null
    }
  }

  // Start periodic updates
  const timer = setInterval(async () => {
    const stats = await getStats()
    if (stats) {
      writer.write(stats).catch(console.error)
    }
  }, interval)

  // Clean up on client disconnect
  req.signal.addEventListener('abort', () => {
    clearInterval(timer)
    writer.close().catch(console.error)
  })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
} 