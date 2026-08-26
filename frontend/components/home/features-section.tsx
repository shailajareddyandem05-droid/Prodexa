import { Layers, Eye, BrainCircuit, Timer, Target, Repeat } from "lucide-react"

const features = [
  {
    icon: Layers,
    title: "Unified Context",
    description:
      "See your tasks, calendar, notes, and timetable in one seamless view. No more switching between apps.",
  },
  {
    icon: Eye,
    title: "Focus Mode",
    description:
      "A dedicated interface that hides everything except your current task. Enter a distraction-free flow state.",
  },
  {
    icon: BrainCircuit,
    title: "Smart Prioritization",
    description:
      "AI algorithms that help you identify the 20% of work that yields 80% of results.",
  },
  {
    icon: Timer,
    title: "Pomodoro Timer",
    description:
      "Built-in 25/5 work-break cycles to boost your focus during study sessions and coding sprints.",
  },
  {
    icon: Target,
    title: "GPA Tracking",
    description:
      "Calculate your semester GPA and CGPA instantly. Plan your grades and track academic progress.",
  },
  {
    icon: Repeat,
    title: "Habit Streaks",
    description:
      "Build daily habits and track streaks. Stay consistent with exercise, coding, reading, and more.",
  },
]

export function FeaturesSection() {
  return (
    <section className="px-6 pb-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Why choose PRODEXA?
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Everything a B.Tech student needs — task management, habit tracking,
          academic tools, and AI-powered assistance in one place.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="animate-fade-in-up rounded-xl border border-border bg-card p-7 transition-colors hover:border-foreground/20"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-lg bg-muted">
                <feature.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
