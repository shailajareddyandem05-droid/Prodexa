"use client"

import { useState } from "react"
import { Bot, X, Send } from "lucide-react"

export function AiDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-transform hover:scale-105 active:scale-95"
          aria-label="Open AI assistant"
        >
          <Bot className="h-5 w-5" />
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed bottom-0 right-0 top-0 z-50 flex w-80 flex-col border-l border-border bg-background shadow-lg animate-in slide-in-from-right">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">Pai Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <Bot className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">How can I help?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ask me anything about your tasks, notes, or schedule.
            </p>
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
              <input
                type="text"
                placeholder="Ask Pai anything..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
              />
              <button className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
