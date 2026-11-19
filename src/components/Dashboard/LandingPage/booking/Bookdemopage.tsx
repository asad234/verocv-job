"use client"
// ══════════════════════════════════════════════════════════════════════
// /companies/book-demo — CEOs / managers book a meeting with the VeroCV team.
// One short form: first name, last name, email, phone, role → "Boka Demo".
// (No time picker — the VeroCV team replies by email to find a time.)
// The phone field only accepts digits (PhoneInput) and is optional.
// Sends to POST /api/book-demo → emailed to info@verocv.se with Resend
// (plus a confirmation email to the person who booked).
// ══════════════════════════════════════════════════════════════════════
import { useSession } from "next-auth/react"
import type React from "react"
import { useState, useEffect } from "react"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import Link from "next/link"
import PhoneInput from "@/components/shared/PhoneInput"
import { isValidPhone } from "@/utils/phone"

type Language = "en" | "sv"

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  /** Honeypot — hidden from people, bots fill it in */
  website: string
}

/* ─────────────────────────────────────────────
   TRANSLATIONS
───────────────────────────────────────────── */
const translations = {
  sv: {
    forJobSeekers: "FÖR CV-SKAPARE",
    forCompanies: "FÖR FÖRETAG",
    signIn: "Logga In",
    /* hero */
    eyebrow: "Boka en Demo",
    heroTitle: "Se VeroCV i",
    heroTitleAccent: "action.",
    heroDesc: "Låt oss visa dig hur VeroCV kan förvandla din konsultverksamhet. 30 minuter. Inga förpliktelser.",
    /* form */
    formTitle: "Dina uppgifter",
    formIntro: "Fyll i dina uppgifter så hör vi av oss för att boka en tid.",
    firstName: "Förnamn",
    lastName: "Efternamn",
    email: "E-postadress",
    phone: "Telefonnummer",
    role: "Din roll",
    rolePlaceholder: "t.ex. Head of Talent, VD, Rekryterare",
    submit: "Boka Demo",
    submitting: "Skickar...",
    sendError: "Det gick inte att skicka din bokning. Försök igen eller mejla oss på",
    /* success */
    successTitle: "Tack — vi har fått din bokning!",
    successDesc: "Vi hör av oss inom en arbetsdag för att hitta en tid som passar dig. En bekräftelse på din förfrågan är redan på väg till din e-post.",
    successSub: "Frågor under tiden? Kontakta oss på",
    /* sidebar */
    whatToExpect: "Vad händer på demod?",
    expect1: "30-minuters genomgång anpassad till ditt företag",
    expect2: "Live-demo av plattformens kärnfunktioner",
    expect3: "Svar på alla dina frågor",
    expect4: "Prisplan och onboarding-plan",
    talkTo: "Du pratar med",
    contactName: "Georgi Renström",
    contactTitle: "Account Executive, VeroCV",
    responseTime: "Svarar vanligtvis inom 2 timmar",
    /* validation */
    required: "Detta fält är obligatoriskt",
    invalidEmail: "Ange en giltig e-postadress",
    invalidPhone: "Ange ett giltigt telefonnummer (6–15 siffror)",
    /* footer */
    contact: "Kontakt",
    about: "Om Oss",
    terms: "Villkor & Integritet",
    copyright: "VeroCV.",
    allRights: "Alla rättigheter förbehållna.",
  },
  en: {
    forJobSeekers: "FOR CV-MAKERS",
    forCompanies: "FOR COMPANIES",
    signIn: "Sign In",
    eyebrow: "Book a Demo",
    heroTitle: "See VeroCV in",
    heroTitleAccent: "action.",
    heroDesc: "Let us show you how VeroCV can transform your consulting operation. 30 minutes. No commitment.",
    formTitle: "Your details",
    formIntro: "Fill in your details and we'll get back to you to book a time.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone number",
    role: "Your role",
    rolePlaceholder: "e.g. Head of Talent, CEO, Recruiter",
    submit: "Book Demo",
    submitting: "Sending...",
    sendError: "We couldn't send your booking. Please try again or email us at",
    successTitle: "Thank you — we've received your booking!",
    successDesc: "We'll get back to you within one business day to find a time that suits you. A confirmation of your request is already on its way to your email.",
    successSub: "Questions in the meantime? Contact us at",
    whatToExpect: "What to expect",
    expect1: "30-minute walkthrough tailored to your company",
    expect2: "Live demo of the platform's core features",
    expect3: "Answers to all your questions",
    expect4: "Pricing and onboarding plan",
    talkTo: "You'll be talking to",
    contactName: "Georgi Renstrom",
    contactTitle: "Account Executive, VeroCV",
    responseTime: "Usually responds within 2 hours",
    required: "This field is required",
    invalidEmail: "Please enter a valid email address",
    invalidPhone: "Enter a valid phone number (6–15 digits)",
    contact: "Contact",
    about: "About",
    terms: "Terms & Privacy",
    copyright: "VeroCV.",
    allRights: "All rights reserved.",
  },
} as const

