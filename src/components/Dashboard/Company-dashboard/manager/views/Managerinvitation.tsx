"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/Managerinvitation.tsx   (REPLACE)
// WHAT IT DOES:   Manager → Invitations.
//   • Existing VeroCV account → invitation only (as before).
//   • Create new account → like when a business admin creates a manager: login email,
//     generated / checked password, and the login details emailed to the employee's
//     private email (or the login email). A preview shows what they get, and after
//     creating, the login details can be copied if the email couldn't be sent.
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"

/* ─── Constants ─── */
const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"

/* ─── Types ─── */
type InvitationStatus = "pending" | "accepted" | "declined"
type AccessLevel = "full" | "cv_only" | "portfolio_only"
type InviteMode = "existing" | "new"

/* Real shape returned by GET /api/company/managers/invitations.
   firstName/lastName/accessLevel are optional: the endpoint is only
   guaranteed to accept+store `email` today. If the backend is later
   updated to persist the rest of the form fields, this same interface
   will pick them up automatically without further UI changes. */
interface SentInvitation {
  id: string
  employeeEmail: string
  firstName?: string
  lastName?: string
  accessLevel?: AccessLevel
  bossName: string
  companyName?: string
  status: InvitationStatus
  createdAt: string
  respondedAt: string | null
}

interface EmployeeSummary {
  employeeId: string
  employeeName: string
  employeeEmail: string
}

/* ─── Input helpers ─── */
const fo = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(176,196,222,0.5)"
    e.currentTarget.style.borderColor = "rgb(176,196,222)"
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.boxShadow = ""
    e.currentTarget.style.borderColor = ""
  },
}
const inputCls = "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none transition-all"
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

/** 14 characters, no look-alikes (0/O, 1/l/I), always upper + lower + digit + symbol. */
function generatePassword(len = 14) {
  const sets = ["ABCDEFGHJKMNPQRSTUVWXYZ", "abcdefghjkmnpqrstuvwxyz", "23456789", "!#%&*?@$"]
  const all = sets.join("")
  const rnd = (n: number) => {
    const a = new Uint32Array(1)
    crypto.getRandomValues(a)
    return a[0]! % n
  }
  const chars = sets.map((s) => s[rnd(s.length)]!)
  while (chars.length < len) chars.push(all[rnd(all.length)]!)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1)
      ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join("")
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** What the server answered when a new account was created. */
interface CreatedAccount {
  name: string
  loginEmail: string
  password: string
  emailStatus: { sent: boolean; to?: string; error?: string }
}

/* ─── Inline toast ─── */
const useToast = () => {
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" | "loading" } | null>(null)
  const show = (text: string, type: "success" | "error" | "loading" = "success") => {
    setToast({ text, type })
    if (type !== "loading") setTimeout(() => setToast(null), 4000)
  }
  return { toast, show }
}

/* ─── Status & access styles ─── */
const statusStyle: Record<InvitationStatus, { bg: string; text: string; border: string; dot: string }> = {
  pending: { bg: "rgb(255,251,235)", text: "rgb(146,64,14)", border: "rgb(253,230,138)", dot: "bg-amber-400" },
  accepted: { bg: "rgb(240,253,244)", text: "rgb(22,101,52)", border: "rgb(187,247,208)", dot: "bg-green-400" },
  declined: { bg: "rgb(254,242,242)", text: "rgb(185,28,28)", border: "rgb(254,202,202)", dot: "bg-red-400" },
}
const accessMeta: Record<AccessLevel, { label: string; labelSv: string; icon: string; color: string; bg: string }> = {
  full: { label: "Full access", labelSv: "Full åtkomst", icon: "tabler:lock-open", color: NAVY, bg: LIGHT },
  cv_only: { label: "CVs only", labelSv: "Endast CV:n", icon: "tabler:files", color: "rgb(109,40,217)", bg: "rgb(245,243,255)" },
  portfolio_only: { label: "Portfolio only", labelSv: "Endast portfolio", icon: "tabler:briefcase", color: "rgb(217,119,6)", bg: "rgb(255,247,237)" },
}

/* ─────────────────────────────────────────────
   REVOKE CONFIRMATION DIALOG — manager ending their own access to an
   employee's data. Mirrors the employee-side RevokeAccessDialog, but with
   the perspective flipped (it's the manager's access being given up).
───────────────────────────────────────────── */
function RevokeEmployeeDialog({
  employeeName, isEn, revoking, onConfirm, onCancel,
}: {
  employeeName: string
  isEn: boolean
  revoking: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={revoking ? undefined : onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgb(254,242,242)" }}>
          <Icon icon="tabler:alert-triangle" className="w-6 h-6 text-red-500" />
        </div>

        <h3 className="text-center text-gray-900 font-semibold text-base mb-2">
          {isEn ? `Revoke access to ${employeeName}'s data?` : `Återkalla åtkomst till ${employeeName}s data?`}
        </h3>
        <p className="text-center text-gray-500 text-sm mb-3 leading-relaxed">
          {isEn
            ? "You will no longer be able to view their CVs, portfolio, or personal information."
            : "Du kommer inte längre kunna se deras CV:n, portfolio eller personliga information."}
        </p>
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 mb-6">
          <Icon icon="tabler:bell" className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 text-left leading-relaxed">
            {isEn
              ? "The employee will automatically be notified that your access has ended."
              : "Medarbetaren meddelas automatiskt om att din åtkomst har upphört."}
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={revoking}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            {isEn ? "Cancel" : "Avbryt"}
          </button>
          <button onClick={onConfirm} disabled={revoking}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: "rgb(220,38,38)" }}>
            {revoking && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {revoking ? (isEn ? "Revoking…" : "Återkallar…") : (isEn ? "Yes, revoke" : "Ja, återkalla")}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ManagerInvitation() {
  const { language } = useManagerTranslations()
  const isEn = language === "en"
  const { toast, show } = useToast()

  const [tab, setTab] = useState<"send" | "sent" | "access">("send")

  const [invitations, setInvitations] = useState<SentInvitation[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState("")

  // Real employee records — cross-referenced by email as a fallback for
  // displaying a name, in case the invitation record itself doesn't carry
  // firstName/lastName back from the server.
  const [employeesByEmail, setEmployeesByEmail] = useState<Record<string, EmployeeSummary>>({})

  const [sending, setSending] = useState(false)
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | "">("")
  const [search, setSearch] = useState("")

  // Revoking a manager's own access to an accepted employee's data
  const [revokeEmployeeTarget, setRevokeEmployeeTarget] = useState<SentInvitation | null>(null)
  const [revokingEmployeeId, setRevokingEmployeeId] = useState<string | null>(null)

  // Which flow the manager picked on the Send tab
  const [inviteMode, setInviteMode] = useState<InviteMode>("existing")

  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "",
    password: "", confirmPassword: "",
    accessLevel: "full" as AccessLevel,
    personalMessage: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [copiedPw, setCopiedPw] = useState(false)
  // New account: email the login details (like when an admin creates a manager)
  const [sendLoginEmail, setSendLoginEmail] = useState(true)
  const [privateEmail, setPrivateEmail] = useState("")
  const [emailLanguage, setEmailLanguage] = useState<"sv" | "en">(isEn ? "en" : "sv")
  const [showPreview, setShowPreview] = useState(false)
  const [created, setCreated] = useState<CreatedAccount | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(p => ({ ...p, [k]: e.target.value }))
      setFormError("")
      setFieldErrors(f => ({ ...f, [k]: "" }))
    }

  const resetForm = () => {
    setForm({ email: "", firstName: "", lastName: "", password: "", confirmPassword: "", accessLevel: "full", personalMessage: "" })
    setShowPassword(false)
    setFormError("")
    setFieldErrors({})
    setPrivateEmail("")
    setSendLoginEmail(true)
    setShowPreview(false)
  }

  /* ── Password rules — same as when a business admin creates a manager ── */
  const pwRules = useMemo(() => [
    { ok: form.password.length >= 8, label: isEn ? "At least 8 characters" : "Minst 8 tecken", required: true },
    { ok: /[A-Za-z]/.test(form.password) && /\d/.test(form.password), label: isEn ? "Letters and numbers" : "Bokstäver och siffror", required: true },
    { ok: /[^A-Za-z0-9]/.test(form.password) || form.password.length >= 12, label: isEn ? "A symbol or 12+ characters (recommended)" : "Ett specialtecken eller 12+ tecken (rekommenderas)", required: false },
  ], [form.password, isEn])

  const generate = () => {
    const pw = generatePassword()
    setForm(p => ({ ...p, password: pw, confirmPassword: pw }))
    setFieldErrors(f => ({ ...f, password: "", confirmPassword: "" }))
    setShowPassword(true)
    setFormError("")
  }

  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login"
  const copyText = (c: CreatedAccount) => isEn
    ? `VeroCV login\nEmail: ${c.loginEmail}\nPassword: ${c.password}\nLog in: ${loginUrl}`
    : `VeroCV-inloggning\nE-post: ${c.loginEmail}\nLösenord: ${c.password}\nLogga in: ${loginUrl}`

  const loadInvitations = () => {
    setLoadingList(true)
    setListError("")
    fetch("/api/company/managers/invitations")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load")
        const body = await res.json()
        setInvitations(body.data ?? [])
      })
      .catch(() => setListError(isEn ? "Failed to load invitations." : "Kunde inte ladda inbjudningar."))
      .finally(() => setLoadingList(false))
  }

  useEffect(() => { loadInvitations() }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/company/managers/employees")
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const body = await res.json()
        if (cancelled) return
        const list: EmployeeSummary[] = body.data ?? []
        const map: Record<string, EmployeeSummary> = {}
        list.forEach((emp) => { if (emp.employeeEmail) map[emp.employeeEmail.toLowerCase()] = emp })
        setEmployeesByEmail(map)
      })
      .catch(() => { })
    return () => { cancelled = true }
  }, [])

  /* ── Access options ── */
  const accessOptions = [
    {
      value: "full" as AccessLevel,
      label: isEn ? "Full access" : "Full åtkomst",
      desc: isEn ? "CVs, portfolios and personal information" : "CV:n, portfolios och personlig information",
      icon: "tabler:lock-open", color: NAVY,
    },
    {
      value: "cv_only" as AccessLevel,
      label: isEn ? "CVs only" : "Endast CV:n",
      desc: isEn ? "View and manage created CVs" : "Visa och hantera skapade CV:n",
      icon: "tabler:files", color: "rgb(109,40,217)",
    },
    {
      value: "portfolio_only" as AccessLevel,
      label: isEn ? "Portfolio only" : "Endast portfolio",
      desc: isEn ? "View portfolio projects and work samples" : "Visa portfolioprojekt och arbetsprover",
      icon: "tabler:briefcase", color: "rgb(217,119,6)",
    },
  ]

  /* ── Client-side validation before hitting the API ── */
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    const req = isEn ? "Required" : "Obligatoriskt"
    const bad = isEn ? "Enter a valid email address" : "Ange en giltig e-postadress"
    if (!form.email.trim()) e.email = req
    else if (!isEmail(form.email)) e.email = bad
    if (inviteMode === "new") {
      if (!form.firstName.trim()) e.firstName = req
      if (!form.lastName.trim()) e.lastName = req
      if (!pwRules[0]!.ok || !pwRules[1]!.ok) e.password = isEn ? "At least 8 characters with letters and numbers" : "Minst 8 tecken med bokstäver och siffror"
      if (!form.confirmPassword) e.confirmPassword = req
      else if (form.confirmPassword !== form.password) e.confirmPassword = isEn ? "The passwords don't match" : "Lösenorden matchar inte"
      if (privateEmail.trim() && !isEmail(privateEmail)) e.privateEmail = bad
    }
    return e
  }

  /* ── Send handler — real API call ── */
  const sendInvitation = async () => {
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length) {
      setFormError(isEn ? "Please check the highlighted fields." : "Kontrollera de markerade fälten.")
      return
    }

    setSending(true)
    show(isEn ? "Sending invitation…" : "Skickar inbjudan…", "loading")
    try {
      const payload: Record<string, unknown> = {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        accessLevel: form.accessLevel,
        personalMessage: form.personalMessage.trim(),
        mode: inviteMode,
      }
      if (inviteMode === "new") {
        payload.password = form.password
        payload.sendLoginEmail = sendLoginEmail
        payload.privateEmail = sendLoginEmail ? privateEmail.trim() : ""
        payload.language = emailLanguage
      }

      const res = await fetch("/api/company/managers/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const fe = (data?.fieldErrors ?? {}) as Record<string, string>
        const msg: Record<string, string> = {
          taken: isEn ? "There's already an account with this email — choose “Existing VeroCV account”." : "Det finns redan ett konto med den här e-posten — välj ”Befintligt VeroCV-konto”.",
          not_found: isEn ? "No VeroCV account with this email — choose “Create new account”." : "Inget VeroCV-konto med den här e-posten — välj ”Skapa nytt konto”.",
          invalid: isEn ? "Enter a valid email address" : "Ange en giltig e-postadress",
          weak: isEn ? "At least 8 characters with letters and numbers" : "Minst 8 tecken med bokstäver och siffror",
          required: isEn ? "Required" : "Obligatoriskt",
        }
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(fe)) mapped[k] = msg[v] ?? data?.message ?? ""
        setFieldErrors(mapped)
        const text = data?.message || (isEn ? "Failed to send invitation." : "Kunde inte skicka inbjudan.")
        setFormError(Object.keys(mapped).length ? (isEn ? "Please check the highlighted fields." : "Kontrollera de markerade fälten.") : text)
        show(text, "error")
        return
      }
      if (inviteMode === "new") {
        // Show the login details — they may need to be passed on by hand.
        setCreated({
          name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          loginEmail: data?.loginEmail ?? form.email.trim().toLowerCase(),
          password: form.password,
          emailStatus: data?.emailStatus ?? { sent: false },
        })
        resetForm()
        show(isEn ? "Account created and invitation sent!" : "Kontot är skapat och inbjudan skickad!", "success")
        loadInvitations()
        return
      }
      resetForm()
      show(isEn ? "Invitation sent!" : "Inbjudan skickades!", "success")
      setTab("sent")
      loadInvitations()
    } catch {
      show(isEn ? "Failed to send invitation." : "Kunde inte skicka inbjudan.", "error")
    } finally {
      setSending(false)
    }
  }

  /* ── Revoke handler — manager ends their own access to an accepted employee ── */
  const confirmRevokeEmployee = async () => {
    if (!revokeEmployeeTarget) return
    const inv = revokeEmployeeTarget

    setRevokingEmployeeId(inv.id)
    try {
      const res = await fetch(`/api/company/managers/invitations/${inv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      })
      if (!res.ok) throw new Error("Failed to revoke")
      setInvitations((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status: "declined" as InvitationStatus } : i)))
      show(isEn ? "Access revoked. The employee has been notified." : "Åtkomst återkallad. Medarbetaren har meddelats.", "success")
      setRevokeEmployeeTarget(null)
    } catch {
      show(isEn ? "Failed to revoke access. Please try again." : "Det gick inte att återkalla åtkomsten. Försök igen.", "error")
    } finally {
      setRevokingEmployeeId(null)
    }
  }

  /* ── Derived ── */
  const displayName = (inv: SentInvitation) => {
    const fromForm = `${inv.firstName ?? ""} ${inv.lastName ?? ""}`.trim()
    if (fromForm) return fromForm
    const matched = employeesByEmail[inv.employeeEmail.toLowerCase()]
    return matched?.employeeName || inv.employeeEmail
  }
  const displayAccessLevel = (inv: SentInvitation): AccessLevel => inv.accessLevel ?? "full"

  const initials = (inv: SentInvitation) => {
    const name = displayName(inv)
    const parts = name.split(" ")
    return parts.length > 1 ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() : name.slice(0, 2).toUpperCase()
  }

  const filtered = invitations.filter(inv => {
    const q = `${displayName(inv)} ${inv.employeeEmail}`.toLowerCase()
    return (!search || q.includes(search.toLowerCase())) && (!statusFilter || inv.status === statusFilter)
  })

  const stats = {
    total: invitations.length,
    accepted: invitations.filter(i => i.status === "accepted").length,
    pending: invitations.filter(i => i.status === "pending").length,
    declined: invitations.filter(i => i.status === "declined").length,
  }

  const statusLabel = (s: InvitationStatus) => ({
    pending: isEn ? "Pending" : "Väntande",
    accepted: isEn ? "Accepted" : "Accepterad",
    declined: isEn ? "Declined" : "Nekad",
  }[s])

  /* ── Tabs config ── */
  const tabs = [
    { id: "send" as const, label: isEn ? "Send Invitation" : "Skicka inbjudan", icon: "tabler:send" },
    { id: "sent" as const, label: isEn ? "Sent Invitations" : "Skickade", icon: "tabler:list" },
    { id: "access" as const, label: isEn ? "Access Management" : "Åtkomsthantering", icon: "tabler:shield-lock" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

      {/* Toast */}
      {toast && (
        <div className={clsx(
          "fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg text-sm font-medium",
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
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:send" className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{isEn ? "Employee Invitations" : "Medarbetarinbjudningar"}</h1>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            {isEn
              ? "Invite employees to share their CVs, portfolios and personal information with you."
              : "Bjud in medarbetare att dela sina CV:n, portfolios och personlig information med dig."}
          </p>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: isEn ? "Total sent" : "Totalt", val: stats.total, icon: "tabler:send", color: NAVY },
            { label: isEn ? "Accepted" : "Accepterade", val: stats.accepted, icon: "tabler:circle-check", color: "rgb(22,101,52)" },
            { label: isEn ? "Pending" : "Väntande", val: stats.pending, icon: "tabler:clock", color: "rgb(146,64,14)" },
            { label: isEn ? "Declined" : "Nekade", val: stats.declined, icon: "tabler:circle-x", color: "rgb(185,28,28)" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: LIGHT }}>
                <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{s.val}</div>
                <div className="text-xs text-gray-400 leading-tight">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all border-b-2",
                  tab === t.id
                    ? "border-blue-800 text-blue-900 bg-blue-50/30"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}>
                <Icon icon={t.icon} className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─────────────────────── SEND TAB ─────────────────────── */}
        {tab === "send" && created && (
          <CreatedCard created={created} isEn={isEn} copiedAll={copiedAll}
            onCopy={async () => { if (await copyToClipboard(copyText(created))) { setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000) } }}
            onAnother={() => { setCreated(null); setCopiedAll(false) }}
            onList={() => { setCreated(null); setTab("sent") }} />
        )}

        {tab === "send" && !created && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{isEn ? "New Invitation" : "Ny inbjudan"}</h2>
            <p className="text-sm text-gray-500 mb-6">
              {isEn ? "Choose whether the employee already has a VeroCV account." : "Välj om medarbetaren redan har ett VeroCV-konto."}
            </p>

            <div className="space-y-5 max-w-xl">

              {/* Mode selector — two cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  {
                    value: "existing" as InviteMode,
                    icon: "tabler:user-check",
                    title: isEn ? "Existing VeroCV account" : "Befintligt VeroCV-konto",
                    desc: isEn ? "They already have an account with this email." : "De har redan ett konto med denna e-post.",
                  },
                  {
                    value: "new" as InviteMode,
                    icon: "tabler:user-plus",
                    title: isEn ? "Create new account" : "Skapa nytt konto",
                    desc: isEn ? "They don't have a VeroCV account yet." : "De har inte något VeroCV-konto ännu.",
                  },
                ]).map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => { setInviteMode(opt.value); setFormError("") }}
                    className={clsx(
                      "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                      inviteMode === opt.value ? "shadow-sm" : "border-gray-100 hover:border-gray-200 bg-gray-50/40"
                    )}
                    style={inviteMode === opt.value ? { backgroundColor: `${NAVY}0d`, borderColor: `${NAVY}50` } : {}}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${NAVY}15` }}>
                      <Icon icon={opt.icon} className="w-4.5 h-4.5" style={{ color: NAVY }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">{opt.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                    </div>
                    {inviteMode === opt.value && (
                      <Icon icon="tabler:circle-check-filled" className="w-5 h-5 flex-shrink-0" style={{ color: NAVY }} />
                    )}
                  </button>
                ))}
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {inviteMode === "new"
                    ? (isEn ? "Login email" : "Inloggningsmejl")
                    : (isEn ? "Employee email" : "Medarbetarens e-post")} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Icon icon="tabler:mail" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={form.email} onChange={set("email")} autoComplete="off" aria-invalid={!!fieldErrors.email}
                    className={clsx(inputCls, "pl-9", fieldErrors.email && "border-red-300")} placeholder="employee@company.se" {...fo} />
                </div>
                <FieldNote error={fieldErrors.email}
                  hint={inviteMode === "new" ? (isEn ? "The employee logs in to VeroCV with this email — e.g. their work email." : "Medarbetaren loggar in i VeroCV med den här e-posten — t.ex. jobbmejlen.") : undefined} />
              </div>

              {inviteMode === "existing" ? (
                <>
                  {/* Name row — optional, only used for display until the backend persists these */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {isEn ? "First name" : "Förnamn"}
                      </label>
                      <input type="text" value={form.firstName} onChange={set("firstName")}
                        className={inputCls} placeholder="Emma" {...fo} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {isEn ? "Last name" : "Efternamn"}
                      </label>
                      <input type="text" value={form.lastName} onChange={set("lastName")}
                        className={inputCls} placeholder="Larsson" {...fo} />
                    </div>
                  </div>

                  {/* Info: must match an existing account */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <Icon icon="tabler:info-circle" className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      {isEn
                        ? "Must match an existing VeroCV account. The invitation appears in their dashboard notifications."
                        : "Måste matcha ett befintligt VeroCV-konto. Inbjudan visas i deras dashboard-notiser."}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Name row — required to create the account */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {isEn ? "First name" : "Förnamn"} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Icon icon="tabler:user" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={form.firstName} onChange={set("firstName")} autoComplete="off" aria-invalid={!!fieldErrors.firstName}
                          className={clsx(inputCls, "pl-9", fieldErrors.firstName && "border-red-300")} placeholder="Emma" {...fo} />
                      </div>
                      <FieldNote error={fieldErrors.firstName} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {isEn ? "Last name" : "Efternamn"} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Icon icon="tabler:user" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={form.lastName} onChange={set("lastName")} autoComplete="off" aria-invalid={!!fieldErrors.lastName}
                          className={clsx(inputCls, "pl-9", fieldErrors.lastName && "border-red-300")} placeholder="Larsson" {...fo} />
                      </div>
                      <FieldNote error={fieldErrors.lastName} />
                    </div>
                  </div>

                  {/* Password — generate, copy, show, rules */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {isEn ? "Password" : "Lösenord"} <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 min-w-0">
                        <Icon icon="tabler:lock" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")}
                          autoComplete="new-password" aria-invalid={!!fieldErrors.password}
                          className={clsx(inputCls, "pl-9 pr-16 font-mono", fieldErrors.password && "border-red-300")} {...fo} />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                          {form.password && (
                            <button type="button" tabIndex={-1} aria-label={isEn ? "Copy" : "Kopiera"} title={copiedPw ? (isEn ? "Copied" : "Kopierat") : (isEn ? "Copy" : "Kopiera")}
                              onClick={async () => { if (await copyToClipboard(form.password)) { setCopiedPw(true); setTimeout(() => setCopiedPw(false), 1500) } }}
                              className="p-1.5 text-gray-400 hover:text-gray-600">
                              <Icon icon={copiedPw ? "tabler:check" : "tabler:copy"} className="w-4 h-4" />
                            </button>
                          )}
                          <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                            aria-label={showPassword ? (isEn ? "Hide password" : "Dölj lösenord") : (isEn ? "Show password" : "Visa lösenord")}
                            className="p-1.5 text-gray-400 hover:text-gray-600">
                            <Icon icon={showPassword ? "tabler:eye-off" : "tabler:eye"} className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button type="button" onClick={generate}
                        className="flex items-center gap-1.5 px-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex-shrink-0">
                        <Icon icon="tabler:wand" className="w-4 h-4" />
                        <span className="hidden sm:inline">{isEn ? "Generate" : "Generera"}</span>
                      </button>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {pwRules.map(r => (
                        <li key={r.label} className={clsx("flex items-center gap-1.5 text-xs", r.ok ? "text-green-700" : r.required ? "text-gray-500" : "text-gray-400")}>
                          <Icon icon={r.ok ? "tabler:circle-check-filled" : "tabler:circle"} className="w-3.5 h-3.5" />
                          {r.label}
                        </li>
                      ))}
                    </ul>
                    <FieldNote error={fieldErrors.password} />
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {isEn ? "Confirm password" : "Bekräfta lösenord"} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Icon icon={form.confirmPassword && form.confirmPassword === form.password ? "tabler:lock-check" : "tabler:lock"}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")}
                        autoComplete="new-password" aria-invalid={!!fieldErrors.confirmPassword}
                        className={clsx(inputCls, "pl-9 font-mono", fieldErrors.confirmPassword && "border-red-300")}
                        placeholder={isEn ? "Re-enter password" : "Ange lösenordet igen"} {...fo} />
                    </div>
                    <FieldNote error={fieldErrors.confirmPassword} />
                  </div>

                  {/* Send login details — like when an admin creates a manager */}
                  <div className="rounded-2xl border border-gray-100 p-4 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <button type="button" role="switch" aria-checked={sendLoginEmail} onClick={() => setSendLoginEmail(v => !v)}
                        className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
                        style={{ backgroundColor: sendLoginEmail ? NAVY : "rgb(209,213,219)" }}>
                        <span className={clsx("absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform", sendLoginEmail && "translate-x-4")} />
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        {isEn ? "Email the login details to the employee" : "Mejla inloggningsuppgifterna till medarbetaren"}
                      </span>
                    </label>

                    {sendLoginEmail ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            {isEn ? "Private email" : "Privat e-post"}
                          </label>
                          <div className="relative">
                            <Icon icon="tabler:mail-forward" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="email" value={privateEmail} autoComplete="off" aria-invalid={!!fieldErrors.privateEmail}
                              onChange={e => { setPrivateEmail(e.target.value); setFieldErrors(f => ({ ...f, privateEmail: "" })); setFormError("") }}
                              className={clsx(inputCls, "pl-9", fieldErrors.privateEmail && "border-red-300")} placeholder="emma@gmail.com" {...fo} />
                          </div>
                          <FieldNote error={fieldErrors.privateEmail}
                            hint={isEn
                              ? "The login details are sent here. Leave empty to send them to the login email."
                              : "Hit skickas inloggningsuppgifterna. Lämna tomt för att skicka till inloggningsmejlen."} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            {isEn ? "Email language" : "Mejlets språk"}
                          </label>
                          <div className="flex gap-2">
                            {(["sv", "en"] as const).map(l => (
                              <button key={l} type="button" onClick={() => setEmailLanguage(l)}
                                className={clsx("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                                  emailLanguage === l ? "text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50")}
                                style={emailLanguage === l ? { backgroundColor: NAVY, borderColor: NAVY } : undefined}>
                                <Icon icon={l === "sv" ? "circle-flags:se" : "circle-flags:gb"} className="w-4 h-4" />
                                {l === "sv" ? "Svenska" : "English"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button type="button" onClick={() => setShowPreview(v => !v)}
                          className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: NAVY }}>
                          <Icon icon={showPreview ? "tabler:chevron-up" : "tabler:mail-opened"} className="w-4 h-4" />
                          {showPreview ? (isEn ? "Hide email preview" : "Dölj förhandsvisning") : (isEn ? "Preview the email" : "Förhandsvisa mejlet")}
                        </button>
                        {showPreview && (
                          <EmailPreview sv={emailLanguage === "sv"} to={privateEmail.trim() || form.email.trim()}
                            firstName={form.firstName.trim()} loginEmail={form.email.trim().toLowerCase()}
                            password={form.password} showPassword={showPassword} accessLevel={form.accessLevel}
                            note={form.personalMessage.trim()} />
                        )}
                      </>
                    ) : (
                      <p className="flex items-start gap-2 text-xs text-gray-500">
                        <Icon icon="tabler:info-circle" className="w-4 h-4 flex-shrink-0" />
                        {isEn
                          ? "No email will be sent. You'll get the login details to share with the employee yourself."
                          : "Inget mejl skickas. Du får inloggningsuppgifterna och ger dem till medarbetaren själv."}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Access level */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {isEn ? "Access level" : "Åtkomstnivå"}
                </label>
                <div className="space-y-2">
                  {accessOptions.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(p => ({ ...p, accessLevel: opt.value }))}
                      className={clsx(
                        "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                        form.accessLevel === opt.value ? "shadow-sm" : "border-gray-100 hover:border-gray-200 bg-gray-50/40"
                      )}
                      style={form.accessLevel === opt.value
                        ? { backgroundColor: `${opt.color}0d`, borderColor: `${opt.color}50` } : {}}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${opt.color}15` }}>
                        <Icon icon={opt.icon} className="w-5 h-5" style={{ color: opt.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                      </div>
                      {form.accessLevel === opt.value && (
                        <Icon icon="tabler:circle-check-filled" className="w-5 h-5 flex-shrink-0" style={{ color: opt.color }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* What's included preview */}
              <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40">
                <p className="text-xs font-semibold text-blue-800 mb-3 flex items-center gap-1.5">
                  <Icon icon="tabler:info-circle" className="w-3.5 h-3.5" />
                  {isEn ? "Included with this access level:" : "Ingår med denna åtkomstnivå:"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: "tabler:files", label: isEn ? "CVs & templates" : "CV:n & mallar", included: form.accessLevel === "full" || form.accessLevel === "cv_only" },
                    { icon: "tabler:briefcase", label: isEn ? "Portfolio" : "Portfolio", included: form.accessLevel === "full" || form.accessLevel === "portfolio_only" },
                    { icon: "tabler:user-circle", label: isEn ? "Personal info" : "Personlig info", included: form.accessLevel === "full" },
                    { icon: "tabler:chart-bar", label: isEn ? "Work stats" : "Arbetsstatistik", included: form.accessLevel === "full" },
                    { icon: "tabler:calendar", label: isEn ? "Availability" : "Tillgänglighet", included: form.accessLevel === "full" },
                    { icon: "tabler:certificate", label: isEn ? "Certifications" : "Certifieringar", included: form.accessLevel === "full" || form.accessLevel === "cv_only" },
                  ].map((item, i) => (
                    <div key={i} className={clsx("flex items-center gap-2 text-xs font-medium", item.included ? "text-blue-700" : "text-gray-300 line-through")}>
                      <Icon icon={item.included ? "tabler:circle-check-filled" : "tabler:circle-dashed"} className="w-3.5 h-3.5 flex-shrink-0" />
                      <Icon icon={item.icon} className="w-3.5 h-3.5 flex-shrink-0" />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal message */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {isEn ? "Personal message (optional)" : "Personligt meddelande (valfritt)"}
                  {inviteMode === "new" && sendLoginEmail && (
                    <span className="normal-case tracking-normal font-normal text-gray-400"> · {isEn ? "included in the email" : "visas i mejlet"}</span>
                  )}
                </label>
                <textarea value={form.personalMessage} onChange={set("personalMessage")} rows={3}
                  className={clsx(inputCls, "resize-none")}
                  placeholder={isEn
                    ? "Hi! I'd like access to your CVs to better support your job search…"
                    : "Hej! Jag vill ha åtkomst till dina CV:n för att bättre stödja din jobbsökning…"} {...fo} />
              </div>

              {/* Submit */}
              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button onClick={sendInvitation} disabled={!form.email.trim() || sending}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: NAVY }}
                  onMouseEnter={e => { if (!sending) e.currentTarget.style.backgroundColor = "rgb(15,32,90)" }}
                  onMouseLeave={e => { if (!sending) e.currentTarget.style.backgroundColor = NAVY }}>
                  <Icon icon={sending ? "tabler:loader-2" : "tabler:send"}
                    className={clsx("w-4 h-4", sending && "animate-spin")} />
                  {sending
                    ? (isEn ? "Sending…" : "Skickar…")
                    : inviteMode === "new"
                      ? (isEn ? "Create account & invite" : "Skapa konto & bjud in")
                      : (isEn ? "Send Invitation" : "Skicka inbjudan")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────── SENT TAB ─────────────────────── */}
        {tab === "sent" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 p-5 border-b border-gray-100">
              <div className="relative flex-1">
                <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder={isEn ? "Search by name or email…" : "Sök på namn eller e-post…"} />
                {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Icon icon="tabler:x" className="w-3.5 h-3.5" /></button>}
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as InvitationStatus | "")}
                className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white outline-none cursor-pointer text-gray-600">
                <option value="">{isEn ? "All statuses" : "Alla statusar"}</option>
                <option value="pending">{isEn ? "Pending" : "Väntande"}</option>
                <option value="accepted">{isEn ? "Accepted" : "Accepterade"}</option>
                <option value="declined">{isEn ? "Declined" : "Nekade"}</option>
              </select>
              <button onClick={() => setTab("send")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md flex-shrink-0"
                style={{ backgroundColor: NAVY }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgb(15,32,90)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = NAVY}>
                <Icon icon="tabler:plus" className="w-4 h-4" />
                {isEn ? "New" : "Ny"}
              </button>
            </div>

            {/* List */}
            {loadingList && (
              <div className="py-20 flex items-center justify-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                {isEn ? "Loading…" : "Laddar…"}
              </div>
            )}

            {!loadingList && listError && (
              <div className="p-6 text-sm text-red-600">{listError}</div>
            )}

            {!loadingList && !listError && filtered.length === 0 && (
              <div className="py-20 text-center">
                <Icon icon="tabler:send-off" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{isEn ? "No invitations found." : "Inga inbjudningar hittades."}</p>
                <p className="text-sm text-gray-400 mt-1">{isEn ? "Try a different filter or send a new invitation." : "Prova ett annat filter eller skicka en ny inbjudan."}</p>
              </div>
            )}

            {!loadingList && !listError && filtered.length > 0 && (
              <div className="divide-y divide-gray-50">
                {filtered.map(inv => {
                  const ss = statusStyle[inv.status]
                  const acc = accessMeta[displayAccessLevel(inv)]
                  return (
                    <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: NAVY }}>
                        {initials(inv)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 truncate">{displayName(inv)}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0"
                            style={{ backgroundColor: ss.bg, color: ss.text, borderColor: ss.border }}>
                            <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", ss.dot)} />
                            {statusLabel(inv.status)}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                            style={{ backgroundColor: acc.bg, color: acc.color }}>
                            <Icon icon={acc.icon} className="w-3 h-3" />
                            {isEn ? acc.label : acc.labelSv}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Icon icon="tabler:mail" className="w-3 h-3" />{inv.employeeEmail}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Icon icon="tabler:calendar" className="w-3 h-3" />
                            {new Date(inv.createdAt).toLocaleDateString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {/* Status-only indicator — no resend/revoke actions since the backend doesn't currently expose those endpoints */}
                      {inv.status === "accepted" && (
                        <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 flex-shrink-0">
                          <Icon icon="tabler:shield-check" className="w-3.5 h-3.5" />
                          {isEn ? "Access granted" : "Åtkomst beviljad"}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────── ACCESS TAB ─────────────────────── */}
        {tab === "access" && (
          <div className="space-y-6">

            {/* Accepted — employees with active access */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgb(240,253,244)" }}>
                  <Icon icon="tabler:shield-check" className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="font-bold text-gray-900">{isEn ? "Employees with active access" : "Medarbetare med aktiv åtkomst"}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  {stats.accepted}
                </span>
              </div>
              {loadingList && (
                <div className="py-12 flex items-center justify-center gap-2 text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  {isEn ? "Loading…" : "Laddar…"}
                </div>
              )}
              {!loadingList && stats.accepted === 0 ? (
                <div className="py-12 text-center">
                  <Icon icon="tabler:users-off" className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{isEn ? "No employees have accepted an invitation yet." : "Inga medarbetare har accepterat en inbjudan ännu."}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {invitations.filter(i => i.status === "accepted").map(inv => {
                    const acc = accessMeta[displayAccessLevel(inv)]
                    return (
                      <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/40 transition-colors">
                        <button
                          onClick={() => setRevokeEmployeeTarget(inv)}
                          className="flex items-center gap-4 flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: NAVY }}>
                            {initials(inv)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{displayName(inv)}</p>
                            <p className="text-xs text-gray-400">{inv.employeeEmail}</p>
                          </div>
                        </button>
                        {/* Access breakdown */}
                        <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
                          {[
                            { icon: "tabler:files", label: isEn ? "CVs" : "CV:n", ok: displayAccessLevel(inv) === "full" || displayAccessLevel(inv) === "cv_only" },
                            { icon: "tabler:briefcase", label: isEn ? "Portfolio" : "Portfolio", ok: displayAccessLevel(inv) === "full" || displayAccessLevel(inv) === "portfolio_only" },
                            { icon: "tabler:user-circle", label: isEn ? "Profile" : "Profil", ok: displayAccessLevel(inv) === "full" },
                            { icon: "tabler:chart-bar", label: isEn ? "Stats" : "Statistik", ok: displayAccessLevel(inv) === "full" },
                          ].map((item, i) => (
                            <span key={i} className={clsx("flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg",
                              item.ok ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-300 line-through")}>
                              <Icon icon={item.icon} className="w-3 h-3" />{item.label}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => setRevokeEmployeeTarget(inv)}
                          disabled={revokingEmployeeId === inv.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 text-xs font-medium flex-shrink-0 transition-colors"
                        >
                          {revokingEmployeeId === inv.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Icon icon="tabler:lock" className="w-3.5 h-3.5" />
                          )}
                          {isEn ? "Revoke" : "Återkalla"}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="tabler:info-circle" className="w-5 h-5" style={{ color: NAVY }} />
                {isEn ? "How access works" : "Hur åtkomst fungerar"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "tabler:circle-number-1", color: NAVY, title: isEn ? "You send an invitation" : "Du skickar en inbjudan", desc: isEn ? "Choose an existing account, or create a new one on the spot." : "Välj ett befintligt konto, eller skapa ett nytt direkt." },
                  { icon: "tabler:circle-number-2", color: "rgb(109,40,217)", title: isEn ? "Employee reviews & accepts" : "Medarbetaren granskar & accepterar", desc: isEn ? "They choose to accept or decline. You are notified either way." : "De väljer att acceptera eller neka. Du meddelas oavsett." },
                  { icon: "tabler:circle-number-3", color: "rgb(22,101,52)", title: isEn ? "Access is granted" : "Åtkomst beviljas", desc: isEn ? "Accepted CVs, portfolios and data appear in your dashboard immediately." : "Accepterade CV:n, portfolios och data visas i din dashboard direkt." },
                  { icon: "tabler:circle-number-4", color: "rgb(217,119,6)", title: isEn ? "Employee controls access" : "Medarbetaren kontrollerar åtkomst", desc: isEn ? "They can revoke your access at any time from their own settings." : "De kan återkalla din åtkomst när som helst från sina egna inställningar." },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/40">
                    <Icon icon={s.icon} className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Access level reference */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{isEn ? "Access level reference" : "Åtkomstnivåöversikt"}</p>
                <div className="space-y-2">
                  {accessOptions.map(opt => {
                    const included = {
                      full: [isEn ? "CVs & templates" : "CV:n & mallar", isEn ? "Portfolio" : "Portfolio", isEn ? "Personal info" : "Personlig info", isEn ? "Work stats" : "Arbetsstatistik", isEn ? "Availability" : "Tillgänglighet", isEn ? "Certifications" : "Certifieringar"],
                      cv_only: [isEn ? "CVs & templates" : "CV:n & mallar", isEn ? "Certifications" : "Certifieringar"],
                      portfolio_only: [isEn ? "Portfolio" : "Portfolio"],
                    }[opt.value]
                    return (
                      <div key={opt.value} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${opt.color}15` }}>
                          <Icon icon={opt.icon} className="w-4 h-4" style={{ color: opt.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                          <p className="text-xs text-gray-400">{included.join(" · ")}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {revokeEmployeeTarget && (
        <RevokeEmployeeDialog
          employeeName={displayName(revokeEmployeeTarget)}
          isEn={isEn}
          revoking={revokingEmployeeId === revokeEmployeeTarget.id}
          onConfirm={confirmRevokeEmployee}
          onCancel={() => setRevokeEmployeeTarget(null)}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Small pieces
───────────────────────────────────────────── */
function FieldNote({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <p className="text-xs text-red-600 mt-1">{error}</p>
  if (hint) return <p className="text-xs text-gray-400 mt-1">{hint}</p>
  return null
}

/** What the employee receives (same layout as the real email). */
function EmailPreview({ sv, to, firstName, loginEmail, password, showPassword, accessLevel, note }: {
  sv: boolean; to: string; firstName: string; loginEmail: string; password: string; showPassword: boolean
  accessLevel: AccessLevel; note: string
}) {
  const what = sv
    ? { full: "CV:n, portfolio och personlig information", cv_only: "dina CV:n", portfolio_only: "din portfolio" }[accessLevel]
    : { full: "your CVs, portfolio and personal information", cv_only: "your CVs", portfolio_only: "your portfolio" }[accessLevel]
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-4 py-2.5 border-b border-gray-100 text-xs space-y-0.5">
        <p className="text-gray-500 truncate"><span className="font-semibold text-gray-700">{sv ? "Till" : "To"}:</span> {to || "—"}</p>
        <p className="text-gray-700 font-semibold truncate">{sv ? "Dina inloggningsuppgifter till VeroCV" : "Your VeroCV login details"}</p>
      </div>
      <div className="px-4 py-2 text-white text-sm font-bold" style={{ backgroundColor: NAVY }}>VeroCV</div>
      <div className="p-4 text-[13px] text-gray-700 space-y-3">
        <p className="font-semibold text-gray-900">{sv ? `Hej ${firstName || "…"}!` : `Hi ${firstName || "…"}!`}</p>
        <p>{sv ? "Din chef har skapat ett VeroCV-konto åt dig. Här är dina inloggningsuppgifter:" : "Your manager has created a VeroCV account for you. Here are your login details:"}</p>
        <div className="rounded-lg border border-gray-100 bg-gray-50 divide-y divide-gray-100 text-xs">
          <div className="flex justify-between gap-2 px-3 py-2"><span className="text-gray-500">{sv ? "E-post" : "Email"}</span><span className="font-semibold text-gray-900 truncate">{loginEmail || "—"}</span></div>
          <div className="flex justify-between gap-2 px-3 py-2"><span className="text-gray-500">{sv ? "Lösenord" : "Password"}</span><span className="font-semibold text-gray-900 font-mono">{password ? (showPassword ? password : "•".repeat(Math.min(password.length, 14))) : "—"}</span></div>
        </div>
        <div className="text-center">
          <span className="inline-block px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: NAVY }}>{sv ? "Logga in på VeroCV" : "Log in to VeroCV"}</span>
        </div>
        <p className="text-xs">{sv ? `Din chef ber om åtkomst till ${what}. Godkänn inbjudan under notiserna när du har loggat in.` : `Your manager is asking for access to ${what}. Accept the invitation in your notifications after you log in.`}</p>
        {note && <div className="p-2.5 rounded-lg bg-blue-50 border-l-2 text-xs whitespace-pre-wrap break-words" style={{ borderColor: NAVY }}>{note}</div>}
        <p className="text-xs text-gray-500">{sv ? "Byt lösenord efter första inloggningen." : "Change your password after the first login."}</p>
      </div>
    </div>
  )
}

/** After creating an account: email status + the login details to copy. */
function CreatedCard({ created, isEn, copiedAll, onCopy, onAnother, onList }: {
  created: CreatedAccount; isEn: boolean; copiedAll: boolean
  onCopy: () => void; onAnother: () => void; onList: () => void
}) {
  const [show, setShow] = useState(false)
  const s = created.emailStatus
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-xl mx-auto">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-50">
          <Icon icon="tabler:check" className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{isEn ? "Account created" : "Kontot är skapat"}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isEn
            ? `${created.name} can now log in to VeroCV. The invitation waits in their notifications.`
            : `${created.name} kan nu logga in i VeroCV. Inbjudan väntar bland deras notiser.`}
        </p>
      </div>

      <div className="mt-6">
        {s.sent ? (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-green-50 border border-green-100 text-sm text-green-800">
            <Icon icon="tabler:mail-check" className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{isEn ? `Login details sent to ${s.to}` : `Inloggningsuppgifterna skickades till ${s.to}`}</span>
          </div>
        ) : s.to ? (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
            <Icon icon="tabler:mail-exclamation" className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{isEn ? "The login email couldn't be sent" : "Mejlet med inloggningsuppgifterna kunde inte skickas"}</p>
              <p className="mt-0.5">{isEn ? "The account is created. Copy the login details and give them to the employee another way." : "Kontot är skapat. Kopiera inloggningsuppgifterna och ge dem till medarbetaren på annat sätt."}</p>
              {s.error && <p className="mt-1 text-xs opacity-80">{s.error}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700">
            <Icon icon="tabler:info-circle" className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{isEn ? "No email was sent — give the login details to the employee yourself." : "Inget mejl skickades — ge medarbetaren inloggningsuppgifterna själv."}</span>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100">
        <p className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">{isEn ? "Login details" : "Inloggningsuppgifter"}</p>
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">{isEn ? "Email" : "E-post"}</span>
          <span className="text-sm font-semibold text-gray-900 truncate">{created.loginEmail}</span>
        </div>
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">{isEn ? "Password" : "Lösenord"}</span>
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 font-mono">{show ? created.password : "•".repeat(Math.min(created.password.length, 14))}</span>
            <button type="button" onClick={() => setShow(v => !v)} className="p-1 text-gray-400 hover:text-gray-600"
              aria-label={show ? (isEn ? "Hide password" : "Dölj lösenord") : (isEn ? "Show password" : "Visa lösenord")}>
              <Icon icon={show ? "tabler:eye-off" : "tabler:eye"} className="w-4 h-4" />
            </button>
          </span>
        </div>
      </div>
      <button type="button" onClick={onCopy}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
        <Icon icon={copiedAll ? "tabler:check" : "tabler:copy"} className="w-4 h-4" />
        {copiedAll ? (isEn ? "Copied" : "Kopierat") : (isEn ? "Copy login details" : "Kopiera inloggningsuppgifter")}
      </button>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button type="button" onClick={onList} className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          {isEn ? "Sent invitations" : "Skickade inbjudningar"}
        </button>
        <button type="button" onClick={onAnother} className="py-3 rounded-xl text-white text-sm font-semibold hover:shadow-md" style={{ backgroundColor: NAVY }}>
          {isEn ? "Invite another" : "Bjud in en till"}
        </button>
      </div>
    </div>
  )
}
