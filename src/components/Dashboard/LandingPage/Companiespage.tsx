"use client"
import { useSession } from "next-auth/react"
import type React from "react"
import { useState, useEffect } from "react"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import Link from "next/link"

type Language = "en" | "sv"

/* ─────────────────────────────────────────────
   TRANSLATIONS
───────────────────────────────────────────── */
const translations = {
  sv: {
    /* nav */
    forJobSeekers: "FÖR CV-SKAPARE",
    forCompanies: "FÖR FÖRETAG",
    signIn: "Logga In",
    getStarted: "Kom igång",
    bookDemo: "Boka Demo",
    /* hero */
    heroEyebrow: "Konsultplattform",
    heroTitle: "Hantera dina konsulter",
    heroSubtitle: "Enkelt och effektivt",
    heroDesc1: "Hjälp dina konsulter att hitta rätt jobb med ",
    heroDesc1Bold: "skräddarsydda CV:n på sekunder",
    heroDesc2: "Centralisera all kandidatdata och ",
    heroDesc2Bold: "håll koll på varje placering",
    heroDesc3: "Skala din konsultverksamhet utan att skala upp administrationen",
    heroCta: "Starta gratis period",
    heroCtaSub: "Ingen kreditkortskrävs · 14 dagars gratis",
    /* trust bar */
    trustedBy: "BETRODD AV LEDANDE KONSULTBOLAG",
    /* features */
    featuresEyebrow: "Allt du behöver",
    featuresTitle: "En plattform.",
    featuresTitleAccent: "Oändliga placeringar.",
    feature1Title: "Masshantering av CV",
    feature1Desc: "Skapa, anpassa och exportera professionella CV:n för hela din konsultstyrka med ett klick.",
    feature2Title: "Jobbmatchning med AI",
    feature2Desc: "Vår AI analyserar varje jobbannons och anpassar automatiskt konsultens CV för maximal träffsäkerhet.",
    feature3Title: "Kandidatöversikt",
    feature3Desc: "En samlad dashboard där du ser alla konsulters status, aktiva ansökningar och placeringsstatus i realtid.",
    feature4Title: "Personliga brev på sekunder",
    feature4Desc: "Generera jobbspecifika personliga brev för varje konsult utan att de behöver lyfta ett finger.",
    feature5Title: "Teamsamarbete",
    feature5Desc: "Bjud in rekryterare och koordinatorer — arbeta tillsammans i samma kandidatflöde med rollbaserade behörigheter.",
    feature6Title: "Analys & rapportering",
    feature6Desc: "Spåra intervjufrekvenser, placeringstakt och CV-prestanda med detaljerade rapporter.",
    /* how it works */
    howEyebrow: "Så fungerar det",
    howTitle: "Från onboarding till placering",
    howTitleAccent: "på dagar, inte veckor.",
    step1Num: "01",
    step1Title: "Importera dina konsulter",
    step1Desc: "Ladda upp befintliga CV:n eller lägg till konsulter manuellt. Plattformen strukturerar och berikar all data automatiskt.",
    step2Num: "02",
    step2Title: "Matcha mot jobbannonser",
    step2Desc: "Klistra in en jobbannons — vår AI identifierar bäst matchande konsulter och optimerar deras CV:n för just den rollen.",
    step3Num: "03",
    step3Title: "Skicka och följ upp",
    step3Desc: "Exportera färdiga ansökningar och spåra varje steg i rekryteringsprocessen direkt i plattformen.",
    /* stats */
    statsEyebrow: "Bevisade resultat",
    statsTitle: "Siffror som talar för sig själva",
    stat1Val: "3×",
    stat1Label: "Fler placeringar per rekryterare",
    stat2Val: "90%",
    stat2Label: "Kortare tid att förbereda kandidater",
    stat3Val: "80%",
    stat3Label: "Högre svarsfrekvens från arbetsgivare",
    stat4Val: "2 min",
    stat4Label: "Genomsnittlig tid per optimerat CV",
    /* testimonial */
    quoteText: "Med VeroCV hanterar vi tre gånger fler kandidater med samma team. Kvaliteten på CV:n har ökat markant och vi ser en tydlig förbättring i intervjufrekvens.",
    quoteAuthor: "Sara Lindqvist",
    quoteRole: "Head of Talent, Nordic Konsult AB",
    /* final cta */
    finalEyebrow: "Redo att skala upp?",
    finalTitle: "Din nästa placering",
    finalTitleAccent: "börjar här.",
    finalDesc: "Gå med konsultbolag som redan förändrar sin rekrytering med VeroCV. Kom igång direkt — ingen installation krävs.",
    finalCta: "Starta din gratisperiod",
    finalCtaSecondary: "Boka en demo",
    /* footer */
    contact: "Kontakt",
    about: "Om Oss",
    terms: "Villkor & Integritet",
    copyright: "VeroCV.",
    allRights: "Alla rättigheter förbehållna.",
  },
  en: {
    /* nav */
    forJobSeekers: "FOR CV-MAKERS",
    forCompanies: "FOR COMPANIES",
    signIn: "Sign In",
    getStarted: "Get Started",
    bookDemo: "Book Demo",
    /* hero */
    heroEyebrow: "Staffing & Consulting Platform",
    heroTitle: "Manage your consultants",
    heroSubtitle: "Simply and efficiently",
    heroDesc1: "Help your consultants land the right roles with ",
    heroDesc1Bold: "tailored CVs in seconds",
    heroDesc2: "Centralise all candidate data and ",
    heroDesc2Bold: "track every placement",
    heroDesc3: "Scale your consulting operation without scaling your admin",
    heroCta: "Start free trial",
    heroCtaSub: "No credit card required · 14 days free",
    /* trust bar */
    trustedBy: "TRUSTED BY LEADING STAFFING COMPANIES",
    /* features */
    featuresEyebrow: "Everything you need",
    featuresTitle: "One platform.",
    featuresTitleAccent: "Endless placements.",
    feature1Title: "Bulk CV Management",
    feature1Desc: "Create, tailor, and export professional CVs for your entire consultant pool with a single click.",
    feature2Title: "AI Job Matching",
    feature2Desc: "Our AI reads every job posting and automatically adapts each consultant's CV for maximum relevance.",
    feature3Title: "Candidate Dashboard",
    feature3Desc: "One centralised view of all your consultants' status, active applications, and placement progress in real time.",
    feature4Title: "Cover Letters in Seconds",
    feature4Desc: "Generate job-specific cover letters for every consultant — no input needed from them.",
    feature5Title: "Team Collaboration",
    feature5Desc: "Invite recruiters and coordinators to work together in the same candidate pipeline with role-based access.",
    feature6Title: "Analytics & Reporting",
    feature6Desc: "Track interview rates, placement velocity, and CV performance with detailed, exportable reports.",
    /* how it works */
    howEyebrow: "How it works",
    howTitle: "From onboarding to placement",
    howTitleAccent: "in days, not weeks.",
    step1Num: "01",
    step1Title: "Import your consultants",
    step1Desc: "Upload existing CVs or add consultants manually. The platform structures and enriches all data automatically.",
    step2Num: "02",
    step2Title: "Match to job postings",
    step2Desc: "Paste a job ad — our AI identifies best-fit consultants and optimises their CVs specifically for that role.",
    step3Num: "03",
    step3Title: "Send and track",
    step3Desc: "Export polished applications and track every step of the hiring process directly inside the platform.",
    /* stats */
    statsEyebrow: "Proven results",
    statsTitle: "Numbers that speak for themselves",
    stat1Val: "3×",
    stat1Label: "More placements per recruiter",
    stat2Val: "90%",
    stat2Label: "Less time preparing candidates",
    stat3Val: "80%",
    stat3Label: "Higher employer response rate",
    stat4Val: "2 min",
    stat4Label: "Average time per optimised CV",
    /* testimonial */
    quoteText: "With VeroCV we handle three times as many candidates with the same team. CV quality has improved dramatically and we see a clear uplift in interview rates.",
    quoteAuthor: "Sara Lindqvist",
    quoteRole: "Head of Talent, Nordic Konsult AB",
    /* final cta */
    finalEyebrow: "Ready to scale?",
    finalTitle: "Your next placement",
    finalTitleAccent: "starts here.",
    finalDesc: "Join staffing companies already transforming their recruitment with VeroCV. Get started immediately — no setup required.",
    finalCta: "Start your free trial",
    finalCtaSecondary: "Book a demo",
    /* footer */
    contact: "Contact",
    about: "About",
    terms: "Terms & Privacy",
    copyright: "VeroCV.",
    allRights: "All rights reserved.",
  },
} as const

