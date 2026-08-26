"use client"

import { useEffect, useState, useRef } from "react"
import { Users, CheckCircle2, Clock, Star } from "lucide-react"

const stats = [
  { label: "Active Students", value: 10000, suffix: "+", icon: Users },
  { label: "Tasks Completed", value: 50000, suffix: "+", icon: CheckCircle2 },
  { label: "Uptime", value: 99.9, suffix: "%", icon: Clock },
  { label: "User Rating", value: 4.9, suffix: "★", icon: Star },
]

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const isDecimal = target % 1 !== 0
          const duration = 2000
          const steps = 60
          const increment = target / steps

          let current = 0
          const interval = setInterval(() => {
            current += increment
            if (current >= target) {
              current = target
              clearInterval(interval)
            }
            setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current))
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  const display = target >= 1000 ? `${(count / 1000).toFixed(count >= target ? 0 : 0)}K` : String(count)

  return (
    <div ref={ref} className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
      {target >= 1000 ? `${Math.floor(count / 1000)}K` : count}
      {suffix}
    </div>
  )
}

export function StatsSection() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="animate-fade-in-up flex flex-col items-center gap-3 text-center"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
                <stat.icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
