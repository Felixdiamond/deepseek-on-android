'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendIcon } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = React.useState('')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!content.trim() || disabled) return
    onSend(content)
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const adjustHeight = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }

    textarea.addEventListener('input', adjustHeight)
    return () => textarea.removeEventListener('input', adjustHeight)
  }, [])

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Cmd/Ctrl + Enter to send)"
        disabled={disabled}
        className="min-h-[60px] resize-none rounded-lg sm:min-h-[44px]"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!content.trim() || disabled}
        size="icon"
        className="h-10 w-full shrink-0 sm:h-[44px] sm:w-[44px]"
      >
        <SendIcon className="h-5 w-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  )
} 