'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { KeyboardIcon } from 'lucide-react'

interface ShortcutProps {
  keys: string[]
  description: string
}

function Shortcut({ keys, description }: ShortcutProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            <kbd className="rounded bg-muted px-2 py-1 text-sm font-semibold">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="text-muted-foreground">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export function KeyboardShortcuts() {
  const { shortcutsOpen, setShortcutsOpen } = useStore()

  return (
    <Sheet open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <KeyboardIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Keyboard Shortcuts</SheetTitle>
          <SheetDescription>
            Keyboard shortcuts to help you work faster
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Navigation */}
          <Card className="p-4">
            <h3 className="mb-4 font-semibold">Navigation</h3>
            <div className="space-y-2">
              <Shortcut
                keys={['⌘', '/']}
                description="Toggle settings panel"
              />
              <Shortcut
                keys={['⌘', 'B']}
                description="Toggle sidebar"
              />
              <Shortcut
                keys={['⌘', '[']}
                description="Previous conversation"
              />
              <Shortcut
                keys={['⌘', ']']}
                description="Next conversation"
              />
              <Shortcut
                keys={['Alt', '1-9']}
                description="Switch to conversation 1-9"
              />
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-4">
            <h3 className="mb-4 font-semibold">Actions</h3>
            <div className="space-y-2">
              <Shortcut
                keys={['⌘', 'N']}
                description="New conversation"
              />
              <Shortcut
                keys={['⌘', 'Enter']}
                description="Send message"
              />
              <Shortcut
                keys={['Esc']}
                description="Cancel current operation"
              />
            </div>
          </Card>

          {/* Note */}
          <p className="text-sm text-muted-foreground">
            Note: On Windows and Linux, use Ctrl instead of ⌘
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
} 