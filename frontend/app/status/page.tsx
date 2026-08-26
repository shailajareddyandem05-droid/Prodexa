import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HelpButton } from "@/components/help-button"
import { CheckCircle2, Activity, Server, Database, Globe, Shield, Zap, Clock } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "System Status - PRODEXA",
  description: "Check the current status of PRODEXA services and infrastructure.",
}

const services = [
  { name: "Web Application", status: "operational", icon: Globe, uptime: "99.98%" },
  { name: "API Services", status: "operational", icon: Server, uptime: "99.95%" },
  { name: "Database", status: "operational", icon: Database, uptime: "99.99%" },
  { name: "Authentication", status: "operational", icon: Shield, uptime: "99.97%" },
  { name: "AI Engine", status: "operational", icon: Zap, uptime: "99.90%" },
  { name: "Real-time Sync", status: "operational", icon: Activity, uptime: "99.93%" },
]

const recentIncidents = [
  {
    date: "March 10, 2026",
    title: "Scheduled Maintenance",
    description: "Routine database optimization. No user impact.",
    status: "Resolved",
  },
  {
    date: "February 28, 2026",
    title: "Minor API Latency",
    description: "Brief increase in API response times. Resolved within 15 minutes.",
    status: "Resolved",
  },
]

export default function StatusPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              System Status
            </h1>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-primary" />
            <div className="mx-auto mt-8 flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-4">
              <CheckCircle2 className="h-6 w-6 text-foreground" />
              <div>
                <p className="text-lg font-semibold text-foreground">All Systems Operational</p>
                <p className="text-sm text-muted-foreground">Last checked: just now</p>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="mt-12">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Services
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-muted">
                    <service.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{service.name}</p>
                    <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-foreground" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="mt-14">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Incidents
            </h2>
            <div className="flex flex-col gap-4">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.title}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{incident.title}</h3>
                    <span className="rounded-full border border-border px-3 py-0.5 text-xs font-medium text-muted-foreground">
                      {incident.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{incident.description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {incident.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
