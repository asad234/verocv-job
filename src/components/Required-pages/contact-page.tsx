"use client"
import { useState } from "react"
import { Mail, MapPin, Clock, CheckCircle, AlertTriangle, Send } from "lucide-react"
import Link from "next/link"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import { useSession } from "next-auth/react"

type Language = "en" | "sv"

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

const ContactPage = () => {
  const { language, setLanguage } = useAuthTranslation('sv')
  const { data: session, status } = useSession()
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const translations = {
    sv: {
      getStarted: "Kom igång",
      signIn: "Logga In",
      dashboard: "Dashboard",
      pageTitle: "Kontakta Oss",
      pageSubtitle: "Vi är här för att hjälpa dig",
      pageDescription: "Har du frågor eller behöver support? Skicka oss ett meddelande så återkommer vi så snart som möjligt.",
      formTitle: "Skicka oss ett meddelande",
      name: "Ditt Namn",
      email: "E-postadress",
      subject: "Ämne",
      message: "Meddelande",
      namePlaceholder: "Anna Andersson",
      emailPlaceholder: "anna@exempel.se",
      subjectPlaceholder: "Hur kan vi hjälpa dig?",
      messagePlaceholder: "Beskriv ditt ärende i detalj...",
      sendButton: "Skicka Meddelande",
      sending: "Skickar...",
      contactInfo: "Kontaktinformation",
      emailLabel: "E-post",
      emailValue: "info@verocv.se",
      locationLabel: "Plats",
      locationValue: "Stockholm, Sverige",
      responseTime: "Svarstid",
      responseTimeValue: "Vi svarar vanligtvis inom 24 timmar",
      successMessage: "Ditt meddelande har skickats framgångsrikt! Vi återkommer inom 24 timmar.",
      errorMessage: "Misslyckades att skicka meddelande. Försök igen.",
      required: "*",
      backToHome: "Tillbaka till Startsidan",
      contact: "Kontakt",
      about: "Om Oss",
      terms: "Villkor & Integritet",
      copyright: "© 2025 VeroCV.",
      allRights: "Alla rättigheter förbehållna.",
    },
    en: {
      getStarted: "Get Started",
      signIn: "Sign In",
      dashboard: "Dashboard",
      pageTitle: "Contact Us",
      pageSubtitle: "We're here to help",
      pageDescription: "Have questions or need support? Send us a message and we'll get back to you as soon as possible.",
      formTitle: "Send us a message",
      name: "Your Name",
      email: "Email Address",
      subject: "Subject",
      message: "Message",
      namePlaceholder: "John Doe",
      emailPlaceholder: "johndoe@example.com",
      subjectPlaceholder: "How can we help you?",
      messagePlaceholder: "Describe your inquiry in detail...",
      sendButton: "Send Message",
      sending: "Sending...",
      contactInfo: "Contact Information",
      emailLabel: "Email",
      emailValue: "info@verocv.se",
      locationLabel: "Location",
      locationValue: "Stockholm, Sweden",
      responseTime: "Response Time",
      responseTimeValue: "We typically respond within 24 hours",
      successMessage: "Your message has been sent successfully! We'll get back to you within 24 hours.",
      errorMessage: "Failed to send message. Please try again.",
      required: "*",
      backToHome: "Back to Home",
      contact: "Contact",
      about: "About",
      terms: "Terms & Privacy",
      copyright: "© 2025 VeroCV.",
      allRights: "All rights reserved.",
    },
  }

  const t = translations[language]

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem('dashboardLanguage', newLanguage)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmissionStatus({ type: null, message: "" })

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactForm),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmissionStatus({
          type: "success",
          message: t.successMessage,
        })
        setContactForm({
          name: "",
          email: "",
          subject: "",
          message: "",
        })
      } else {
        setSubmissionStatus({
          type: "error",
          message: result.error || t.errorMessage,
        })
      }
    } catch (error) {
      setSubmissionStatus({
        type: "error",
        message: t.errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      <header className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-blue-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 sm:py-8">
            <Link href="/" className="group cursor-pointer">
              <div className="relative px-2 sm:px-6 py-2">
                <img
                  src="/logo/logovero.svg"
                  className="h-10 sm:h-16 w-auto mr-3 object-contain relative z-10"
                  alt="VeroCV Logo"
                />
              </div>
            </Link>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
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

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light text-slate-900 mb-4">
            {t.pageTitle}
          </h1>
          <p className="text-xl text-slate-600 mb-2">{t.pageSubtitle}</p>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">{t.pageDescription}</p>
          <div className="w-24 h-0.5 mx-auto mt-6" style={{ backgroundColor: 'rgb(5, 22, 80)' }}></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-8 border border-blue-200/40 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">{t.formTitle}</h2>

              {submissionStatus.type && (
                <div
                  className={`mb-6 p-4 rounded-md border ${submissionStatus.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                    }`}
                >
                  <div className="flex items-center">
                    {submissionStatus.type === "success" && <CheckCircle className="h-5 w-5 mr-2" />}
                    {submissionStatus.type === "error" && <AlertTriangle className="h-5 w-5 mr-2" />}
                    <span>{submissionStatus.message}</span>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.name} <span className="text-red-500">{t.required}</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{
                      '--focus-ring-color': 'rgb(5, 22, 80)',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgb(5, 22, 80, 0.2)';
                      e.currentTarget.style.borderColor = 'rgb(5, 22, 80)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.borderColor = '';
                    }}
                    placeholder={t.namePlaceholder}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.email} <span className="text-red-500">{t.required}</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgb(5, 22, 80, 0.2)';
                      e.currentTarget.style.borderColor = 'rgb(5, 22, 80)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.borderColor = '';
                    }}
                    placeholder={t.emailPlaceholder}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.subject} <span className="text-red-500">{t.required}</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgb(5, 22, 80, 0.2)';
                      e.currentTarget.style.borderColor = 'rgb(5, 22, 80)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.borderColor = '';
                    }}
                    placeholder={t.subjectPlaceholder}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.message} <span className="text-red-500">{t.required}</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={contactForm.message}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgb(5, 22, 80, 0.2)';
                      e.currentTarget.style.borderColor = 'rgb(5, 22, 80)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.borderColor = '';
                    }}
                    placeholder={t.messagePlaceholder}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  className="group w-full text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  style={{ backgroundColor: isSubmitting ? 'rgb(5, 22, 80, 0.5)' : 'rgb(5, 22, 80)' }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)')}
                  onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    t.sending
                  ) : (
                    <>
                      <span>{t.sendButton}</span>
                      <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl p-6 border border-blue-200/40 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{t.contactInfo}</h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: 'rgb(176, 196, 222, 0.3)' }}>
                    <Mail className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{t.emailLabel}</h4>
                    <a
                      href="mailto:info@verocv.se"
                      className="transition-colors"
                      style={{ color: 'rgb(5, 22, 80)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                    >
                      {t.emailValue}
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: 'rgb(156, 177, 202, 0.3)' }}>
                    <MapPin className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{t.locationLabel}</h4>
                    <p className="text-gray-600">{t.locationValue}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="backdrop-blur-sm rounded-2xl p-6 border border-blue-200/40" style={{ backgroundColor: 'rgb(176, 196, 222, 0.2)' }}>
              <h4 className="font-semibold mb-2" style={{ color: 'rgb(5, 22, 80)' }}>{t.responseTime}</h4>
              <p className="text-slate-700">{t.responseTimeValue}</p>
            </div>
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

export default ContactPage
