"use client"

import { useState, useRef, useEffect } from "react"
import {
  Link2,
  X,
  Clock,
  Plus,
  Trash2,
  Loader2,
  Check,
  LogOut,
} from "lucide-react"
import { api } from "@/lib/api"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase"

interface RoutineItem {
  id: string
  time: string
  activity: string
}

export function IntegrationsDropdown() {
  const [open, setOpen] = useState(false)
  const [showRoutine, setShowRoutine] = useState(false)
  const [routine, setRoutine] = useState<RoutineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [newTime, setNewTime] = useState("")
  const [newActivity, setNewActivity] = useState("")
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Check Google connection status on mount and when dropdown opens
  const checkGoogleStatus = () => {
    api.google.getStatus()
      .then((data) => setGoogleConnected(data.connected))
      .catch((err) => console.warn("Google status check failed:", err))
  }

  // Check once Firebase auth is ready (handles login/re-login)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        checkGoogleStatus()
      }
    })
    return () => unsubscribe()
  }, [])

  // Re-check when dropdown opens
  useEffect(() => {
    if (open) {
      checkGoogleStatus()
    }
  }, [open])

  // Check for OAuth callback result in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const googleResult = params.get("google")
    
    if (googleResult) {
      if (window.opener || window.name === 'googleAuth') {
        window.close()
        // If close fails, continue to render and set flags
      }
      
      if (googleResult === "success") {
        setGoogleConnected(true)
      }
      
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete("google")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

  useEffect(() => {
    if (showRoutine && routine.length === 0) {
      setLoading(true)
      api.dashboard.routine()
        .then((data) => setRoutine(data.routine || []))
        .catch(() => { })
        .finally(() => setLoading(false))
    }
  }, [showRoutine])

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
            checkGoogleStatus()
            setGoogleLoading(false)
            return
          }
          try {
            if (popup.location.href.includes("google=success")) {
              popup.close()
              clearInterval(timer)
              checkGoogleStatus()
              setGoogleLoading(false)
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

  async function handleGoogleDisconnect() {
    setGoogleLoading(true)
    try {
      await api.google.disconnect()
      setGoogleConnected(false)
    } catch (err) {
      console.error("Failed to disconnect Google:", err)
    } finally {
      setGoogleLoading(false)
    }
  }

  function addRoutineItem() {
    if (!newTime.trim() || !newActivity.trim()) return
    const newItem: RoutineItem = { id: Date.now().toString(), time: newTime, activity: newActivity }
    setRoutine((prev) =>
      [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time))
    )
    setNewTime("")
    setNewActivity("")
  }

  function removeItem(id: string) {
    setRoutine((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        aria-label="Integrations"
      >
        <Link2 className="h-4 w-4" />
      </button>

      {open && !showRoutine && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Integrations</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-col p-2">
            {/* Google Integration */}
            <div className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-muted">
              <button
                onClick={googleConnected ? undefined : handleGoogleConnect}
                disabled={googleLoading}
                className="flex items-center gap-3 text-left text-sm text-foreground disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                {googleLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : googleConnected ? (
                  <span className="flex items-center gap-1.5">
                    Google
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  </span>
                ) : (
                  "Connect Google"
                )}
              </button>
              {googleConnected && (
                <button
                  onClick={handleGoogleDisconnect}
                  disabled={googleLoading}
                  className="text-muted-foreground transition-colors hover:text-red-500"
                  title="Disconnect Google"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Daily Routine */}
            <button
              onClick={() => setShowRoutine(true)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Clock className="h-4 w-4" />
              Daily Routine
            </button>
          </div>
        </div>
      )}

      {/* Daily Routine window */}
      {open && showRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Daily Routine</h2>
              </div>
              <button
                onClick={() => { setShowRoutine(false); setOpen(false) }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Routine list */}
            <div className="max-h-80 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : routine.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No routine items yet. Add one below.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {routine.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                      <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground">{item.time}</span>
                      <span className="flex-1 text-sm text-foreground">{item.activity}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-24 rounded-md border border-border bg-background px-2 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring dark:[color-scheme:dark]"
                />
                <input
                  type="text"
                  placeholder="Activity..."
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={addRoutineItem}
                  className="flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-background transition-opacity hover:opacity-90"
                  aria-label="Add item"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
