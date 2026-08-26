"use client"

import Link from "next/link"
import { HelpCircle } from "lucide-react"

export function HelpButton() {
  return (
    <Link
      href="/faq"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
      aria-label="Help center"
    >
      <HelpCircle className="h-7 w-7" />
    </Link>
  )
}