type T = typeof translations["en"]

/* ─────────────────────────────────────────────
   ICON COMPONENTS
───────────────────────────────────────────── */
const IconBulkCV = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
  </svg>
)

const IconAI = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
)

const IconDashboard = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
)

const IconLetter = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
)

const IconTeam = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
)

const IconAnalytics = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
)

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const CompaniesPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { data: session, status } = useSession()
  const { language, setLanguage } = useAuthTranslation("sv")

  const t = translations[language]

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("dashboardLanguage", lang)
  }

  const features = [
    { icon: <IconBulkCV />, title: t.feature1Title, desc: t.feature1Desc, accent: "blue" },
    { icon: <IconAI />, title: t.feature2Title, desc: t.feature2Desc, accent: "purple" },
    { icon: <IconDashboard />, title: t.feature3Title, desc: t.feature3Desc, accent: "blue" },
    { icon: <IconLetter />, title: t.feature4Title, desc: t.feature4Desc, accent: "indigo" },
    { icon: <IconTeam />, title: t.feature5Title, desc: t.feature5Desc, accent: "blue" },
    { icon: <IconAnalytics />, title: t.feature6Title, desc: t.feature6Desc, accent: "purple" },
  ]

  const steps = [
    { num: t.step1Num, title: t.step1Title, desc: t.step1Desc },
    { num: t.step2Num, title: t.step2Title, desc: t.step2Desc },
    { num: t.step3Num, title: t.step3Title, desc: t.step3Desc },
  ]

  const stats = [
    { val: t.stat1Val, label: t.stat1Label },
    { val: t.stat2Val, label: t.stat2Label },
    { val: t.stat3Val, label: t.stat3Label },
    { val: t.stat4Val, label: t.stat4Label },
  ]

  /* Consulting company logos — text-based since these are real brands */
  const partners = ["Lernia", "Adecco", "Manpower", "Randstad", "Academic Work"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 relative overflow-hidden">

      {/* ── AUDIENCE TOP NAV ── */}
      <div className="relative z-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-10">
            {/* Job Seekers — inactive */}
            <Link
              href="/"
              className="relative flex items-center h-full px-4 sm:px-6 text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-400 hover:text-slate-700 transition-colors duration-200 group"
            >
              {t.forJobSeekers}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"
                style={{ backgroundColor: "rgb(5,22,80)" }} />
            </Link>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Companies — active */}
            <Link
              href="/companies"
              className="relative flex items-center h-full px-4 sm:px-6 text-xs sm:text-sm font-semibold tracking-widest uppercase transition-colors duration-200"
              style={{ color: "rgb(5,22,80)" }}
            >
              {t.forCompanies}
              <span className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: "rgb(5,22,80)" }} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-blue-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 sm:py-8">
            {/* Logo */}
            <div className="group cursor-pointer">
              <div className="relative px-2 sm:px-6 py-2">
                <img src="/logo/logovero.svg" className="h-10 sm:h-16 w-auto mr-3 object-contain relative z-10" alt="VeroCV Logo" />
              </div>
            </div>

            {/* Language + Auth */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              {/* Language flags */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`px-1 py-1 sm:px-2 sm:py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${language === "en" ? "border-[rgb(5,22,80)] bg-blue-50" : "border-gray-200 bg-white"}`}
                  title="Switch to English"
                >
                  <svg className="w-4 h-3 sm:w-6 sm:h-4" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
                    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                  </svg>
                </button>
                <button
                  onClick={() => handleLanguageChange("sv")}
                  className={`px-1 py-1 sm:px-2 sm:py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${language === "sv" ? "border-[rgb(5,22,80)] bg-blue-50" : "border-gray-200 bg-white"}`}
                  title="Switch to Swedish"
                >
                  <svg className="w-4 h-3 sm:w-6 sm:h-4" viewBox="0 0 16 10" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="10" fill="#006AA7" />
                    <rect x="0" y="4" width="16" height="2" fill="#FECC00" />
                    <rect x="5" y="0" width="2" height="10" fill="#FECC00" />
                  </svg>
                </button>
              </div>

              {/* Book Demo button */}
              {!session && status !== "loading" && (
                <Link
                  href="/companies/book-demo"
                  className="inline-flex items-center justify-center whitespace-nowrap px-2 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2.5 rounded-full border-2 font-medium text-[10px] sm:text-sm md:text-base transition-all duration-300 hover:shadow-md"
                  style={{ borderColor: "rgb(5,22,80)", color: "rgb(5,22,80)" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgb(5,22,80)"; e.currentTarget.style.color = "white" }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgb(5,22,80)" }}
                >
                  {t.bookDemo}
                </Link>
              )}

              {/* Auth */}
              {status === "loading" ? (
                <button disabled className="whitespace-nowrap px-2 py-1.5 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-full bg-gray-400 text-white font-medium text-[10px] sm:text-sm md:text-base">
                  Loading...
                </button>
              ) : session ? (
                <Link href="/dashboard"
                  className="whitespace-nowrap px-2 py-1.5 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-full text-white font-medium text-[10px] sm:text-sm md:text-base hover:shadow-lg transition-all duration-300"
                  style={{ backgroundColor: "rgb(5,22,80)" }}>
                  Dashboard
                </Link>
              ) : (
                <Link href="/companies/auth/login"
                  className="whitespace-nowrap px-2 py-1.5 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-full text-white font-medium text-[10px] sm:text-sm md:text-base hover:shadow-lg transition-all duration-300"
                  style={{ backgroundColor: "rgb(5,22,80)" }}>
                  {t.signIn}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10">

        {/* ════════════════════════════════════
            HERO
        ════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-12 sm:pb-16">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>

            {/* Eyebrow pill */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase border border-blue-200 mb-8"
              style={{ color: "rgb(5,22,80)" }}>
              <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: "rgb(5,22,80)" }} />
              {t.heroEyebrow}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-light text-slate-900 mb-4 leading-tight tracking-tight">
              {t.heroTitle}
              <br />
              <span className="font-normal" style={{ color: "rgb(156,177,202)" }}>
                {t.heroSubtitle}
              </span>
            </h1>
            <div className="w-16 sm:w-24 h-0.5 mx-auto mt-4 sm:mt-6 mb-10" style={{ backgroundColor: "rgb(5,22,80)" }} />

            {/* Description card */}
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-8 sm:p-12 md:p-16 border border-blue-200/40 shadow-sm mb-8 hover:shadow-md transition-all duration-500">
              <div className="space-y-4 sm:space-y-5 mb-10 text-left max-w-2xl mx-auto">
                {[
                  { pre: t.heroDesc1, bold: t.heroDesc1Bold, post: "" },
                  { pre: t.heroDesc2, bold: t.heroDesc2Bold, post: "" },
                  { pre: t.heroDesc3, bold: "", post: "" },
                ].map((line, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {/* Check mark */}
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgb(5,22,80)" }}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed">
                      {line.pre}
                      {line.bold && <span className="font-bold" style={{ color: "rgb(5,22,80)" }}>{line.bold}</span>}
                      {line.post}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => window.location.href = "/companies/book-demo"}
                  className="group relative overflow-hidden px-10 sm:px-14 py-4 rounded-full text-white text-lg font-medium hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: "rgb(5,22,80)" }}
                >
                  <div className="absolute inset-0 -translate-x-full animate-shimmer-custom bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative z-10 flex items-center">
                    {t.bookDemo}
                    <svg className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            TRUST BAR — partner logos
        ════════════════════════════════════ */}
        <section className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 transform transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="text-center mb-8">
            <span className="inline-flex items-center px-4 py-2 bg-slate-100/70 text-slate-500 rounded-full text-xs font-semibold tracking-widest border border-slate-200/60">
              <div className="w-2 h-2 bg-slate-400 rounded-full mr-2" />
              {t.trustedBy}
            </span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 items-center">
            {partners.map((name) => (
              <div key={name}
                className="group flex items-center justify-center bg-white/80 rounded-xl px-4 py-5 border border-blue-200/40 hover:bg-white/95 hover:shadow-sm transition-all duration-300">
                <span className="text-slate-400 font-semibold text-sm tracking-wide group-hover:text-slate-600 transition-colors duration-200">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════
            FEATURES GRID
        ════════════════════════════════════ */}
        <section className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 transform transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="text-center mb-14">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase border border-blue-200 mb-6"
              style={{ color: "rgb(5,22,80)" }}>
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "rgb(5,22,80)" }} />
              {t.featuresEyebrow}
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900">
              {t.featuresTitle}{" "}
              <span className="font-medium" style={{ color: "rgb(156,177,202)" }}>{t.featuresTitleAccent}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i}
                className="group backdrop-blur-sm bg-white/90 rounded-2xl p-8 border border-blue-200/40 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                {/* Icon circle */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "rgb(239,246,255)", color: "rgb(5,22,80)" }}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════ */}
        <section className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 transform transition-all duration-1000 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-8 sm:p-14 md:p-16 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            {/* Heading */}
            <div className="text-center mb-14">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase border border-blue-200 mb-6"
                style={{ color: "rgb(5,22,80)" }}>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "rgb(5,22,80)" }} />
                {t.howEyebrow}
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900">
                {t.howTitle}{" "}
                <span className="font-medium" style={{ color: "rgb(5,22,80)" }}>{t.howTitleAccent}</span>
              </h2>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              {/* Connector line (desktop) */}
              <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px" style={{ backgroundColor: "rgb(176,196,222)" }} />

              {steps.map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center group">
                  {/* Number circle */}
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center mb-6 border-2 font-bold text-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                    style={{ borderColor: "rgb(5,22,80)", color: "rgb(5,22,80)", backgroundColor: "rgb(239,246,255)" }}>
                    {step.num}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base max-w-xs">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            STATS
        ════════════════════════════════════ */}
        <section className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 transform transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-8 sm:p-14 border border-blue-200/40 shadow-sm">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase border border-blue-200 mb-6"
                style={{ color: "rgb(5,22,80)" }}>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "rgb(5,22,80)" }} />
                {t.statsEyebrow}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light text-slate-900">{t.statsTitle}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-14">
              {stats.map((s, i) => (
                <div key={i} className="text-center p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-sm"
                  style={{ backgroundColor: i % 2 === 0 ? "rgb(239,246,255)" : "rgb(245,243,255)", borderColor: i % 2 === 0 ? "rgb(191,219,254)" : "rgb(221,214,254)" }}>
                  <div className="text-3xl sm:text-4xl font-bold mb-2"
                    style={{ color: i % 2 === 0 ? "rgb(5,22,80)" : "rgb(109,40,217)" }}>
                    {s.val}
                  </div>
                  <div className="text-slate-600 text-sm leading-snug">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="rounded-2xl p-8 sm:p-10 border relative overflow-hidden"
              style={{ backgroundColor: "rgb(239,246,255)", borderColor: "rgb(191,219,254)" }}>
              {/* Large quote mark */}
              <div className="absolute -top-4 -left-2 text-9xl font-serif leading-none select-none pointer-events-none"
                style={{ color: "rgb(191,219,254)" }}>&ldquo;</div>

              <blockquote className="relative z-10">
                <p className="text-lg sm:text-xl text-slate-700 leading-relaxed italic mb-6 max-w-3xl">
                  {t.quoteText}
                </p>
                <div className="flex items-center gap-4">
                  {/* Avatar placeholder */}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: "rgb(5,22,80)" }}>
                    SL
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{t.quoteAuthor}</div>
                    <div className="text-sm text-slate-500">{t.quoteRole}</div>
                  </div>
                </div>
              </blockquote>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════ */}
        <section className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 transform transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-12 sm:p-16 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase border border-blue-200 mb-8"
              style={{ color: "rgb(5,22,80)" }}>
              <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: "rgb(5,22,80)" }} />
              {t.finalEyebrow}
            </div>

            <h3 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-4">
              {t.finalTitle}{" "}
              <span className="font-medium" style={{ color: "rgb(156,177,202)" }}>{t.finalTitleAccent}</span>
            </h3>

            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">{t.finalDesc}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.location.href = "/companies/book-demo"}
                className="group relative overflow-hidden px-10 sm:px-14 py-4 rounded-full text-white text-lg font-medium hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: "rgb(5,22,80)" }}
              >
                <div className="absolute inset-0 -translate-x-full animate-shimmer-custom bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative z-10 flex items-center">
                  {t.bookDemo}
                  <svg className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 backdrop-blur-sm bg-white/60 border-t border-blue-200/30 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <nav className="flex flex-wrap justify-center md:justify-start gap-4 sm:space-x-6 text-sm text-center">
              {["contact", "about", "terms", "privacy", "accessibility"].map((link) => (
                <Link
                  key={link}
                  href={`/${link}`}
                  className="text-slate-600 transition-colors duration-300 relative group"
                  onMouseEnter={e => e.currentTarget.style.color = "rgb(176,196,222)"}
                  onMouseLeave={e => e.currentTarget.style.color = ""}
                >
                  {t[link as keyof T] ?? link}
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

export default CompaniesPage
