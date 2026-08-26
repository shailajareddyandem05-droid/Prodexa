"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { NeuralBackground } from "@/components/auth/neural-background"
import { AuthForm } from "@/components/auth/auth-form"
import { useAuth } from "@/components/auth/auth-context"

export function LoginPageContent() {
  const { auth } = useAuth()
  const router = useRouter()

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (auth.isLoggedIn) {
      router.replace("/dashboard")
    }
  }, [auth.isLoggedIn, router])

  if (auth.isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <NeuralBackground />
      <div className="relative z-10 w-full px-4">
        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
