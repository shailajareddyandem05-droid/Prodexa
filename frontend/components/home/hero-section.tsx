import Link from "next/link"

export function HeroSection() {
  return (
    <section className="flex flex-col items-center px-6 pb-28 pt-20 md:pt-28">
      {/* Hero Card */}
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card px-8 py-24 text-center md:px-16 md:py-32">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--muted)_0%,transparent_70%)]" />
        <div className="relative z-10 flex flex-col items-center gap-7">
          <h1 className="animate-fade-in-up text-balance text-5xl font-extrabold tracking-tight text-foreground md:text-7xl lg:text-8xl">
            PRODEXA
          </h1>
          <p className="animate-fade-in-up stagger-1 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            Productivity with Excellence. Your all-in-one workspace to manage
            tasks, track habits, and ace your semester.
          </p>
          <div className="animate-fade-in-up stagger-2 mt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-primary px-10 py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-border bg-muted px-10 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
