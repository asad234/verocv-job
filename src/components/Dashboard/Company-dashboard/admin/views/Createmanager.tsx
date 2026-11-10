"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/Createmanager.tsx
// WHAT IT DOES:   Business admin → Managers → Create manager.
//   • Work email      — the manager logs in to VeroCV with this.
//   • Personal email  — gets the "Your VeroCV login details" email (Resend),
//                       with the work email, password and a log-in button.
//   Password can be generated, copied and checked against simple rules.
//   A live preview shows exactly what the manager will receive.
// ══════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react"
import type React from "react"
import { Icon } from "@iconify/react"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { useBusinessAdmin } from "@/components/Dashboard/Company-dashboard/admin/Businessadmincontext"

const NAVY = "rgb(5,22,80)"
type Lang = "sv" | "en"

/* ─── Texts ─── */
const TX = {
  en: {
    title: "Create manager",
    subtitle: "Set up a manager account. They'll log in with their work email.",
    s1: "Personal details",
    s1d: "Who is the manager?",
    s2: "Login & access",
    s2d: "What they log in with and what they can do.",
    s3: "Send login details",
    s3d: "We email the login details to the manager's personal email.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    jobTitle: "Job title",
    jobTitlePh: "e.g. Team lead",
    workEmail: "Work email",
    workEmailHint: "The manager logs in to VeroCV with this email.",
    personalEmail: "Personal email",
    personalEmailHint: "The login details are sent here — e.g. their private email until the work inbox is set up.",
    department: "Department",
    departmentPh: "e.g. IT, Sales",
    access: "Access level",
    password: "Password",
    confirm: "Confirm password",
    generate: "Generate",
    copy: "Copy",
    copied: "Copied",
    show: "Show password",
    hide: "Hide password",
    rule8: "At least 8 characters",
    ruleMix: "Letters and numbers",
    ruleStrong: "A symbol or 12+ characters (recommended)",
    sendToggle: "Email the login details to the manager",
    sendOff: "No email will be sent. Share the login details with the manager yourself.",
    emailLang: "Email language",
    note: "Personal message (optional)",
    notePh: "e.g. Welcome to the team! Let's meet on Monday at 9.",
    create: "Create manager",
    creating: "Creating…",
    clear: "Clear form",
    required: "Required",
    invalidEmail: "Enter a valid email address",
    taken: "There's already an account with this email",
    sameEmail: "Use a different email than the work email — or turn the email off",
    pwShort: "At least 8 characters with letters and numbers",
    pwMismatch: "The passwords don't match",
    checkFields: "Please check the highlighted fields.",
    failed: "Couldn't create the manager. Please try again.",
    preview: "Email preview",
    to: "To",
    subject: (c?: string) => `Your VeroCV login details${c ? ` – ${c}` : ""}`,
    subjectSv: (c?: string) => `Dina inloggningsuppgifter till VeroCV${c ? ` – ${c}` : ""}`,
    pvHi: (n: string) => `Hi ${n || "…"}!`,
    pvHiSv: (n: string) => `Hej ${n || "…"}!`,
    pvIntro: "You have a manager account in VeroCV. Here are your login details:",
    pvIntroSv: "Du har fått ett chefskonto i VeroCV. Här är dina inloggningsuppgifter:",
    pvEmail: "Email",
    pvEmailSv: "E-post",
    pvPassword: "Password",
    pvPasswordSv: "Lösenord",
    pvButton: "Log in to VeroCV",
    pvButtonSv: "Logga in på VeroCV",
    pvChange: "Change your password after the first login.",
    pvChangeSv: "Byt lösenord efter första inloggningen.",
    // success
    doneTitle: "Manager created",
    doneDesc: (n: string) => `${n} can now log in to VeroCV.`,
    loginDetails: "Login details",
    copyAll: "Copy login details",
    sentTo: (e: string) => `Login details sent to ${e}`,
    notSent: "The login email couldn't be sent",
    notSentHint: "The account is created. Copy the login details and send them to the manager another way.",
    noEmail: "No email was sent — share the login details with the manager yourself.",
    another: "Create another manager",
    toList: "Go to managers list",
    copyText: (e: string, p: string, url: string) => `VeroCV login\nEmail: ${e}\nPassword: ${p}\nLog in: ${url}`,
  },
  sv: {
    title: "Skapa chef",
    subtitle: "Skapa ett chefskonto. Chefen loggar in med sin jobbmejl.",
    s1: "Personuppgifter",
    s1d: "Vem är chefen?",
    s2: "Inloggning & behörighet",
    s2d: "Vad chefen loggar in med och vad hen får göra.",
    s3: "Skicka inloggningsuppgifter",
    s3d: "Vi mejlar inloggningsuppgifterna till chefens privata e-post.",
    firstName: "Förnamn",
    lastName: "Efternamn",
    phone: "Telefon",
    jobTitle: "Titel",
    jobTitlePh: "t.ex. Teamledare",
    workEmail: "Jobbmejl",
    workEmailHint: "Chefen loggar in i VeroCV med den här e-postadressen.",
    personalEmail: "Privat e-post",
    personalEmailHint: "Hit skickas inloggningsuppgifterna — t.ex. privat e-post tills jobbmejlen är på plats.",
    department: "Avdelning",
    departmentPh: "t.ex. IT, Försäljning",
    access: "Behörighet",
    password: "Lösenord",
    confirm: "Bekräfta lösenord",
    generate: "Generera",
    copy: "Kopiera",
    copied: "Kopierat",
    show: "Visa lösenord",
    hide: "Dölj lösenord",
    rule8: "Minst 8 tecken",
    ruleMix: "Bokstäver och siffror",
    ruleStrong: "Ett specialtecken eller 12+ tecken (rekommenderas)",
    sendToggle: "Mejla inloggningsuppgifterna till chefen",
    sendOff: "Inget mejl skickas. Ge chefen inloggningsuppgifterna själv.",
    emailLang: "Mejlets språk",
    note: "Personligt meddelande (valfritt)",
    notePh: "t.ex. Välkommen till teamet! Vi ses på måndag kl. 9.",
    create: "Skapa chef",
    creating: "Skapar…",
    clear: "Rensa formuläret",
    required: "Obligatoriskt",
    invalidEmail: "Ange en giltig e-postadress",
    taken: "Det finns redan ett konto med den här e-postadressen",
    sameEmail: "Använd en annan adress än jobbmejlen — eller stäng av mejlet",
    pwShort: "Minst 8 tecken med bokstäver och siffror",
    pwMismatch: "Lösenorden matchar inte",
    checkFields: "Kontrollera de markerade fälten.",
    failed: "Kunde inte skapa chefen. Försök igen.",
    preview: "Förhandsvisning av mejlet",
    to: "Till",
    subject: (c?: string) => `Your VeroCV login details${c ? ` – ${c}` : ""}`,
    subjectSv: (c?: string) => `Dina inloggningsuppgifter till VeroCV${c ? ` – ${c}` : ""}`,
    pvHi: (n: string) => `Hi ${n || "…"}!`,
    pvHiSv: (n: string) => `Hej ${n || "…"}!`,
    pvIntro: "You have a manager account in VeroCV. Here are your login details:",
    pvIntroSv: "Du har fått ett chefskonto i VeroCV. Här är dina inloggningsuppgifter:",
    pvEmail: "Email",
    pvEmailSv: "E-post",
    pvPassword: "Password",
    pvPasswordSv: "Lösenord",
    pvButton: "Log in to VeroCV",
    pvButtonSv: "Logga in på VeroCV",
    pvChange: "Change your password after the first login.",
    pvChangeSv: "Byt lösenord efter första inloggningen.",
    doneTitle: "Chefen är skapad",
    doneDesc: (n: string) => `${n} kan nu logga in i VeroCV.`,
    loginDetails: "Inloggningsuppgifter",
    copyAll: "Kopiera inloggningsuppgifter",
    sentTo: (e: string) => `Inloggningsuppgifterna skickades till ${e}`,
    notSent: "Mejlet med inloggningsuppgifterna kunde inte skickas",
    notSentHint: "Kontot är skapat. Kopiera inloggningsuppgifterna och ge dem till chefen på annat sätt.",
    noEmail: "Inget mejl skickades — ge chefen inloggningsuppgifterna själv.",
    another: "Skapa en till chef",
    toList: "Till chefslistan",
    copyText: (e: string, p: string, url: string) => `VeroCV-inloggning\nE-post: ${e}\nLösenord: ${p}\nLogga in: ${url}`,
  },
}
type Tx = (typeof TX)["en"]

