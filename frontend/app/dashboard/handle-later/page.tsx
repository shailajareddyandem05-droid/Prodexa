"use client"

import { useState, useEffect } from "react"
import { Clock, Plus, X, ArrowRight, Trash2, Calendar, CheckCircle2, Sparkles, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

interface DeferredItem {
  id: string
  text: string
  note: string
  createdAt: string
  scheduledFor: string | null
  status: "parked" | "scheduled" | "moved"
}

export default function HandleLaterPage() {
  const [items, setItems] = useState<DeferredItem[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [text, setText] = useState("")
  const [note, setNote] = useState("")
  const [schedulingItem, setSchedulingItem] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState("")
  const [isAutoPiloting, setIsAutoPiloting] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("prodexa_handle_later")
    if (saved) setItems(JSON.parse(saved))
  }, [])

  function save(updated: DeferredItem[]) {
    setItems(updated)
    localStorage.setItem("prodexa_handle_later", JSON.stringify(updated))
  }

  function addItem() {
    if (!text.trim()) return
    const item: DeferredItem = {
      id: Date.now().toString(),
      text: text.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
      scheduledFor: null,
      status: "parked",
    }
    save([item, ...items])
    setText("")
    setNote("")
    setShowAdd(false)
  }

  function deleteItem(id: string) {
    save(items.filter((i) => i.id !== id))
  }

  function scheduleItem(id: string) {
    if (!scheduleDate) return
    save(
      items.map((i) =>
        i.id === id ? { ...i, scheduledFor: scheduleDate, status: "scheduled" as const } : i
      )
    )
    setSchedulingItem(null)
    setScheduleDate("")
  }

  function moveToTasks(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return

    // Save to tasks localStorage
    const existingTasks = JSON.parse(localStorage.getItem("prodexa_dump_tasks") || "[]")
    existingTasks.push({
      id: item.id,
      title: item.text,
      completed: false,
      source: "handle-later",
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem("prodexa_dump_tasks", JSON.stringify(existingTasks))

    // Mark as moved
    save(items.map((i) => (i.id === id ? { ...i, status: "moved" as const } : i)))
  }

  async function triggerAutoPilot() {
    const parkedItems = items.filter((i) => i.status === "parked")
    if (parkedItems.length === 0) return

    setIsAutoPiloting(true)
    try {
      const resp = await api.ai.handleLaterPlan(parkedItems)
      const planned = resp.items || []
      
      const newItems = items.map(original => {
        if (original.status !== "parked") return original
        const plannedMatch = planned.find((p: any) => p.id === original.id)
        if (plannedMatch && plannedMatch.scheduledFor) {
          return { ...original, status: "scheduled" as const, scheduledFor: plannedMatch.scheduledFor }
        }
        return original
      })
      
      save(newItems)
    } catch (err) {
      console.error("AutoPilot Failed", err)
    } finally {
      setIsAutoPiloting(false)
    }
  }

  const parkedItems = items.filter((i) => i.status === "parked")
  const scheduledItems = items.filter((i) => i.status === "scheduled")
  const movedItems = items.filter((i) => i.status === "moved")

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  function daysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="flex flex-col gap-8 -m-6 p-10 bg-background min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Handle Later</h1>
          <p className="mt-2 text-base text-muted-foreground/80 leading-relaxed">
            Park things you can&apos;t deal with right now. Come back when ready, or let the AI completely organize and schedule them into your calendar automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerAutoPilot}
            disabled={parkedItems.length === 0 || isAutoPiloting}
            className="flex items-center gap-2 rounded-full border border-border/50 bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:opacity-40 disabled:hover:scale-100 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            {isAutoPiloting ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI Auto-Pilot
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            <Plus className="h-4 w-4" />
            Park an Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border/50 bg-muted/5 p-6 transition-colors hover:bg-muted/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Parked</p>
          <p className="mt-3 text-4xl font-light tracking-tight text-foreground">{parkedItems.length}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-muted/5 p-6 transition-colors hover:bg-muted/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Scheduled</p>
          <p className="mt-3 text-4xl font-light tracking-tight text-foreground">{scheduledItems.length}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-muted/5 p-6 transition-colors hover:bg-muted/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Resolved</p>
          <p className="mt-3 text-4xl font-light tracking-tight text-foreground">{movedItems.length}</p>
        </div>
      </div>

      {/* Parked items */}
      <div>
        <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Parked Items
            </p>
        </div>
        {parkedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/40 py-16 bg-muted/5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background shadow-sm">
              <Clock className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Nothing parked</p>
              <p className="mt-1.5 text-sm text-muted-foreground/70">
                You're completely caught up. Clear headspace.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {parkedItems.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-foreground/30 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground leading-snug">{item.text}</p>
                    {item.note && (
                      <p className="mt-2 text-sm text-muted-foreground/80 leading-relaxed border-l-2 border-border/40 pl-3">{item.note}</p>
                    )}
                    <p className="mt-3 text-[11px] font-medium tracking-widest text-muted-foreground/50 uppercase">
                      Parked {daysSince(item.createdAt) === 0 ? "Today" : `${daysSince(item.createdAt)} days ago`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setSchedulingItem(item.id)
                        setScheduleDate("")
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      title="Schedule for later"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Pick Date
                    </button>
                    <button
                      onClick={() => moveToTasks(item.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      title="Move to tasks"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Make Task
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-muted-foreground/50 transition-colors hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Inline schedule picker */}
                {schedulingItem === item.id && (
                  <div className="mt-4 flex animate-in fade-in items-center gap-3 border-t border-border/40 pt-4">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40 dark:[color-scheme:dark]"
                    />
                    <button
                      onClick={() => scheduleItem(item.id)}
                      disabled={!scheduleDate}
                      className="rounded-lg bg-foreground px-5 py-2 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setSchedulingItem(null)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled items */}
      {scheduledItems.length > 0 && (
        <div className="mt-6 border-t border-border/40 pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Scheduled Pipeline
          </p>
          <div className="flex flex-col gap-3">
            {scheduledItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-xl border border-border/40 bg-card p-4 transition-colors hover:bg-muted/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.text}</p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {formatDate(item.scheduledFor!)}
                  </p>
                </div>
                <button
                  onClick={() => moveToTasks(item.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <ArrowRight className="h-3 w-3" />
                  To Tasks
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-muted-foreground/50 transition-colors hover:text-foreground p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moved items */}
      {movedItems.length > 0 && (
        <div className="mt-2 border-t border-border/40 pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Resolved & Moved to Tasks
          </p>
          <div className="flex flex-col gap-2">
            {movedItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border/20 bg-muted/5 px-4 py-3 opacity-50">
                <CheckCircle2 className="h-4 w-4 text-foreground/50" />
                <span className="flex-1 text-sm font-medium text-muted-foreground line-through">{item.text}</span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-muted-foreground/40 transition-colors hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Park Something</h2>
              <button
                onClick={() => { setShowAdd(false); setText(""); setNote("") }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="What do you want to handle later?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-foreground/40"
              />
              <textarea
                placeholder="Add a note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-foreground/40"
              />
              <button
                onClick={addItem}
                disabled={!text.trim()}
                className="rounded-lg bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Park It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
