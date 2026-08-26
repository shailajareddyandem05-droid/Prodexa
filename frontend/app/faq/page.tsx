import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HelpButton } from "@/components/help-button"
import {
  HelpCircle,
  Shield,
  Zap,
  Download,
  Smartphone,
  Users,
  CreditCard,
  Code,
} from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ - PRODEXA Help Center",
  description:
    "Find quick answers to common questions about the Prodexa productivity suite.",
}

const faqs = [
  {
    icon: HelpCircle,
    question: "What is Prodexa?",
    answer:
      "A unified workspace for deep work, combining notes, tasks, and calendars.",
  },
  {
    icon: Shield,
    question: "Is my data secure?",
    answer:
      "We use industry-standard end-to-end encryption on all your tasks and notes.",
  },
  {
    icon: Zap,
    question: "How does Brain Dump work?",
    answer:
      "Quick-capture thoughts via global shortcuts without leaving your current app.",
  },
  {
    icon: Download,
    question: "Can I export my data?",
    answer:
      "Yes, Prodexa supports full data portability via CSV, Markdown, and PDF exports.",
  },
  {
    icon: Smartphone,
    question: "Is there a mobile app?",
    answer:
      "Available on iOS and Android with full offline synchronization support.",
  },
  {
    icon: Users,
    question: "Can I collaborate?",
    answer:
      "Real-time multiplayer editing and shared workspaces for teams and families.",
  },
  {
    icon: CreditCard,
    question: "What is the pricing?",
    answer:
      "Free for individuals, with premium tiers for power users and enterprise teams.",
  },
  {
    icon: Code,
    question: "Do you have an API?",
    answer:
      "Robust REST API and Webhooks for developers to build custom integrations.",
  },
]

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="px-6 pb-10 pt-16 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">
            Help Center
          </p>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {"Find quick answers to common questions about the Prodexa productivity suite. Can't find what you're looking for? Reach out to our support team."}
          </p>
        </section>

        {/* FAQ Grid */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                  <faq.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-foreground">
                  {faq.question}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
