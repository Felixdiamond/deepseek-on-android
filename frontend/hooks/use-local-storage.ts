'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function useLocalStorage() {
  const { conversations, setConversations } = useStore()

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('deepseek-conversations')
      if (stored) {
        const data = JSON.parse(stored)
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to load conversations from localStorage:', error)
    }
  }, [setConversations])

  // Save conversations to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('deepseek-conversations', JSON.stringify(conversations))
    } catch (error) {
      console.error('Failed to save conversations to localStorage:', error)
    }
  }, [conversations])
} 