"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, StickyNote, CheckSquare, X, CalendarDays } from "lucide-react"

export function FloatingActions() {
  const [open, setOpen] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskName, setTaskName] = useState("")
  const [taskDesc, setTaskDesc] = useState("")
  const [taskDate, setTaskDate] = useState("")
  const router = useRouter()

  function handleAddTask() {
    if (!taskName.trim()) return
    setShowTaskModal(false)
    setTaskName("")
    setTaskDesc("")
    setTaskDate("")
    setOpen(false)
  }

  function handleAddNote() {
    setOpen(false)
    router.push("/dashboard/notes?new=1")
  }

  return (
    <>
      <div className="fixed bottom-6 right-20 z-40 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <CheckSquare className="h-4 w-4" />
              Add Task
            </button>
            <button
              onClick={handleAddNote}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <StickyNote className="h-4 w-4" />
              Add Note
            </button>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-foreground text-background shadow-sm transition-transform hover:scale-105 active:scale-95"
          aria-label={open ? "Close menu" : "Quick add"}
        >
          {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">New Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Task Name</label>
                <input
                  type="text"
                  placeholder="Enter task name..."
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  placeholder="Describe the task..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  className="resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 dark:[color-scheme:dark]"
                  />
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleAddTask}
                className="mt-1 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
