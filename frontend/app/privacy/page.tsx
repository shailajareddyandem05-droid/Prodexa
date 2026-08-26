import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HelpButton } from "@/components/help-button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - PRODEXA",
  description: "Learn how PRODEXA collects, uses, and protects your personal data.",
}

const sections = [
  {
    title: "Information We Collect",
    content:
      "We collect information you provide directly, such as your name, email address, and profile details when you create an account. We also collect usage data including how you interact with our platform, features you use, and your productivity patterns to improve our services.",
  },
  {
    title: "How We Use Your Data",
    content:
      "Your data is used to provide and improve our productivity services, personalize your experience, generate AI-powered insights, and communicate important updates. We never sell your personal data to third parties.",
  },
  {
    title: "Data Storage & Security",
    content:
      "All data is encrypted at rest and in transit using industry-standard AES-256 encryption. We use secure cloud infrastructure with regular security audits. Your notes, tasks, and personal information are stored in isolated, access-controlled environments.",
  },
  {
    title: "Third-Party Services",
    content:
      "We integrate with select third-party services (Google, GitHub) for authentication purposes only. These integrations follow OAuth 2.0 standards and we only request the minimum permissions necessary.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, export, or delete your personal data at any time from your profile settings. You can also request a complete data export in standard formats (JSON, CSV). Account deletion permanently removes all associated data within 30 days.",
  },
  {
    title: "Cookies",
    content:
      "We use essential cookies for authentication and session management. We do not use tracking cookies or share cookie data with advertisers. You can manage cookie preferences in your browser settings.",
  },
  {
    title: "Updates to This Policy",
    content:
      "We may update this privacy policy from time to time. We will notify you of any material changes via email or through a notice on our platform. Continued use of PRODEXA after changes constitutes acceptance of the updated policy.",
  },
]

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Privacy Policy
          </h1>
          <div className="mt-3 h-1 w-20 rounded-full bg-primary" />
          <p className="mt-8 text-base leading-relaxed text-muted-foreground">
            At PRODEXA, we take your privacy seriously. This policy explains how
            we handle your information when you use our productivity platform.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: March 2026
          </p>

          <hr className="my-12 border-border" />

          <div className="flex flex-col gap-10">
            {sections.map((section, i) => (
              <div key={section.title} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <h2 className="text-xl font-bold text-foreground">
                  {section.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
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
