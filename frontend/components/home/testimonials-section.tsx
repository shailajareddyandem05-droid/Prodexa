import { Quote } from "lucide-react"

const testimonials = [
  {
    name: "Arjun K.",
    role: "B.Tech CSE, 3rd Year",
    quote:
      "PRODEXA completely changed how I manage my semester. The Pomodoro timer and GPA calculator are a lifesaver during exam season.",
  },
  {
    name: "Sneha R.",
    role: "B.Tech ECE, 2nd Year",
    quote:
      "I used to forget assignment deadlines all the time. Now my tasks, calendar, and timetable are in one place. Best decision ever.",
  },
  {
    name: "Rahul M.",
    role: "B.Tech IT, 4th Year",
    quote:
      "The habit tracker keeps me accountable. I have a 45-day coding streak going strong. This app just gets what students need.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Trusted by Students
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            What students are saying
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="animate-fade-in-up flex flex-col rounded-xl border border-border bg-card p-7 transition-colors hover:border-foreground/20"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <Quote className="mb-4 h-6 w-6 text-muted-foreground/40" />
              <p className="flex-1 text-base leading-relaxed text-foreground">
                {`"${t.quote}"`}
              </p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