/* ─── Helpers ─── */
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

interface Form {
  firstName: string
  lastName: string
  phone: string
  jobTitle: string
  workEmail: string
  department: string
  accessLevel: string
  password: string
  confirmPassword: string
  sendInvite: boolean
  personalEmail: string
  emailLanguage: Lang
  note: string
}
type Errors = Partial<Record<keyof Form, string>>

const inputCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 placeholder-gray-300 bg-white outline-none transition-all focus:ring-2 ${err ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:ring-blue-100 focus:border-blue-300"
  }`

function Field({ label, required, hint, error, children, className = "" }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : hint ? <p className="text-xs text-gray-400 mt-1">{hint}</p> : null}
    </div>
  )
}

function Section({ n, title, desc, children }: { n: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: NAVY }}>{n}</span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

/* ═════════════════════════════════════════════════════════════════════ */
export default function CreateManager() {
  const { t, language } = useBusinessAdminTranslations()
  const { setView } = useBusinessAdmin()
  const lang: Lang = language === "en" ? "en" : "sv"
  const tx: Tx = TX[lang]
  const accessOptions: string[] = Array.isArray((t as any).accessOptions) ? (t as any).accessOptions : []

  const empty = (): Form => ({
    firstName: "", lastName: "", phone: "", jobTitle: "",
    workEmail: "", department: "", accessLevel: accessOptions[0] ?? "",
    password: "", confirmPassword: "",
    sendInvite: true, personalEmail: "", emailLanguage: lang, note: "",
  })

  const [form, setForm] = useState<Form>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [showPw, setShowPw] = useState(false)
  const [copiedPw, setCopiedPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [done, setDone] = useState<null | { name: string; workEmail: string; password: string; emailStatus: { sent: boolean; to?: string; error?: string } }>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
    setSubmitError("")
  }

  const rules = useMemo(() => [
    { ok: form.password.length >= 8, label: tx.rule8, required: true },
    { ok: /[A-Za-z]/.test(form.password) && /\d/.test(form.password), label: tx.ruleMix, required: true },
    { ok: /[^A-Za-z0-9]/.test(form.password) || form.password.length >= 12, label: tx.ruleStrong, required: false },
  ], [form.password, tx])

  const generate = () => {
    const pw = generatePassword()
    setForm((f) => ({ ...f, password: pw, confirmPassword: pw }))
    setErrors((e) => ({ ...e, password: undefined, confirmPassword: undefined }))
    setShowPw(true)
  }

  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.firstName.trim()) e.firstName = tx.required
    if (!form.lastName.trim()) e.lastName = tx.required
    if (!form.workEmail.trim()) e.workEmail = tx.required
    else if (!isEmail(form.workEmail)) e.workEmail = tx.invalidEmail
    if (!form.department.trim()) e.department = tx.required
    if (!rules[0]!.ok || !rules[1]!.ok) e.password = tx.pwShort
    if (!form.confirmPassword) e.confirmPassword = tx.required
    else if (form.confirmPassword !== form.password) e.confirmPassword = tx.pwMismatch
    if (form.sendInvite) {
      if (!form.personalEmail.trim()) e.personalEmail = tx.required
      else if (!isEmail(form.personalEmail)) e.personalEmail = tx.invalidEmail
      else if (form.personalEmail.trim().toLowerCase() === form.workEmail.trim().toLowerCase()) e.personalEmail = tx.sameEmail
    } else if (form.personalEmail.trim() && !isEmail(form.personalEmail)) e.personalEmail = tx.invalidEmail
    return e
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      setSubmitError(tx.checkFields)
      document.querySelector("[aria-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch("/api/company/admin/create-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          jobTitle: form.jobTitle,
          workEmail: form.workEmail,
          personalEmail: form.personalEmail,
          department: form.department,
          accessLevel: form.accessLevel,
          password: form.password,
          sendInvite: form.sendInvite,
          note: form.note,
          language: form.emailLanguage,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const fe = (data?.fieldErrors ?? {}) as Record<string, string>
        const mapped: Errors = {}
        for (const [k, v] of Object.entries(fe)) {
          mapped[k as keyof Form] =
            v === "taken" ? tx.taken : v === "invalid" ? tx.invalidEmail : v === "weak" ? tx.pwShort : tx.required
        }
        setErrors(mapped)
        setSubmitError(Object.keys(mapped).length ? tx.checkFields : data?.message || tx.failed)
        return
      }
      setDone({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        workEmail: form.workEmail.trim().toLowerCase(),
        password: form.password,
        emailStatus: data?.emailStatus ?? { sent: false },
      })
    } catch {
      setSubmitError(tx.failed)
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setForm(empty())
    setErrors({})
    setSubmitError("")
    setShowPw(false)
    setDone(null)
    setCopiedAll(false)
  }

  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login"

  /* ═══ Success ═══ */
  if (done) {
    const copyAll = async () => {
      if (await copyToClipboard(tx.copyText(done.workEmail, done.password, loginUrl))) {
        setCopiedAll(true)
        setTimeout(() => setCopiedAll(false), 2000)
      }
    }
    const s = done.emailStatus
    return (
      <div className="max-w-xl mx-auto py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-50">
              <Icon icon="tabler:check" className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{tx.doneTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">{tx.doneDesc(done.name)}</p>
          </div>

          {/* Email status */}
          <div className="mt-6">
            {s.sent ? (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-green-50 border border-green-100 text-sm text-green-800">
                <Icon icon="tabler:mail-check" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{tx.sentTo(s.to ?? "")}</span>
              </div>
            ) : s.to ? (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                <Icon icon="tabler:mail-exclamation" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{tx.notSent}</p>
                  <p className="mt-0.5">{tx.notSentHint}</p>
                  {s.error && <p className="mt-1 text-xs opacity-80">{s.error}</p>}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700">
                <Icon icon="tabler:info-circle" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{tx.noEmail}</span>
              </div>
            )}
          </div>

          {/* Login details */}
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100">
            <p className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">{tx.loginDetails}</p>
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">{tx.workEmail}</span>
              <span className="text-sm font-semibold text-gray-900 truncate">{done.workEmail}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">{tx.password}</span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 font-mono">{showPw ? done.password : "•".repeat(Math.min(done.password.length, 14))}</span>
                <button type="button" onClick={() => setShowPw((v) => !v)} className="p-1 text-gray-400 hover:text-gray-600" aria-label={showPw ? tx.hide : tx.show}>
                  <Icon icon={showPw ? "tabler:eye-off" : "tabler:eye"} className="w-4 h-4" />
                </button>
              </span>
            </div>
          </div>
          <button type="button" onClick={copyAll} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Icon icon={copiedAll ? "tabler:check" : "tabler:copy"} className="w-4 h-4" />
            {copiedAll ? tx.copied : tx.copyAll}
          </button>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onClick={() => setView("managers_list")} className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              {tx.toList}
            </button>
            <button type="button" onClick={reset} className="py-3 rounded-xl text-white text-sm font-semibold hover:shadow-md" style={{ backgroundColor: NAVY }}>
              {tx.another}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ═══ Form ═══ */
  const pvSv = form.emailLanguage === "sv"
  return (
    <form onSubmit={submit} noValidate className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: NAVY }}>
          <Icon icon="tabler:user-plus" className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{tx.title}</h1>
          <p className="text-sm text-gray-500">{tx.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Form ── */}
        <div className="lg:col-span-2 space-y-5">
          <Section n={1} title={tx.s1} desc={tx.s1d}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={tx.firstName} required error={errors.firstName}>
                <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Anna" autoComplete="off" aria-invalid={!!errors.firstName} className={inputCls(errors.firstName)} />
              </Field>
              <Field label={tx.lastName} required error={errors.lastName}>
                <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Karlsson" autoComplete="off" aria-invalid={!!errors.lastName} className={inputCls(errors.lastName)} />
              </Field>
              <Field label={tx.jobTitle}>
                <input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder={tx.jobTitlePh} className={inputCls()} />
              </Field>
              <Field label={tx.phone}>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+46 70 000 00 00" className={inputCls()} />
              </Field>
            </div>
          </Section>

          <Section n={2} title={tx.s2} desc={tx.s2d}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={tx.workEmail} required hint={tx.workEmailHint} error={errors.workEmail} className="sm:col-span-2">
                <div className="relative">
                  <Icon icon="tabler:briefcase" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={form.workEmail} onChange={(e) => set("workEmail", e.target.value)} placeholder="anna.karlsson@company.se" autoComplete="off" aria-invalid={!!errors.workEmail} className={`${inputCls(errors.workEmail)} pl-9`} />
                </div>
              </Field>
              <Field label={tx.department} required error={errors.department}>
                <input value={form.department} onChange={(e) => set("department", e.target.value)} placeholder={tx.departmentPh} aria-invalid={!!errors.department} className={inputCls(errors.department)} />
              </Field>
              {accessOptions.length > 0 && (
                <Field label={tx.access}>
                  <select value={form.accessLevel} onChange={(e) => set("accessLevel", e.target.value)} className={`${inputCls()} cursor-pointer`}>
                    {accessOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              )}

              {/* Password */}
              <Field label={tx.password} required error={errors.password} className="sm:col-span-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Icon icon="tabler:lock" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      autoComplete="new-password"
                      aria-invalid={!!errors.password}
                      className={`${inputCls(errors.password)} pl-9 pr-20 font-mono`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                      {form.password && (
                        <button type="button" tabIndex={-1} title={copiedPw ? tx.copied : tx.copy} aria-label={tx.copy}
                          onClick={async () => { if (await copyToClipboard(form.password)) { setCopiedPw(true); setTimeout(() => setCopiedPw(false), 1500) } }}
                          className="p-1.5 text-gray-400 hover:text-gray-600">
                          <Icon icon={copiedPw ? "tabler:check" : "tabler:copy"} className="w-4 h-4" />
                        </button>
                      )}
                      <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)} aria-label={showPw ? tx.hide : tx.show} className="p-1.5 text-gray-400 hover:text-gray-600">
                        <Icon icon={showPw ? "tabler:eye-off" : "tabler:eye"} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={generate} className="flex items-center gap-1.5 px-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex-shrink-0">
                    <Icon icon="tabler:wand" className="w-4 h-4" />
                    {tx.generate}
                  </button>
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {rules.map((r) => (
                    <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-green-700" : r.required ? "text-gray-500" : "text-gray-400"}`}>
                      <Icon icon={r.ok ? "tabler:circle-check-filled" : "tabler:circle"} className="w-3.5 h-3.5" />
                      {r.label}
                    </li>
                  ))}
                </ul>
              </Field>
              <Field label={tx.confirm} required error={errors.confirmPassword} className="sm:col-span-2">
                <div className="relative">
                  <Icon icon={form.confirmPassword && form.confirmPassword === form.password ? "tabler:lock-check" : "tabler:lock"} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    className={`${inputCls(errors.confirmPassword)} pl-9 font-mono`}
                  />
                </div>
              </Field>
            </div>
          </Section>

          <Section n={3} title={tx.s3} desc={tx.s3d}>
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={form.sendInvite}
                onClick={() => set("sendInvite", !form.sendInvite)}
                className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
                style={{ backgroundColor: form.sendInvite ? NAVY : "rgb(209,213,219)" }}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.sendInvite ? "translate-x-4" : ""}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">{tx.sendToggle}</span>
            </label>

            {form.sendInvite ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={tx.personalEmail} required hint={tx.personalEmailHint} error={errors.personalEmail} className="sm:col-span-2">
                  <div className="relative">
                    <Icon icon="tabler:mail" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={form.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} placeholder="anna@gmail.com" autoComplete="off" aria-invalid={!!errors.personalEmail} className={`${inputCls(errors.personalEmail)} pl-9`} />
                  </div>
                </Field>
                <Field label={tx.emailLang}>
                  <div className="flex gap-2">
                    {(["sv", "en"] as const).map((l) => (
                      <button key={l} type="button" onClick={() => set("emailLanguage", l)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.emailLanguage === l ? "text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        style={form.emailLanguage === l ? { backgroundColor: NAVY, borderColor: NAVY } : undefined}>
                        <Icon icon={l === "sv" ? "circle-flags:se" : "circle-flags:gb"} className="w-4 h-4" />
                        {l === "sv" ? "Svenska" : "English"}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={tx.note} className="sm:col-span-2">
                  <textarea rows={3} value={form.note} maxLength={2000} onChange={(e) => set("note", e.target.value)} placeholder={tx.notePh} className={`${inputCls()} resize-none`} />
                </Field>
              </div>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-sm text-gray-500">
                <Icon icon="tabler:info-circle" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {tx.sendOff}
              </p>
            )}
          </Section>

          {/* Actions */}
          {submitError && (
            <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
              <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {submitError}
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={reset} className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-white">
              {tx.clear}
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: NAVY }}>
              <Icon icon={submitting ? "tabler:loader-2" : "tabler:user-plus"} className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`} />
              {submitting ? tx.creating : tx.create}
            </button>
          </div>
        </div>

        {/* ── Email preview ── */}
        <aside className="lg:sticky lg:top-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">{tx.preview}</p>
          {form.sendInvite ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-xs space-y-1">
                <p className="text-gray-500 truncate"><span className="font-semibold text-gray-700">{tx.to}:</span> {form.personalEmail || "—"}</p>
                <p className="text-gray-700 font-semibold truncate">{pvSv ? tx.subjectSv() : tx.subject()}</p>
              </div>
              <div className="px-4 py-2.5 text-white text-sm font-bold" style={{ backgroundColor: NAVY }}>VeroCV</div>
              <div className="p-4 text-[13px] text-gray-700 space-y-3">
                <p className="font-semibold text-gray-900">{pvSv ? tx.pvHiSv(form.firstName.trim()) : tx.pvHi(form.firstName.trim())}</p>
                <p>{pvSv ? tx.pvIntroSv : tx.pvIntro}</p>
                <div className="rounded-lg border border-gray-100 bg-gray-50 divide-y divide-gray-100 text-xs">
                  <div className="flex justify-between gap-2 px-3 py-2"><span className="text-gray-500">{pvSv ? tx.pvEmailSv : tx.pvEmail}</span><span className="font-semibold text-gray-900 truncate">{form.workEmail.trim().toLowerCase() || "—"}</span></div>
                  <div className="flex justify-between gap-2 px-3 py-2"><span className="text-gray-500">{pvSv ? tx.pvPasswordSv : tx.pvPassword}</span><span className="font-semibold text-gray-900 font-mono">{form.password ? (showPw ? form.password : "•".repeat(Math.min(form.password.length, 14))) : "—"}</span></div>
                </div>
                <div className="text-center">
                  <span className="inline-block px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: NAVY }}>{pvSv ? tx.pvButtonSv : tx.pvButton}</span>
                </div>
                {form.note.trim() && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border-l-2 text-xs whitespace-pre-wrap break-words" style={{ borderColor: NAVY }}>{form.note.trim()}</div>
                )}
                <p className="text-xs text-gray-500">{pvSv ? tx.pvChangeSv : tx.pvChange}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
              <Icon icon="tabler:mail-off" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{tx.sendOff}</p>
            </div>
          )}
        </aside>
      </div>
    </form>
  )
}
