"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/Businessadminsettings.tsx
// WHAT IT DOES:   Business admin → Settings → Account (view "account").
//   Tabs:
//     General  — your name, phone, job title (saved; the login email is shown read-only)
//     Company  — company details + logo (the logo is saved too, resized in the browser)
//     Security — change password (shared ChangePasswordForm → /api/user/password)
//   Data: GET / PUT /api/company/admin/settings
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Icon } from "@iconify/react"
import Card from "@/components/Dashboard/ReUsable/Card"
import { toast } from "sonner"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import ChangePasswordForm from "@/components/shared/ChangePasswordForm"

/* ─────────────────────────────────────────────
   TYPES + API
───────────────────────────────────────────── */
interface CompanyForm {
  companyName: string
  orgNumber: string
  industry: string
  companySize: string
  companyEmail: string
  companyPhone: string
  companyWebsite: string
  companyAddress: string
}
interface AdminSettings {
  loginEmail: string
  firstName: string
  lastName: string
  phone: string
  jobTitle: string
  company: CompanyForm & { logo: string | null }
}

class SaveError extends Error {
  constructor(message: string, public field?: string) { super(message) }
}

const API = "/api/company/admin/settings"

async function loadSettings(): Promise<AdminSettings> {
  const res = await fetch(API, { cache: "no-store", credentials: "include" })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message || "Failed to load settings")
  return body.data
}

async function saveSettings(patch: Record<string, unknown>): Promise<AdminSettings> {
  const res = await fetch(API, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new SaveError(body?.message || "Failed to save settings", body?.field)
  return body.data
}

/** Resizes an uploaded logo to max 512 px (PNG) so it stays small; SVG is kept as it is. */
function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("read"))
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (file.type === "image/svg+xml") return resolve(dataUrl)
      const img = new Image()
      img.onerror = () => reject(new Error("image"))
      img.onload = () => {
        const scale = Math.min(1, 512 / Math.max(img.width, img.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/png"))
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}

/* ─────────────────────────────────────────────
   SHARED UI HELPERS
───────────────────────────────────────────── */
const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; hint?: string; error?: string }> = ({ label, required, children, hint, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
)

const inputCls = "w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500"

const fo = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(176,196,222,0.5)"
    e.currentTarget.style.borderColor = "rgb(176,196,222)"
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = ""
    e.currentTarget.style.borderColor = ""
  },
}

const SaveBtn: React.FC<{ label: string; onClick: () => void; disabled?: boolean; busy?: boolean }> = ({ label, onClick, disabled, busy }) => (
  <button onClick={onClick} disabled={disabled || busy}
    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-sm text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ backgroundColor: "rgb(5,22,80)" }}>
    {busy && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
    {label}
  </button>
)

