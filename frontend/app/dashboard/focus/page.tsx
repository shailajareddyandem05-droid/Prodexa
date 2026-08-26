"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Target, Play, Pause, AlertTriangle, Lock, IndianRupee, X, CheckCircle2, Clock } from "lucide-react"
import api from "@/lib/api"

export default function FocusModePage() {
  const [task, setTask] = useState("")
  const [durationMin, setDurationMin] = useState(25)
  const [durationSec, setDurationSec] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [processingState, setProcessingState] = useState<"idle" | "processing" | "success" | "failed">("idle")
  const [exitFee, setExitFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi")
  const [completedTasks, setCompletedTasks] = useState<{ task: string; durationMin: number; durationSec: number }[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Load completed
  useEffect(() => {
    const saved = localStorage.getItem("prodexa_focus_completed")
    if (saved) setCompletedTasks(JSON.parse(saved))
    
    // Load Razorpay Script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Timer countdown
  useEffect(() => {
    if (!isActive || isPaused) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer complete — exit fullscreen and celebrate
          setIsActive(false)
          exitFullscreen()
          const updated = [
            { task, durationMin, durationSec },
            ...completedTasks,
          ]
          setCompletedTasks(updated)
          localStorage.setItem("prodexa_focus_completed", JSON.stringify(updated))
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive, isPaused, task, durationMin, durationSec, completedTasks])

  // Calculate exit fee based on remaining time (more time left = higher fee)
  function calculateExitFee(): number {
    const totalSeconds = (durationMin * 60) + durationSec
    const remaining = secondsLeft
    const percentLeft = remaining / totalSeconds
    // Base fee ₹10–₹500 depending on how much time is left
    return Math.max(10, Math.round(percentLeft * 500))
  }

  // Fullscreen helpers
  function enterFullscreen() {
    const el = containerRef.current
    if (!el) return
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {})
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen()
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  // Listen for fullscreen exit attempts (Esc key)
  useEffect(() => {
    function handleFullscreenChange() {
      // If user exited fullscreen while timer is still running
      if (!document.fullscreenElement && isActive && secondsLeft > 0) {
        setExitFee(calculateExitFee())
        setShowExitModal(true)
        // Re-enter fullscreen immediately
        setTimeout(() => enterFullscreen(), 100)
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [isActive, secondsLeft, durationMin])

  // Start focus
  function startFocus() {
    if (!task.trim() || (durationMin === 0 && durationSec === 0)) return
    setSecondsLeft((durationMin * 60) + durationSec)
    setIsActive(true)
    setIsPaused(false)
    setShowExitModal(false)
    setShowPayment(false)
    setProcessingState("idle")
    setTimeout(() => enterFullscreen(), 200)
  }

  // Try to exit early
  function tryExit() {
    setExitFee(calculateExitFee())
    setShowExitModal(true)
  }

  // "Pay" and exit
  async function payAndExit() {
    setProcessingState("processing")
    
    try {
      // 1. Create order
      const order = await api.razorpay.createOrder(exitFee * 100);
      
      const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_Sb0iWNwpIlRhpl",
          amount: order.amount,
          currency: order.currency,
          name: "Prodexa Focus",
          description: "Early Exit Penalty",
          order_id: order.order_id,
          handler: async function (response: any) {
              setProcessingState("success");
              try {
                  await api.razorpay.verifyPayment({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                  });
                  // Successfully paid and verified
                  setIsActive(false)
                  setShowExitModal(false)
                  setProcessingState("idle")
                  exitFullscreen()
              } catch (err) {
                  alert("Payment Verification Failed. Penalty still applies.");
                  setProcessingState("idle");
              }
          },
          prefill: { name: "Focus User" },
          theme: { color: "#2563EB" },
          modal: {
              ondismiss: function() { setProcessingState("idle"); }
          }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
          alert("Payment Failed: " + response.error.description);
          setProcessingState("idle");
      });
      rzp.open();
    } catch (err: any) {
       console.error("Payment init failed", err);
       setProcessingState("idle");
       alert(`Payment error: ${err.message || "Unknown error"}`);
    }
  }

  // Continue focusing (dismiss exit modal)
  function continueFocusing() {
    setShowExitModal(false)
    setShowPayment(false)
    setProcessingState("idle")
  }

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const totalSeconds = (durationMin * 60) + durationSec
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0

  // ============ SETUP SCREEN ============
  if (!isActive) {
    return (
      <div ref={containerRef} className="flex h-full flex-col items-center justify-center gap-8 -m-6 p-6 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border">
            <Target className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Focus Mode</h1>
          <p className="max-w-md text-center text-base text-muted-foreground">
            Enter a task and set your focus duration. Once started, the screen goes
            fullscreen. <span className="font-semibold text-foreground">Exiting early will cost you! 💸</span>
          </p>
        </div>

        <div className="w-full max-w-md space-y-4">
          <input
            type="text"
            placeholder="What do you want to focus on?"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-6 py-4 text-lg text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40"
          />

          {/* Duration selector */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">Duration:</p>
            <div className="flex items-center gap-2">
              {[15, 25, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDurationMin(d); setDurationSec(0); }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    durationMin === d && durationSec === 0
                      ? "bg-foreground text-background"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
            <div className="ml-2 flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={180}
                value={durationMin}
                onChange={(e) => setDurationMin(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm text-foreground outline-none transition-colors focus:border-foreground/40"
              />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">m</span>
              <span className="text-muted-foreground/30 font-bold">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={durationSec}
                onChange={(e) => setDurationSec(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm text-foreground outline-none transition-colors focus:border-foreground/40"
              />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">s</span>
            </div>
          </div>

          <button
            onClick={startFocus}
            disabled={!task.trim() || (durationMin === 0 && durationSec === 0)}
            className="w-full rounded-xl bg-foreground py-4 text-base font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Lock In & Start ({durationMin}m {durationSec > 0 ? `${durationSec}s` : ""})
            </div>
          </button>
        </div>

        {/* Completed sessions */}
        {secondsLeft === 0 && completedTasks.length > 0 && completedTasks[0] && (
          <div className="animate-fade-in-up flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-4">
            <CheckCircle2 className="h-5 w-5 text-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Session Complete!</p>
              <p className="text-xs text-muted-foreground">
                You focused on &ldquo;{completedTasks[0].task}&rdquo; for {completedTasks[0].durationMin}m {completedTasks[0].durationSec > 0 ? `${completedTasks[0].durationSec}s` : ""}
              </p>
            </div>
          </div>
        )}

        {/* History */}
        {completedTasks.length > 0 && (
          <div className="w-full max-w-md">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Focus History
            </p>
            <div className="flex flex-col gap-2">
              {completedTasks.slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-foreground" />
                    <span className="text-sm text-foreground">{t.task}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{t.durationMin}m {t.durationSec > 0 ? `${t.durationSec}s` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ FULLSCREEN FOCUS MODE ============
  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-screen flex-col items-center justify-center gap-10 bg-background p-8"
      style={{ cursor: "none" }}
    >
      {/* Task */}
      <div className="text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Locked in on
        </p>
        <h1 className="text-4xl font-bold text-foreground">{task}</h1>
      </div>

      {/* Big Timer */}
      <div className="relative flex items-center justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300" className="rotate-[-90deg]">
          <circle
            cx="150" cy="150" r="130"
            fill="none" stroke="currentColor" strokeWidth="4"
            className="text-border"
          />
          <circle
            cx="150" cy="150" r="130"
            fill="none" stroke="currentColor" strokeWidth="4"
            strokeDasharray={2 * Math.PI * 130}
            strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
            strokeLinecap="round"
            className="text-foreground transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center gap-2">
          <span className="text-7xl font-bold tabular-nums tracking-tight text-foreground">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
            <span className="text-sm text-muted-foreground">
              {isPaused ? "Paused" : "Focusing"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 active:scale-95"
        >
          {isPaused ? (
            <Play className="h-6 w-6 translate-x-0.5" />
          ) : (
            <Pause className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Exit button — triggers penalty */}
      <button
        onClick={tryExit}
        className="mt-4 flex items-center gap-2 rounded-full border border-border/50 px-6 py-2 text-sm text-muted-foreground/60 transition-colors hover:border-border hover:text-muted-foreground"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Exit Early (Costs Money 💸)
      </button>

      {/* ============ EXIT PENALTY MODAL ============ */}
      {showExitModal && !showPayment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-destructive/30 bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Quitting Already?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You still have <span className="font-semibold text-foreground">{mins}m {secs}s</span> left.
              Exiting early will cost you:
            </p>
            <div className="my-6 flex items-center justify-center gap-1">
              <span className="text-4xl font-light text-muted-foreground">₹</span>
              <span className="text-6xl font-extrabold tracking-tighter text-foreground">{exitFee}</span>
            </div>
            <p className="mb-8 text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Penalty Fee
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={continueFocusing}
                className="w-full rounded-xl bg-foreground py-4 text-sm font-bold tracking-wide text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                RETURN TO FOCUS
              </button>
              <button
                onClick={payAndExit}
                disabled={processingState === "processing"}
                className="w-full rounded-xl border border-border/50 bg-muted/30 py-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {processingState === "processing" ? "Processing..." : `Proceed to Checkout (₹${exitFee})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
