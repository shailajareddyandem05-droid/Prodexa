"use client"

import { useState, useRef, useEffect } from "react"
import {
  Bell,
  ArrowUp,
  Mail,
  X,
  Loader2,
} from "lucide-react"
import { api } from "@/lib/api"

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [highPriorityTasks, setHighPriorityTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    setLoading(true)
    api.tasks.list()
      .then((data) => {
        const tasks = (data.tasks || []).filter((t: any) => t.priority === "high" && !t.done)
        setHighPriorityTasks(tasks.slice(0, 5))
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const totalCount = highPriorityTasks.length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {totalCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
            {totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* High priority tasks */}
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <ArrowUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">High Priority Tasks</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : highPriorityTasks.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">No high priority tasks</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {highPriorityTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                    <span className="text-xs font-medium text-foreground">{t.title}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{t.due}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
