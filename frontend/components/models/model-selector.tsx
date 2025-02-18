'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2Icon, TrashIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ModelSelector() {
  const {
    availableModels,
    selectedModel,
    setAvailableModels,
    setSelectedModel,
  } = useStore()

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [modelToDelete, setModelToDelete] = React.useState<string | null>(null)

  // Fetch available models on mount
  React.useEffect(() => {
    fetchModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // We only want to run this once on mount

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models')
      if (!response.ok) throw new Error('Failed to fetch models')
      const data = await response.json()
      setAvailableModels(data.models)
    } catch (error) {
      setError('Failed to fetch available models')
      console.error('Error fetching models:', error)
    }
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
  }

  const handlePullModel = async (model: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      })

      if (!response.ok) throw new Error('Failed to pull model')

      await fetchModels() // Refresh model list
    } catch (error) {
      setError('Failed to pull model')
      console.error('Error pulling model:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteModel = async (model: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/models', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      })

      if (!response.ok) throw new Error('Failed to delete model')

      await fetchModels() // Refresh model list
      setModelToDelete(null)

      // If deleted model was selected, switch to another available model
      if (model === selectedModel) {
        const firstAvailableModel = availableModels.find(m => m.name !== model)
        if (firstAvailableModel) {
          setSelectedModel(firstAvailableModel.name)
        }
      }
    } catch (error) {
      setError('Failed to delete model')
      console.error('Error deleting model:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="font-semibold">Model Selection</h3>

        {/* Model selector */}
        <Select value={selectedModel} onValueChange={handleModelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.name} value={model.name}>
                <div className="flex items-center justify-between gap-2">
                  <span>{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.size}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Available models list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Available Models</h4>
          <div className="space-y-2">
            {availableModels.map((model) => (
              <div
                key={model.name}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-muted-foreground">{model.size}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModelToDelete(model.name)}
                  disabled={isLoading || model.name === selectedModel}
                  className={cn(
                    'text-muted-foreground hover:text-red-500',
                    model.name === selectedModel && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Pull new model */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Add New Model</h4>
          <div className="flex gap-2">
            <Select
              onValueChange={(model) => handlePullModel(model)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model to pull" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deepseek-r1:1.5b">
                  DeepSeek 1.5B (5.7GB)
                </SelectItem>
                <SelectItem value="deepseek-r1:7b">
                  DeepSeek 7B (12GB)
                </SelectItem>
              </SelectContent>
            </Select>
            {isLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-100 p-2 text-sm text-red-700 dark:bg-red-900/30">
            {error}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!modelToDelete} onOpenChange={() => setModelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {modelToDelete}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => modelToDelete && handleDeleteModel(modelToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 