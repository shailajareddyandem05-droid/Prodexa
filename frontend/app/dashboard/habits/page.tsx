"use client"

import { useState, useEffect, KeyboardEvent } from "react"
import { Sparkles, Plus, X, Flame, CheckCircle2, Circle, Trash2, Activity, Target, Workflow, Trophy, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface Habit {
  id: string
  name: string
  history: Record<string, boolean> // "2026-03-13" -> true/false
}

function getToday() {
  return new Date().toISOString().split("T")[0]
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split("T")[0])
  }
  return days
}

function getStreak(habit: Habit): number {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    if (habit.history[key]) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { weekday: "short" })
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  
  // Smart Input State
  const [smartInput, setSmartInput] = useState("")

  // AI States
  const [isGeneratingBreakdown, setIsGeneratingBreakdown] = useState(false)
  const [suggestedHabits, setSuggestedHabits] = useState<string[]>([])
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)
  const [currentInsight, setCurrentInsight] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("prodexa_habits")
    if (saved) setHabits(JSON.parse(saved))
  }, [])

  function save(updated: Habit[]) {
    setHabits(updated)
    localStorage.setItem("prodexa_habits", JSON.stringify(updated))
  }

  function addHabit(nameToUse?: string) {
    const targetName = nameToUse || newName.trim()
    if (!targetName) return
    const habit: Habit = {
      id: Date.now().toString(),
      name: targetName,
      history: {},
    }
    save([...habits, habit])
    if (!nameToUse) {
      setNewName("")
      setShowAdd(false)
    }
  }

  function handleSmartSubmit(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && smartInput.trim()) {
      addHabit(smartInput.trim())
      setSmartInput("")
    }
  }

  function toggleDay(habitId: string, date: string) {
    save(
      habits.map((h) =>
        h.id === habitId
          ? { ...h, history: { ...h.history, [date]: !h.history[date] } }
          : h
      )
    )
  }

  function deleteHabit(habitId: string) {
    save(habits.filter((h) => h.id !== habitId))
  }

  async function handleBreakdown() {
    if (!smartInput.trim()) return
    setIsGeneratingBreakdown(true)
    setSuggestedHabits([])
    try {
      const res = await api.ai.habitBreakdown(smartInput.trim())
      if (res.habits) setSuggestedHabits(res.habits)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingBreakdown(false)
    }
  }

  async function handleInsight() {
    if (habits.length === 0) return
    setIsGeneratingInsight(true)
    try {
      const res = await api.ai.habitInsights(habits)
      if (res.insight) setCurrentInsight(res.insight)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingInsight(false)
    }
  }

  const today = getToday()
  const last7 = getLast7Days()
  const completedToday = habits.filter((h) => h.history[today]).length

  return (
    <div className="flex flex-col gap-8 max-w-5xl w-full mx-auto pb-12">
      
      {/* Header & Smart Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6" /> Habits
          </h1>
          <button
            onClick={handleInsight}
            disabled={habits.length === 0 || isGeneratingInsight}
            className="flex items-center gap-2 rounded-full border border-border/50 bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            {isGeneratingInsight ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Sparkles className="h-4 w-4 text-foreground" />
            )}
            AI Performance Review
          </button>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Target className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          </div>
          <input 
            type="text"
            value={smartInput}
            onChange={e => setSmartInput(e.target.value)}
            onKeyDown={handleSmartSubmit}
            placeholder="Type a habit (e.g. 'Read 10 pages') OR a goal to break down (e.g. 'Get fit')"
            className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-32 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-foreground/30 focus:shadow-sm"
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            <button
               onClick={handleBreakdown}
               disabled={!smartInput.trim() || isGeneratingBreakdown}
               className="flex items-center gap-1.5 px-3 py-1.5 mr-1 bg-muted rounded-xl text-xs font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:pointer-events-none"
             >
               {isGeneratingBreakdown ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
               <span className="hidden sm:inline">AI Suggest</span>
            </button>
            <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase border border-border px-2 py-1 rounded-[8px] hidden sm:block mr-2">
               ⏎ Add
            </span>
          </div>
        </div>

        {/* AI Suggested Habits */}
        {suggestedHabits.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 mt-2 flex flex-wrap gap-2 items-center p-2 rounded-xl border border-border/30 bg-muted/5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mr-2 border-r border-border/40">
               Suggestions
            </span>
            {suggestedHabits.map((habit, idx) => (
               <button 
                 key={idx} 
                 onClick={() => { addHabit(habit); setSuggestedHabits(prev => prev.filter(h => h !== habit)) }} 
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border/60 shadow-sm rounded-full text-xs font-medium hover:border-foreground/40 text-foreground transition-all hover:-translate-y-0.5"
               >
                  <Plus className="h-3.5 w-3.5" />
                  {habit}
               </button>
            ))}
            <button
              onClick={() => setSuggestedHabits([])}
              className="ml-auto p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* AI Performance Insight Callout */}
      {currentInsight && (
        <div className="animate-in slide-in-from-bottom-4 fade-in relative overflow-hidden rounded-2xl bg-foreground text-background p-6 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles className="h-32 w-32 -mt-4 -mr-4" />
          </div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex gap-4 sm:gap-6">
              <div className="h-10 w-10 shrink-0 rounded-full bg-background/20 flex items-center justify-center shadow-inner">
                <Sparkles className="h-5 w-5 text-background" />
              </div>
              <div className="pt-0.5">
                 <h3 className="font-semibold text-lg tracking-tight mb-2">Coach's Review</h3>
                 <p className="text-background/90 leading-relaxed text-sm lg:text-base pr-8">{currentInsight}</p>
              </div>
            </div>
            <button onClick={() => setCurrentInsight("")} className="shrink-0 p-2 hover:bg-background/20 rounded-full transition-colors text-background/60 hover:text-background active:scale-95">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modern Typographic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between overflow-hidden relative group">
          <div className="mb-6 flex items-center justify-between z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total Habits</p>
            <Workflow className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
          </div>
          <p className="text-4xl font-bold text-foreground tracking-tight z-10">{habits.length}</p>
        </div>
        
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between relative group overflow-hidden">
          <div className="mb-6 flex items-center justify-between z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Done Today</p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
          </div>
          <p className="text-4xl font-bold text-foreground tracking-tight z-10">
            {completedToday}<span className="text-xl text-muted-foreground font-medium">/{habits.length}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between relative group overflow-hidden">
          <div className="mb-6 flex items-center justify-between z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Completion</p>
            <Trophy className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
          </div>
          <p className="text-4xl font-bold text-foreground tracking-tight z-10 flex items-baseline gap-1">
            {habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0}<span className="text-xl text-muted-foreground font-medium">%</span>
          </p>
        </div>
      </div>

      {/* Habits list */}
      <div className="flex flex-col gap-3 mt-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1 border-b border-border pb-2">
          Tracking Grid
        </h2>
        
        {habits.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/10 opacity-70 mt-4">
             <p className="text-sm font-medium text-foreground">Blank Slate</p>
             <p className="text-xs text-muted-foreground">Type a habit above and hit enter to start tracking.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden mt-2">
            
            {/* Header row */}
            <div className="flex items-center border-b border-border/50 bg-muted/20 px-4 sm:px-6 py-4">
              <div className="flex-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Routine
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {last7.map((d) => (
                  <div key={d} className="w-8 sm:w-10 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {getDayLabel(d)}
                  </div>
                ))}
              </div>
              <div className="w-12 sm:w-16 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">
                Streak
              </div>
              <div className="w-8" />
            </div>

            {/* Habit rows */}
            <div className="flex flex-col">
              {habits.map((habit) => {
                const streak = getStreak(habit)
                return (
                  <div key={habit.id} className="group flex items-center border-b border-border/50 px-4 sm:px-6 py-4 transition-colors hover:bg-muted/10 last:border-0">
                    <div className="flex-1 min-w-0 pr-4">
                       <p className="text-sm font-medium text-foreground truncate">{habit.name}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      {last7.map((d) => (
                        <div key={d} className="flex w-8 sm:w-10 items-center justify-center">
                          <button
                            onClick={() => toggleDay(habit.id, d)}
                            className="transition-transform hover:scale-110 active:scale-95"
                            aria-label={`Toggle ${habit.name} for ${d}`}
                          >
                            {habit.history[d] ? (
                              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
                            ) : (
                              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border border-border/70 hover:border-foreground/40 transition-colors bg-background" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex w-12 sm:w-16 items-center justify-center gap-1.5 ml-2">
                      <Flame className={`h-3.5 w-3.5 ${streak > 0 ? "text-foreground" : "text-muted-foreground/30"}`} />
                      <span className={`text-sm tracking-tight ${streak > 0 ? "font-bold text-foreground" : "font-medium text-muted-foreground/50"}`}>{streak}</span>
                    </div>
                    
                    <div className="flex w-8 items-center justify-end">
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive rounded-md"
                        aria-label="Delete habit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
