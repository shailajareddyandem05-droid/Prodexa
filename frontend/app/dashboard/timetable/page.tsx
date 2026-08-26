"use client"

import { useState, useEffect, KeyboardEvent } from "react"
import { Sparkles, Plus, X, Trash2, Clock, MapPin, CalendarDays, LibraryBig, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface ClassEntry {
  id: string
  subject: string
  room: string
  startTime: string
  endTime: string
  day: string
  color: string
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const COLORS = [
  "bg-foreground/5 border-foreground/10 text-foreground",
  "bg-muted border-border text-foreground",
  "bg-card border-foreground/20 text-foreground",
  "bg-secondary/50 border-secondary-foreground/20 text-secondary-foreground",
  "bg-muted/50 border-muted-foreground/20 text-foreground",
]
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
]

export default function TimetablePage() {
  const [classes, setClasses] = useState<ClassEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [subject, setSubject] = useState("")
  const [room, setRoom] = useState("")
  const [day, setDay] = useState("Monday")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  
  // Smart Input State
  const [smartInput, setSmartInput] = useState("")
  const [isParsing, setIsParsing] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("prodexa_timetable")
    if (saved) setClasses(JSON.parse(saved))
  }, [])

  function save(updated: ClassEntry[]) {
    setClasses(updated)
    localStorage.setItem("prodexa_timetable", JSON.stringify(updated))
  }

  function addClass() {
    if (!subject.trim()) return
    const subjectColors: Record<string, string> = {}
    classes.forEach((c) => { subjectColors[c.subject] = c.color })
    const color = subjectColors[subject.trim()] || COLORS[Object.keys(subjectColors).length % COLORS.length]

    const entry: ClassEntry = {
      id: Date.now().toString(),
      subject: subject.trim(),
      room: room.trim(),
      startTime,
      endTime,
      day,
      color,
    }
    save([...classes, entry])
    setSubject("")
    setRoom("")
    setDay("Monday")
    setStartTime("09:00")
    setEndTime("10:00")
    setShowAdd(false)
  }

  async function handleSmartSubmit(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && smartInput.trim() && !isParsing) {
      setIsParsing(true)
      try {
        const res = await api.ai.timetableParse(smartInput.trim())
        if (res.schedule && res.schedule.days && res.schedule.days.length > 0) {
          const subjectColors: Record<string, string> = {}
          classes.forEach((c) => { subjectColors[c.subject] = c.color })
          const color = subjectColors[res.schedule.subject] || COLORS[Object.keys(subjectColors).length % COLORS.length]
          
          const newEntries = res.schedule.days.map((dayName: string, index: number) => ({
             id: Date.now().toString() + index,
             subject: res.schedule.subject,
             room: res.schedule.room || "",
             startTime: res.schedule.startTime,
             endTime: res.schedule.endTime,
             day: dayName,
             color: color
          }))
          save([...classes, ...newEntries])
          setSmartInput("")
        } else {
           setSubject(smartInput)
           setShowAdd(true)
           setSmartInput("")
        }
      } catch (err) {
        console.error(err)
        setSubject(smartInput)
        setShowAdd(true)
        setSmartInput("")
      } finally {
        setIsParsing(false)
      }
    }
  }

  function deleteClass(id: string) {
    save(classes.filter((c) => c.id !== id))
  }

  function getClassesForSlot(dayName: string, time: string) {
    return classes.filter(
      (c) => c.day === dayName && c.startTime <= time && c.endTime > time
    )
  }

  function isFirstSlot(c: ClassEntry, time: string) {
    return c.startTime === time
  }

  const todayIndex = new Date().getDay()
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][todayIndex]

  const upcomingToday = classes
    .filter(c => c.day === todayName && c.endTime > new Date().toTimeString().substring(0,5))
    .sort((a,b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="flex flex-col gap-8 max-w-6xl w-full mx-auto pb-12">
      
      {/* Header & Smart Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <LibraryBig className="h-6 w-6" /> Schedule
          </h1>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Class
          </button>
        </div>

        <div className="relative group max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            {isParsing ? (
              <Loader2 className="h-4 w-4 text-foreground animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            )}
          </div>
          <input 
            type="text"
            value={smartInput}
            onChange={e => setSmartInput(e.target.value)}
            onKeyDown={handleSmartSubmit}
            disabled={isParsing}
            placeholder="Quick add... 'Physics in Lab 3 on Mons and Weds from 10 to 12'"
            className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-32 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-foreground/30 focus:shadow-sm disabled:opacity-50"
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
             <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase border border-border px-2 py-0.5 rounded-md hidden sm:block">
               ENTER to Parse
             </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-2">
        {/* Main Timetable (3 columns) */}
        <div className="xl:col-span-3 flex flex-col gap-3">
          <div className="flex items-center justify-between pl-1 border-b border-border pb-2">
             <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
               Weekly Overview
             </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card mt-2 shadow-sm">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-muted/10">
                  <th className="w-20 border-b border-r border-border/50 px-3 py-4 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-4 w-4 mx-auto" />
                  </th>
                  {DAYS.map((d) => (
                    <th
                      key={d}
                      className={`border-b border-border/50 px-3 py-4 text-center text-xs font-semibold uppercase tracking-widest ${
                        d === todayName ? "text-foreground bg-foreground/5 shadow-inner" : "text-muted-foreground"
                      }`}
                    >
                      {d.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time, idx) => (
                  <tr key={time} className="group">
                    <td className="border-b border-r border-border/50 px-3 py-4 text-[10px] font-bold tracking-widest text-muted-foreground text-center align-top bg-muted/5 group-hover:bg-muted/20 transition-colors">
                      {time}
                    </td>
                    {DAYS.map((d) => {
                      const slotClasses = getClassesForSlot(d, time)
                      const isToday = d === todayName

                      return (
                        <td
                          key={`${d}-${time}`}
                          className={`relative border-b border-border/30 px-1 py-1 align-top ${
                            isToday ? "bg-foreground/[0.02]" : ""
                          }`}
                        >
                          {slotClasses.map((c) =>
                            isFirstSlot(c, time) ? (
                              <div
                                key={c.id}
                                className={`group/class relative z-10 mx-0.5 rounded-xl border px-3 py-2.5 shadow-sm transition-transform hover:scale-[1.02] ${c.color}`}
                              >
                                <p className="text-xs font-bold leading-tight tracking-tight">{c.subject}</p>
                                {c.room && (
                                  <p className="mt-1 flex items-center gap-1 text-[10px] font-medium opacity-80">
                                    <MapPin className="h-2.5 w-2.5" /> {c.room}
                                  </p>
                                )}
                                <p className="mt-0.5 text-[9px] font-semibold opacity-60 tracking-wider">
                                  {c.startTime} - {c.endTime}
                                </p>
                                <button
                                  onClick={() => deleteClass(c.id)}
                                  className="absolute right-1.5 top-1.5 hidden h-5 w-5 items-center justify-center rounded-md bg-background/50 text-foreground backdrop-blur-sm transition-colors hover:bg-destructive hover:text-white group-hover/class:flex"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ) : null
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Up Next */}
        <div className="xl:col-span-1 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1 border-b border-border pb-2">
            Up Next
          </h2>
          
          <div className="rounded-2xl border border-border bg-card p-5 mt-2 flex flex-col gap-5">
            <div className="flex items-center gap-2">
               <CalendarDays className="h-5 w-5 text-foreground" />
               <p className="font-semibold text-foreground tracking-tight">{todayName}</p>
            </div>
            
            <div className="flex flex-col gap-3">
               {upcomingToday.length === 0 ? (
                 <p className="text-xs text-muted-foreground">You have no more classes today. Relax!</p>
               ) : (
                 upcomingToday.map((c) => (
                   <div key={c.id} className="flex flex-col gap-1 border-l-2 border-foreground/30 pl-3">
                     <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">{c.startTime} - {c.endTime}</p>
                     <p className="text-sm font-semibold text-foreground leading-snug">{c.subject}</p>
                     {c.room && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3"/> {c.room}</p>}
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Add class modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Schedule Class</h2>
              <button onClick={() => setShowAdd(false)} className="flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
                 <input
                   type="text"
                   value={subject}
                   onChange={(e) => setSubject(e.target.value)}
                   autoFocus
                   className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground/30"
                 />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Room (Optional)</label>
                 <input
                   type="text"
                   value={room}
                   onChange={(e) => setRoom(e.target.value)}
                   className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground/30"
                 />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Day</label>
                 <select
                   value={day}
                   onChange={(e) => setDay(e.target.value)}
                   className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground/30"
                 >
                   {DAYS.map((d) => (
                     <option key={d} value={d}>{d}</option>
                   ))}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Time</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground/30"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Time</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground/30"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="18:00">18:00</option>
                  </select>
                </div>
              </div>
              <button
                onClick={addClass}
                disabled={!subject.trim()}
                className="mt-2 rounded-lg bg-foreground py-3 text-sm font-bold tracking-wide text-background shadow-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              >
                Add to Timetable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
