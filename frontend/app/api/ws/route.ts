import { WebSocketServer } from 'ws'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

const wss = new WebSocketServer({ noServer: true })

// Store active connections
const clients = new Set<WebSocket>()

// Handle WebSocket connection
wss.on('connection', (ws: WebSocket) => {
  clients.add(ws)
  logger.info('Client connected', { totalClients: clients.size })

  // Send initial system stats
  sendSystemStats(ws)

  // Handle incoming messages
  ws.on('message', async (data: string) => {
    try {
      const message = JSON.parse(data)
      logger.debug('Received message', { type: message.type })

      switch (message.type) {
        case 'chat':
          handleChatMessage(ws, message)
          break
        case 'system':
          handleSystemMessage(ws, message)
          break
        default:
          logger.warn('Unknown message type', { type: message.type })
      }
    } catch (error) {
      logger.error('Error handling message', error)
      sendError(ws, 'Failed to process message')
    }
  })

  // Handle client disconnect
  ws.on('close', () => {
    clients.delete(ws)
    logger.info('Client disconnected', { totalClients: clients.size })
  })

  // Handle errors
  ws.on('error', (error) => {
    logger.error('WebSocket error', error)
    clients.delete(ws)
  })
})

// Handle chat messages
async function handleChatMessage(ws: WebSocket, message: any) {
  const messageId = crypto.randomUUID()

  try {
    // Send start message
    send(ws, {
      type: 'chat',
      payload: {
        type: 'start',
        messageId,
      },
    })

    // Start streaming response
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: message.payload.model,
        prompt: message.payload.content,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate response')
    }

    // Stream the response
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response stream')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = new TextDecoder().decode(value)
      send(ws, {
        type: 'chat',
        payload: {
          type: 'update',
          messageId,
          content: chunk,
        },
      })
    }

    // Send end message
    send(ws, {
      type: 'chat',
      payload: {
        type: 'end',
        messageId,
      },
    })
  } catch (error) {
    logger.error('Error handling chat message', error)
    sendError(ws, 'Failed to generate response')
  }
}

// Handle system messages
async function handleSystemMessage(ws: WebSocket, message: any) {
  try {
    const stats = await getSystemStats()
    send(ws, {
      type: 'system',
      payload: stats,
    })
  } catch (error) {
    logger.error('Error handling system message', error)
    sendError(ws, 'Failed to get system stats')
  }
}

// Get system stats
async function getSystemStats() {
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)

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
      logger.warn('Failed to get CPU temperature', error)
    }

    // Get storage info
    const { stdout: storageInfo } = await execAsync('df -h /data')
    const storageLines = storageInfo.split('\n')
    const storageValues = storageLines[1].split(/\s+/)
    const totalStorage = parseFloat(storageValues[1].replace('G', ''))
    const usedStorage = parseFloat(storageValues[2].replace('G', ''))
    const availableStorage = parseFloat(storageValues[3].replace('G', ''))
    const storageUsage = Math.round((usedStorage / totalStorage) * 100)

    // Check if Ollama is running
    let ollamaStatus = 'stopped'
    try {
      await execAsync('pgrep ollama')
      ollamaStatus = 'running'
    } catch {
      // Ollama is not running
    }

    return {
      ram: {
        total: totalRam,
        used: usedRam,
        usage: ramUsage,
      },
      cpu: {
        temperature: cpuTemp,
      },
      storage: {
        total: totalStorage,
        used: usedStorage,
        available: availableStorage,
        usage: storageUsage,
      },
      ollama: {
        status: ollamaStatus,
      },
    }
  } catch (error) {
    logger.error('Error getting system stats', error)
    throw error
  }
}

// Send system stats to a client
async function sendSystemStats(ws: WebSocket) {
  try {
    const stats = await getSystemStats()
    send(ws, {
      type: 'system',
      payload: stats,
    })
  } catch (error) {
    logger.error('Error sending system stats', error)
    sendError(ws, 'Failed to get system stats')
  }
}

// Send error message to a client
function sendError(ws: WebSocket, message: string) {
  send(ws, {
    type: 'error',
    payload: { message },
  })
}

// Send message to a client
function send(ws: WebSocket, message: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}

// Broadcast message to all clients
function broadcast(message: any) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}

// Export the WebSocket server
export const GET = async (req: NextRequest) => {
  if (!req.headers.get('upgrade')?.includes('websocket')) {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req)
    wss.handleUpgrade(req, socket, Buffer.alloc(0), (ws) => {
      wss.emit('connection', ws, req)
    })
    return response
  } catch (error) {
    logger.error('Error upgrading WebSocket connection', error)
    return new Response('Failed to upgrade WebSocket connection', { status: 500 })
  }
} 