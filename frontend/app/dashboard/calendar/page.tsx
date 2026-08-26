"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, Loader2, ExternalLink, CalendarDays, Zap, FileText } from "lucide-react"
import { api } from "@/lib/api"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface CalendarEvent {
  id: string
  title: string
  date: string
  type?: string
  source?: "internal" | "google" | "task"
  link?: string
  location?: string
  calendarName?: string
}

const typeColors: Record<string, string> = {
  internal: "bg-foreground/5 text-foreground border-foreground/20",
  task: "bg-destructive/10 text-destructive border-destructive/20",
  google: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch Internal Events
        const internalData = await api.calendar.list().catch(() => ({ events: [] }))
        const internalEvents: CalendarEvent[] = (internalData.events || []).map((e: any, i: number) => ({
          ...e,
          id: `int-${e.id || i}-${i}`,
          source: "internal" as const,
          type: "internal"
        }))

        // Fetch Google Events (Holidays + Primary)
        let googleEvents: CalendarEvent[] = []
        try {
          const status = await api.google.getStatus()
          if (status.connected) {
            const gData = await api.google.calendarEvents()
            googleEvents = (gData.events || []).map((e: any, i: number) => ({
              id: `g-${e.id}-${i}`,
              title: e.title,
              date: e.start,
              source: "google" as const,
              type: "google",
              link: e.link,
              location: e.location,
              calendarName: e.calendarName
            }))
          }
        } catch { }

        // Fetch Tasks
        let taskEvents: CalendarEvent[] = []
        try {
          const tasksData = await api.tasks.list().catch(() => [])
          taskEvents = tasksData
            .filter((t: any) => t.due) // only dates
            .map((t: any, i: number) => ({
              id: `t-${t.id}-${i}`,
              title: `Task: ${t.title}`,
              date: t.due, // "YYYY-MM-DD"
              source: "task" as const,
              type: "task",
            }))
        } catch { }

        setEvents([...internalEvents, ...googleEvents, ...taskEvents])
      } catch (err) {
        console.error("Failed to load calendar data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear()

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDay(null)
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDay(null)
  }

  /* Map events to day numbers for the current month */
  function getEventsForDay(day: number): CalendarEvent[] {
    const filtered = events.filter((e) => {
      try {
        const d = new Date(e.date)
        return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear
      } catch { return false }
    })
    
    // Sort by type (Task -> Google -> Internal) so colors group together visually
    return filtered.sort((a, b) => {
      const order = { task: 1, google: 2, internal: 3 }
      const rankA = order[a.source as keyof typeof order] || 4
      const rankB = order[b.source as keyof typeof order] || 4
      return rankA - rankB
    })
  }

  const eventsForDay = selectedDay ? getEventsForDay(selectedDay) : []
  const daysWithEvents = new Set<number>()
  events.forEach((e) => {
    try {
      const d = new Date(e.date)
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        daysWithEvents.add(d.getDate())
      }
    } catch { }
  })

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl w-full mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6" /> Ultimate Calendar
        </h1>
        <button className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-105 active:scale-95 shadow-sm">
          <Plus className="h-4 w-4" />
          Event
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start h-[750px] overflow-hidden">
        {/* Calendar grid */}
        <div className="flex flex-col flex-1 rounded-3xl border border-border/50 bg-card p-6 md:p-8 shadow-sm h-full w-full">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {MONTH_NAMES[currentMonth]} <span className="text-muted-foreground font-medium">{currentYear}</span>
            </h2>
            <div className="flex items-center gap-1 bg-muted/20 border border-border/50 rounded-full p-1">
               <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm">
                 <ChevronLeft className="h-4 w-4" />
               </button>
               <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm">
                 <ChevronRight className="h-4 w-4" />
               </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className="rounded-xl border border-dashed border-border/20 bg-background/5" />
              const isToday = isCurrentMonth && day === today.getDate()
              const isSelected = day === selectedDay
              const dayEvents = getEventsForDay(day)

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`group relative flex flex-col items-center pt-2 rounded-2xl transition-all border shadow-xs overflow-hidden ${
                    isSelected
                      ? "bg-foreground border-foreground scale-[1.02] shadow-md z-10"
                      : isToday
                        ? "bg-muted/10 border-foreground/30 hover:border-foreground/50 text-foreground"
                        : "bg-card border-border/50 hover:bg-muted/20 hover:border-border text-foreground"
                  }`}
                >
                  <span className={`text-sm font-semibold mb-1 z-10 ${isSelected ? "text-background" : isToday ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                    {day}
                  </span>
                  
                  {/* Event Dots mapped out */}
                  <div className="flex w-full justify-center gap-1 mt-0.5 flex-wrap px-1 z-10">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full shadow-sm ${isSelected ? "bg-background" : e.source === 'task' ? "bg-destructive" : e.source === 'google' ? "bg-blue-500" : "bg-foreground"}`} />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="flex items-center justify-center">
                         <span className={`text-[8px] font-bold leading-none ${isSelected ? "text-background" : "text-muted-foreground"}`}>+{dayEvents.length - 3}</span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar -- events for selected day */}
        <div className="flex flex-col w-full xl:w-80 shrink-0 rounded-3xl border border-border/50 bg-card p-6 h-full shadow-sm">
          <h3 className="text-sm font-bold tracking-wider uppercase text-muted-foreground border-b border-border/50 pb-4 mb-4 flex justify-between items-center">
            <span>{selectedDay ? `${MONTH_NAMES[currentMonth]} ${selectedDay}` : "Select Date"}</span>
            <CalendarDays className="h-4 w-4" />
          </h3>
          
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {eventsForDay.length === 0 ? (
               <div className="flex flex-1 flex-col items-center justify-center text-center opacity-60">
                 <Zap className="h-8 w-8 text-muted-foreground mb-3" />
                 <p className="text-sm font-medium text-foreground">A totally clear day.</p>
                 <p className="text-xs text-muted-foreground mt-1">Nothing scheduled. Go touch grass.</p>
               </div>
            ) : (
               eventsForDay.map((ev) => (
                <div
                  key={ev.id}
                  className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm transition-transform hover:scale-[1.01] ${typeColors[ev.type || "internal"] || typeColors.internal}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold tracking-tight leading-snug">{ev.title}</span>
                    {ev.source === "google" && (
                      <span className="shrink-0 rounded-md border border-current bg-current/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5">
                        G-Cal
                      </span>
                    )}
                    {ev.source === "task" && (
                      <div className="shrink-0 mt-0.5"><FileText className="h-3.5 w-3.5 opacity-70" /></div>
                    )}
                  </div>
                  
                  {(ev.location || ev.calendarName) && (
                    <div className="flex flex-col gap-0.5 mt-1 border-t border-current/10 pt-2">
                       {ev.calendarName && <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1">{ev.calendarName}</p>}
                       {ev.location && <p className="text-xs font-medium opacity-80 break-words">{ev.location}</p>}
                    </div>
                  )}

                  {ev.link && (
                    <a
                      href={ev.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-3 w-3" /> Source
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
