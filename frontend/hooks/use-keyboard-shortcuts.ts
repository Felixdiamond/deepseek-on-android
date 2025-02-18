'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function useKeyboardShortcuts() {
  const {
    settingsOpen,
    setSettingsOpen,
    sidebarOpen,
    setSidebarOpen,
    conversations,
    currentConversationId,
    addConversation,
    setCurrentConversationId,
  } = useStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if not in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Command/Ctrl + / - Toggle settings
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSettingsOpen(!settingsOpen)
      }

      // Command/Ctrl + B - Toggle sidebar
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSidebarOpen(!sidebarOpen)
      }

      // Command/Ctrl + N - New chat
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const newConversation = {
          id: crypto.randomUUID(),
          title: 'New Chat',
          messages: [],
          model: 'deepseek-r1:1.5b',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        addConversation(newConversation)
      }

      // Alt + number keys (1-9) - Switch conversations
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (index < conversations.length) {
          setCurrentConversationId(conversations[index].id)
        }
      }

      // Command/Ctrl + [ or ] - Previous/Next conversation
      if ((e.key === '[' || e.key === ']') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const currentIndex = conversations.findIndex(
          (conv) => conv.id === currentConversationId
        )
        if (currentIndex !== -1) {
          const newIndex =
            e.key === '['
              ? (currentIndex - 1 + conversations.length) % conversations.length
              : (currentIndex + 1) % conversations.length
          setCurrentConversationId(conversations[newIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    settingsOpen,
    setSettingsOpen,
    sidebarOpen,
    setSidebarOpen,
    conversations,
    currentConversationId,
    addConversation,
    setCurrentConversationId,
  ])
} 