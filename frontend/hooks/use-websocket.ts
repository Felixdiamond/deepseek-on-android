'use client'

import { useEffect, useCallback } from 'react'
import { webSocketService, WebSocketMessage, ChatMessage, SystemStats } from '@/lib/websocket'
import { useStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

export function useWebSocket() {
  const { toast } = useToast()
  const {
    addMessage,
    updateMessage,
    setSystemStats,
    setIsStreaming,
    currentConversationId,
  } = useStore()

  const handleChatMessage = useCallback(
    (message: WebSocketMessage) => {
      if (!currentConversationId) return

      const payload = message.payload as ChatMessage
      if (payload.type === 'start') {
        setIsStreaming(true)
        addMessage(currentConversationId, {
          id: payload.messageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        })
      } else if (payload.type === 'update') {
        updateMessage(currentConversationId, payload.messageId, payload.content ?? '')
      } else if (payload.type === 'end') {
        setIsStreaming(false)
      }
    },
    [currentConversationId, addMessage, updateMessage, setIsStreaming]
  )

  const handleSystemMessage = useCallback(
    (message: WebSocketMessage) => {
      setSystemStats(message.payload as SystemStats)
    },
    [setSystemStats]
  )

  const handleErrorMessage = useCallback(
    (message: WebSocketMessage) => {
      toast({
        title: 'Error',
        description: (message.payload as { message: string }).message,
        variant: 'destructive',
      })
    },
    [toast]
  )

  useEffect(() => {
    // Connect to WebSocket when component mounts
    webSocketService.connect()

    // Subscribe to different message types
    const unsubscribeChat = webSocketService.subscribe('chat', handleChatMessage)
    const unsubscribeSystem = webSocketService.subscribe('system', handleSystemMessage)
    const unsubscribeError = webSocketService.subscribe('error', handleErrorMessage)

    // Cleanup subscriptions when component unmounts
    return () => {
      unsubscribeChat()
      unsubscribeSystem()
      unsubscribeError()
      webSocketService.disconnect()
    }
  }, [handleChatMessage, handleSystemMessage, handleErrorMessage])

  return {
    send: webSocketService.send.bind(webSocketService),
    connect: webSocketService.connect.bind(webSocketService),
    disconnect: webSocketService.disconnect.bind(webSocketService),
  }
} 