import { LoginPageContent } from "@/components/auth/login-page-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login / Sign Up - PRODEXA",
  description: "Access your PRODEXA account or create a new one.",
}

export default function LoginPage() {
  return <LoginPageContent />
}
