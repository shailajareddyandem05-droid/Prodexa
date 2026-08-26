"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HelpButton } from "@/components/help-button"
import {
  Mail,
  Clock,
  MapPin,
  Zap,
  User,
  AtSign,
  MessageSquare,
  Send,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { api } from "@/lib/api"

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "support@prodexa.com",
  },
  {
    icon: Clock,
    label: "Support Hours",
    value: "Mon-Fri, 9am - 5pm EST",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "San Francisco, CA",
  },
]

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !message) return

    setLoading(true)
    setError(null)
    try {
      await api.contact.submit({ name, email, subject, message })
      setSent(true)
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
    } catch (err: any) {
      setError(err.message || "Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Contact Us
          </h1>
          <div className="mt-3 h-1 w-20 rounded-full bg-primary" />
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            {"Have questions or suggestions? We're here to help optimize your workflow."}
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            {"We'd love to hear from you."}
          </p>

          <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:gap-16">
            {/* Left – Contact Info */}
            <div className="flex shrink-0 flex-col gap-6 lg:w-72">
              {contactInfo.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </div>
                </div>
              ))}

              <div className="mt-2 flex items-start gap-4 rounded-lg border border-border bg-muted/40 p-4">
                <Zap className="h-5 w-5 shrink-0 text-foreground" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Fast Response:</span> We
                  typically respond within 24 hours.
                </p>
              </div>
            </div>

            {/* Right – Form */}
            <div className="flex-1 rounded-xl border border-border bg-card p-8">
              {sent ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                  <h3 className="text-lg font-semibold text-foreground">Message Sent!</h3>
                  <p className="text-sm text-muted-foreground">{"We'll get back to you within 24 hours."}</p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-4 rounded-full border border-border px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6"
                >
                  {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-card-foreground">
                        Name
                      </label>
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Doe"
                          required
                          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-card-foreground">
                        Email
                      </label>
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3">
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="jane@example.com"
                          required
                          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-card-foreground">
                      Subject
                    </label>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="How can we help?"
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-card-foreground">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message here..."
                      required
                      className="resize-none rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        <>Send Message <Send className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
