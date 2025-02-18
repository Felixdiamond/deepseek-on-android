'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatInput } from './chat-input'
import { ChatMessage } from './chat-message'
import { ChatWelcome } from './chat-welcome'

export function ChatContainer() {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const {
    conversations,
    currentConversationId,
    isStreaming,
    addMessage,
    updateMessage,
    setIsStreaming,
  } = useStore()

  const currentConversation = React.useMemo(
    () => conversations.find((conv) => conv.id === currentConversationId),
    [conversations, currentConversationId]
  )

  const handleSendMessage = async (content: string) => {
    if (!currentConversation || !content.trim() || isStreaming) return

    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    }
    addMessage(currentConversation.id, userMessage)

    // Add assistant message placeholder
    const assistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toISOString(),
    }
    addMessage(currentConversation.id, assistantMessage)

    // Start streaming
    setIsStreaming(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: currentConversation.model,
          prompt: content,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      let accumulatedContent = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        accumulatedContent += chunk
        updateMessage(currentConversation.id, assistantMessage.id, accumulatedContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      updateMessage(
        currentConversation.id,
        assistantMessage.id,
        'Sorry, there was an error processing your message.'
      )
    } finally {
      setIsStreaming(false)
    }
  }

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [currentConversation?.messages])

  if (!currentConversation) {
    return <ChatWelcome />
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden lg:h-[calc(100vh-2rem)]">
      {/* Messages */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 p-4"
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {currentConversation.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  )
} 