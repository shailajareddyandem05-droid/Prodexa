"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Mail,
  Bot,
  StickyNote,
  CheckSquare,
  User,
  LogOut,
  Timer,
  Target,
  Repeat,
  Wallet,
  GraduationCap,
  CalendarRange,
  BrainCircuit,
  Clock,
  Heart,
  Command,
  Settings,
  HardDrive
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

const coreItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Prodexa AI", href: "/dashboard/ai", icon: Bot },
]

const workspaceItems = [
  { label: "Inbox", href: "/dashboard/mails", icon: Mail },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { label: "Notes", href: "/dashboard/notes", icon: StickyNote },
  { label: "Drive", href: "/dashboard/drive", icon: HardDrive },
]

const productivityItems = [
  { label: "Pomodoro", href: "/dashboard/pomodoro", icon: Timer },
  { label: "Focus Mode", href: "/dashboard/focus", icon: Target },
  { label: "Brain Dump", href: "/dashboard/dump", icon: BrainCircuit },
  { label: "Handle Later", href: "/dashboard/handle-later", icon: Clock },
]

const personalItems = [
  { label: "Stress Relief", href: "/dashboard/stress-relief", icon: Heart },
  { label: "Habits", href: "/dashboard/habits", icon: Repeat },
  { label: "Expenses", href: "/dashboard/expenses", icon: Wallet },
  { label: "Timetable", href: "/dashboard/timetable", icon: CalendarRange },
  { label: "Academic", href: "/dashboard/gpa", icon: GraduationCap },
]

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string
  items: typeof coreItems
  pathname: string
}) {
  return (
    <div className="flex flex-col gap-0.5 mt-4">
      <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </p>
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <item.icon className={`h-4 w-4 ${isActive ? "text-background" : "text-muted-foreground group-hover:text-foreground"}`} />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export function DashboardSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { auth, logout } = useAuth()

  return (
    <aside className={`flex h-full w-64 shrink-0 flex-col bg-background relative z-10 border-r border-border/50 ${className || 'hidden md:flex'}`}>
      
      {/* Logo & Brand */}
      <div className="flex flex-col px-6 pt-8 pb-4">
        <Link href="/dashboard" className="flex items-center group">
          <span className="text-3xl font-black tracking-tighter text-foreground transition-transform group-hover:scale-[1.02]">
            Prodexa.
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-4 pb-8 scrollbar-hide">
        <NavSection title="Main" items={coreItems} pathname={pathname} />
        <NavSection title="Workspace" items={workspaceItems} pathname={pathname} />
        <NavSection title="Focus" items={productivityItems} pathname={pathname} />
        <NavSection title="Life" items={personalItems} pathname={pathname} />
      </nav>

      {/* Profile */}
      <div className="p-4 mt-auto border-t border-border/50 bg-muted/10">
        <div className="flex items-center justify-between p-2 rounded-xl transition-colors hover:bg-muted/40 cursor-pointer group">
          <Link href="/dashboard/profile" className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-background shadow-xs bg-muted group-hover:border-foreground/20 transition-colors">
              {auth.avatarUrl ? (
                <img src={auth.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-bold text-foreground tracking-tight">{auth.username || "User"}</span>
              <span className="truncate text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Pro Plan</span>
            </div>
          </Link>
          
          <button
            onClick={logout}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      
    </aside>
  )
}
