import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { FloatingActions } from "@/components/dashboard/floating-actions"
import { AiDrawer } from "@/components/dashboard/ai-drawer"

export const metadata = {
  title: "PRODEXA Dashboard",
  description: "Your AI-powered productivity dashboard",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <FloatingActions />
      <AiDrawer />
    </div>
  )
}
