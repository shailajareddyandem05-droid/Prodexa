"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { firebaseAuth, googleProvider } from "@/lib/firebase"
import { api } from "@/lib/api"

interface AuthState {
  isLoggedIn: boolean
  username: string
  avatarUrl: string | null
  email: string | null
  uid: string | null
}

interface AuthContextValue {
  auth: AuthState
  login: (username: string) => void
  loginWithEmail: (email: string, password: string) => Promise<void>
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => void
  setAvatarUrl: (url: string | null) => void
  firebaseUser: User | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    username: "",
    avatarUrl: null,
    email: null,
    uid: null,
  })
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const state: AuthState = {
          isLoggedIn: true,
          username: user.displayName || user.email?.split("@")[0] || "User",
          avatarUrl: user.photoURL,
          email: user.email,
          uid: user.uid,
        }
        setAuth(state)
        setFirebaseUser(user)

        // Verify with backend
        try {
          await api.auth.verify()
        } catch (err) {
          console.warn("Backend verification failed:", err)
        }
      } else {
        setAuth({ isLoggedIn: false, username: "", avatarUrl: null, email: null, uid: null })
        setFirebaseUser(null)
      }
      setHydrated(true)
    })

    return () => unsubscribe()
  }, [])

  // Protect /dashboard routes
  useEffect(() => {
    if (!hydrated) return
    if (pathname.startsWith("/dashboard") && !auth.isLoggedIn) {
      router.replace("/login")
    }
  }, [hydrated, auth.isLoggedIn, pathname, router])

  // Legacy login (fallback for non-Firebase)
  const login = useCallback(
    (username: string) => {
      const next: AuthState = {
        isLoggedIn: true,
        username: username || "User",
        avatarUrl: null,
        email: null,
        uid: null,
      }
      setAuth(next)
      sessionStorage.setItem("prodexa_auth", JSON.stringify(next))
      router.push("/dashboard")
    },
    [router],
  )

  // Firebase Email/Password Login
  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      await signInWithEmailAndPassword(firebaseAuth, email, password)
      router.push("/dashboard")
    },
    [router],
  )

  // Firebase Email/Password Signup
  const signupWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
      if (credential.user) {
        await updateProfile(credential.user, { displayName: name })
      }
      router.push("/dashboard")
    },
    [router],
  )

  // Firebase Google Sign-In
  const loginWithGoogle = useCallback(async () => {
    await signInWithPopup(firebaseAuth, googleProvider)
    router.push("/dashboard")
  }, [router])

  const logout = useCallback(async () => {
    await firebaseSignOut(firebaseAuth)
    sessionStorage.removeItem("prodexa_auth")
    setAuth({ isLoggedIn: false, username: "", avatarUrl: null, email: null, uid: null })
    router.push("/")
  }, [router])

  const setAvatarUrl = useCallback((url: string | null) => {
    setAuth((prev) => ({ ...prev, avatarUrl: url }))
  }, [])

  // While hydrating, show nothing for protected routes to avoid flash
  if (!hydrated && pathname.startsWith("/dashboard")) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{ auth, login, loginWithEmail, signupWithEmail, loginWithGoogle, logout, setAvatarUrl, firebaseUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
