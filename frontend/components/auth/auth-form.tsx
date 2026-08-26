"use client"

import { useState } from "react"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth/auth-context"

type Tab = "login" | "signup"

export function AuthForm() {
  const [activeTab, setActiveTab] = useState<Tab>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login, loginWithEmail, signupWithEmail } = useAuth()

  async function handleLogin(email: string, password: string) {
    setError(null)
    setLoading(true)
    try {
      if (!password) {
        login(email)
      } else {
        await loginWithEmail(email, password)
      }
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(name: string, email: string, password: string) {
    setError(null)
    setLoading(true)
    try {
      if (!email || !password) {
        login(name)
      } else {
        await signupWithEmail(name, email, password)
      }
    } catch (err: any) {
      setError(err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-border/40 bg-card/60 p-8 shadow-2xl backdrop-blur-2xl">
      {/* Go Back */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Link>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {error}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="mb-8 flex rounded-full border border-border/60 bg-muted/50 p-1">
        <button
          onClick={() => { setActiveTab("login"); setError(null) }}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${activeTab === "login"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Login
        </button>
        <button
          onClick={() => { setActiveTab("signup"); setError(null) }}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${activeTab === "signup"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Sign Up
        </button>
      </div>

      {activeTab === "login" ? (
        <LoginForm
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          onLogin={handleLogin}
          loading={loading}
        />
      ) : (
        <SignUpForm
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          onSignup={handleSignup}
          loading={loading}
        />
      )}
    </div>
  )
}

function LoginForm({
  showPassword,
  togglePassword,
  onLogin,
  loading,
}: {
  showPassword: boolean
  togglePassword: () => void
  onLogin: (email: string, password: string) => void
  loading: boolean
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); onLogin(email, password) }}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-lg border border-border/60 bg-muted/40 px-4 py-3 pr-11 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <div className="mt-1 text-center">
        <a
          href="#"
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Forgot your password?
        </a>
      </div>
    </form>
  )
}

function SignUpForm({
  showPassword,
  togglePassword,
  onSignup,
  loading,
}: {
  showPassword: boolean
  togglePassword: () => void
  onSignup: (name: string, email: string, password: string) => void
  loading: boolean
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const inputClasses =
    "rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSignup(name, email, password) }}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password (min 6 characters)"
            className={`w-full pr-11 ${inputClasses}`}
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  )
}
