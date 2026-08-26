"use client"

import { useState, useEffect, useCallback } from "react"
import { Heart, Play, Pause, RotateCcw, Wind, Brain, Smile, Moon, Sun, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"

type Activity = "breathing" | "grounding" | "affirmation" | "bodyRelax"

interface ActivityConfig {
  label: string
  icon: React.ElementType
  description: string
  duration: number // in seconds
  instructions: string[]
  isInteractive?: boolean // Whether this activity requires text input instead of an auto-advancing timer
}

const ACTIVITIES: Record<Activity, ActivityConfig> = {
  breathing: {
    label: "Box Breathing",
    icon: Wind,
    description: "A calming 4-4-4-4 breathing pattern used by Navy SEALs.",
    duration: 120,
    instructions: [
      "Breathe in slowly for 4 seconds",
      "Hold your breath for 4 seconds",
      "Exhale slowly for 4 seconds",
      "Hold empty for 4 seconds",
      "Repeat the cycle",
    ],
  },
  grounding: {
    label: "5-4-3-2-1 Grounding",
    icon: Brain,
    description: "A sensory grounding technique to bring you back to the present.",
    duration: 0, // Duration isn't used for interactive mode
    isInteractive: true,
    instructions: [
      "Name 5 things you can SEE around you",
      "Name 4 things you can TOUCH",
      "Name 3 things you can HEAR",
      "Name 2 things you can SMELL",
      "Name 1 thing you can TASTE",
    ],
  },
  affirmation: {
    label: "Positive Affirmations",
    icon: Smile,
    description: "Repeat these affirmations to shift your mindset.",
    duration: 35, // Reduced from 60s
    instructions: [
      "I am capable of handling this",
      "This feeling is temporary",
      "I have overcome challenges before",
      "I am doing my best, and that is enough",
      "I choose to focus on what I can control",
    ],
  },
  bodyRelax: {
    label: "Body Relaxation",
    icon: Moon,
    description: "Progressive muscle relaxation to release physical tension.",
    duration: 75, // Reduced from 150s
    instructions: [
      "Tense your fists tightly for 5 seconds, then release",
      "Shrug your shoulders to your ears, hold, then drop",
      "Scrunch your face muscles, hold, then relax",
      "Tense your legs and feet, hold, then release",
      "Take 3 deep breaths and notice how your body feels",
    ],
  },
}

const ACTIVITIES_ORDER: Activity[] = ["breathing", "grounding", "affirmation", "bodyRelax"]

export default function StressReliefPage() {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSessions, setCompletedSessions] = useState(0)

  // Interactive grounding state
  const [userInputs, setUserInputs] = useState<Record<number, string>>({})
  const [showReport, setShowReport] = useState(false)

  // Breathing animation state
  const [breathPhase, setBreathPhase] = useState<"in" | "hold-in" | "out" | "hold-out">("in")

  useEffect(() => {
    const saved = localStorage.getItem("prodexa_stress_sessions")
    if (saved) setCompletedSessions(parseInt(saved, 10))
  }, [])

  // Timer
  useEffect(() => {
    if (!isRunning || !selectedActivity) return
    const config = ACTIVITIES[selectedActivity]

    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= config.duration) {
          setIsRunning(false)
          const newCount = completedSessions + 1
          setCompletedSessions(newCount)
          localStorage.setItem("prodexa_stress_sessions", String(newCount))
          return config.duration
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, selectedActivity, completedSessions])

  // Breathing phase cycle (4s each phase)
  useEffect(() => {
    if (!isRunning || selectedActivity !== "breathing") return
    const phases: typeof breathPhase[] = ["in", "hold-in", "out", "hold-out"]
    const interval = setInterval(() => {
      setBreathPhase((prev) => {
        const idx = phases.indexOf(prev)
        return phases[(idx + 1) % phases.length]
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [isRunning, selectedActivity])

  // Auto-advance steps
  useEffect(() => {
    if (!isRunning || !selectedActivity) return
    const config = ACTIVITIES[selectedActivity]
    
    // Don't auto advance if interactive
    if (config.isInteractive) return

    const stepDuration = config.duration / config.instructions.length
    const newStep = Math.min(
      Math.floor(elapsed / stepDuration),
      config.instructions.length - 1
    )
    setCurrentStep(newStep)
  }, [elapsed, isRunning, selectedActivity])

  const startActivity = useCallback((activity: Activity) => {
    setSelectedActivity(activity)
    setElapsed(0)
    setCurrentStep(0)
    setIsRunning(false)
    setBreathPhase("in")
    setUserInputs({})
    setShowReport(false)
  }, [])

  const reset = useCallback(() => {
    setElapsed(0)
    setCurrentStep(0)
    setIsRunning(false)
    setBreathPhase("in")
    setUserInputs({})
    setShowReport(false)
  }, [])

  const handleInteractiveNext = () => {
    const config = ACTIVITIES[selectedActivity!]
    if (currentStep < config.instructions.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Completed interactive session
      setShowReport(true)
      const newCount = completedSessions + 1
      setCompletedSessions(newCount)
      localStorage.setItem("prodexa_stress_sessions", String(newCount))
    }
  }

  const config = selectedActivity ? ACTIVITIES[selectedActivity] : null
  const progress = config ? (elapsed / config.duration) * 100 : 0

  const breathLabels = {
    "in": "Breathe In",
    "hold-in": "Hold",
    "out": "Breathe Out",
    "hold-out": "Hold",
  }

  // Scale for breathing circle animation
  const breathScale = breathPhase === "in" || breathPhase === "hold-in" ? 1.3 : 0.8

  // Activity selection view
  if (!selectedActivity) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stress Relief</h1>
          <p className="text-sm text-muted-foreground">
            Take a moment to relax. Choose an activity below.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 rounded-xl border border-border bg-card px-6 py-4">
          <Heart className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">{completedSessions} sessions</p>
            <p className="text-xs text-muted-foreground">Total stress relief sessions completed</p>
          </div>
        </div>

        {/* Activity cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {ACTIVITIES_ORDER.map((key, i) => {
            const activity = ACTIVITIES[key]
            return (
              <button
                key={key}
                onClick={() => startActivity(key)}
                className="animate-fade-in-up group flex flex-col rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-foreground/20"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted transition-colors group-hover:bg-foreground group-hover:text-background">
                  <activity.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{activity.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {activity.description}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {Math.floor(activity.duration / 60)} min
                </p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Active session view
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-6 p-8 bg-background">
      
      {/* Prominent Back button */}
      <div className="mb-8">
        <button
          onClick={() => {
            setSelectedActivity(null)
            reset()
          }}
          className="flex flex-none items-center gap-2 rounded-full border border-border/50 bg-muted/20 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Activities
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-16 w-full max-w-4xl mx-auto">
        <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          {config!.label}
        </p>

        {/* Breathing circle */}
        {selectedActivity === "breathing" && isRunning ? (
          <div className="flex flex-col items-center gap-6">
            <div
              className="flex h-56 w-56 items-center justify-center rounded-full border-[3px] border-foreground/30 transition-all duration-[4000ms] ease-in-out shadow-[0_0_40px_rgba(255,255,255,0.05)]"
              style={{ transform: `scale(${breathScale})` }}
            >
              <span className="text-xl font-bold tracking-wider text-foreground">
                {breathLabels[breathPhase]}
              </span>
            </div>
          </div>
        ) : showReport && config!.isInteractive ? (
          // INTERACTIVE REPORT VIEW
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8">
            <div className="flex flex-col items-center text-center mb-8">
               <Sun className="h-12 w-12 text-foreground mb-4" />
               <h2 className="text-3xl font-bold text-foreground tracking-tight">Grounding Complete</h2>
               <p className="text-muted-foreground mt-2">You have successfully brought your mind back to the present. Here is what you observed:</p>
            </div>
            
            <div className="space-y-4">
              {config!.instructions.map((instruction, idx) => (
                <div key={idx} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">{instruction}</p>
                  <p className="text-foreground font-medium text-lg leading-relaxed whitespace-pre-wrap">{userInputs[idx] || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // CURRENT INSTRUCTION VIEW
          <div className="flex w-full flex-col items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-muted/5 shadow-sm">
              {config && <config.icon className="h-9 w-9 text-foreground/70" />}
            </div>
            
            <div className="w-full max-w-xl text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-tight">
                {config!.instructions[currentStep]}
              </h2>
              <p className="mt-3 text-sm font-medium text-muted-foreground/70 uppercase tracking-widest">
                Step {currentStep + 1} of {config!.instructions.length}
              </p>
            </div>

            {/* Interactive Inputs */}
            {config!.isInteractive && (
              <div className="mt-8 w-full max-w-2xl animate-in fade-in">
                <textarea
                  autoFocus
                  placeholder="Type your observations here..."
                  value={userInputs[currentStep] || ""}
                  onChange={(e) => setUserInputs(prev => ({ ...prev, [currentStep]: e.target.value }))}
                  className="w-full h-40 resize-none rounded-2xl border border-border/50 bg-background px-6 py-5 text-lg text-foreground placeholder-muted-foreground/30 shadow-sm focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20 outline-none transition-all"
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleInteractiveNext}
                    disabled={!(userInputs[currentStep]?.trim())}
                    className="flex items-center gap-2 rounded-full bg-foreground px-8 py-3.5 text-sm font-bold text-background transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-30 shadow-md"
                  >
                    <span>{currentStep === config!.instructions.length - 1 ? "Complete Exercise" : "Continue"}</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress bar (Non-Interactive) */}
        {!config!.isInteractive && !showReport && (
          <div className="w-full max-w-md mt-16">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-1000"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-medium text-muted-foreground/70">
              <span className="tabular-nums tracking-wider">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </span>
              <span className="tabular-nums tracking-wider">
                {Math.floor(config!.duration / 60)}:{String(config!.duration % 60).padStart(2, "0")}
              </span>
            </div>
          </div>
        )}

        {/* Controls (Non-Interactive) */}
        {!config!.isInteractive && !showReport && (
          <div className="mt-10 flex items-center gap-5">
            <button
              onClick={reset}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-muted/5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
              aria-label="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-110 active:scale-95 shadow-xl"
              aria-label={isRunning ? "Pause" : "Start"}
            >
              {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 translate-x-0.5" />}
            </button>
          </div>
        )}

        {/* Completion message (Non-Interactive) */}
        {elapsed >= config!.duration && !config!.isInteractive && (
          <div className="animate-in slide-in-from-bottom-4 fade-in mt-12 flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-foreground" />
            <p className="text-xl font-bold tracking-tight text-foreground">Well done!</p>
            <p className="text-sm font-medium text-muted-foreground">You completed a {config!.label} session.</p>
          </div>
        )}
      </div>
    </div>
  )
}
