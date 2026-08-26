import Link from "next/link"
import { Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-8 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Zap className="h-5 w-5 text-primary" />
          <span>{"© 2026 PRODEXA. All rights reserved."}</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <Link href="/faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="/status" className="transition-colors hover:text-foreground">
            Status
          </Link>
        </div>
      </div>
    </footer>
  )
}

