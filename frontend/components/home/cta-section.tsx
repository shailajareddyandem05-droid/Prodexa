import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-16 text-center md:px-16 md:py-20">
          {/* Subtle radial glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--muted)_0%,transparent_70%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Ready to transform your productivity?
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Join thousands of students who are crushing their goals with PRODEXA.
              Your best semester starts here.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
