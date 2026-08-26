"use client"

import { useState, useEffect, KeyboardEvent } from "react"
import {
  Sparkles,
  Circle,
  CheckCircle2,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Bot,
  Loader2,
  Trash2,
  CornerDownRight,
  CalendarDays,
  ListTodo
} from "lucide-react"
import { api } from "@/lib/api"

interface Task {
  id: string
  title: string
  due: string
  priority: "high" | "medium" | "low"
  done: boolean
  source: "manual" | "ai"
  parentId?: string
}

const priorityConfig = {
  high: { icon: ArrowUp, label: "High" },
  medium: { icon: ArrowRight, label: "Medium" },
  low: { icon: ArrowDown, label: "Low" },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  
  // Magic Bar State
  const [magicInput, setMagicInput] = useState("")
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicError, setMagicError] = useState<string | null>(null)

  // Breakdown State
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      const data = await api.tasks.list()
      setTasks(data.tasks || [])
    } catch (err) {
      console.error("Failed to load tasks:", err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(id: string, currentDone: boolean) {
    try {
      await api.tasks.update(id, { done: !currentDone })
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
    } catch (err) {
      console.error("Failed to toggle task:", err)
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return
    try {
      await api.tasks.delete(id)
      // also optimally delete children logically, but for now just filter out visually
      setTasks((prev) => prev.filter((t) => t.id !== id && t.parentId !== id))
    } catch (err) {
      console.error("Failed to delete task", err)
    }
  }

  /* Magic Bar Execution */
  async function handleMagicSubmit(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && magicInput.trim()) {
      setMagicLoading(true)
      setMagicError(null)
      try {
        const res = await api.ai.magicTasks(magicInput)
        const generatedTasks = res.tasks || []
        
        // Save them sequentially or parallelly
        const newTasks: Task[] = []
        for (const t of generatedTasks) {
          const saved = await api.tasks.create({
            title: t.title || "Untitled",
            due: t.due || "No date",
            priority: t.priority || "medium",
            source: "ai"
          })
          newTasks.push(saved)
        }
        
        setTasks((prev) => [...newTasks, ...prev])
        setMagicInput("")
      } catch (err: any) {
        setMagicError(err.message)
      } finally {
        setMagicLoading(false)
      }
    }
  }

  /* Breakdown Task Execution */
  async function handleBreakdown(task: Task) {
    setBreakingDownId(task.id)
    try {
      const res = await api.ai.breakdownTask(task.title)
      const subtasks = res.tasks || []
      
      const newSubtasks: Task[] = []
      for (const st of subtasks) {
        const saved = await api.tasks.create({
          title: st.title || "Subtask",
          due: st.due || task.due,
          priority: st.priority || task.priority,
          source: "ai",
          parentId: task.id
        })
        newSubtasks.push(saved)
      }
      
      setTasks((prev) => [...newSubtasks, ...prev])
    } catch (err) {
      console.error("Failed to breakdown task:", err)
    } finally {
      setBreakingDownId(null)
    }
  }

  // Derived state
  const parentTasks = tasks.filter(t => !t.parentId)
  const todayTasks = parentTasks.filter(t => t.due?.toLowerCase().includes("today"))
  const upcomingTasks = parentTasks.filter(t => !t.due?.toLowerCase().includes("today"))

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Sub-component for rendering a task and its children
  const TaskTree = ({ task }: { task: Task }) => {
    const subtasks = tasks.filter(t => t.parentId === task.id)
    const PriorityIcon = priorityConfig[task.priority]?.icon || ArrowRight

    return (
      <div className="flex flex-col mb-1.5 animate-in fade-in slide-in-from-bottom-2">
        {/* Parent Task UI */}
        <div className={`group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/30 ${task.done ? 'opacity-60' : ''}`}>
          <button onClick={() => toggleTask(task.id, task.done)} className="shrink-0 transition-transform hover:scale-110">
            {task.done ? (
              <CheckCircle2 className="h-5 w-5 text-foreground" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          
          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
            <span className={`text-sm font-medium truncate ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {task.title}
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <CalendarDays className="h-3 w-3" /> {task.due}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <PriorityIcon className="h-3 w-3" /> {task.priority}
              </span>
              {task.source === "ai" && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Bot className="h-3 w-3" /> AI
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            {!task.done && subtasks.length === 0 && (
              <button 
                onClick={() => handleBreakdown(task)}
                disabled={breakingDownId === task.id}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {breakingDownId === task.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3 text-muted-foreground"/>}
                Breakdown
              </button>
            )}
            <button 
              onClick={() => deleteTask(task.id)}
              className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Subtasks Container */}
        {subtasks.length > 0 && (
          <div className="relative mt-1 ml-6 pl-4 flex flex-col gap-1 border-l-2 border-border/50">
            {subtasks.map(sub => {
              const SubPriorityIcon = priorityConfig[sub.priority]?.icon || ArrowRight
              return (
                <div key={sub.id} className={`group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:bg-muted/30 ${sub.done ? 'opacity-60' : ''}`}>
                  <CornerDownRight className="h-3 w-3 text-muted-foreground/40 absolute -left-[7px] bg-background" />
                  
                  <button onClick={() => toggleTask(sub.id, sub.done)} className="shrink-0 transition-transform hover:scale-110 z-10">
                    {sub.done ? (
                      <CheckCircle2 className="h-4 w-4 text-foreground" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className={`text-xs ${sub.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {sub.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                     <button 
                        onClick={() => deleteTask(sub.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl w-full mx-auto pb-12">
      
      {/* Magic Bar Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2 mb-2">
           <ListTodo className="h-6 w-6" /> Tasks
        </h1>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            {magicLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
            ) : (
              <Sparkles className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            )}
          </div>
          <input 
            type="text"
            value={magicInput}
            onChange={e => setMagicInput(e.target.value)}
            onKeyDown={handleMagicSubmit}
            disabled={magicLoading}
            placeholder="Type naturally... e.g. 'Remind me to call sarah tomorrow at high priority'"
            className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-6 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-foreground/30 focus:shadow-sm disabled:opacity-60"
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
             <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase border border-border px-2 py-0.5 rounded-md hidden sm:block">
               ENTER to Create
             </span>
          </div>
        </div>
        {magicError && <p className="text-xs text-red-500 font-medium pl-2">{magicError}</p>}
      </div>

      {/* Task Views */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="flex flex-col gap-3">
           <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1 border-b border-border pb-2">
             Today Focus
           </h2>
           {todayTasks.length === 0 ? (
             <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/10 opacity-70">
                <p className="text-sm font-medium text-foreground">Clear schedule</p>
                <p className="text-xs text-muted-foreground">You have no tasks assigned for today.</p>
             </div>
           ) : (
             <div className="flex flex-col mt-2">
                {todayTasks.map(t => <TaskTree key={t.id} task={t} />)}
             </div>
           )}
        </div>

        <div className="flex flex-col gap-3">
           <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1 border-b border-border pb-2">
             Upcoming / Scheduled
           </h2>
           {upcomingTasks.length === 0 ? (
             <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/10 opacity-70">
                <p className="text-sm font-medium text-foreground">Nothing upcoming</p>
                <p className="text-xs text-muted-foreground">Use the magic bar to queue up work.</p>
             </div>
           ) : (
             <div className="flex flex-col mt-2">
                {upcomingTasks.map(t => <TaskTree key={t.id} task={t} />)}
             </div>
           )}
        </div>

      </div>
    </div>
  )
}
