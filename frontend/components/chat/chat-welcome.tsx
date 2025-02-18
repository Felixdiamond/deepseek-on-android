'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { PlusIcon, BrainCircuitIcon, ShieldCheckIcon, WifiOffIcon, ZapIcon } from 'lucide-react'

export function ChatWelcome() {
  const { addConversation, selectedModel } = useStore()

  const handleNewChat = () => {
    addConversation({
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      model: selectedModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <BrainCircuitIcon className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-6 text-3xl font-bold">Welcome to DeepSeek</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Experience powerful AI, completely offline and private on your device
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Card className="p-4 text-left">
            <ShieldCheckIcon className="h-8 w-8 text-green-500" />
            <h3 className="mt-2 font-semibold">Complete Privacy</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              All processing happens locally on your device
            </p>
          </Card>
          <Card className="p-4 text-left">
            <WifiOffIcon className="h-8 w-8 text-blue-500" />
            <h3 className="mt-2 font-semibold">Offline Access</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No internet required after initial setup
            </p>
          </Card>
          <Card className="p-4 text-left">
            <ZapIcon className="h-8 w-8 text-yellow-500" />
            <h3 className="mt-2 font-semibold">Fast Response</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Optimized for mobile processors
            </p>
          </Card>
          <Card className="p-4 text-left">
            <BrainCircuitIcon className="h-8 w-8 text-purple-500" />
            <h3 className="mt-2 font-semibold">Advanced AI</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Powered by state-of-the-art language models
            </p>
          </Card>
        </div>

        <Button onClick={handleNewChat} size="lg" className="mt-8">
          <PlusIcon className="mr-2 h-5 w-5" />
          Start New Chat
        </Button>
      </Card>
    </div>
  )
} 