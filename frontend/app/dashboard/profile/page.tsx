"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/components/auth/auth-context"
import { useTheme } from "next-themes"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { updateProfile } from "firebase/auth"
import { storage } from "@/lib/firebase"
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Moon,
  Sun,
  Monitor,
  Globe,
  Clock,
  Camera,
  Check,
  Pencil,
  X,
  Lock,
  Smartphone,
  KeyRound,
} from "lucide-react"

/* eslint-disable @next/next/no-img-element */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Section = "profile" | "preferences" | "security"

const sections: { key: Section; label: string; desc: string }[] = [
  { key: "profile", label: "Profile", desc: "Personal information and photo" },
  { key: "preferences", label: "Preferences", desc: "Theme and appearance" },
  { key: "security", label: "Security", desc: "Account protection" },
]

const timezones = [
  "PST (UTC-8)",
  "MST (UTC-7)",
  "CST (UTC-6)",
  "EST (UTC-5)",
  "GMT (UTC+0)",
  "CET (UTC+1)",
  "IST (UTC+5:30)",
  "JST (UTC+9)",
  "AEST (UTC+10)",
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { auth, setAvatarUrl, firebaseUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeSection, setActiveSection] = useState<Section>("profile")

  /* Editing states */
  const [editingDetails, setEditingDetails] = useState(false)
  const [editingBio, setEditingBio] = useState(false)

  /* Personal details */
  const [fullName, setFullName] = useState(auth.username || "User")
  const [email] = useState(auth.email || "")
  const [address, setAddress] = useState("")
  const [dob, setDob] = useState("")
  const [timezone, setTimezone] = useState("")
  const [bio, setBio] = useState("")

  /* Temp states for cancel */
  const [tempDetails, setTempDetails] = useState({ fullName, email, address, dob, timezone })
  const [tempBio, setTempBio] = useState(bio)

  /* Security */
  const [twoFa, setTwoFa] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  /* Photo upload */
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !firebaseUser) return
    
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarUrl(ev.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const storageRef = ref(storage, `users/${firebaseUser.uid}/profile_${Date.now()}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      await updateProfile(firebaseUser, { photoURL: downloadURL })
      setAvatarUrl(downloadURL) // update with permanent URL
    } catch (err) {
      console.error("Failed to upload profile picture:", err)
      alert("Failed to upload image. Please try again.")
    }
  }

  /* Details editing */
  function startEditingDetails() {
    setTempDetails({ fullName, email, address, dob, timezone })
    setEditingDetails(true)
  }
  function cancelEditingDetails() {
    setEditingDetails(false)
  }
  function saveDetails() {
    setFullName(tempDetails.fullName)
    setAddress(tempDetails.address)
    setDob(tempDetails.dob)
    setTimezone(tempDetails.timezone)
    setEditingDetails(false)
  }

  /* Bio editing */
  function startEditingBio() {
    setTempBio(bio)
    setEditingBio(true)
  }
  function saveBio() {
    setBio(tempBio)
    setEditingBio(false)
  }

  /* Format date */
  function formatDate(d: string) {
    try {
      return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    } catch {
      return d
    }
  }

  return (
    <div className="-m-6 flex h-[calc(100%+48px)] overflow-hidden">
      {/* Left sidebar navigation */}
      <div className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        {/* Avatar header */}
        <div className="flex flex-col items-center gap-3 border-b border-border px-6 py-8">
          <div className="group relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
              {auth.avatarUrl ? (
                <img src={auth.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 opacity-0 transition-all group-hover:bg-foreground/50 group-hover:opacity-100"
              aria-label="Upload photo"
            >
              <Camera className="h-4 w-4 text-background" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{fullName}</p>
            <p className="text-[11px] text-muted-foreground">{email}</p>
          </div>
        </div>

        {/* Section nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${activeSection === s.key
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top bar */}
        <div className="border-b border-border px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">
            {sections.find((s) => s.key === activeSection)?.label}
          </h1>
          <p className="text-xs text-muted-foreground">
            {sections.find((s) => s.key === activeSection)?.desc}
          </p>
        </div>

        <div className="flex-1 px-8 py-6">
          {/* ---- PROFILE ---- */}
          {activeSection === "profile" && (
            <div className="flex flex-col gap-8 max-w-2xl">
              {/* Photo */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-sm font-semibold text-foreground">Profile Photo</h2>
                <div className="flex items-center gap-5">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
                    {auth.avatarUrl ? (
                      <img src={auth.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
                      >
                        Upload Photo
                      </button>
                      {auth.avatarUrl && (
                        <button
                          onClick={() => setAvatarUrl(null)}
                          className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">JPG, PNG or GIF. Max 2MB recommended.</p>
                  </div>
                </div>
              </div>

              {/* Personal details */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Personal Details</h2>
                  {!editingDetails && (
                    <button
                      onClick={startEditingDetails}
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>

                {editingDetails ? (
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <FieldInput
                        icon={User}
                        label="Full Name"
                        value={tempDetails.fullName}
                        onChange={(v) => setTempDetails((p) => ({ ...p, fullName: v }))}
                      />
                      <FieldInput
                        icon={Mail}
                        label="Email"
                        type="email"
                        value={tempDetails.email}
                        onChange={() => { }}
                        disabled
                      />
                      <FieldInput
                        icon={MapPin}
                        label="Address"
                        value={tempDetails.address}
                        onChange={(v) => setTempDetails((p) => ({ ...p, address: v }))}
                      />
                      <FieldInput
                        icon={Calendar}
                        label="Date of Birth"
                        type="date"
                        value={tempDetails.dob}
                        onChange={(v) => setTempDetails((p) => ({ ...p, dob: v }))}
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3 w-3" /> Timezone
                        </label>
                        <select
                          value={tempDetails.timezone}
                          onChange={(e) => setTempDetails((p) => ({ ...p, timezone: e.target.value }))}
                          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                        >
                          {timezones.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveDetails}
                        className="flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
                      >
                        <Check className="h-3 w-3" /> Save
                      </button>
                      <button
                        onClick={cancelEditingDetails}
                        className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <DetailRow icon={User} label="Full Name" value={fullName} />
                    <DetailRow icon={Mail} label="Email" value={email} />
                    <DetailRow icon={MapPin} label="Address" value={address} />
                    <DetailRow icon={Calendar} label="Date of Birth" value={formatDate(dob)} />
                    <DetailRow icon={Clock} label="Timezone" value={timezone} />
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Bio</h2>
                  {!editingBio && (
                    <button
                      onClick={startEditingBio}
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>
                {editingBio ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      rows={4}
                      autoFocus
                      maxLength={500}
                      className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                      placeholder="Tell us about yourself..."
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">{tempBio.length}/500</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={saveBio}
                          className="flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
                        >
                          <Check className="h-3 w-3" /> Save
                        </button>
                        <button
                          onClick={() => setEditingBio(false)}
                          className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-foreground">{bio}</p>
                )}
              </div>
            </div>
          )}

          {/* ---- PREFERENCES (theme only) ---- */}
          {activeSection === "preferences" && (
            <div className="max-w-2xl">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-1 text-sm font-semibold text-foreground">Theme</h2>
                <p className="mb-6 text-xs text-muted-foreground">Choose how the application looks for you</p>
                <div className="grid grid-cols-3 gap-4">
                  <ThemeCard
                    label="Light"
                    desc="Clean and bright"
                    icon={Sun}
                    iconBg="bg-[#fafafa]"
                    iconBorder="border-[#e4e4e7]"
                    iconColor="text-[#0a0a0a]"
                    active={theme === "light"}
                    onClick={() => setTheme("light")}
                  />
                  <ThemeCard
                    label="Dark"
                    desc="Easy on the eyes"
                    icon={Moon}
                    iconBg="bg-[#09090b]"
                    iconBorder="border-[#27272a]"
                    iconColor="text-[#fafafa]"
                    active={theme === "dark"}
                    onClick={() => setTheme("dark")}
                  />
                  <ThemeCard
                    label="System"
                    desc="Match your OS"
                    icon={Monitor}
                    iconBg="bg-muted"
                    iconBorder="border-border"
                    iconColor="text-foreground"
                    active={theme === "system"}
                    onClick={() => setTheme("system")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---- SECURITY ---- */}
          {activeSection === "security" && (
            <div className="flex max-w-2xl flex-col gap-6">
              {/* 2FA */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-foreground">Two-Factor Authentication</h2>
                      {twoFa ? (
                        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground">Active</span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Inactive</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {twoFa
                        ? "Your account is protected with an additional verification step on every login."
                        : "Add a second layer of security to protect your account from unauthorized access."}
                    </p>
                  </div>
                  <button
                    onClick={() => setTwoFa(!twoFa)}
                    className={`shrink-0 rounded-lg px-5 py-2 text-xs font-medium transition-colors ${twoFa
                      ? "border border-border text-foreground hover:bg-muted"
                      : "bg-foreground text-background hover:opacity-90"
                      }`}
                  >
                    {twoFa ? "Disable" : "Enable"}
                  </button>
                </div>
                {/* 2FA detail */}
                <div className="mt-5 rounded-md border border-border bg-muted/30 p-4">
                  <p className="mb-3 text-xs font-medium text-foreground">Supported methods</p>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">Authenticator App</p>
                        <p className="text-[11px] text-muted-foreground">Use Google Authenticator, Authy, or similar TOTP apps</p>
                      </div>
                      {twoFa && <Check className="h-3.5 w-3.5 text-foreground" />}
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">SMS Verification</p>
                        <p className="text-[11px] text-muted-foreground">Receive a one-time code via text message</p>
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center gap-3">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">Recovery Codes</p>
                        <p className="text-[11px] text-muted-foreground">One-time backup codes stored securely in case you lose access</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold text-foreground">Password</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Last changed 30 days ago. We recommend updating every 90 days.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="shrink-0 rounded-lg border border-border px-5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {showPasswordForm ? "Cancel" : "Change"}
                  </button>
                </div>
                {showPasswordForm && (
                  <div className="mt-5 flex flex-col gap-4 rounded-md border border-border bg-muted/30 p-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter current password"
                        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">New Password</label>
                        <input
                          type="password"
                          placeholder="Enter new password"
                          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
                        <input
                          type="password"
                          placeholder="Re-enter new password"
                          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[11px] text-muted-foreground">Password must contain:</p>
                      <ul className="flex flex-col gap-1 pl-3 text-[11px] text-muted-foreground">
                        <li>At least 8 characters</li>
                        <li>One uppercase and one lowercase letter</li>
                        <li>One number and one special character</li>
                      </ul>
                    </div>
                    <div>
                      <button
                        onClick={() => setShowPasswordForm(false)}
                        className="rounded-lg bg-foreground px-5 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Login Activity */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold text-foreground">Login Activity</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Devices and locations where your account is currently active
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground py-4 text-center">No login activity data available</p>
                </div>
                <button className="mt-4 w-full rounded-md border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                  Sign out all other devices
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

function FieldInput({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`rounded-lg border border-border px-3 py-2.5 text-sm outline-none transition-colors dark:[color-scheme:dark] ${disabled
          ? "cursor-not-allowed bg-muted text-muted-foreground opacity-60"
          : "bg-background text-foreground focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
          }`}
      />
      {disabled && (
        <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
      )}
    </div>
  )
}

function ThemeCard({
  label,
  desc,
  icon: Icon,
  iconBg,
  iconBorder,
  iconColor,
  active,
  onClick,
}: {
  label: string
  desc: string
  icon: React.ElementType
  iconBg: string
  iconBorder: string
  iconColor: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${active
        ? "border-foreground bg-muted/50"
        : "border-border hover:border-foreground/30"
        }`}
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${iconBorder} ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
      {active && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground">
          <Check className="h-3 w-3 text-background" />
        </div>
      )}
    </button>
  )
}