const EMPTY_COMPANY: CompanyForm = {
  companyName: "", orgNumber: "", industry: "", companySize: "",
  companyEmail: "", companyPhone: "", companyWebsite: "", companyAddress: "",
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const BusinessAdminSettings: React.FC = () => {
  const { t, language } = useBusinessAdminTranslations()
  const isEn = language === "en"
  const [activeTab, setActiveTab] = useState<"general" | "company" | "security">("general")
  const logoRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState<"general" | "company" | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [loginEmail, setLoginEmail] = useState("")
  const [general, setGeneral] = useState({ firstName: "", lastName: "", phone: "", jobTitle: "" })
  const [company, setCompany] = useState<CompanyForm>(EMPTY_COMPANY)
  const [logo, setLogo] = useState<string | null>(null)
  const [logoChanged, setLogoChanged] = useState(false)

  const apply = (d: AdminSettings) => {
    setLoginEmail(d.loginEmail)
    setGeneral({ firstName: d.firstName, lastName: d.lastName, phone: d.phone, jobTitle: d.jobTitle })
    const { logo: savedLogo, ...rest } = d.company
    setCompany({ ...EMPTY_COMPANY, ...rest })
    setLogo(savedLogo)
    setLogoChanged(false)
  }

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      apply(await loadSettings())
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const required = isEn ? "This field is required" : "Det här fältet är obligatoriskt"

  const saveGeneral = async () => {
    const e: Record<string, string> = {}
    if (!general.firstName.trim()) e.firstName = required
    if (!general.lastName.trim()) e.lastName = required
    if (!general.jobTitle.trim()) e.jobTitle = required
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving("general")
    try {
      apply(await saveSettings(general))
      toast.success(t.saved)
    } catch (err) {
      const se = err as SaveError
      if (se.field) setErrors({ [se.field]: se.message })
      toast.error(t.failedToSave)
    } finally {
      setSaving(null)
    }
  }

  const saveCompany = async () => {
    const e: Record<string, string> = {}
    if (!company.companyName.trim()) e.companyName = required
    if (company.companyEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(company.companyEmail.trim())) e.companyEmail = t.invalidEmail
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving("company")
    try {
      apply(await saveSettings({ company: { ...company, ...(logoChanged ? { logo: logo ?? "" } : {}) } }))
      toast.success(t.saved)
    } catch (err) {
      const se = err as SaveError
      if (se.field) setErrors({ [se.field]: se.message })
      toast.error(se.message || t.failedToSave)
    } finally {
      setSaving(null)
    }
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error(t.logoHint)
      return
    }
    try {
      setLogo(await readLogo(file))
      setLogoChanged(true)
    } catch {
      toast.error(t.failedToSave)
    }
  }

  const setG = (k: keyof typeof general, v: string) => { setGeneral(g => ({ ...g, [k]: v })); setErrors(x => ({ ...x, [k]: "" })) }
  const setC = (k: keyof CompanyForm, v: string) => { setCompany(c => ({ ...c, [k]: v })); setErrors(x => ({ ...x, [k]: "" })) }

  const tabs = [
    { id: "general" as const, label: t.tabGeneral, icon: "tabler:user" },
    { id: "company" as const, label: t.tabCompany, icon: "tabler:building" },
    { id: "security" as const, label: t.tabSecurity, icon: "tabler:shield-lock" },
  ]
  const busy = loading || !!saving

  return (
    <div className="w-full px-1 sm:px-2 py-2">
      <div className="w-full max-w-7xl mx-auto">

        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{t.settingsTitle}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t.settingsSubtitle}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200" role="tablist">
            {tabs.map(tab => (
              <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => { setActiveTab(tab.id); setErrors({}) }}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 lg:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm lg:text-base ${activeTab === tab.id ? "border-b-2" : "text-gray-600 hover:bg-gray-50"}`}
                style={activeTab === tab.id ? { color: "rgb(5,22,80)", borderColor: "rgb(5,22,80)", backgroundColor: "rgba(176,196,222,0.1)" } : {}}>
                <Icon icon={tab.icon} className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loadError && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{isEn ? "Couldn't load your settings." : "Kunde inte ladda dina inställningar."}</span>
            <button onClick={load} className="font-semibold underline">{isEn ? "Try again" : "Försök igen"}</button>
          </div>
        )}

        <Card>
          <div className="p-3 sm:p-5 lg:p-6">

            {/* GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{t.personalInfo}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Field label={t.firstName} required error={errors.firstName}>
                    <input type="text" value={general.firstName} onChange={e => setG("firstName", e.target.value)} className={inputCls} placeholder="Anna" disabled={busy} maxLength={120} {...fo} />
                  </Field>
                  <Field label={t.lastName} required error={errors.lastName}>
                    <input type="text" value={general.lastName} onChange={e => setG("lastName", e.target.value)} className={inputCls} placeholder="Karlsson" disabled={busy} maxLength={120} {...fo} />
                  </Field>
                  <Field label={t.email} hint={isEn ? "Your login email. Contact support to change it." : "Din inloggningsmejl. Kontakta support för att ändra den."}>
                    <input type="email" value={loginEmail} className={inputCls} disabled readOnly />
                  </Field>
                  <Field label={t.phone}>
                    <input type="tel" value={general.phone} onChange={e => setG("phone", e.target.value)} className={inputCls} placeholder="+46 70 000 00 00" disabled={busy} maxLength={40} {...fo} />
                  </Field>
                  <Field label={t.jobTitle} required error={errors.jobTitle}>
                    <input type="text" value={general.jobTitle} onChange={e => setG("jobTitle", e.target.value)} className={inputCls} placeholder={t.jobTitlePlaceholder} disabled={busy} maxLength={120} {...fo} />
                  </Field>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <SaveBtn label={saving === "general" ? t.saving : t.saveChanges} onClick={saveGeneral} disabled={loading} busy={saving === "general"} />
                </div>
              </div>
            )}

            {/* COMPANY */}
            {activeTab === "company" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t.companyLogo}</h2>
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <button type="button" onClick={() => logoRef.current?.click()} disabled={busy}
                      aria-label={t.uploadLogo}
                      className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all overflow-hidden flex-shrink-0 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {logo ? <img src={logo} alt="" className="w-full h-full object-contain" /> : <Icon icon="tabler:upload" className="w-8 h-8 text-gray-400" />}
                    </button>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{t.logoDesc}</p>
                      <p className="text-xs text-gray-400 mb-3">{t.logoHint}</p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => logoRef.current?.click()} disabled={busy} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">
                          <Icon icon="tabler:upload" className="w-4 h-4 inline mr-1" />{t.uploadLogo}
                        </button>
                        {logo && (
                          <button onClick={() => { setLogo(null); setLogoChanged(true) }} disabled={busy} className="px-4 py-2 text-sm rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                            {t.removeLogo}
                          </button>
                        )}
                      </div>
                      {logoChanged && (
                        <p className="text-xs text-amber-700 mt-2">
                          {isEn ? "Click “Save company info” to keep the new logo." : "Klicka på ”Spara företagsinfo” för att spara den nya logotypen."}
                        </p>
                      )}
                      {errors.logo && <p className="text-xs text-red-600 mt-2">{errors.logo}</p>}
                      <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoFile} />
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t.companyInfo}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Field label={t.companyNameLabel} required error={errors.companyName}>
                      <input type="text" value={company.companyName} onChange={e => setC("companyName", e.target.value)} className={inputCls} placeholder={t.companyNamePlaceholder} disabled={busy} {...fo} />
                    </Field>
                    <Field label={t.orgNumberLabel}>
                      <input type="text" value={company.orgNumber} onChange={e => setC("orgNumber", e.target.value)} className={inputCls} placeholder={t.orgNumberPlaceholder} disabled={busy} {...fo} />
                    </Field>
                    <Field label={t.industryLabel}>
                      <select value={company.industry} onChange={e => setC("industry", e.target.value)} className={`${inputCls} cursor-pointer`} disabled={busy} {...fo}>
                        <option value="">—</option>
                        {company.industry && !(t.industries as readonly string[]).includes(company.industry) && <option value={company.industry}>{company.industry}</option>}
                        {t.industries.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </Field>
                    <Field label={t.companySizeLabel}>
                      <select value={company.companySize} onChange={e => setC("companySize", e.target.value)} className={`${inputCls} cursor-pointer`} disabled={busy} {...fo}>
                        <option value="">—</option>
                        {t.companySizes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label={t.companyEmailLabel} error={errors.companyEmail}>
                      <input type="email" value={company.companyEmail} onChange={e => setC("companyEmail", e.target.value)} className={inputCls} placeholder={t.companyEmailPlaceholder} disabled={busy} {...fo} />
                    </Field>
                    <Field label={t.companyPhoneLabel}>
                      <input type="tel" value={company.companyPhone} onChange={e => setC("companyPhone", e.target.value)} className={inputCls} placeholder={t.companyPhonePlaceholder} disabled={busy} {...fo} />
                    </Field>
                    <Field label={t.companyWebsiteLabel}>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                          <Icon icon="tabler:world" className="w-4 h-4 text-gray-500" />
                        </span>
                        <input type="text" value={company.companyWebsite} onChange={e => setC("companyWebsite", e.target.value)} className={`${inputCls} rounded-l-none`} placeholder={t.companyWebsitePlaceholder} disabled={busy} {...fo} />
                      </div>
                    </Field>
                    <Field label={t.companyAddressLabel}>
                      <input type="text" value={company.companyAddress} onChange={e => setC("companyAddress", e.target.value)} className={inputCls} placeholder={t.companyAddressPlaceholder} disabled={busy} {...fo} />
                    </Field>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <SaveBtn label={saving === "company" ? t.saving : t.saveCompany} onClick={saveCompany} disabled={loading} busy={saving === "company"} />
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{t.securityTitle}</h2>
                {/* Same form as the manager and employee settings */}
                <div className="max-w-xl">
                  <ChangePasswordForm endpoint="/api/user/password" language={language} />
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default BusinessAdminSettings
