"use client"
import { useSession } from "next-auth/react"
import type React from "react"
import { useState, useEffect } from "react"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import Link from "next/link"

type Language = "en" | "sv"

interface Translations {
  en: {
    signIn: string
    heroTitle: string
    heroSubtitle: string
    heroDescription1: string
    heroDescription2: string
    heroDescription3: string
    getStartedFree: string
    getStarted: string
    learnMore: string
    provenResults: string
    morelikely: string
    hiringDescription: string
    hours: string
    fewClicks: string
    avgTime: string
    avgTimeDesc: string
    faster: string
    fasterDesc: string
    higherRate: string
    higherRateDesc: string
    getHiredBy: string
    finalTitle: string
    finalSubtitle: string
    finalDescription: string
    startSuccess: string
    contact: string
    about: string
    terms: string
    copyright: string
    allRights: string
    forJobSeekers: string
    forCompanies: string
  }
  sv: {
    signIn: string
    heroTitle: string
    heroSubtitle: string
    heroDescription1: string
    heroDescription2: string
    heroDescription3: string
    getStartedFree: string
    getStarted: string
    learnMore: string
    provenResults: string
    morelikely: string
    hiringDescription: string
    hours: string
    fewClicks: string
    avgTime: string
    avgTimeDesc: string
    faster: string
    fasterDesc: string
    higherRate: string
    higherRateDesc: string
    getHiredBy: string
    finalTitle: string
    finalSubtitle: string
    finalDescription: string
    startSuccess: string
    contact: string
    about: string
    terms: string
    copyright: string
    allRights: string
    forJobSeekers: string
    forCompanies: string
  }
}

const translations: Translations = {
  sv: {
    signIn: "Logga In",
    heroTitle: "Skapa ditt CV",
    heroSubtitle: "Snabbt och enkelt",
    heroDescription1: "Att skapa ett säljande och jobbspecifikt CV ska vara ",
    heroDescription2: "Personliga brev ska vara enkla att skapa och anpassa till jobbannonsen",
    heroDescription3: "Din jobbansökningsprocess ska vara snabb och smidig",
    getStartedFree: "Kom igång gratis",
    getStarted: "Kom igång",
    learnMore: "Lär dig mer om vårt tillvägagångssätt",
    provenResults: "Bevisade resultat",
    morelikely: "80% större chans ",
    hiringDescription:
      "om du anpassar ditt CV och personligt brev till jobbannonsen. Denna process kan i vanliga fall ta timmar; vi hjälper dig att få det gjort med bara några klick",
    hours: "timmar",
    fewClicks: "bara några klick",
    avgTime: "2 min",
    avgTimeDesc: "Genomsnittlig tid att skapa CV",
    faster: "100x",
    fasterDesc: "Snabbare än manuell skrivning",
    higherRate: "80%",
    higherRateDesc: "Högre intervjufrekvens",
    getHiredBy: "BLI ANSTÄLLD AV TOPPFÖRETAG VÄRLDEN ÖVER",
    finalTitle: "Din karriär ",
    finalSubtitle: "",
    finalDescription:
      "Gå med tusentals yrkesverksamma som har förvandlat sin jobbsökning med vår intelligenta CV-plattform",
    startSuccess: "Starta din framgångssaga",
    contact: "Kontakt",
    about: "Om Oss",
    terms: "Villkor & Integritet",
    copyright: "VeroCV.",
    allRights: "Alla rättigheter förbehållna.",
    forJobSeekers: "FÖR CV-SKAPARE",
    forCompanies: "FÖR FÖRETAG",
  },
  en: {
    signIn: "Sign In",
    heroTitle: "Professional CVs",
    heroSubtitle: "Made simple",
    heroDescription1: "Creating a compelling, job-specific CV should be effortless",
    heroDescription2: "Cover letters should be written with precision and speed",
    heroDescription3: "Your job application process should be seamless",
    getStartedFree: "Get started free",
    getStarted: "Get started",
    learnMore: "Learn more about our approach",
    provenResults: "Proven results",
    morelikely: "80% more likely",
    hiringDescription:
      "if you tailor your CV and cover letter to the job. This process manually can take hours; we help you do this in just a few clicks",
    hours: "hours",
    fewClicks: "just a few clicks",
    avgTime: "2 min",
    avgTimeDesc: "Average time to create CV",
    faster: "100x",
    fasterDesc: "Faster than manual writing",
    higherRate: "80%",
    higherRateDesc: "Higher interview rate",
    getHiredBy: "GET HIRED BY TOP COMPANIES WORLDWIDE",
    finalTitle: "Your career ",
    finalSubtitle: "",
    finalDescription:
      "Join thousands of professionals who've transformed their job search with our intelligent CV platform",
    startSuccess: "Start your success story",
    contact: "Contact",
    about: "About",
    terms: "Terms & Privacy",
    copyright: "VeroCV.",
    allRights: "All rights reserved.",
    forJobSeekers: "FOR CV-MAKERS",
    forCompanies: "FOR COMPANIES",
  },
}

