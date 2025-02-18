import { toast } from '@/hooks/use-toast'

export type SystemStats = {
  ram: {
    total: number
    used: number
    usage: number
  }
  cpu: {
    temperature: number
  }
  storage: {
    total: number
    used: number
    available: number
    usage: number
  }
  ollama: {
    status: 'running' | 'stopped'
  }
}

export type ChatMessage = {
  type: 'start' | 'update' | 'end'
  messageId: string
  content?: string
}

export type WebSocketMessage = {
  type: 'chat' | 'system' | 'error'
  payload: ChatMessage | SystemStats | { message: string }
}

class WebSocketService {
  private static instance: WebSocketService
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout = 1000
  private listeners: Map<string, Set<(message: WebSocketMessage) => void>> = new Map()

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      this.socket = new WebSocket(`${protocol}//${host}/api/ws`)

      this.socket.onopen = this.handleOpen.bind(this)
      this.socket.onmessage = this.handleMessage.bind(this)
      this.socket.onclose = this.handleClose.bind(this)
      this.socket.onerror = this.handleError.bind(this)
    } catch (error) {
      console.error('WebSocket connection error:', error)
      this.handleError(error as Event)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  subscribe(type: string, callback: (message: WebSocketMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)?.add(callback)

    return () => {
      this.listeners.get(type)?.delete(callback)
      if (this.listeners.get(type)?.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  send(message: WebSocketMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
      toast({
        title: 'Connection Error',
        description: 'WebSocket is not connected. Attempting to reconnect...',
        variant: 'destructive',
      })
      this.connect()
    }
  }

  private handleOpen() {
    console.log('WebSocket connected')
    this.reconnectAttempts = 0
    toast({
      title: 'Connected',
      description: 'WebSocket connection established',
      variant: 'default',
    })
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      this.listeners.get(message.type)?.forEach((callback) => {
        callback(message)
      })
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket closed:', event.code, event.reason)
    this.socket = null

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
      setTimeout(() => this.connect(), this.reconnectTimeout * this.reconnectAttempts)
    } else {
      toast({
        title: 'Connection Lost',
        description: 'Failed to reconnect to the server. Please refresh the page.',
        variant: 'destructive',
      })
    }
  }

  private handleError(event: Event) {
    console.error('WebSocket error:', event)
    toast({
      title: 'Connection Error',
      description: 'An error occurred with the WebSocket connection',
      variant: 'destructive',
    })
  }
}

export const webSocketService = WebSocketService.getInstance() 