/* ─────────────────────────────────────────────
   FIELD COMPONENT
───────────────────────────────────────────── */
const Field: React.FC<{
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}> = ({ label, error, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {children}
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
)

const inputClass = (error?: string) =>
  `w-full px-4 py-3 rounded-xl border text-slate-800 text-sm placeholder-slate-400 bg-white transition-all duration-200 outline-none
  focus:ring-2 focus:border-transparent ${error
    ? "border-red-300 focus:ring-red-200"
    : "border-blue-200/60 focus:ring-blue-200"
  }`

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const BookDemoPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { data: session, status } = useSession()
  const { language, setLanguage } = useAuthTranslation("sv")
  const t = translations[language]

  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [form, setForm] = useState<FormState>({
    firstName: "", lastName: "", email: "", phone: "", role: "", website: "",
  })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => { setIsVisible(true) }, [])

  const set = (key: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  /* ── Validation ── */
  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.firstName.trim()) errs.firstName = t.required
    if (!form.lastName.trim()) errs.lastName = t.required
    if (!form.email.trim()) errs.email = t.required
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = t.invalidEmail
    // Phone is optional — but if filled in it must be a real number.
    if (form.phone && !isValidPhone(form.phone)) errs.phone = t.invalidPhone
    if (!form.role.trim()) errs.role = t.required
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ── Submit → /api/book-demo (Resend → info@verocv.se) ── */
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!validate() || sending) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone,
          role: form.role.trim(),
          website: form.website, // honeypot
          language,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setSendError(t.sendError)
    } finally {
      setSending(false)
    }
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("dashboardLanguage", lang)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 relative overflow-hidden">

      {/* ── AUDIENCE TOP NAV ── */}
      <div className="relative z-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-10">
            <Link href="/" className="relative flex items-center h-full px-4 sm:px-6 text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-400 hover:text-slate-700 transition-colors duration-200 group">
              {t.forJobSeekers}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" style={{ backgroundColor: "rgb(5,22,80)" }} />
            </Link>
            <div className="h-4 w-px bg-slate-300 mx-1" />
            <Link href="/companies" className="relative flex items-center h-full px-4 sm:px-6 text-xs sm:text-sm font-semibold tracking-widest uppercase transition-colors duration-200 text-slate-400 hover:text-slate-700 group">
              {t.forCompanies}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" style={{ backgroundColor: "rgb(5,22,80)" }} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-blue-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 sm:py-8">
            <Link href="/" className="group cursor-pointer">
              <div className="relative px-2 sm:px-6 py-2">
                <img src="/logo/logovero.svg" className="h-10 sm:h-16 w-auto mr-3 object-contain relative z-10" alt="VeroCV Logo" />
              </div>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button onClick={() => handleLanguageChange("en")}
                  className={`px-1 py-1 sm:px-2 sm:py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${language === "en" ? "border-[rgb(5,22,80)] bg-blue-50" : "border-gray-200 bg-white"}`}>
                  <svg className="w-4 h-3 sm:w-6 sm:h-4" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
                    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                  </svg>
                </button>
                <button onClick={() => handleLanguageChange("sv")}
                  className={`px-1 py-1 sm:px-2 sm:py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${language === "sv" ? "border-[rgb(5,22,80)] bg-blue-50" : "border-gray-200 bg-white"}`}>
                  <svg className="w-4 h-3 sm:w-6 sm:h-4" viewBox="0 0 16 10" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="10" fill="#006AA7" />
                    <rect x="0" y="4" width="16" height="2" fill="#FECC00" />
                    <rect x="5" y="0" width="2" height="10" fill="#FECC00" />
                  </svg>
                </button>
              </div>
              {status !== "loading" && !session && (
                <Link href="/login"
                  className="whitespace-nowrap px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full text-white font-medium text-xs sm:text-sm hover:shadow-lg transition-all duration-300"
                  style={{ backgroundColor: "rgb(5,22,80)" }}>
                  {t.signIn}
                </Link>
              )}
              {session && (
                <Link href="/dashboard"
                  className="whitespace-nowrap px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full text-white font-medium text-xs sm:text-sm hover:shadow-lg transition-all duration-300"
                  style={{ backgroundColor: "rgb(5,22,80)" }}>
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Page heading */}
        <div className={`text-center mb-12 transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase border border-blue-200 mb-6"
            style={{ color: "rgb(5,22,80)" }}>
            <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: "rgb(5,22,80)" }} />
            {t.eyebrow}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-slate-900 mb-4 leading-tight tracking-tight">
            {t.heroTitle}{" "}
            <span className="font-medium" style={{ color: "rgb(156,177,202)" }}>{t.heroTitleAccent}</span>
          </h1>
          <div className="w-16 sm:w-24 h-0.5 mx-auto mt-4 sm:mt-6 mb-4" style={{ backgroundColor: "rgb(5,22,80)" }} />
          <p className="text-lg text-slate-600 max-w-xl mx-auto">{t.heroDesc}</p>
        </div>

        {/* ── TWO COLUMN LAYOUT ── */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transform transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>

          {/* ════ FORM CARD (2/3 width) ════ */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl border border-blue-200/40 shadow-sm overflow-hidden">


              {/* Title */}
              {!submitted && (
                <div className="px-8 pt-8 pb-6">
                  <h2 className="text-lg font-semibold text-slate-900">{t.formTitle}</h2>
                  <p className="text-sm text-slate-500 mt-1">{t.formIntro}</p>
                </div>
              )}

              <div className={`px-8 pb-8 ${submitted ? "pt-8" : ""}`}>
                {/* ── SUCCESS STATE ── */}
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ backgroundColor: "rgb(239,246,255)" }}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}
                        style={{ color: "rgb(5,22,80)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-3">{t.successTitle}</h2>
                    <p className="text-slate-600 mb-2 max-w-sm mx-auto">{t.successDesc}</p>
                    <p className="text-sm text-slate-400 mb-8">
                      {t.successSub}{" "}
                      <a href="mailto:info@verocv.se" className="underline" style={{ color: "rgb(5,22,80)" }}>
                        info@verocv.se
                      </a>
                    </p>
                    <div className="mt-8">
                      <Link href="/companies"
                        className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                        style={{ color: "rgb(5,22,80)" }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        {t.forCompanies}
                      </Link>
                    </div>
                  </div>

                ) : (
                  /* ── THE FORM ── */
                  <form onSubmit={handleSubmit} noValidate className="relative space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label={t.firstName} required error={errors.firstName}>
                        <input
                          type="text" value={form.firstName} onChange={e => set("firstName", e.target.value)}
                          placeholder="Anna" autoComplete="given-name" className={inputClass(errors.firstName)} />
                      </Field>
                      <Field label={t.lastName} required error={errors.lastName}>
                        <input
                          type="text" value={form.lastName} onChange={e => set("lastName", e.target.value)}
                          placeholder="Karlsson" autoComplete="family-name" className={inputClass(errors.lastName)} />
                      </Field>
                    </div>
                    <Field label={t.email} required error={errors.email}>
                      <input
                        type="email" value={form.email} onChange={e => set("email", e.target.value)}
                        placeholder="anna@foretaget.se" autoComplete="email" className={inputClass(errors.email)} />
                    </Field>
                    <Field label={t.phone} error={errors.phone}>
                      <PhoneInput
                        value={form.phone} onChange={v => set("phone", v)}
                        placeholder="+46701234567" invalid={!!errors.phone} className={inputClass(errors.phone)} />
                    </Field>
                    <Field label={t.role} required error={errors.role}>
                      <input
                        type="text" value={form.role} onChange={e => set("role", e.target.value)}
                        placeholder={t.rolePlaceholder} autoComplete="organization-title" className={inputClass(errors.role)} />
                    </Field>

                    {/* Honeypot (hidden from people) */}
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
                      value={form.website} onChange={e => set("website", e.target.value)}
                      className="absolute -left-[9999px] w-px h-px opacity-0" />

                    {sendError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {sendError}{" "}
                        <a href="mailto:info@verocv.se" className="underline font-medium">info@verocv.se</a>
                      </div>
                    )}

                    <div className="flex justify-end mt-8 pt-6 border-t border-blue-100">
                      <button type="submit" disabled={sending}
                        className="flex items-center gap-2 px-8 py-3 rounded-full text-white text-sm font-medium hover:shadow-lg transition-all duration-300 relative overflow-hidden group disabled:opacity-60 disabled:cursor-wait"
                        style={{ backgroundColor: "rgb(5,22,80)" }}>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span className="relative z-10">{sending ? t.submitting : t.submit}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* ════ SIDEBAR (1/3 width) ════ */}
          <div className="flex flex-col gap-6">

            {/* What to expect */}
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-7 border border-blue-200/40 shadow-sm">
              <h3 className="text-sm font-semibold tracking-widest uppercase mb-5" style={{ color: "rgb(5,22,80)" }}>
                {t.whatToExpect}
              </h3>
              <ul className="space-y-4">
                {[t.expect1, t.expect2, t.expect3, t.expect4].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgb(239,246,255)" }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
                        style={{ color: "rgb(5,22,80)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-600 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>

              {/* Duration badge */}
              <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "rgb(239,246,255)" }}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}
                  style={{ color: "rgb(5,22,80)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: "rgb(5,22,80)" }}>30 min</span>
              </div>
            </div>

            {/* Contact person card */}
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-7 border border-blue-200/40 shadow-sm">
              <h3 className="text-sm font-semibold tracking-widest uppercase mb-5" style={{ color: "rgb(5,22,80)" }}>
                {t.talkTo}
              </h3>
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: "rgb(5,22,80)" }}>
                  {t.contactName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.contactName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.contactTitle}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {t.responseTime}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 backdrop-blur-sm bg-white/60 border-t border-blue-200/30 py-8 sm:py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <nav className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 text-sm">
              {["contact", "about", "terms"].map((link) => (
                <Link key={link} href={`/${link}`}
                  className="text-slate-600 transition-colors duration-300 relative group"
                  onMouseEnter={e => e.currentTarget.style.color = "rgb(176,196,222)"}
                  onMouseLeave={e => e.currentTarget.style.color = ""}>
                  {String((t as Record<string, unknown>)[link] ?? link)}
                  <span className="absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                    style={{ backgroundColor: "rgb(5,22,80)" }} />
                </Link>
              ))}
            </nav>
            <div className="text-xs sm:text-sm text-slate-500 text-center md:text-left">
              <span>© {new Date().getFullYear()} {t.copyright}</span>
              <span className="block sm:inline sm:ml-4">{t.allRights}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default BookDemoPage
