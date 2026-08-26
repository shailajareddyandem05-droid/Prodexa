"use client"

import { useState, useEffect } from "react"
import { BrainCircuit, Sparkles, ArrowRight, CheckCircle2, Trash2, X, Loader2 } from "lucide-react"

interface ExtractedItem {
  id: string
  text: string
  type: "task" | "idea" | "note"
}

interface DumpEntry {
  id: string
  rawText: string
  extractedItems: ExtractedItem[]
  timestamp: string
}

import { api } from "@/lib/api"

export default function DumpModePage() {
  const [rawText, setRawText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([])
  const [history, setHistory] = useState<DumpEntry[]>([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("prodexa_dumps")
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  function saveHistory(updated: DumpEntry[]) {
    setHistory(updated)
    localStorage.setItem("prodexa_dumps", JSON.stringify(updated))
  }

  async function handleDump() {
    if (!rawText.trim()) return
    setIsProcessing(true)

    try {
      const resp = await api.ai.dumpOrganize(rawText)
      // The API returns an array, we ensure each item has an ID and a valid type
      const items: ExtractedItem[] = (resp.items || []).map((i: any, idx: number) => ({
        id: `${Date.now()}-${idx}`,
        text: i.text || "Unknown item",
        type: ["task", "idea", "note"].includes(i.type) ? i.type : "note"
      }))

      setExtractedItems(items)
      setShowResults(true)

      // Save to history
      const entry: DumpEntry = {
        id: Date.now().toString(),
        rawText: rawText.trim(),
        extractedItems: items,
        timestamp: new Date().toISOString(),
      }
      saveHistory([entry, ...history])
    } catch (error) {
       console.error("AI dump failed", error)
    } finally {
       setIsProcessing(false)
    }
  }

  function saveToTasks() {
    // Save extracted tasks to the tasks localStorage
    const existingTasks = JSON.parse(localStorage.getItem("prodexa_dump_tasks") || "[]")
    const newTasks = extractedItems
      .filter((item) => item.type === "task")
      .map((item) => ({
        id: item.id,
        title: item.text,
        completed: false,
        source: "dump",
        createdAt: new Date().toISOString(),
      }))
    localStorage.setItem("prodexa_dump_tasks", JSON.stringify([...newTasks, ...existingTasks]))

    // Reset
    setRawText("")
    setExtractedItems([])
    setShowResults(false)
  }

  function removeItem(id: string) {
    setExtractedItems(extractedItems.filter((item) => item.id !== id))
  }

  function clearHistory() {
    saveHistory([])
  }

  const typeColors = {
    task: "border-border/50 bg-muted/10",
    idea: "border-border/50 bg-background",
    note: "border-border/50 bg-muted/5",
  }

  const typeLabels = {
    task: "Task",
    idea: "Idea",
    note: "Note",
  }

  if (showResults && extractedItems.length > 0) {
    return (
      <div className="flex flex-col gap-8 -m-6 p-10 bg-background min-h-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">AI structuring complete.</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We extracted {extractedItems.length} distinct items from your input.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowResults(false)
                setExtractedItems([])
                setRawText("")
              }}
              className="rounded-full border border-border/50 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              New Dump
            </button>
            <button
              onClick={saveToTasks}
              className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save to Tasks
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-6">
          {(["task", "idea", "note"] as const).map((type) => {
            const count = extractedItems.filter((i) => i.type === type).length
            return (
              <div key={type} className="rounded-2xl border border-border/50 bg-muted/5 p-6 transition-colors hover:bg-muted/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {typeLabels[type]}s
                </p>
                <p className="mt-3 text-4xl font-light tracking-tight text-foreground">{count}</p>
              </div>
            )
          })}
        </div>

        {/* Extracted items */}
        <div className="flex flex-col gap-3">
          {extractedItems.map((item, i) => (
            <div
              key={item.id}
              className={`animate-in slide-in-from-bottom-4 fade-in group flex items-start gap-4 rounded-2xl border p-5 transition-colors hover:border-border ${typeColors[item.type]}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="mt-0.5 w-[60px] shrink-0">
                <span className="rounded-md border border-border/50 bg-background px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {typeLabels[item.type]}
                </span>
              </div>
              <span className="flex-1 text-sm leading-relaxed text-foreground/90">{item.text}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground/50 hover:text-foreground p-1"
                title="Remove Item"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 -m-6 p-10 bg-background min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Brain Dump</h1>
        <p className="mt-2 text-base text-muted-foreground/80 leading-relaxed">
          Unload everything on your mind into the canvas below. Do not filter. 
          The AI will automatically parse the chaos into categorized Tasks, Ideas, and Notes.
        </p>
      </div>

      {/* Input area */}
      <div className="rounded-2xl border border-border/50 bg-muted/5 p-1 pb-2 shadow-sm focus-within:ring-1 focus-within:ring-foreground/20 focus-within:border-foreground/30 transition-all">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="I need to finish the DSA assignment by Friday. Also should prepare for the OS mid-term. Maybe I could start that ML project idea. Need to buy groceries. What if I try the new study technique..."
          rows={12}
          className="w-full resize-none rounded-xl bg-transparent px-6 py-6 text-base leading-relaxed text-foreground placeholder-muted-foreground/50 outline-none"
        />
        <div className="mt-2 flex items-center justify-between px-5 py-2 border-t border-border/10">
          <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest">
            {rawText.length > 0
              ? `${rawText.split(/[.\n]/).filter((s) => s.trim().length > 3).length} fragments block`
              : "Awaiting input"}
          </p>
          <button
            onClick={handleDump}
            disabled={!rawText.trim() || isProcessing}
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 disabled:opacity-40 disabled:hover:scale-100 hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-background/70" />
                <span>Organizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>AI Organize</span>
                <ArrowRight className="h-4 w-4 opacity-70 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8 border-t border-border/40 pt-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Archived Dumps
            </p>
            <button
              onClick={clearHistory}
              className="group flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
              Clear Archive
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.slice(0, 6).map((entry) => (
              <div
                key={entry.id}
                className="group rounded-2xl border border-border/50 bg-card p-5 transition-all hover:bg-muted/10 hover:border-foreground/20 cursor-default"
              >
                <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">{entry.rawText}</p>
                <div className="mt-4 flex items-center gap-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="text-foreground/70">{entry.extractedItems.length} items</span>
                  <span>·</span>
                  <span>
                    {new Date(entry.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
