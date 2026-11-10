"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useSession } from "next-auth/react"
import { useManagerTranslations } from "@/utils/Managertranslations"
import ChangePasswordForm from "@/components/shared/ChangePasswordForm"
import DelegationSettings from "@/components/Dashboard/Company-dashboard/manager/delegation/DelegationSettings"

/* ─── Constants ─── */
const NAVY = "rgb(5,22,80)"

/* ─────────────────────────────────────────────
   SHARED UI HELPERS
───────────────────────────────────────────── */
const Field: React.FC<{
  label: string; required?: boolean; hint?: string
  span2?: boolean; children: React.ReactNode
}> = ({ label, required, hint, span2, children }) => (
  <div className={clsx(span2 && "sm:col-span-2")}>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
)

const inputCls = "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none transition-all focus:ring-2 focus:ring-blue-200 focus:border-blue-300"

const SaveBtn: React.FC<{ label: string; onClick: () => void; icon?: string; disabled?: boolean }> = ({ label, onClick, icon = "tabler:device-floppy", disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ backgroundColor: NAVY }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.backgroundColor = "rgb(15,32,90)")}
    onMouseLeave={e => !disabled && (e.currentTarget.style.backgroundColor = NAVY)}>
    <Icon icon={icon} className="w-4 h-4" />{label}
  </button>
)

/* ─── Inline toast (no external dependency needed) ─── */
const useInlineToast = () => {
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" | "loading" } | null>(null)
  const show = (text: string, type: "success" | "error" | "loading" = "success") => {
    setMsg({ text, type })
    if (type !== "loading") setTimeout(() => setMsg(null), 3000)
  }
  return { msg, show }
}

/* ─── API helpers ─── */
const fetchManagerInfo = async (): Promise<any> => {
  const res = await fetch("/api/company/managers/settings")
  if (!res.ok) throw new Error("Failed to load settings")
  const body = await res.json()
  return body.data
}

