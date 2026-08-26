"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Mail,
  Inbox,
  FileText,
  ChevronRight,
  Smile,
  Activity,
  Loader2,
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  X
} from "lucide-react"
import { MoodPopup } from "@/components/dashboard/mood-popup"
import { api } from "@/lib/api"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

// -- Circular Progress --
function CircularProgress({ percentage }: { percentage: number }) {
  const r = 36
  const c = 2 * Math.PI * r
  const offset = c - (percentage / 100) * c
  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tracking-tight text-foreground drop-shadow-sm">{percentage}</span>
        <span className="text-[10px] uppercase font-bold text-muted-foreground">%</span>
      </div>
    </div>
  )
}

// -- Stat box --
function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between group transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:shadow-md group-hover:scale-105">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</p>
      </div>
      <p className="text-2xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform">{value}</p>
    </div>
  )
}

// -- Mood & Stress Display --
const moodEmojis: Record<string, string> = {
  Happy: "\u{1F60A}", Calm: "\u{1F60C}", Neutral: "\u{1F610}", Sad: "\u{1F614}", Angry: "\u{1F621}",
}

const moodColors: Record<string, string> = {
  Happy: "from-foreground/5 to-transparent border-border",
  Calm: "from-foreground/5 to-transparent border-border",
  Neutral: "from-foreground/5 to-transparent border-border",
  Sad: "from-foreground/5 to-transparent border-border",
  Angry: "from-foreground/5 to-transparent border-border",
}

function MoodStressDisplay({ mood, stress }: { mood: string; stress: number }) {
  function getStressLabel() {
    if (stress <= 20) return "Very Low"
    if (stress <= 40) return "Low"
    if (stress <= 60) return "Moderate"
    if (stress <= 80) return "High"
    return "Very High"
  }

  const moodColor = moodColors[mood] || moodColors.Neutral

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Mood card */}
      <div className={`flex-1 rounded-3xl border bg-gradient-to-br ${moodColor} p-6 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
        <div className="mb-6 flex items-center justify-between z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Today's Mood</p>
          <Smile className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
        </div>
        <div className="flex items-end justify-between z-10">
          <p className="text-3xl font-black text-foreground tracking-tighter">{mood}</p>
          <span className="text-4xl filter drop-shadow-md transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">{moodEmojis[mood] || "\u{1F610}"}</span>
        </div>
      </div>

      {/* Stress card */}
      <div className="flex-1 rounded-3xl border border-border bg-card p-6 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="mb-6 flex items-center justify-between z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Stress Level</p>
          <Activity className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
        </div>
        
        <div className="flex items-end justify-between z-10 mb-2">
          <p className="text-4xl font-black text-foreground tracking-tighter">{stress}<span className="text-xl text-muted-foreground/50 font-semibold">%</span></p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-foreground/5 px-2 py-1 rounded-md">{getStressLabel()}</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted z-10">
           <div className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)] ${stress > 70 ? 'bg-destructive' : 'bg-foreground'}`} style={{ width: `${stress}%` }} />
        </div>
      </div>
    </div>
  )
}

