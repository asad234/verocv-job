"use client"

import { AlertTriangle, X, Building2, Calendar, User } from "lucide-react"

type AccessLevel = "full" | "cv_only" | "portfolio_only"

export interface RevokedInvitation {
  id: string
  bossName: string
  companyName?: string
  respondedAt?: string
  accessLevel?: AccessLevel
}

interface AccessRevokedDialogProps {
  invitation: RevokedInvitation
  language: "en" | "sv"
  onClose: () => void
}

const translations = {
  en: {
    title: "Access revoked",
    intro: (boss: string) => `${boss} has ended their access to your information.`,
    fromLabel: "Manager",
    companyLabel: "Company",
    noCompany: "No company listed",
    endedOnLabel: "Ended on",
    noLongerTitle: "They can no longer see:",
    accessCvs: "CVs & templates",
    accessPortfolio: "Portfolio",
    accessPersonalInfo: "Personal information",
    accessStats: "Work stats",
    accessAvailability: "Availability",
    accessCertifications: "Certifications",
    footerNote: "If this doesn't look right, you can always send them a new invitation from your own account.",
    closeBtn: "Got it",
  },
  sv: {
    title: "Åtkomst återkallad",
    intro: (boss: string) => `${boss} har avslutat sin åtkomst till din information.`,
    fromLabel: "Chef",
    companyLabel: "Företag",
    noCompany: "Inget företag angivet",
    endedOnLabel: "Avslutad",
    noLongerTitle: "De kan inte längre se:",
    accessCvs: "CV:n & mallar",
    accessPortfolio: "Portfolio",
    accessPersonalInfo: "Personlig information",
    accessStats: "Arbetsstatistik",
    accessAvailability: "Tillgänglighet",
    accessCertifications: "Certifieringar",
    footerNote: "Om detta inte stämmer kan du alltid skicka en ny inbjudan från ditt eget konto.",
    closeBtn: "Uppfattat",
  },
} as const

type TFunc = (typeof translations)["en"]

const ACCESS_ITEMS: Record<AccessLevel, (keyof Pick<TFunc,
  "accessCvs" | "accessPortfolio" | "accessPersonalInfo" | "accessStats" | "accessAvailability" | "accessCertifications"
>)[]> = {
  full: ["accessCvs", "accessPortfolio", "accessPersonalInfo", "accessStats", "accessAvailability", "accessCertifications"],
  cv_only: ["accessCvs", "accessCertifications"],
  portfolio_only: ["accessPortfolio"],
}

/**
 * Shown to an employee when a manager revokes their own access to an
 * already-accepted connection. Self-contained (own translations + date
 * locale) so it can be dropped into NotificationBell — or anywhere else —
 * with just an invitation object and a language code.
 */
export default function AccessRevokedDialog({ invitation, language, onClose }: AccessRevokedDialogProps) {
  const t = translations[language]
  const locale = language === "en" ? "en-US" : "sv-SE"
  const level: AccessLevel = invitation.accessLevel ?? "full"
  const items = ACCESS_ITEMS[level]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgb(254,242,242)" }}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="font-bold text-gray-900">{t.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <p className="text-sm text-gray-700 leading-relaxed">
            {t.intro(invitation.bossName || "—")}
          </p>

          <div className="rounded-xl bg-gray-50/70 border border-gray-100 p-4 space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 w-[72px] flex-shrink-0">{t.fromLabel}</span>
              <span className="font-medium text-gray-800">{invitation.bossName || "—"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 w-[72px] flex-shrink-0">{t.companyLabel}</span>
              <span className="font-medium text-gray-800">{invitation.companyName || t.noCompany}</span>
            </div>
            {invitation.respondedAt && (
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 w-[72px] flex-shrink-0">{t.endedOnLabel}</span>
                <span className="font-medium text-gray-800">
                  {new Date(invitation.respondedAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2.5">{t.noLongerTitle}</p>
            <div className="grid grid-cols-2 gap-2">
              {items.map((key) => (
                <div key={key} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg px-2.5 py-2">
                  <X className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                  <span className="line-through decoration-gray-300">{t[key]}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">{t.footerNote}</p>
        </div>

        <div className="flex items-center px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow-lg transition-all"
            style={{ backgroundColor: "rgb(5,22,80)" }}>
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
