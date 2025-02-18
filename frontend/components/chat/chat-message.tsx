'use client'

import * as React from 'react'
import { Message } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CopyIcon, CheckIcon, UserIcon, BotIcon } from 'lucide-react'
import ReactMarkdown, { Components } from 'react-markdown'
import { createHighlighter, bundledLanguages, bundledThemes } from 'shiki'

interface ChatMessageProps {
  message: Message
}

type CodeComponentProps = React.ComponentPropsWithoutRef<'code'> & {
  inline?: boolean
}

// Initialize highlighter in a component to avoid top-level await
export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false)
  const [highlighter, setHighlighter] = React.useState<Awaited<ReturnType<typeof createHighlighter>> | null>(null)

  // Initialize highlighter on mount
  React.useEffect(() => {
    createHighlighter({
      themes: [bundledThemes['one-dark-pro']],
      langs: Object.keys(bundledLanguages),
    })
      .then(setHighlighter)
      .catch(console.error)
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const components: Components = {
    code(props: CodeComponentProps) {
      const { inline, className, children, ...rest } = props
      const match = /language-(\w+)/.exec(className || '')
      const code = String(children).replace(/\n$/, '')

      if (!inline && match && highlighter) {
        const lang = match[1]
        const html = highlighter.codeToHtml(code, {
          lang,
          theme: 'one-dark-pro',
        })

        return (
          <div className="group relative">
            <div className="absolute right-2 top-2 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => copyToClipboard(code)}
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="max-w-[calc(100vw-4rem)] overflow-auto rounded-md bg-zinc-900 sm:max-w-none">
              <div
                className="text-sm [&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:p-4"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
        )
      }

      return (
        <code className={className} {...rest}>
          {children}
        </code>
      )
    },
  }

  return (
    <Card
      className={cn(
        'overflow-hidden',
        message.role === 'user' ? 'bg-primary/10' : 'bg-muted/50'
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        {/* Avatar */}
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-primary/10 sm:h-10 sm:w-10">
          {message.role === 'user' ? (
            <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <BotIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="prose prose-sm dark:prose-invert max-w-none sm:prose-base">
            <ReactMarkdown components={components}>
              {message.content}
            </ReactMarkdown>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </Card>
  )
} 