// -- Daily routine (Timeline layout) --
function DailyRoutineCard() {
  const [routine, setRoutine] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard.routine()
      .then((data) => setRoutine(data.routine || []))
      .catch((err) => console.error("Failed to load routine:", err))
      .finally(() => setLoading(false))
  }, [])

  async function toggleItem(id: string, currentDone: boolean) {
    try {
      await api.dashboard.toggleRoutine(id, !currentDone)
      setRoutine((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
    } catch (err) {
      console.error("Failed to toggle routine item:", err)
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
         <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daily Routine</h3>
         <Target className="h-4 w-4 text-muted-foreground/60" />
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col relative">
          {routine.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-60">
               <Target className="h-8 w-8 text-muted-foreground mb-3" />
               <p className="text-sm font-medium text-foreground tracking-tight">No routine configured.</p>
               <p className="text-xs text-muted-foreground mt-1">Visit settings to set up habits.</p>
            </div>
          ) : (
            <>
              {/* Timeline background line */}
              <div className="absolute left-[21px] top-4 bottom-4 w-px bg-border/40 z-0"></div>
              
              {routine.map((item, idx) => (
                <div key={item.id} className="group relative flex items-center gap-6 p-2 z-10">
                  <button onClick={() => toggleItem(item.id, item.done)} className="shrink-0 transition-transform duration-300 hover:scale-110 active:scale-95 bg-card relative">
                    {item.done ? (
                      <CheckCircle2 className="h-7 w-7 text-background bg-foreground rounded-full" />
                    ) : (
                      <div className="h-7 w-7 rounded-full border-2 border-border transition-colors duration-300 group-hover:border-foreground/40 bg-card" />
                    )}
                  </button>
                  <div className="flex flex-col flex-1 pb-1">
                    <span className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">{item.time}</span>
                    <span className={`text-sm font-bold tracking-tight transition-all duration-300 ${item.done ? "text-muted-foreground line-through opacity-50 translate-x-1" : "text-foreground"}`}>
                      {item.activity}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// -- Week progress (Empirical) --
function WeekProgressCard() {
  const [weekData, setWeekData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard.weekProgress()
      .then((data) => setWeekData(data.weekData || []))
      .catch((err) => console.error("Failed to load week progress:", err))
      .finally(() => setLoading(false))
  }, [])

  const avg = weekData.length > 0 ? Math.round(weekData.reduce((s, d) => s + d.tasks, 0) / weekData.length) : 0
  const isEmpty = weekData.length > 0 && weekData.every(d => d.tasks === 0 && d.focus === 0 && d.stress === 30)

  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-foreground/5 rounded-full blur-3xl group-hover:bg-foreground/10 transition-colors duration-1000 z-0" />

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50 z-10">
         <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Weekly Velocity</h3>
         <div className="flex items-center gap-2 bg-foreground/5 rounded-full px-3 py-1 shadow-sm border border-border/50">
           <TrendingUp className="h-3 w-3 text-foreground" />
           <span className="text-[10px] font-black uppercase text-foreground">Avg {avg}/day</span>
         </div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center z-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 z-10 py-10">
           <Activity className="h-8 w-8 text-muted-foreground mb-3" />
           <p className="text-sm font-medium text-foreground tracking-tight">No data yet.</p>
           <p className="text-xs text-muted-foreground mt-1">Complete tasks to see your velocity.</p>
        </div>
      ) : (
        <div className="flex-1 w-full h-full pt-4 min-h-[160px] z-10 text-xs font-bold uppercase tracking-wider">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={weekData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
               <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5, fontWeight: 'bold' }} dy={10} />
               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5, fontWeight: 'bold' }} />
               <Tooltip
                 contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                 itemStyle={{ fontSize: 13, fontWeight: 700 }}
                 labelStyle={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--muted-foreground))', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}
               />
               <Line type="monotone" dataKey="tasks" stroke="hsl(var(--foreground))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 6, strokeWidth: 0 }} name="Tasks Done" />
               <Line type="monotone" dataKey="focus" stroke="hsl(var(--muted-foreground))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 6, strokeWidth: 0 }} name="Focus (Hrs)" />
             </LineChart>
           </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// -- Page --
export default function DashboardPage() {
  const [showMoodPopup, setShowMoodPopup] = useState(false)
  const [mood, setMood] = useState<string | null>(null)
  const [stress, setStress] = useState<number | null>(null)
  
  const [stats, setStats] = useState<any>(null)
  const [mailStats, setMailStats] = useState<{ today: number, unread: number, connected: boolean } | null>(null)
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)

  // AI Suggestion State
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [fetchingSuggestion, setFetchingSuggestion] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        // Parallel requests for max speed
        const [moodData, statsData, gStatus, tasksData] = await Promise.all([
          api.mood.get().catch(() => ({ mood: null })),
          api.dashboard.stats().catch(() => null),
          api.google.getStatus().catch(() => ({ connected: false })),
          api.tasks.list().catch(() => [])
        ])

        // Handle Mood
        if (moodData && moodData.mood) {
           setMood(moodData.mood)
           setStress(moodData.stress)
        } else {
           const stored = sessionStorage.getItem("prodexa_mood")
           if (stored) {
             const parsed = JSON.parse(stored)
             setMood(parsed.mood)
             setStress(parsed.stress)
           } else {
             setShowMoodPopup(true)
           }
        }

        // Handle Dashboard Stats
        if (statsData) setStats(statsData)

        // Handle Upcoming Tasks
        if (tasksData && tasksData.length > 0) {
           const pending = tasksData.filter((t: any) => !t.done)
           // Sort logic: high priority first, then by earliest due date
           const prioMap = { "high": 3, "medium": 2, "low": 1, "none": 0 }
           pending.sort((a: any, b: any) => {
             const pA = prioMap[(a.priority || "none") as keyof typeof prioMap]
             const pB = prioMap[(b.priority || "none") as keyof typeof prioMap]
             if (pA !== pB) return pB - pA // descending
             if (a.due && b.due) return new Date(a.due).getTime() - new Date(b.due).getTime()
             if (a.due) return -1
             if (b.due) return 1
             return 0
           })
           setUpcomingTasks(pending.slice(0, 2)) // Show top 2
        }

        // Handle Live Gmail Stats (only if connected)
        if (gStatus.connected) {
           try {
             const msgs = await api.google.gmailMessages()
             // Simple proxy count:
             setMailStats({
               today: msgs.messages?.length || 0,
               unread: msgs.messages?.length || 0,
               connected: true
             })
           } catch {
             setMailStats({ today: 0, unread: 0, connected: true })
           }
        } else {
           setMailStats({ today: 0, unread: 0, connected: false })
        }

      } catch (err) {
        console.error("Failed to load dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleMoodComplete(m: string, s: number) {
    setMood(m)
    setStress(s)
    setShowMoodPopup(false)
    sessionStorage.setItem("prodexa_mood", JSON.stringify({ mood: m, stress: s }))
    try {
      await api.mood.log({ mood: m, stress: s })
    } catch (err) { }
  }

  const taskStats = stats?.tasks || { total: 0, completed: 0, pending: 0, percentage: 0 }
  
  const [showAiModal, setShowAiModal] = useState(false)

  function openAiAction() {
    setShowAiModal(true)
    if (!aiSuggestion && !fetchingSuggestion && mood && stress !== null) {
      setFetchingSuggestion(true)
      const pendingTitles = upcomingTasks.map(t => t.title).join(", ")
      const prompt = `The user is feeling ${mood} with ${stress}% stress. They have ${taskStats.pending} pending tasks total. Immediate priorities: ${pendingTitles || "None specifically identified."}. 
      Write a highly personalized, structured 3-step action plan recommending exactly what they should do next. Keep it concise, punchy, and formatting with bullet points. Be motivational or calming depending on their mood/stress.`
      
      api.ai.chat(prompt, [], "coach", undefined, false)
        .then(res => setAiSuggestion(res.reply))
        .catch(() => setAiSuggestion("• Focus on your highest priority task first.\n• Break your work into 25-minute Pomodoro sessions.\n• Step away for a quick break to manage stress levels."))
        .finally(() => setFetchingSuggestion(false))
    }
  }

  async function handleGoogleConnect() {
    setGoogleLoading(true)
    try {
      const data = await api.google.getAuthUrl()
      if (data.url) {
        const popup = window.open(data.url, 'googleAuth', 'width=500,height=600')
        const timer = setInterval(() => {
          if (!popup) {
            clearInterval(timer)
            setGoogleLoading(false)
            return
          }
          if (popup.closed) {
            clearInterval(timer)
            api.google.getStatus().then(res => {
              if (res.connected) window.location.reload()
              setGoogleLoading(false)
            }).catch(() => setGoogleLoading(false))
            return
          }
          try {
            if (popup.location.href.includes("google=success")) {
              popup.close()
              clearInterval(timer)
              api.google.getStatus().then(res => {
                if (res.connected) window.location.reload()
                setGoogleLoading(false)
              }).catch(() => setGoogleLoading(false))
            }
          } catch (e) {
            // Ignore cross-origin error
          }
        }, 500)
      } else {
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error("Failed to get Google auth URL:", err)
      setGoogleLoading(false)
    }
  }

  // Custom aesthetic coloring for AI briefing
  const aiBriefingColor = mood && moodColors[mood] ? moodColors[mood] : "from-foreground/5 to-transparent border-border"

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {showMoodPopup && <MoodPopup onComplete={handleMoodComplete} />}

      {/* AI Action Plan Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground tracking-tight">AI Action Plan</h3>
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Personalized Strategy</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                 <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 min-h-[140px] bg-foreground/5 rounded-2xl p-5 border border-border/50">
              {fetchingSuggestion ? (
                <div className="flex flex-col gap-4 h-full justify-center">
                  <div className="flex items-center gap-3 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing Data...
                  </div>
                  <div className="h-3 w-3/4 rounded-full bg-muted/60 animate-pulse"></div>
                  <div className="h-3 w-full rounded-full bg-muted/60 animate-pulse"></div>
                  <div className="h-3 w-5/6 rounded-full bg-muted/60 animate-pulse"></div>
                </div>
              ) : (
                <div className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                  {aiSuggestion}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full flex-col sm:flex-row">
               <Link href="/dashboard/tasks" className="w-full rounded-xl bg-foreground text-background py-3.5 font-bold text-center text-xs uppercase tracking-widest transition-transform hover:scale-[1.02] shadow-sm">
                 Take Me to Tasks
               </Link>
               {(stress ?? 50) > 60 ? (
                 <Link href="/dashboard/stress-relief" className="w-full rounded-xl bg-transparent text-foreground py-3.5 font-bold text-center text-xs uppercase tracking-widest transition-all hover:bg-muted border border-border shadow-sm">
                   Reduce Stress
                 </Link>
               ) : (
                 <Link href="/dashboard/focus" className="w-full rounded-xl bg-transparent text-foreground py-3.5 font-bold text-center text-xs uppercase tracking-widest transition-all hover:bg-muted border border-border shadow-sm">
                   Head to Focus Mode
                 </Link>
               )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 max-w-[1400px] w-full mx-auto pb-12">
        
        {/* Dynamic AI Briefing Component */}
        <div className={`rounded-3xl bg-gradient-to-r ${aiBriefingColor} border p-8 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500 relative overflow-hidden backdrop-blur-md`}>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-foreground" />
          
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-foreground text-background shrink-0 shadow-lg rotate-3 group-hover:rotate-12 transition-transform duration-500">
             <Sparkles className="h-7 w-7" />
          </div>
          
          <div className="flex-1 w-full">
             <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground drop-shadow-sm">Good Morning.</h2>
             <p className="text-sm font-medium text-muted-foreground mt-1.5 max-w-3xl leading-relaxed">
               You're feeling <span className="text-foreground font-bold">{mood?.toLowerCase() || 'focused'}</span> today with <span className="text-foreground font-bold">{stress ?? 50}%</span> stress. You have <strong>{taskStats.pending} pending tasks</strong> and <strong>{mailStats?.connected ? mailStats.unread : 'disconnected'} unread emails</strong>. Let's systematically knock them out.
             </p>
          </div>
          
          {/* Execute Button */}
          <button onClick={openAiAction} className="shrink-0 w-full md:w-auto group rounded-2xl bg-foreground text-background border border-foreground pl-5 pr-6 py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-ring">
             <div className="flex items-center justify-center p-1 bg-background/20 rounded-md">
               <Sparkles className="h-4 w-4" />
             </div>
             Get Action Plan
          </button>
        </div>

        {/* Top block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Tasks Hero */}
          <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            {/* Glow orb */}
            <div className="absolute -left-32 -top-32 w-64 h-64 bg-foreground/5 rounded-full blur-3xl group-hover:bg-foreground/10 transition-colors duration-1000 z-0" />
            
            <div className="mb-8 flex items-center justify-between z-10 relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Tasks Pipeline</p>
              <ListTodo className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 lg:gap-10 z-10 relative mb-8">
              <CircularProgress percentage={taskStats.percentage || 0} />
              <div className="flex flex-col gap-5 flex-1 w-full relative z-10">
                <Stat label="Total Active" value={taskStats.total} icon={FileText} />
                <div className="h-px w-full bg-border/50"></div>
                <Stat label="Completed" value={taskStats.completed} icon={CheckCircle2} />
              </div>
            </div>

            {/* Upcoming priority tasks snippet */}
            {upcomingTasks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border/50 relative z-10">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3">Priority Objectives</p>
                <div className="flex flex-col gap-2">
                  {upcomingTasks.map((t, i) => (
                    <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-muted/40 border border-border/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:bg-muted/60">
                      <div className="flex items-center gap-2">
                        {t.priority === 'high' && <AlertCircle className="h-3.5 w-3.5 text-foreground shrink-0" />}
                        <span className="text-xs font-bold text-foreground truncate">{t.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {upcomingTasks.length === 0 && taskStats.pending === 0 && (
               <div className="mt-6 pt-6 border-t border-border/50 relative z-10 text-center opacity-70">
                 <p className="text-xs font-semibold text-muted-foreground">All caught up. Excellent.</p>
               </div>
            )}
          </div>

          {/* Mails Hero */}
          <div className="lg:col-span-4 rounded-3xl border border-border bg-card p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            {/* Glow orb */}
            <div className="absolute -right-32 -bottom-32 w-64 h-64 bg-foreground/5 rounded-full blur-3xl group-hover:bg-foreground/10 transition-colors duration-1000 z-0" />

             <div className="mb-8 flex items-center justify-between z-10 relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Digital Comm</p>
              <Mail className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
            </div>
            
            {mailStats?.connected ? (
               <div className="flex flex-col gap-5 w-full relative z-10 h-full justify-center pb-6">
                 <Stat label="Incoming Today" value={mailStats.today} icon={Inbox} />
                 <div className="h-px w-full bg-border/50"></div>
                 <Stat label="Actionable Extraction" value={mailStats.unread} icon={Sparkles} />
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-full pb-8 z-10 relative text-center">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                     <Mail className="h-6 w-6 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">Gmail Not Synced</p>
                  <p className="text-xs text-muted-foreground mb-6">Connect your Google account to track and extract tasks from your inbox automatically.</p>
                  <button 
                    onClick={handleGoogleConnect} 
                    disabled={googleLoading}
                    className="px-4 py-2 rounded-xl bg-foreground text-background font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center min-w-[120px]"
                  >
                    {googleLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> CONNECTING
                      </span>
                    ) : "Connect Google"}
                  </button>
               </div>
            )}
          </div>

          {/* Mood Side Column */}
          <div className="lg:col-span-3">
             <MoodStressDisplay mood={mood || "Neutral"} stress={stress ?? 50} />
          </div>
          
        </div>

        {/* Bottom Block */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DailyRoutineCard />
          <WeekProgressCard />
        </div>

      </div>
    </>
  )
}
