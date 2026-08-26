"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Pause, RotateCcw, Coffee, BrainCircuit, CheckCircle2 } from "lucide-react"

type Mode = "work" | "shortBreak" | "longBreak"

const MODE_CONFIG: Record<Mode, { label: string; minutes: number; icon: React.ElementType }> = {
  work: { label: "Focus", minutes: 25, icon: BrainCircuit },
  shortBreak: { label: "Short Break", minutes: 5, icon: Coffee },
  longBreak: { label: "Long Break", minutes: 15, icon: Coffee },
}

export default function PomodoroPage() {
  const [mode, setMode] = useState<Mode>("work")
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)

  // Load saved sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("prodexa_pomodoro_sessions")
    if (saved) setSessions(parseInt(saved, 10))
  }, [])

  // Timer logic
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          if (mode === "work") {
            const newSessions = sessions + 1
            setSessions(newSessions)
            localStorage.setItem("prodexa_pomodoro_sessions", String(newSessions))
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, mode, sessions])

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode)
    setSecondsLeft(MODE_CONFIG[newMode].minutes * 60)
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    setSecondsLeft(MODE_CONFIG[mode].minutes * 60)
    setIsRunning(false)
  }, [mode])

  const totalSeconds = MODE_CONFIG[mode].minutes * 60
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  // SVG circle values
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const ModeIcon = MODE_CONFIG[mode].icon

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 -m-6 p-6">
      {/* Mode selector */}
      <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1.5">
        {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="relative flex items-center justify-center">
        <svg width="280" height="280" viewBox="0 0 280 280" className="rotate-[-90deg]">
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-border"
          />
          {/* Progress circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-foreground transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center gap-2">
          <ModeIcon className="h-6 w-6 text-muted-foreground" />
          <span className="text-6xl font-bold tabular-nums tracking-tight text-foreground">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-sm text-muted-foreground">{MODE_CONFIG[mode].label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Reset"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 active:scale-95"
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? (
            <Pause className="h-7 w-7" />
          ) : (
            <Play className="h-7 w-7 translate-x-0.5" />
          )}
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
          <span className="text-sm font-bold text-foreground">{sessions}</span>
        </div>
      </div>

      {/* Session info */}
      <div className="flex items-center gap-6 rounded-xl border border-border bg-card px-8 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">{sessions}</p>
            <p className="text-xs text-muted-foreground">Sessions today</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">{sessions * 25}m</p>
            <p className="text-xs text-muted-foreground">Focus time</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <p className="max-w-md text-center text-sm text-muted-foreground">
        The Pomodoro Technique: Work for 25 minutes, take a 5-minute break.
        After 4 sessions, take a longer 15-minute break.
      </p>
    </div>
  )
}
