import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HelpButton } from "@/components/help-button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - PRODEXA",
  description: "Terms and conditions for using the PRODEXA productivity platform.",
}

const sections = [
  {
    title: "Acceptance of Terms",
    content:
      "By accessing or using PRODEXA, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms apply to all users, including students, educators, and team members.",
  },
  {
    title: "Account Responsibilities",
    content:
      "You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration and to update it as needed. You must not share your account with others or allow unauthorized access.",
  },
  {
    title: "Acceptable Use",
    content:
      "PRODEXA is designed for productivity and personal organization. You agree not to use the platform for illegal activities, spam, harassment, or any purpose that violates applicable laws. Automated scraping or data extraction without permission is prohibited.",
  },
  {
    title: "Intellectual Property",
    content:
      "Content you create on PRODEXA (notes, tasks, schedules) remains your intellectual property. PRODEXA retains rights to its software, design, and branding. You grant us a limited license to process your content solely to provide our services.",
  },
  {
    title: "Service Availability",
    content:
      "We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. We may perform maintenance with advance notice. We are not liable for any losses resulting from temporary unavailability.",
  },
  {
    title: "Termination",
    content:
      "You may delete your account at any time. We may suspend or terminate accounts that violate these terms. Upon termination, your data will be retained for 30 days before permanent deletion, during which you can request an export.",
  },
  {
    title: "Limitation of Liability",
    content:
      "PRODEXA is provided as-is without warranties of any kind. We are not liable for indirect, incidental, or consequential damages. Our total liability shall not exceed the amount you paid for the service in the preceding 12 months.",
  },
  {
    title: "Changes to Terms",
    content:
      "We reserve the right to modify these terms at any time. Material changes will be communicated via email or in-app notification at least 14 days before taking effect.",
  },
]

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Terms of Service
          </h1>
          <div className="mt-3 h-1 w-20 rounded-full bg-primary" />
          <p className="mt-8 text-base leading-relaxed text-muted-foreground">
            Please read these terms carefully before using PRODEXA. By using our
            platform, you acknowledge that you have read and understood these terms.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective date: March 2026
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