const CVListModern: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { data: session, status } = useSession()

  const { language, setLanguage } = useAuthTranslation('sv')

  const t = translations[language]

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem('dashboardLanguage', newLanguage)
  }

  const scrollToFinalSection = () => {
    const finalSection = document.getElementById('final-cta-section')
    if (finalSection) {
      finalSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 relative overflow-hidden">

      {/* ── TOP AUDIENCE NAV BAR (Adecco-style) ── */}
      <div className="relative z-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-10">
            {/* Job Seekers tab — active on this page */}
            <Link
              href="/"
              className="relative flex items-center h-full px-4 sm:px-6 text-xs sm:text-sm font-semibold tracking-widest uppercase transition-colors duration-200"
              style={{ color: 'rgb(5, 22, 80)' }}
            >
              {t.forJobSeekers}
              {/* Active underline */}
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              />
            </Link>

            {/* Divider */}
            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Companies tab — links to konsult/company landing page */}
            <Link
              href="/companies"
              className="relative flex items-center h-full px-4 sm:px-6 text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-400 hover:text-slate-700 transition-colors duration-200 group"
            >
              {t.forCompanies}
              {/* Hover underline */}
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"
                style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              />
            </Link>
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER ── */}
      <header className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-blue-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 sm:py-8">
            {/* Logo */}
            <div className="group cursor-pointer">
              <div className="relative px-2 sm:px-6 py-2">
                <img
                  src="/logo/logovero.svg"
                  className="h-10 sm:h-16 w-auto mr-3 object-contain relative z-10"
                  alt="Logo"
                />
              </div>
            </div>

            {/* Language + Auth */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              {/* Language Selector */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* English */}
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`px-1 py-1 sm:px-2 sm:py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${language === "en"
                    ? "border-[rgb(5,22,80)] bg-blue-50"
                    : "border-gray-200 bg-white hover:border-[rgb(176,197,222)]"
                    }`}
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

                {/* Swedish */}
                <button
                  onClick={() => handleLanguageChange("sv")}
                  className={`px-1 py-1 sm:px-2 sm:py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${language === "sv"
                    ? "border-[rgb(5,22,80)] bg-blue-50"
                    : "border-gray-200 bg-white hover:border-[rgb(176,197,222)]"
                    }`}
                  title="Switch to Swedish"
                >
                  <svg className="w-4 h-3 sm:w-6 sm:h-4" viewBox="0 0 16 10" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="10" fill="#006AA7" />
                    <rect x="0" y="4" width="16" height="2" fill="#FECC00" />
                    <rect x="5" y="0" width="2" height="10" fill="#FECC00" />
                  </svg>
                </button>
              </div>

              {/* Get Started Button */}
              {!session && status !== "loading" && (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center whitespace-nowrap px-2 py-1.5 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2.5 rounded-full border-2 font-medium text-[10px] xs:text-xs sm:text-sm md:text-base transition-all duration-300 hover:shadow-md"
                  style={{ borderColor: 'rgb(5, 22, 80)', color: 'rgb(5, 22, 80)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'rgb(5, 22, 80)'
                  }}
                >
                  {t.getStarted}
                </Link>
              )}

              {/* Auth Button */}
              {status === "loading" ? (
                <button
                  disabled
                  className="whitespace-nowrap px-2 py-1.5 xs:px-3 xs:py-1.5 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-full bg-gray-400 text-white font-medium text-[10px] xs:text-xs sm:text-sm md:text-base transition-all duration-300"
                >
                  Loading...
                </button>
              ) : session ? (
                <Link
                  href="/dashboard"
                  className="whitespace-nowrap px-2 py-1.5 xs:px-3 xs:py-1.5 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-full text-white font-medium text-[10px] xs:text-xs sm:text-sm md:text-base transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="whitespace-nowrap px-2 py-1.5 xs:px-3 xs:py-1.5 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-full text-white font-medium text-[10px] xs:text-xs sm:text-sm md:text-base transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                >
                  {t.signIn}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Hero Section */}
        <div
          className={`text-center mb-12 sm:mb-16 transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-light text-slate-900 mb-4 leading-tight tracking-tight">
              {t.heroTitle}
              <br />
              <Link
                href="/register"
                className="font-normal transition-colors duration-300 cursor-pointer inline-block hover:scale-105 transform"
                style={{ color: 'rgb(156, 177, 202)' }}
              >
                {t.heroSubtitle}
              </Link>
            </h1>
            <div className="w-16 sm:w-24 h-0.5 mx-auto mt-4 sm:mt-6"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}></div>
          </div>

          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-4 xs:p-6 sm:p-10 md:p-16 border border-blue-200/40 shadow-sm mb-6 xs:mb-8 sm:mb-10 hover:shadow-md transition-all duration-500">
            <div className="space-y-3 xs:space-y-4 sm:space-y-5 mb-6 xs:mb-8 sm:mb-10">
              <p className="text-sm xs:text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed max-w-xs xs:max-w-sm sm:max-w-3xl mx-auto">
                {t.heroDescription1.split(language === "en" ? "effortless" : "komplicerat")[0]}
                <span className="font-bold" style={{ color: 'rgb(5, 22, 80)' }}>{language === "en" ? "effortless" : "lätt"}</span>
                {language === "en" ? "" : t.heroDescription1.split("komplicerat")[1] || ""}
              </p>
              <p className="text-sm xs:text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed max-w-xs xs:max-w-sm sm:max-w-3xl mx-auto">
                {t.heroDescription2.split(language === "en" ? "precision and speed" : "enkla att skapa")[0]}
                <span className="font-bold" style={{ color: 'rgb(5, 22, 80)' }}>
                  {language === "en" ? "precision and speed" : "enkla att skapa"}
                </span>
                {language === "en" ? "" : t.heroDescription2.split("enkla att skapa")[1] || ""}
              </p>
              <p className="text-sm xs:text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed max-w-xs xs:max-w-sm sm:max-w-3xl mx-auto">
                {t.heroDescription3.split(language === "en" ? "seamless" : "snabb och smidig")[0]}
                <span className="font-bold" style={{ color: 'rgb(5, 22, 80)' }}>
                  {language === "en" ? "seamless" : "snabb och smidig"}
                </span>
                {language === "en" ? "" : t.heroDescription3.split("snabb och smidig")[1] || ""}
              </p>
            </div>

            <button
              onClick={() => (window.location.href = "/register")}
              className="group px-6 xs:px-8 sm:px-10 md:px-12 py-2 xs:py-2.5 sm:py-3 rounded-full text-white text-sm xs:text-base sm:text-lg font-medium
  relative overflow-hidden
  hover:shadow-xl transition-all duration-300"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
            >
              <div className="absolute inset-0 -translate-x-full animate-shimmer-custom bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <span className="flex items-center justify-center relative z-10">
                {t.getStartedFree}
                <svg
                  className="w-4 xs:w-5 h-4 xs:h-5 ml-1 xs:ml-2 sm:ml-3
      animate-arrow-float animate-infinite animate-duration-1500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
          </div>

          {/* Scroll Indicator */}
          <div
            className="flex flex-col items-center mb-10 sm:mb-12 cursor-pointer"
            onClick={scrollToFinalSection}
          >
            <div style={{ color: 'rgb(176, 196, 222)', fontSize: '1.875rem' }}>↓</div>
            <div className="bg-white/70 border border-blue-200/60 rounded-full px-4 sm:px-6 py-2 sm:py-3 hover:bg-white/90 transition-all duration-300">
              <span className="text-slate-600 text-xs sm:text-sm">{t.learnMore}</span>
            </div>
          </div>
        </div>

        {/* Proven Results Section */}
        <div
          className={`mb-16 sm:mb-20 transform transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-8 sm:p-16 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-sm font-medium mb-6 border border-blue-200" style={{ color: 'rgb(5, 22, 80)' }}>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'rgb(5, 22, 80)' }}></div>
                {t.provenResults}
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-6">
                {language === "en" ? "You are " : "Du har "}
                <span className="font-medium" style={{ color: 'rgb(5, 22, 80)' }}>{t.morelikely}</span>
                {language === "en" ? " to get hired" : " att bli anställd"}
              </h2>
              <p className="text-lg sm:text-xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
                {t.hiringDescription.split(t.hours)[0]}
                <span className="font-semibold text-red-500">{t.hours}</span>
                {t.hiringDescription.split(t.hours)[1]?.split(t.fewClicks)[0]}
                <span className="font-semibold" style={{ color: 'rgb(5, 22, 80)' }}>{t.fewClicks}</span>
                {t.hiringDescription.split(t.fewClicks)[1] || ""}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-blue-50/80 rounded-2xl border border-blue-200/30">
                <div className="text-3xl font-bold mb-2" style={{ color: 'rgb(176, 196, 222)' }}>{t.avgTime}</div>
                <div className="text-slate-600">{t.avgTimeDesc}</div>
              </div>
              <div className="text-center p-6 bg-purple-50/80 rounded-2xl border border-purple-200/30">
                <div className="text-3xl font-bold text-purple-600 mb-2">{t.faster}</div>
                <div className="text-slate-600">{t.fasterDesc}</div>
              </div>
              <div className="text-center p-6 bg-blue-50/80 rounded-2xl border border-blue-200/30">
                <div className="text-3xl font-bold mb-2" style={{ color: 'rgb(5, 22, 80)' }}>{t.higherRate}</div>
                <div className="text-slate-600">{t.higherRateDesc}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div
          className={`text-center mb-16 sm:mb-20 transform transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <div className="inline-flex items-center px-4 py-2 bg-slate-100/70 text-slate-700 rounded-full text-sm font-medium mb-12 border border-slate-200/60">
            <div className="w-2 h-2 bg-slate-500 rounded-full mr-2"></div>
            {t.getHiredBy}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
            {/* Coinbase */}
            <div className="group flex flex-col items-center bg-white/80 rounded-xl p-8 border border-blue-200/40 hover:bg-white/95 transition-all duration-300 hover:shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8" fill="#0052FF" />
                  <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" fill="white" />
                </svg>
              </div>
              <span className="text-slate-700 font-medium text-sm"
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                Coinbase
              </span>
            </div>

            {/* Spotify */}
            <div className="group flex flex-col items-center bg-white/80 rounded-xl p-8 border border-blue-200/40 hover:bg-white/95 transition-all duration-300 hover:shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1DB954">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2z" />
                </svg>
              </div>
              <span className="text-slate-700 font-medium text-sm"
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                Spotify
              </span>
            </div>

            {/* Microsoft */}
            <div className="group flex flex-col items-center bg-white/80 rounded-xl p-8 border border-blue-200/40 hover:bg-white/95 transition-all duration-300 hover:shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="8" height="8" fill="#F25022" />
                  <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
                  <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
                  <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
                </svg>
              </div>
              <span className="text-slate-700 font-medium text-sm"
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                Microsoft
              </span>
            </div>

            {/* Meta */}
            <div className="group flex flex-col items-center bg-white/80 rounded-xl p-8 border border-blue-200/40 hover:bg-white/95 transition-all duration-300 hover:shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12C24 5.373 18.627 0 12 0S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
                </svg>
              </div>
              <span className="text-slate-700 font-medium text-sm"
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                Meta
              </span>
            </div>

            {/* SpaceX */}
            <div className="group flex flex-col items-center bg-white/80 rounded-xl p-8 border border-blue-200/40 hover:bg-white/95 transition-all duration-300 hover:shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#005288">
                  <path d="M2 12h4l3-3v6l-3-3H2zm6 0h4l3-3v6l-3-3H8zm6 0h4l3-3v6l-3-3h-4z" />
                </svg>
              </div>
              <span className="text-slate-700 font-medium text-sm group-hover:text-slate-900 transition-colors duration-300 tracking-wider">
                SPACEX
              </span>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div
          id="final-cta-section"
          className={`text-center transform transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-12 sm:p-16 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h3 className="text-3xl sm:text-4xl font-light text-slate-900 mb-4">
              {t.finalTitle.split(language === "en" ? "deserves better" : "förtjänar bättre")[0]}
              <span className="font-medium" style={{ color: 'rgb(156, 177, 202)' }}>
                {language === "en" ? "deserves better" : "förtjänar bättre"}
              </span>
            </h3>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">{t.finalDescription}</p>
            <button
              onClick={() => (window.location.href = "/register")}
              className="group px-12 py-4 rounded-full text-white text-lg font-medium hover:bg-blue-700 transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
            >
              <span className="flex items-center">
                {t.startSuccess}
                <svg
                  className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 backdrop-blur-sm bg-white/60 border-t border-blue-200/30 py-8 sm:py-12 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <nav className="flex flex-wrap justify-center md:justify-start gap-4 sm:space-x-6 text-sm text-center">
              {["contact", "about", "terms", "privacy", "accessibility"].map((link) => (
                <Link
                  key={link}
                  href={`/${link}`}
                  className="text-slate-600 transition-colors duration-300 relative group"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = ''}
                >
                  {t[link as keyof typeof t]}
                  <span className="absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}></span>
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

export default CVListModern