const saveManagerInfo = async (patch: Record<string, unknown>): Promise<any> => {
  const res = await fetch("/api/company/managers/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error("Failed to save settings")
  const body = await res.json()
  return body.data
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const ManagerSettings: React.FC = () => {
  const { t, language, setLanguage } = useManagerTranslations()
  const { data: session } = useSession()
  const isEn = language === "en"
  // ?tab=substitute opens the Substitute tab directly (used by the notification bell).
  const [activeTab, setActiveTab] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "substitute" ? "substitute" : "general")
  const { msg: toast, show } = useInlineToast()
  const [loading, setLoading] = useState(true)

  const avatarRef = useRef<HTMLInputElement>(null)
  const [avatarMode, setAvatarMode] = useState<"initials" | "upload" | "preset">("initials")
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null)
  const [presetAvatar, setPresetAvatar] = useState<string | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const PRESET_AVATARS = [
    { id: "a1", bg: "rgb(99,102,241)", initials: "👤" },
    { id: "a2", bg: "rgb(236,72,153)", initials: "👩" },
    { id: "a3", bg: "rgb(14,165,233)", initials: "🧑" },
    { id: "a4", bg: "rgb(22,163,74)", initials: "👨" },
    { id: "a5", bg: "rgb(251,146,60)", initials: "🧔" },
    { id: "a6", bg: "rgb(168,85,247)", initials: "👩‍💼" },
    { id: "a7", bg: "rgb(20,184,166)", initials: "🧑‍💻" },
    { id: "a8", bg: "rgb(239,68,68)", initials: "👩‍🔬" },
    { id: "a9", bg: "rgb(245,158,11)", initials: "🧑‍🎨" },
    { id: "a10", bg: "rgb(6,182,212)", initials: "👨‍🏫" },
    { id: "a11", bg: "rgb(52,211,153)", initials: "🧑‍🚀" },
    { id: "a12", bg: NAVY, initials: "👔" },
  ]

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedAvatar(reader.result as string)
      setAvatarMode("upload")
      setShowAvatarPicker(false)
    }
    reader.readAsDataURL(file)
  }

  const currentAvatarContent = () => {
    if (avatarMode === "upload" && uploadedAvatar) {
      return <img src={uploadedAvatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
    }
    if (avatarMode === "preset" && presetAvatar) {
      const p = PRESET_AVATARS.find(a => a.id === presetAvatar)!
      return <span className="text-2xl leading-none">{p.initials}</span>
    }
    return <span className="text-xl font-bold text-white">{general.firstName[0]}{general.lastName[0]}</span>
  }
  const currentAvatarBg = () => {
    if (avatarMode === "preset" && presetAvatar) {
      return PRESET_AVATARS.find(a => a.id === presetAvatar)?.bg ?? NAVY
    }
    if (avatarMode === "upload") return "transparent"
    return NAVY
  }

  /* ── State ── */
  const [general, setGeneral] = useState({
    firstName: "", lastName: "",
    email: "", privateEmail: "", phone: "",
    mobilePhone: "",
    jobTitle: "",
    homeAddress: "",
    gender: "other" as "male" | "female",
    professionalBio: "",
  })

  const [emergencyContact, setEmergencyContact] = useState({
    firstName: "", lastName: "", relationship: "", email: "", phoneNumber: "",
  })

  const [dept, setDept] = useState({
    companyName: "",
    department: "", deptSize: "",
    deptFocus: "",
    managedSince: "", deptGoals: "",
  })


  const [prefs, setPrefs] = useState({
    timezone: "Europe/Stockholm",
    dateFormat: "YYYY-MM-DD",
  })

  // ── Load existing settings on mount ──
  useEffect(() => {
    let cancelled = false

    // Derive first/last name from the session's full name, e.g. "Lena Larsson"
    const sessionName = session?.user?.name || ""
    const sessionNameParts = sessionName.split(" ")
    const sessionFirstName = sessionNameParts[0] || ""
    const sessionLastName = sessionNameParts.slice(1).join(" ") || ""
    const sessionEmail = session?.user?.email || ""

    const load = async () => {
      try {
        const data = await fetchManagerInfo()
        if (cancelled) return

        // manager-info may not exist yet (never saved, or its creation failed
        // at account-creation time) — in that case data is null and every
        // field below falls back to the session. Even when a record *does*
        // exist, individual fields (most importantly firstName/lastName/email)
        // might still be blank on it, so each falls back independently rather
        // than only when the whole record is missing.
        setGeneral({
          firstName: data?.firstName || sessionFirstName,
          lastName: data?.lastName || sessionLastName,
          email: data?.email || sessionEmail,
          privateEmail: data?.privateEmail ?? "",
          phone: data?.phone ?? "",
          mobilePhone: data?.mobilePhone ?? "",
          jobTitle: data?.jobTitle ?? "",
          homeAddress: data?.homeAddress ?? "",
          gender: data?.gender ?? "other",
          professionalBio: data?.professionalBio ?? "",
        })

        if (!data) {
          setLoading(false)
          return
        }

        setEmergencyContact({
          firstName: data.emergencyContact?.firstName ?? "",
          lastName: data.emergencyContact?.lastName ?? "",
          relationship: data.emergencyContact?.relationship ?? "",
          email: data.emergencyContact?.email ?? "",
          phoneNumber: data.emergencyContact?.phoneNumber ?? "",
        })
        setDept({
          companyName: data.department?.companyName ?? "",
          department: data.department?.department ?? "",
          deptSize: data.department?.deptSize ?? "",
          deptFocus: data.department?.deptFocus ?? "",
          managedSince: data.department?.managedSince ? data.department.managedSince.slice(0, 10) : "",
          deptGoals: data.department?.deptGoals ?? "",
        })
        setPrefs({
          timezone: data.preferences?.timezone ?? "Europe/Stockholm",
          dateFormat: data.preferences?.dateFormat ?? "YYYY-MM-DD",
        })
      } catch {
        show(isEn ? "Failed to load settings." : "Kunde inte ladda inställningar.", "error")
        // Even on a load failure, still seed name/email from the session so
        // the form isn't blank — better than nothing while they retry.
        setGeneral(g => ({ ...g, firstName: g.firstName || sessionFirstName, lastName: g.lastName || sessionLastName, email: g.email || sessionEmail }))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name, session?.user?.email])

  /* ── Handlers ── */
  const save = async (fn: () => Promise<void>) => {
    show(isEn ? "Saving…" : "Sparar…", "loading")
    try {
      await fn()
      show(isEn ? "Saved!" : "Sparat!", "success")
    } catch {
      show(isEn ? "Failed to save." : "Misslyckades att spara.", "error")
    }
  }

  /* ── Tabs ── */
  const tabs = [
    { id: "general", label: isEn ? "General" : "Allmänt", icon: "tabler:user" },
    { id: "department", label: isEn ? "Department" : "Avdelning", icon: "tabler:building-community" },
    { id: "substitute", label: isEn ? "Substitute" : "Ställföreträdare", icon: "tabler:user-share" },
    { id: "security", label: isEn ? "Security" : "Säkerhet", icon: "tabler:shield-lock" },
    { id: "preferences", label: isEn ? "Preferences" : "Inställningar", icon: "tabler:settings" },
  ]

  const deptSizes = ["1–5", "6–10", "11–20", "21–50", "50+"]
  const deptFocuses = isEn
    ? ["Software Development", "UX/Design", "Sales", "Marketing", "Finance", "HR", "Operations", "Other"]
    : ["Systemutveckling", "UX/Design", "Försäljning", "Marknadsföring", "Finans", "HR", "Drift", "Annat"]

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6">

      {/* Toast banner */}
      {toast && (
        <div className={clsx(
          "fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg text-sm font-medium transition-all",
          toast.type === "success" && "bg-green-50 border-green-200 text-green-700",
          toast.type === "error" && "bg-red-50 border-red-200 text-red-700",
          toast.type === "loading" && "bg-blue-50 border-blue-200 text-blue-700",
        )}>
          <Icon icon={toast.type === "success" ? "tabler:circle-check-filled" : toast.type === "error" ? "tabler:circle-x-filled" : "tabler:loader-2"}
            className={clsx("w-4 h-4 flex-shrink-0", toast.type === "loading" && "animate-spin")} />
          {toast.text}
        </div>
      )}

      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:settings" className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isEn ? "Account Settings" : "Kontoinställningar"}
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            {isEn ? "Manage your personal profile, department and preferences." : "Hantera din profil, avdelning och inställningar."}
          </p>
        </div>

        {/* Tab bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 flex-shrink-0",
                  activeTab === tab.id
                    ? "border-blue-800 text-blue-900 bg-blue-50/30"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}>
                <Icon icon={tab.icon} className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 sm:p-8">

            {/* ── GENERAL ── */}
            {activeTab === "general" && (
              <div className="space-y-8">

                {/* Avatar section */}
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    {isEn ? "Profile Photo" : "Profilbild"}
                  </p>
                  <div className="flex items-start gap-5 flex-wrap">

                    {/* Current avatar display */}
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-gray-100"
                        style={{ backgroundColor: currentAvatarBg() }}>
                        {currentAvatarContent()}
                      </div>
                      {/* Remove uploaded photo */}
                      {avatarMode === "upload" && uploadedAvatar && (
                        <button onClick={() => { setUploadedAvatar(null); setAvatarMode("initials") }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                          <Icon icon="tabler:x" className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-sm font-medium text-gray-800 mb-1">{general.firstName} {general.lastName}</p>
                      <p className="text-xs text-gray-400 mb-3">{general.jobTitle}</p>
                      <div className="flex flex-wrap gap-2">
                        {/* Upload button */}
                        <button onClick={() => avatarRef.current?.click()}
                          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                          <Icon icon="tabler:upload" className="w-3.5 h-3.5" />
                          {isEn ? "Upload photo" : "Ladda upp foto"}
                        </button>
                        {/* Choose avatar */}
                        <button onClick={() => setShowAvatarPicker(v => !v)}
                          className={clsx(
                            "flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border transition-all",
                            showAvatarPicker ? "text-white border-transparent" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          )}
                          style={showAvatarPicker ? { backgroundColor: NAVY } : {}}>
                          <Icon icon="tabler:mood-smile" className="w-3.5 h-3.5" />
                          {isEn ? "Choose avatar" : "Välj avatar"}
                        </button>
                        {/* Reset to initials */}
                        {avatarMode !== "initials" && (
                          <button onClick={() => { setAvatarMode("initials"); setUploadedAvatar(null); setPresetAvatar(null) }}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all">
                            <Icon icon="tabler:refresh" className="w-3.5 h-3.5" />
                            {isEn ? "Reset" : "Återställ"}
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {isEn ? "JPG, PNG or GIF · Max 2 MB" : "JPG, PNG eller GIF · Max 2 MB"}
                      </p>
                      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                    </div>
                  </div>

                  {/* NOTE: avatar upload is preview-only — not persisted yet. */}

                  {/* Avatar picker dropdown */}
                  {showAvatarPicker && (
                    <div className="mt-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                      <p className="text-xs font-semibold text-gray-500 mb-3">
                        {isEn ? "Select an avatar" : "Välj en avatar"}
                      </p>
                      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                        {PRESET_AVATARS.map(p => (
                          <button key={p.id} onClick={() => { setPresetAvatar(p.id); setAvatarMode("preset"); setShowAvatarPicker(false) }}
                            className={clsx(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110",
                              presetAvatar === p.id && avatarMode === "preset" ? "ring-2 ring-offset-1 ring-blue-500 scale-110" : "hover:ring-2 hover:ring-offset-1 hover:ring-gray-300"
                            )}
                            style={{ backgroundColor: p.bg }}>
                            {p.initials}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    {isEn ? "Personal Information" : "Personlig information"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label={isEn ? "First name" : "Förnamn"} required>
                      <input type="text" value={general.firstName} onChange={e => setGeneral(g => ({ ...g, firstName: e.target.value }))} className={inputCls} placeholder="Lena" disabled={loading} />
                    </Field>
                    <Field label={isEn ? "Last name" : "Efternamn"} required>
                      <input type="text" value={general.lastName} onChange={e => setGeneral(g => ({ ...g, lastName: e.target.value }))} className={inputCls} placeholder="Larsson" disabled={loading} />
                    </Field>
                    <Field label={isEn ? "Work email" : "Jobbmail"} required>
                      <div className="relative">
                        <Icon icon="tabler:mail" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={general.email} onChange={e => setGeneral(g => ({ ...g, email: e.target.value }))} className={clsx(inputCls, "pl-9")} disabled={loading} />
                      </div>
                    </Field>
                    <Field label={isEn ? "Private email" : "Privat e-post"}>
                      <div className="relative">
                        <Icon icon="tabler:mail-opened" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={general.privateEmail} onChange={e => setGeneral(g => ({ ...g, privateEmail: e.target.value }))} className={clsx(inputCls, "pl-9")} disabled={loading} />
                      </div>
                    </Field>
                    <Field label={isEn ? "Phone" : "Telefon"}>
                      <div className="relative">
                        <Icon icon="tabler:phone" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="tel" value={general.phone} onChange={e => setGeneral(g => ({ ...g, phone: e.target.value }))} className={clsx(inputCls, "pl-9")} disabled={loading} />
                      </div>
                    </Field>
                    <Field label={isEn ? "Mobile phone" : "Mobiltelefon"}>
                      <div className="relative">
                        <Icon icon="tabler:device-mobile" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="tel" value={general.mobilePhone} onChange={e => setGeneral(g => ({ ...g, mobilePhone: e.target.value }))} className={clsx(inputCls, "pl-9")} disabled={loading} />
                      </div>
                    </Field>
                    <Field label={isEn ? "Job title" : "Jobbtitel"} required>
                      <input type="text" value={general.jobTitle} onChange={e => setGeneral(g => ({ ...g, jobTitle: e.target.value }))} className={inputCls} placeholder={isEn ? "e.g. Team Manager" : "t.ex. Teamchef"} disabled={loading} />
                    </Field>
                    <Field label={isEn ? "Address" : "Adress"}>
                      <div className="relative">
                        <Icon icon="tabler:map-pin" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={general.homeAddress} onChange={e => setGeneral(g => ({ ...g, homeAddress: e.target.value }))} className={clsx(inputCls, "pl-9")} disabled={loading} />
                      </div>
                    </Field>
                    <Field label={isEn ? "Gender" : "Kön"}>
                      <div className="flex gap-4 h-full items-center px-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="gender" value="male" checked={general.gender === "male"}
                            onChange={() => setGeneral(g => ({ ...g, gender: "male" }))}
                            className="h-4 w-4 border-gray-300" style={{ accentColor: NAVY }} disabled={loading} />
                          <span className="text-sm text-gray-700">{isEn ? "Male" : "Man"}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="gender" value="female" checked={general.gender === "female"}
                            onChange={() => setGeneral(g => ({ ...g, gender: "female" }))}
                            className="h-4 w-4 border-gray-300" style={{ accentColor: NAVY }} disabled={loading} />
                          <span className="text-sm text-gray-700">{isEn ? "Female" : "Kvinna"}</span>
                        </label>
                      </div>
                    </Field>
                    <Field label={isEn ? "Professional bio" : "Professionell bio"} span2>
                      <textarea value={general.professionalBio} onChange={e => setGeneral(g => ({ ...g, professionalBio: e.target.value }))}
                        rows={3} className={clsx(inputCls, "resize-none")}
                        placeholder={isEn ? "A short description of your role and expertise…" : "En kort beskrivning av din roll och kompetens…"} disabled={loading} />
                    </Field>
                  </div>
                </div>

                {/* Emergency contact */}
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    {isEn ? "Emergency Contact" : "Nödkontakt"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label={isEn ? "First name" : "Förnamn"}>
                      <input type="text" value={emergencyContact.firstName} onChange={e => setEmergencyContact(c => ({ ...c, firstName: e.target.value }))} className={inputCls} disabled={loading} />
                    </Field>
                    <Field label={isEn ? "Last name" : "Efternamn"}>
                      <input type="text" value={emergencyContact.lastName} onChange={e => setEmergencyContact(c => ({ ...c, lastName: e.target.value }))} className={inputCls} disabled={loading} />
                    </Field>
                    <Field label={isEn ? "Relationship" : "Relation"} hint={isEn ? "e.g. Spouse, Parent, Sibling" : "t.ex. Make/maka, Förälder, Syskon"}>
                      <input type="text" value={emergencyContact.relationship} onChange={e => setEmergencyContact(c => ({ ...c, relationship: e.target.value }))} className={inputCls} disabled={loading} />
                    </Field>
                    <Field label={isEn ? "Phone number" : "Telefonnummer"}>
                      <input type="tel" value={emergencyContact.phoneNumber} onChange={e => setEmergencyContact(c => ({ ...c, phoneNumber: e.target.value }))} className={inputCls} disabled={loading} />
                    </Field>
                    <Field label={isEn ? "Email" : "E-post"} span2>
                      <input type="email" value={emergencyContact.email} onChange={e => setEmergencyContact(c => ({ ...c, email: e.target.value }))} className={inputCls} disabled={loading} />
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <SaveBtn label={isEn ? "Save changes" : "Spara ändringar"} disabled={loading} onClick={() => save(async () => {
                    await saveManagerInfo({
                      firstName: general.firstName,
                      lastName: general.lastName,
                      email: general.email,
                      privateEmail: general.privateEmail,
                      phone: general.phone,
                      mobilePhone: general.mobilePhone,
                      jobTitle: general.jobTitle,
                      homeAddress: general.homeAddress,
                      gender: general.gender,
                      professionalBio: general.professionalBio,
                      emergencyContact,
                    })
                  })} />
                </div>
              </div>
            )}

            {/* ── DEPARTMENT ── */}
            {activeTab === "department" && (
              <div className="space-y-6">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">
                  {isEn ? "Department Information" : "Avdelningsinformation"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label={isEn ? "Company name" : "Företagsnamn"} span2>
                    <div className="relative">
                      <Icon icon="tabler:building-skyscraper" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={dept.companyName} onChange={e => setDept(d => ({ ...d, companyName: e.target.value }))}
                        className={clsx(inputCls, "pl-9")} placeholder={isEn ? "e.g. Nordic Konsult AB" : "t.ex. Nordic Konsult AB"} disabled={loading} />
                    </div>
                  </Field>
                  <Field label={isEn ? "Department name" : "Avdelningsnamn"} required>
                    <input type="text" value={dept.department} onChange={e => setDept(d => ({ ...d, department: e.target.value }))}
                      className={inputCls} placeholder={isEn ? "e.g. IT, Marketing" : "t.ex. IT, Marknadsföring"} disabled={loading} />
                  </Field>
                  <Field label={isEn ? "Team size" : "Teamstorlek"}>
                    <select value={dept.deptSize} onChange={e => setDept(d => ({ ...d, deptSize: e.target.value }))}
                      className={clsx(inputCls, "cursor-pointer")} disabled={loading}>
                      <option value="">—</option>
                      {deptSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label={isEn ? "Department focus" : "Avdelningens fokus"}>
                    <select value={dept.deptFocus} onChange={e => setDept(d => ({ ...d, deptFocus: e.target.value }))}
                      className={clsx(inputCls, "cursor-pointer")} disabled={loading}>
                      <option value="">—</option>
                      {deptFocuses.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label={isEn ? "Managing since" : "Chef sedan"}>
                    <input type="date" value={dept.managedSince} onChange={e => setDept(d => ({ ...d, managedSince: e.target.value }))} className={inputCls} disabled={loading} />
                  </Field>
                  <Field label={isEn ? "Team goals (optional)" : "Teammål (valfritt)"} span2>
                    <textarea value={dept.deptGoals} onChange={e => setDept(d => ({ ...d, deptGoals: e.target.value }))}
                      rows={3} className={clsx(inputCls, "resize-none")}
                      placeholder={isEn ? "Describe the main targets for your team…" : "Beskriv teamets viktigaste mål…"} disabled={loading} />
                  </Field>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <SaveBtn label={isEn ? "Save Department Info" : "Spara avdelningsinfo"} disabled={loading} onClick={() => save(async () => {
                    await saveManagerInfo({ department: dept })
                  })} />
                </div>
              </div>
            )}

            {/* ── SUBSTITUTE (someone covers while you're away) ── */}
            {activeTab === "substitute" && (
              <DelegationSettings language={isEn ? "en" : "sv"} notify={(text, type) => show(text, type ?? "success")} />
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <ChangePasswordForm
                endpoint="/api/company/managers/settings/password"
                language={isEn ? "en" : "sv"}
                onSuccess={(message) => show(message, "success")}
              />
            )}

            {/* ── PREFERENCES ── */}
            {activeTab === "preferences" && (
              <div className="space-y-8">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">
                  {isEn ? "Preferences" : "Inställningar"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">

                  <Field label={isEn ? "Interface language" : "Gränssnittsspråk"}>
                    <div className="flex gap-2">
                      {(["sv", "en"] as const).map(lang => (
                        <button key={lang} onClick={() => setLanguage(lang)}
                          className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                            language === lang ? "text-white shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"
                          )}
                          style={language === lang ? { backgroundColor: NAVY, borderColor: NAVY } : {}}>
                          <span className="text-base">{lang === "sv" ? "🇸🇪" : "🇬🇧"}</span>
                          {lang === "sv" ? "Svenska" : "English"}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label={isEn ? "Timezone" : "Tidszon"}>
                    <select value={prefs.timezone} onChange={e => setPrefs(p => ({ ...p, timezone: e.target.value }))}
                      className={clsx(inputCls, "cursor-pointer")}>
                      {["Europe/Stockholm", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "Australia/Sydney"].map(tz => (
                        <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label={isEn ? "Date format" : "Datumformat"}>
                    <select value={prefs.dateFormat} onChange={e => setPrefs(p => ({ ...p, dateFormat: e.target.value }))}
                      className={clsx(inputCls, "cursor-pointer")}>
                      <option value="YYYY-MM-DD">2026-06-01 (ISO)</option>
                      <option value="DD/MM/YYYY">01/06/2026</option>
                      <option value="MM/DD/YYYY">06/01/2026</option>
                      <option value="D MMM YYYY">1 Jun 2026</option>
                    </select>
                  </Field>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <SaveBtn label={isEn ? "Save Preferences" : "Spara inställningar"} disabled={loading} onClick={() => save(async () => {
                    await saveManagerInfo({ preferences: prefs })
                  })} />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerSettings
