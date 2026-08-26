"use client"

import { useState } from "react"
import { X } from "lucide-react"

const moods = [
  { emoji: "\u{1F60A}", label: "Happy" },
  { emoji: "\u{1F60C}", label: "Calm" },
  { emoji: "\u{1F610}", label: "Neutral" },
  { emoji: "\u{1F614}", label: "Sad" },
  { emoji: "\u{1F621}", label: "Angry" },
]

interface MoodPopupProps {
  onComplete: (mood: string, stress: number) => void
}

export function MoodPopup({ onComplete }: MoodPopupProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [stress, setStress] = useState(50)
  const [step, setStep] = useState<1 | 2>(1)

  function getStressLabel() {
    if (stress <= 20) return "Very Low"
    if (stress <= 40) return "Low"
    if (stress <= 60) return "Moderate"
    if (stress <= 80) return "High"
    return "Very High"
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
        {step === 1 ? (
          <>
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              How are you feeling today?
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Select your current mood to personalize your dashboard.
            </p>
            <div className="mb-6 flex items-center justify-between gap-2">
              {moods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setSelectedMood(m.label)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg px-3 py-3 transition-all ${
                    selectedMood === m.label
                      ? "bg-foreground text-background scale-105"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (selectedMood) setStep(2)
              }}
              disabled={!selectedMood}
              className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Next
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              Stress Level
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              How stressed are you right now? This helps us adapt your workflow.
            </p>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Relaxed</span>
              <span className="text-xs text-muted-foreground">Overwhelmed</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
              className="mb-2 w-full accent-foreground"
            />
            <p className="mb-6 text-center text-sm font-medium text-foreground">
              {stress}% &mdash; {getStressLabel()}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Back
              </button>
              <button
                onClick={() => onComplete(selectedMood || "Neutral", stress)}
                className="flex-1 rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
