"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HelpButton } from "@/components/help-button"
import { Send } from "lucide-react"

export default function FeedbackPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Feedback
            </h1>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-primary" />
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Help us improve Prodexa by sharing your thoughts.
            </p>
          </div>

          {/* Form */}
          <div className="mt-12 rounded-xl border border-border bg-card p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault()
              }}
              className="flex flex-col gap-6"
            >
              {/* Name & Email row */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-card-foreground">
                    Name <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-card-foreground">
                    Email <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Feedback Type */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-card-foreground">
                  Feedback Type
                </label>
                <select className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none">
                  <option>General Feedback</option>
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-card-foreground">
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Tell us more about your experience..."
                  className="resize-none rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Send Feedback
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
