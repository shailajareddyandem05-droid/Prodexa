import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HelpButton } from "@/components/help-button"

const sections = [
  {
    title: "What is Prodexa",
    content:
      "Prodexa is a premium SaaS platform built for high-performance teams. It consolidates task management, time tracking, and strategic planning into a single, distraction-free interface. Unlike other tools that overwhelm you with features, Prodexa operates on the principle of subtraction\u2014giving you only the tools you need to move the needle.",
  },
  {
    title: "Why Prodexa",
    content:
      "Modern work is broken. We are bombarded by notifications, fragmented across dozens of apps, and constantly context-switching. This fragmentation kills deep work. We built Prodexa because we believe that software should be quiet. It should get out of the way and let you do your best work. Our mission is to return control of your attention back to you.",
  },
  {
    title: "How It Helps",
    content:
      "By unifying your tasks, calendar, and documents into a single view, Prodexa eliminates the need to switch between tools. Focus Mode hides everything except your current task, helping you enter a distraction-free flow state. Smart Prioritization uses AI algorithms that identify the 20% of work that yields 80% of results.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            About Prodexa
          </h1>
          <div className="mt-3 h-1 w-20 rounded-full bg-primary" />

          <p className="mt-8 text-base leading-relaxed text-muted-foreground">
            We are building the minimalist productivity suite designed to restore
            clarity to your workflow. We strip away the noise so you can focus on
            what truly matters.
          </p>

          <hr className="my-12 border-border" />

          {/* Content Sections */}
          <div className="flex flex-col gap-12">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-2xl font-bold text-foreground">
                  {section.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
