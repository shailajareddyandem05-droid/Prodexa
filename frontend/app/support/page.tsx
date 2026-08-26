import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HelpButton } from "@/components/help-button"
import { User, Bot, UserCog, Mail, Clock } from "lucide-react"
import Link from "next/link"

const team = [
  {
    icon: User,
    name: "Pavan Sai",
    role: "User Support",
    description: "Expert in API integrations and advanced troubleshooting.",
  },
  {
    icon: Bot,
    name: "Shailaja Reddy",
    role: "Product Specialist",
    description:
      "Here to help you get the most out of Prodexa features.",
  },
  {
    icon: UserCog,
    name: "Manikanta",
    role: "Technical Support",
    description: "Specializing in onboarding and general inquiries.",
  },
]

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Support
          </h1>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-primary" />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {"Need help? Our support team is here for you."}
          </p>

          {/* Team label */}
          <p className="mt-16 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Meet Our Support Team
          </p>

          {/* Team Cards */}
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {team.map((member) => (
              <div
                key={member.name}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <member.icon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-card-foreground">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-primary">
                  {member.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {member.description}
                </p>
                <Link
                  href="/contact"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <Mail className="h-4 w-4" />
                  Message
                </Link>
              </div>
            ))}
          </div>

          {/* Response time note */}
          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            We usually respond within 24 hours.
          </div>
        </div>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
