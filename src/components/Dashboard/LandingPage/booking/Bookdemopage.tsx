"use client"
// ══════════════════════════════════════════════════════════════════════
// /companies/book-demo — CEOs / managers book a meeting with the VeroCV team.
// Steps: 1 Your details · 2 Your company · 3 A few questions
// (No time picker — the VeroCV team replies by email to find a time.)
// Sends to POST /api/book-demo → emailed to info@verocv.se with Resend
// (plus a confirmation email to the person who booked).
// ══════════════════════════════════════════════════════════════════════
import { useSession } from "next-auth/react"
import type React from "react"
import { useState, useEffect } from "react"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import Link from "next/link"

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
  companyName: string
  companySize: string
  industry: string
  consultantCount: string
  /** Step 3 — "What would you like to know more about?" (optional) */
  interests: string
  /** Step 3 — biggest challenge today (optional) */
  challenge: string
  /** Step 3 — when they want to get started (optional) */
  timeline: string
  /** Step 3 — how they heard about VeroCV (required) */
  source: string
  /** Step 3 — "Other / elsewhere" details (optional) */
  sourceOther: string
  /** Honeypot — hidden from people, bots fill it in */
  website: string
}

type Step = 1 | 2 | 3
const STEPS: Step[] = [1, 2, 3]
const OTHER_SOURCE = "other"

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
    /* steps */
    step1Label: "Dina uppgifter",
    step2Label: "Ditt företag",
    step3Label: "Några frågor",
    firstName: "Förnamn",
    lastName: "Efternamn",
    email: "E-postadress",
    phone: "Telefonnummer",
    role: "Din roll",
    rolePlaceholder: "t.ex. Head of Talent, VD, Rekryterare",
    /* form step 2 */
    companyName: "Företagsnamn",
    companySize: "Antal anställda",
    companySizes: ["1–10", "11–50", "51–200", "201–500", "500+"],
    industry: "Bransch",
    industries: ["Konsult & Bemanning", "IT & Tech", "Finans", "Vård & Omsorg", "Bygg & Industri", "Annat"],
    consultantCount: "Antal konsulter ni hanterar",
    consultantCounts: ["Färre än 10", "10–50", "51–100", "101–500", "Fler än 500"],
    /* form step 3 */
    questionsIntro: "Några snabba frågor så att vi kan förbereda demon efter era behov.",
    interests: "Vad vill du veta mer om? (valfritt)",
    interestsPlaceholder: "T.ex. hur vi hanterar massimport av CV, integrationer, prissättning...",
    challenge: "Vad är er största utmaning idag med CV:n och konsulter? (valfritt)",
    challengePlaceholder: "T.ex. det tar för lång tid att anpassa CV:n till varje uppdrag...",
    timeline: "När vill ni komma igång? (valfritt)",
    timelines: ["Så snart som möjligt", "Inom 1–3 månader", "Senare i år", "Vill bara utforska"],
    source: "Hur hörde du talas om VeroCV?",
    sourcePlaceholder: "Välj ett alternativ",
    sources: [
      { value: "google", label: "Google / sökmotor" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "social", label: "Sociala medier (Instagram, Facebook, TikTok)" },
      { value: "recommendation", label: "Rekommendation från kollega eller vän" },
      { value: "event", label: "Event, mässa eller konferens" },
      { value: "article", label: "Artikel, nyhet eller podcast" },
      { value: "verocv_user", label: "Använder redan VeroCV" },
      { value: "other", label: "Annat / någon annanstans" },
    ],
    sourceOther: "Var? (valfritt)",
    sourceOtherPlaceholder: "T.ex. namnet på eventet, podden eller personen",
    /* nav */
    back: "Tillbaka",
    next: "Nästa",
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
    step1Label: "Your details",
    step2Label: "Your company",
    step3Label: "A few questions",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone number",
    role: "Your role",
    rolePlaceholder: "e.g. Head of Talent, CEO, Recruiter",
    companyName: "Company name",
    companySize: "Number of employees",
    companySizes: ["1–10", "11–50", "51–200", "201–500", "500+"],
    industry: "Industry",
    industries: ["Staffing & Consulting", "IT & Tech", "Finance", "Healthcare", "Construction & Industry", "Other"],
    consultantCount: "Consultants you manage",
    consultantCounts: ["Fewer than 10", "10–50", "51–100", "101–500", "More than 500"],
    questionsIntro: "A few quick questions so we can tailor the demo to your needs.",
    interests: "What would you like to know more about? (optional)",
    interestsPlaceholder: "e.g. bulk CV import, integrations, pricing...",
    challenge: "What's your biggest challenge today with CVs and consultants? (optional)",
    challengePlaceholder: "e.g. tailoring CVs for every assignment takes too long...",
    timeline: "When are you looking to get started? (optional)",
    timelines: ["As soon as possible", "Within 1–3 months", "Later this year", "Just exploring"],
    source: "How did you hear about VeroCV?",
    sourcePlaceholder: "Choose an option",
    sources: [
      { value: "google", label: "Google / search engine" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "social", label: "Social media (Instagram, Facebook, TikTok)" },
      { value: "recommendation", label: "Recommendation from a colleague or friend" },
      { value: "event", label: "Event, fair or conference" },
      { value: "article", label: "Article, news or podcast" },
      { value: "verocv_user", label: "Already using VeroCV" },
      { value: "other", label: "Other / somewhere else" },
    ],
    sourceOther: "Where? (optional)",
    sourceOtherPlaceholder: "e.g. the name of the event, podcast or person",
    back: "Back",
    next: "Next",
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

  const [step, setStep] = useState<Step>(1)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [form, setForm] = useState<FormState>({
    firstName: "", lastName: "", email: "", phone: "", role: "",
    companyName: "", companySize: "", industry: "", consultantCount: "",
    interests: "", challenge: "", timeline: "", source: "", sourceOther: "", website: "",
  })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)


  useEffect(() => { setIsVisible(true) }, [])

  const set = (key: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  /* ── Validation ── */
  const validateStep = (s: Step): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (s === 1) {
      if (!form.firstName.trim()) errs.firstName = t.required
      if (!form.lastName.trim()) errs.lastName = t.required
      if (!form.email.trim()) errs.email = t.required
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t.invalidEmail
      if (!form.role.trim()) errs.role = t.required
    }
    if (s === 2) {
      if (!form.companyName.trim()) errs.companyName = t.required
      if (!form.companySize) errs.companySize = t.required
      if (!form.industry) errs.industry = t.required
      if (!form.consultantCount) errs.consultantCount = t.required
    }
    if (s === 3) {
      if (!form.source) errs.source = t.required
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) setStep(s => (s < 3 ? ((s + 1) as Step) : s))
  }
  const handleBack = () => setStep(s => (s > 1 ? ((s - 1) as Step) : s))

  /* ── Submit → /api/book-demo (Resend → info@verocv.se) ── */
  const handleSubmit = async () => {
    if (!validateStep(3) || sending) return
    setSending(true)
    setSendError(null)
    try {
      const sourceLabel = t.sources.find(s => s.value === form.source)?.label ?? form.source
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: sourceLabel,
          sourceOther: form.source === OTHER_SOURCE ? form.sourceOther : "",
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

  /* ─── Progress bar width ─── */
  const progressWidth = `${(step / STEPS.length) * 100}%`

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

              {/* Progress bar */}
              {!submitted && (
                <div className="px-8 pt-8 pb-0">
                  {/* Step labels */}
                  <div className="flex items-center justify-between mb-3">
                    {STEPS.map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= s ? "text-white" : "text-slate-400 border-2 border-slate-200"}`}
                          style={step >= s ? { backgroundColor: "rgb(5,22,80)" } : {}}>
                          {step > s ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : s}
                        </div>
                        <span className={`text-xs font-medium hidden sm:block transition-colors duration-300 ${step === s ? "text-slate-800" : "text-slate-400"}`}>
                          {s === 1 ? t.step1Label : s === 2 ? t.step2Label : t.step3Label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-8">
                    <div className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: progressWidth, backgroundColor: "rgb(5,22,80)" }} />
                  </div>
                </div>
              )}

              <div className="px-8 pb-8">
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

                ) : step === 1 ? (
                  /* ── STEP 1: PERSONAL ── */
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label={t.firstName} error={errors.firstName}>
                        <input
                          type="text" value={form.firstName} onChange={e => set("firstName", e.target.value)}
                          placeholder="Anna" className={inputClass(errors.firstName)} />
                      </Field>
                      <Field label={t.lastName} error={errors.lastName}>
                        <input
                          type="text" value={form.lastName} onChange={e => set("lastName", e.target.value)}
                          placeholder="Karlsson" className={inputClass(errors.lastName)} />
                      </Field>
                    </div>
                    <Field label={t.email} error={errors.email}>
                      <input
                        type="email" value={form.email} onChange={e => set("email", e.target.value)}
                        placeholder="anna@foretaget.se" className={inputClass(errors.email)} />
                    </Field>
                    <Field label={t.phone}>
                      <input
                        type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                        placeholder="+46 70 000 00 00" className={inputClass()} />
                    </Field>
                    <Field label={t.role} error={errors.role}>
                      <input
                        type="text" value={form.role} onChange={e => set("role", e.target.value)}
                        placeholder={t.rolePlaceholder} className={inputClass(errors.role)} />
                    </Field>
                  </div>

                ) : step === 2 ? (
                  /* ── STEP 2: COMPANY ── */
                  <div className="space-y-5">
                    <Field label={t.companyName} error={errors.companyName}>
                      <input
                        type="text" value={form.companyName} onChange={e => set("companyName", e.target.value)}
                        placeholder="Nordic Konsult AB" className={inputClass(errors.companyName)} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label={t.companySize} error={errors.companySize}>
                        <select
                          value={form.companySize} onChange={e => set("companySize", e.target.value)}
                          className={inputClass(errors.companySize) + " cursor-pointer"}>
                          <option value="">—</option>
                          {t.companySizes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label={t.industry} error={errors.industry}>
                        <select
                          value={form.industry} onChange={e => set("industry", e.target.value)}
                          className={inputClass(errors.industry) + " cursor-pointer"}>
                          <option value="">—</option>
                          {t.industries.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label={t.consultantCount} error={errors.consultantCount}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {t.consultantCounts.map(c => (
                          <button key={c} type="button"
                            onClick={() => set("consultantCount", c)}
                            className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 text-left ${form.consultantCount === c
                              ? "text-white"
                              : "border-blue-200/60 text-slate-600 bg-white hover:border-blue-300"
                              }`}
                            style={form.consultantCount === c ? { backgroundColor: "rgb(5,22,80)", borderColor: "rgb(5,22,80)" } : {}}>
                            {c}
                          </button>
                        ))}
                      </div>
                      {errors.consultantCount && <span className="text-xs text-red-500">{errors.consultantCount}</span>}
                    </Field>
                  </div>

                ) : (
                  /* ── STEP 3: A FEW QUESTIONS ── */
                  <div className="space-y-6">
                    <p className="text-sm text-slate-500 -mt-2">{t.questionsIntro}</p>

                    {/* 1 — what to know more about (optional, existing question) */}
                    <Field label={t.interests}>
                      <textarea
                        rows={3} value={form.interests} onChange={e => set("interests", e.target.value)}
                        placeholder={t.interestsPlaceholder}
                        className={`${inputClass()} resize-none`} />
                    </Field>

                    {/* 2 — biggest challenge (optional) */}
                    <Field label={t.challenge}>
                      <textarea
                        rows={3} value={form.challenge} onChange={e => set("challenge", e.target.value)}
                        placeholder={t.challengePlaceholder}
                        className={`${inputClass()} resize-none`} />
                    </Field>

                    {/* 3 — timeline (optional) */}
                    <Field label={t.timeline}>
                      <div className="grid grid-cols-2 gap-2">
                        {t.timelines.map(option => (
                          <button key={option} type="button"
                            onClick={() => set("timeline", form.timeline === option ? "" : option)}
                            className={`py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 text-left ${form.timeline === option
                              ? "text-white"
                              : "border-blue-200/60 text-slate-600 bg-white hover:border-blue-300"
                              }`}
                            style={form.timeline === option ? { backgroundColor: "rgb(5,22,80)", borderColor: "rgb(5,22,80)" } : {}}>
                            {option}
                          </button>
                        ))}
                      </div>
                    </Field>

                    {/* 4 — how did you hear about VeroCV (required) */}
                    <Field label={t.source} required error={errors.source}>
                      <select
                        value={form.source}
                        onChange={e => { set("source", e.target.value); if (e.target.value !== OTHER_SOURCE) set("sourceOther", "") }}
                        className={inputClass(errors.source) + " cursor-pointer"}>
                        <option value="" disabled>{t.sourcePlaceholder}</option>
                        {t.sources.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Field>

                    {form.source === OTHER_SOURCE && (
                      <Field label={t.sourceOther}>
                        <input
                          type="text" value={form.sourceOther} onChange={e => set("sourceOther", e.target.value)}
                          placeholder={t.sourceOtherPlaceholder} maxLength={200}
                          className={inputClass()} />
                      </Field>
                    )}

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
                  </div>
                )}

                {/* ── NAV BUTTONS ── */}
                {!submitted && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-blue-100">
                    {step > 1 ? (
                      <button onClick={handleBack}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        {t.back}
                      </button>
                    ) : <div />}

                    {step < 3 ? (
                      <button onClick={handleNext}
                        className="flex items-center gap-2 px-8 py-3 rounded-full text-white text-sm font-medium hover:shadow-lg transition-all duration-300"
                        style={{ backgroundColor: "rgb(5,22,80)" }}>
                        {t.next}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    ) : (
                      <button onClick={handleSubmit} disabled={sending}
                        className="flex items-center gap-2 px-8 py-3 rounded-full text-white text-sm font-medium hover:shadow-lg transition-all duration-300 relative overflow-hidden group disabled:opacity-60 disabled:cursor-wait"
                        style={{ backgroundColor: "rgb(5,22,80)" }}>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span className="relative z-10">{sending ? t.submitting : t.submit}</span>
                      </button>
                    )}
                  </div>
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
