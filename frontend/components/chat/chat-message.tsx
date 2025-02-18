'use client'

import * as React from 'react'
import { Message } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CopyIcon, CheckIcon, UserIcon, BotIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const code = String(children).replace(/\n$/, '')

                  if (!inline && match) {
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
                        <div className="max-w-[calc(100vw-4rem)] overflow-auto sm:max-w-none">
                          <SyntaxHighlighter
                            language={match[1]}
                            style={oneDark}
                            PreTag="div"
                            className="!my-0 !bg-zinc-900"
                            showLineNumbers
                            {...props}
                          >
                            {code}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
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