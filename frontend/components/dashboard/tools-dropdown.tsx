"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Wrench,
  BrainCircuit,
  Clock,
  Target,
  Timer,
  Heart,
} from "lucide-react"

const tools = [
  { label: "Pomodoro", icon: Timer, description: "25/5 work cycles", href: "/dashboard/pomodoro" },
  { label: "Focus Mode", icon: Target, description: "Block distractions", href: "/dashboard/focus" },
  { label: "Dump Mode", icon: BrainCircuit, description: "Quick brain dump", href: "/dashboard/dump" },
  { label: "Handle Later", icon: Clock, description: "Park tasks for later", href: "/dashboard/handle-later" },
  { label: "Stress Relief", icon: Heart, description: "Guided calm session", href: "/dashboard/stress-relief" },
]

export function ToolsDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        aria-label="Tools"
      >
        <Wrench className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card p-4 shadow-xl animate-in fade-in slide-in-from-top-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            My Tools
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {tools.map((tool) => (
              <button
                key={tool.label}
                onClick={() => {
                  setOpen(false)
                  router.push(tool.href)
                }}
                className="group flex flex-col items-center gap-1.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground transition-all group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
                  <tool.icon className="h-5 w-5" />
                </div>
                <span className="max-w-[60px] text-center text-[10px] font-medium leading-tight text-muted-foreground group-hover:text-foreground">
                  {tool.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
