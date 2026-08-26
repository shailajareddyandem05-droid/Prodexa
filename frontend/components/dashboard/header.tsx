"use client"

import { CalendarDays, Command, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown"
import { IntegrationsDropdown } from "@/components/dashboard/integrations-dropdown"
import { WeatherPill } from "@/components/dashboard/weather-pill"
import { useAuth } from "@/components/auth/auth-context"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

export function DashboardHeader() {
  const { auth } = useAuth()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile sidebar on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 md:px-10 z-20 sticky top-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors border border-border/40 bg-background shadow-sm">
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] sm:w-[300px] border-r-0 bg-background">
            <DashboardSidebar className="flex w-full border-r-0" />
          </SheetContent>
        </Sheet>

        <div className="flex flex-col gap-0.5 mt-1 hidden sm:flex">
          <p className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
            {getGreeting()}, <span className="text-muted-foreground">{auth.username || "User"}</span>
          </p>
        </div>
        <div className="sm:hidden flex items-center h-full mt-1 ml-1 group">
          <p className="text-xl font-black tracking-tighter text-foreground transition-transform group-hover:scale-[1.02]">
            Prodexa.
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* Weather pill hidden on very small screens */}
        <div className="hidden xs:block sm:block">
          <WeatherPill />
        </div>

        {/* Calendar hidden on very small screens */}
        <Link
          href="/dashboard/calendar"
          className="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-muted/10 px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
          aria-label="Calendar"
        >
          <CalendarDays className="h-4 w-4" />
          <span className="hidden md:inline">Calendar</span>
        </Link>


        {/* Integrations */}
        <div className="hover:opacity-80 transition-opacity">
          <IntegrationsDropdown />
        </div>

        {/* Notifications */}
        <div className="hover:opacity-80 transition-opacity">
           <NotificationsDropdown />
        </div>

        {/* Theme */}
        <div className="hover:opacity-80 transition-opacity">
           <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
