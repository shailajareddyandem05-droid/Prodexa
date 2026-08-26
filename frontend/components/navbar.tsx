"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap, Menu, X } from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth/auth-context"

const navLinks = [
  { href: "/feedback", label: "Feedback" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/support", label: "Support" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { auth } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5.5 w-5.5 text-primary-foreground" />
          </div>
          <span className="text-[22px] font-bold tracking-tight text-foreground">
            PRODEXA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[17px] font-medium transition-colors hover:text-foreground ${
                pathname === link.href
                  ? "text-foreground border-b-2 border-foreground pb-0.5"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          <Link
            href={auth.isLoggedIn ? "/dashboard" : "/login"}
            className="rounded-full border border-foreground px-7 py-3 text-base font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            {auth.isLoggedIn ? "Dashboard" : "Login / Sign Up"}
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-foreground"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-6 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={auth.isLoggedIn ? "/dashboard" : "/login"}
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-full border border-foreground px-5 py-2 text-center text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              {auth.isLoggedIn ? "Dashboard" : "Login / Sign Up"}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
