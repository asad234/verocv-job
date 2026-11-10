"use client"
import { useSession } from "next-auth/react"
import type React from "react"
import { useState, useEffect } from "react"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import Link from "next/link"

type Language = "en" | "sv"

interface AboutTranslations {
  en: {
    signIn: string
    dashboard: string
    getStarted: string
    aboutTitle: string
    aboutSubtitle: string
    purposeTitle: string
    purposeText: string
    missionTitle: string
    missionText: string
    storyTitle: string
    storyText: string
    valuesTitle: string
    value1Title: string
    value1Text: string
    value2Title: string
    value2Text: string
    value3Title: string
    value3Text: string
    teamTitle: string
    teamText: string
    futureTitle: string
    futureText: string
    joinTitle: string
    joinText: string
    getStartedToday: string
    contact: string
    about: string
    terms: string
    copyright: string
    allRights: string
  }
  sv: {
    signIn: string
    dashboard: string
    getStarted: string
    aboutTitle: string
    aboutSubtitle: string
    purposeTitle: string
    purposeText: string
    missionTitle: string
    missionText: string
    storyTitle: string
    storyText: string
    valuesTitle: string
    value1Title: string
    value1Text: string
    value2Title: string
    value2Text: string
    value3Title: string
    value3Text: string
    teamTitle: string
    teamText: string
    futureTitle: string
    futureText: string
    joinTitle: string
    joinText: string
    getStartedToday: string
    contact: string
    about: string
    terms: string
    copyright: string
    allRights: string
  }
}

const translations: AboutTranslations = {
  en: {
    signIn: "Sign In",
    dashboard: "Dashboard",
    getStarted: "Get Started",
    aboutTitle: "About VeroCV",
    aboutSubtitle: "Transforming the way professionals create CVs",
    purposeTitle: "Purpose",
    purposeText: "We believe everyone deserves a job they enjoy—regardless of their background, age, gender, technical experience, or life situation. Our purpose is to make career development simple, accessible, and meaningful. In short, more democratic.By offering smart, easy to use modern tools that help people quickly create professional resumes, discover the right opportunities, and feel confident in their application process, we aim to simplify the path to employment and create greater value for the society as a whole: more people at work, more people  doing right work.",
    storyTitle: "Vision",
    storyText: "A world where everyone can find work they love; where job seeking becomes an inspiring journey toward personal growth and professional fulfillment.",
    missionTitle: "Mission",
    missionText: "We support both beginners and seasoned professionals—from the first application to long-term career development. With VeroCV, it's not just easy to apply for jobs. It's easy to find the right ones and grow from there. By continuously evolving our platform with AI, intuitive design, and user-centered features, we strive to give every user a rewarding career journey.",
    valuesTitle: "Our Values",
    value1Title: "Simplicity",
    value1Text: "We believe powerful tools should be easy to use. Every feature is designed with user experience at its core.",
    value2Title: "Quality",
    value2Text: "Your CV represents you. We're committed to helping you create documents that truly showcase your professional excellence.",
    value3Title: "Innovation",
    value3Text: "We continuously evolve our platform, incorporating the latest technology to give you a competitive edge in your job search.",
    teamTitle: "Our Team",
    teamText: "VeroCV is built by a passionate team of developers, designers, and career experts who understand the challenges of modern job hunting. We're committed to creating tools that make a real difference in people's professional lives.",
    futureTitle: "Looking Forward",
    futureText: "We're constantly working to expand VeroCV's capabilities, adding new features and integrations that help you succeed. ",
    joinTitle: "Join Thousands of Professionals",
    joinText: "Be part of a community that's transforming the job application process. Start creating professional CVs that get results.",
    getStartedToday: "Get Started Today",
    contact: "Contact",
    about: "About",
    terms: "Terms & Privacy",
    copyright: "© 2025 VeroCV.",
    allRights: "All rights reserved."
  },
  sv: {
    signIn: "Logga In",
    dashboard: "Dashboard",
    getStarted: "Kom igång",
    aboutTitle: "Om VeroCV",
    aboutSubtitle: "Vi förändrar hur yrkesverksamma skapar CV",
    purposeTitle: "Uppdrag",
    purposeText: "Vi tror att varje individ förtjänar ett jobb de trivs med—oavsett bakgrund, ålder, kön, teknisk erfarenhet och livssituation. Vårt uppdrag är att göra karriärutveckling enkelt, tillgängligt och meningsfullt. Rent av mer demokratiskt.Genom att erbjuda smarta verktyg som hjälper människor att snabbt skapa professionella CV:n, hitta rätt möjligheter och känna sig trygga i sin ansökningsprocess, vill vi förenkla vägen till ett nytt jobb och skapa samhällsnytta: fler i arbete, fler i rätt arbete.",
    storyTitle: "Vision",
    storyText: "Vi ser en värld där alla kan hitta arbete de älskar. En värld där jobbsökande är en inspirerande resa mot personlig utveckling och yrkesmässig uppfyllelse.",
    missionTitle: "Mission",
    missionText: "Vi stöttar både nybörjare och erfarna yrkesverksamma—från första ansökan till långsiktig karriärutveckling. Med VeroCV är det inte bara lätt att söka jobb. Det är lätt att hitta rätt och utvecklas vidare. Genom att kontinuerligt utveckla vår plattform med AI, intuitiv design och användarcentrerade funktioner, strävar vi efter att ge varje användare en givande karriärresa.",
    valuesTitle: "Våra Värderingar",
    value1Title: "Enkelhet",
    value1Text: "Vi tror att kraftfulla verktyg ska vara lätta att använda. Varje funktion är designad med användarupplevelsen i fokus.",
    value2Title: "Kvalitet",
    value2Text: "Ditt CV representerar dig. Vi är engagerade i att hjälpa dig skapa dokument som verkligen visar din professionella excellens.",
    value3Title: "Innovation",
    value3Text: "Vi utvecklar kontinuerligt vår plattform och införlivar den senaste teknologin för att ge dig en konkurrensfördel i din jobbsökning.",
    teamTitle: "Vårt Team",
    teamText: "VeroCV byggs av ett passionerat team av utvecklare, designers och karriärexperter som förstår utmaningarna med modern jobbsökning. Vi är engagerade i att skapa verktyg som gör en verklig skillnad i människors yrkesliv.",
    futureTitle: "Framåtblick",
    futureText: "Vi arbetar ständigt med att utöka VeroCVs kapacitet och lägger till nya funktioner och integrationer som hjälper dig att lyckas. ",
    joinTitle: "Gå Med Tusentals Yrkesverksamma",
    joinText: "Var en del av en community som förändrar ansökningsprocessen. Börja skapa professionella CV som ger resultat.",
    getStartedToday: "Kom Igång Idag",
    contact: "Kontakt",
    about: "Om Oss",
    terms: "Villkor & Integritet",
    copyright: "© 2025 VeroCV.",
    allRights: "Alla rättigheter förbehållna."
  }
}

const AboutPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { language, setLanguage } = useAuthTranslation('sv')
  const { data: session, status } = useSession()

  const t = translations[language]

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem('dashboardLanguage', newLanguage)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-blue-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 sm:py-8">
            {/* Logo */}
            <Link href="/" className="group cursor-pointer">
              <div className="relative px-2 sm:px-6 py-2">
                <img
                  src="/logo/logovero.svg"
                  className="h-10 sm:h-16 w-auto mr-3 object-contain relative z-10"
                  alt="VeroCV Logo"
                />
              </div>
            </Link>

            {/* Language + Auth */}
            <div className="flex items-center space-x-3 sm:space-x-4">
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

              {/* Get Started Button - Always visible when not logged in */}
              {!session && status !== "loading" && (
                <Link
                  href="/register"
                  className="inline-flex px-3 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-2.5 rounded-full border-2 font-medium text-xs sm:text-sm md:text-base transition-all duration-300 hover:shadow-md"
                  style={{
                    borderColor: 'rgb(5, 22, 80)',
                    color: 'rgb(5, 22, 80)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgb(5, 22, 80)';
                  }}
                >
                  {t.getStarted}
                </Link>
              )}

              {/* Auth Button */}
              {status === "loading" ? (
                <button
                  disabled
                  className="px-3 py-1 sm:px-8 sm:py-3 rounded-full bg-gray-400 text-white font-medium text-sm sm:text-base transition-all duration-300"
                >
                  Loading...
                </button>
              ) : session ? (
                <Link
                  href="/dashboard"
                  className="px-3 py-1 sm:px-8 sm:py-3 rounded-full text-white font-medium text-sm sm:text-base transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                >
                  {t.dashboard}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1 sm:px-8 sm:py-3 rounded-full text-white font-medium text-sm sm:text-base transition-all duration-300 hover:shadow-lg"
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
      <main className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 py-24">
        {/* Hero Section */}
        <div
          className={`text-center mb-20 transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <h1 className="text-5xl md:text-6xl font-light text-slate-900 mb-4 leading-tight tracking-tight">
            {t.aboutTitle}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">{t.aboutSubtitle}</p>
          <div className="w-24 h-0.5 mx-auto mt-8" style={{ backgroundColor: 'rgb(5, 22, 80)' }}></div>
        </div>

        {/* Purpose Section */}
        <div
          className={`mb-16 transform transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-12 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: 'rgb(176, 196, 222, 0.3)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(5, 22, 80)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-light text-slate-900">{t.purposeTitle}</h2>
            </div>
            <p className="text-lg text-slate-700 leading-relaxed">{t.purposeText}</p>
          </div>
        </div>

        {/* Story Section */}
        <div
          className={`mb-16 transform transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-12 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: 'rgb(156, 177, 202, 0.3)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(5, 22, 80)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-3xl font-light text-slate-900">{t.storyTitle}</h2>
            </div>
            <p className="text-lg text-slate-700 leading-relaxed">{t.storyText}</p>
          </div>
        </div>

        {/* Mission Section */}
        <div
          className={`mb-16 transform transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-12 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: 'rgb(176, 196, 222, 0.3)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(5, 22, 80)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-light text-slate-900">{t.missionTitle}</h2>
            </div>
            <p className="text-lg text-slate-700 leading-relaxed">{t.missionText}</p>
          </div>
        </div>

        {/* Values Section */}
        <div
          className={`mb-16 transform transition-all duration-1000 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <h2 className="text-3xl font-light text-slate-900 text-center mb-12">{t.valuesTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-8 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgb(176, 196, 222, 0.3)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(5, 22, 80)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">{t.value1Title}</h3>
              <p className="text-slate-700 leading-relaxed">{t.value1Text}</p>
            </div>

            <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-8 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgb(156, 177, 202, 0.3)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(5, 22, 80)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">{t.value2Title}</h3>
              <p className="text-slate-700 leading-relaxed">{t.value2Text}</p>
            </div>

            <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-8 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgb(176, 196, 222, 0.3)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(5, 22, 80)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">{t.value3Title}</h3>
              <p className="text-slate-700 leading-relaxed">{t.value3Text}</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div
          className={`mb-16 transform transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-12 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: 'rgb(156, 177, 202, 0.3)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(5, 22, 80)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-light text-slate-900">{t.teamTitle}</h2>
            </div>
            <p className="text-lg text-slate-700 leading-relaxed">{t.teamText}</p>
          </div>
        </div>

        {/* Future Section */}
        <div
          className={`mb-16 transform transition-all duration-1000 delay-600 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-12 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: 'rgb(176, 196, 222, 0.3)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(5, 22, 80)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-3xl font-light text-slate-900">{t.futureTitle}</h2>
            </div>
            <p className="text-lg text-slate-700 leading-relaxed">{t.futureText}</p>
          </div>
        </div>

        {/* CTA Section */}
        <div
          className={`text-center transform transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <div className="backdrop-blur-sm bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-16 border border-blue-200/40 shadow-sm hover:shadow-md transition-all duration-500">
            <h3 className="text-3xl font-light text-slate-900 mb-4">{t.joinTitle}</h3>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">{t.joinText}</p>
            <button
              onClick={() => (window.location.href = "/register")}
              className="group px-12 py-4 rounded-full text-white text-lg font-medium transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
            >
              <span className="flex items-center">
                {t.getStartedToday}
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
              {["contact", "about", "terms"].map((link) => (
                <Link
                  key={link}
                  href={`/${link}`}
                  className="text-slate-600 transition-colors duration-300 relative group"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = ''}
                >
                  {t[link as keyof typeof t]}
                  <span
                    className="absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                  ></span>
                </Link>
              ))}
            </nav>

            <div className="text-xs sm:text-sm text-slate-500 text-center md:text-left">
              <span>{t.copyright}</span>
              <span className="block sm:inline sm:ml-4">{t.allRights}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AboutPage
