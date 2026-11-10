"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Icon } from "@iconify/react"
import Card from "@/components/Dashboard/ReUsable/Card"
import { toast } from "sonner"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import type { BusinessAdminInfo, BusinessAdminInfoResponse } from "@/types/payloadTypes"

/* ─────────────────────────────────────────────
   SHARED UI HELPERS
───────────────────────────────────────────── */
const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; hint?: string }> = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
)

const inputCls = "w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none transition-colors"

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

const SaveBtn: React.FC<{ label: string; onClick: () => void; disabled?: boolean }> = ({ label, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ backgroundColor: "rgb(5,22,80)" }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.backgroundColor = "rgb(15,32,90)")}
    onMouseLeave={e => !disabled && (e.currentTarget.style.backgroundColor = "rgb(5,22,80)")}>
    {label}
  </button>
)

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
    style={{ backgroundColor: checked ? "rgb(5,22,80)" : "rgb(229,231,235)" }}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
  </button>
)

/* ─────────────────────────────────────────────
   API HELPERS
───────────────────────────────────────────── */
const fetchSettings = async (): Promise<BusinessAdminInfo | null> => {
  const res = await fetch("/api/company/settings")
  if (!res.ok) throw new Error("Failed to load settings")
  const body = (await res.json()) as BusinessAdminInfoResponse
  return body.data
}

const saveSettings = async (patch: Partial<BusinessAdminInfo>): Promise<BusinessAdminInfo> => {
  const res = await fetch("/api/company/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error("Failed to save settings")
  const body = (await res.json()) as { data: BusinessAdminInfo }
  return body.data
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const BusinessAdminSettings: React.FC = () => {
  const { t } = useBusinessAdminTranslations()
  const [activeTab, setActiveTab] = useState("general")
  const logoRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)

  const [general, setGeneral] = useState({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "" })
  const [company, setCompany] = useState({
    companyName: "", orgNumber: "",
    industry: "", companySize: "", companyEmail: "", companyPhone: "",
    companyWebsite: "", companyAddress: "",
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [notif, setNotif] = useState({ emailNotif: true, newManagerNotif: true, placementAlert: true, weeklyReport: false })
  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [twoFactor, setTwoFactor] = useState(false)

  // ── Load existing settings on mount ──
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await fetchSettings()
        if (cancelled || !data) return

        setGeneral({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          jobTitle: data.jobTitle ?? "",
        })
        setCompany({
          companyName: data.company?.companyName ?? "",
          orgNumber: data.company?.orgNumber ?? "",
          industry: data.company?.industry ?? "",
          companySize: data.company?.companySize ?? "",
          companyEmail: data.company?.companyEmail ?? "",
          companyPhone: data.company?.companyPhone ?? "",
          companyWebsite: data.company?.companyWebsite ?? "",
          companyAddress: data.company?.companyAddress ?? "",
        })
        if (data.company?.companyLogo?.staticImage) {
          setLogoPreview(data.company.companyLogo.staticImage)
        }
        setNotif({
          emailNotif: data.notificationPreferences?.emailNotif ?? true,
          newManagerNotif: data.notificationPreferences?.newManagerNotif ?? true,
          placementAlert: data.notificationPreferences?.placementAlert ?? true,
          weeklyReport: data.notificationPreferences?.weeklyReport ?? false,
        })
        setTwoFactor(data.twoFactorEnabled ?? false)
      } catch (err) {
        toast.error(t.failedToSave)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async (fn: () => Promise<void>) => {
    const id = toast.loading(t.saving)
    try { await fn(); toast.success(t.saved, { id }) }
    catch { toast.error(t.failedToSave, { id }) }
  }

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handlePasswordSave = () => {
    if (security.newPassword.length < 8) { toast.error(t.passwordTooShort); return }
    if (security.newPassword !== security.confirmPassword) { toast.error(t.passwordMismatch); return }
    // NOTE: password changes aren't handled by /api/company/settings — that endpoint
    // only manages the business-admin-info record, not credentials. This still needs
    // a dedicated endpoint (e.g. hitting Payload's built-in auth) to actually take effect.
    toast.success(t.passwordSaved)
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  const handleTwoFactorChange = async (value: boolean) => {
    const previous = twoFactor
    setTwoFactor(value) // optimistic update
    try {
      await saveSettings({ twoFactorEnabled: value })
    } catch {
      setTwoFactor(previous) // revert on failure
      toast.error(t.failedToSave)
    }
  }

  const tabs = [
    { id: "general", label: t.tabGeneral, icon: "tabler:user" },
    { id: "company", label: t.tabCompany, icon: "tabler:building" },
    { id: "notifications", label: t.tabNotifications, icon: "tabler:bell" },
    { id: "security", label: t.tabSecurity, icon: "tabler:shield-lock" },
  ]

  return (
    <div className="w-full min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="w-full max-w-7xl mx-auto">

        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{t.settingsTitle}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t.settingsSubtitle}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 lg:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm lg:text-base ${activeTab === tab.id ? "border-b-2" : "text-gray-600 hover:bg-gray-50"}`}
                style={activeTab === tab.id ? { color: "rgb(5,22,80)", borderColor: "rgb(5,22,80)", backgroundColor: "rgba(176,196,222,0.1)" } : {}}>
                <Icon icon={tab.icon} className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Card>
          <div className="p-3 sm:p-5 lg:p-6">

            {/* GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{t.personalInfo}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Field label={t.firstName} required>
                    <input type="text" value={general.firstName} onChange={e => setGeneral(g => ({ ...g, firstName: e.target.value }))} className={inputCls} placeholder="Anna" disabled={loading} {...fo} />
                  </Field>
                  <Field label={t.lastName} required>
                    <input type="text" value={general.lastName} onChange={e => setGeneral(g => ({ ...g, lastName: e.target.value }))} className={inputCls} placeholder="Karlsson" disabled={loading} {...fo} />
                  </Field>
                  <Field label={t.email} required>
                    <input type="email" value={general.email} onChange={e => setGeneral(g => ({ ...g, email: e.target.value }))} className={inputCls} placeholder="anna@company.se" disabled={loading} {...fo} />
                  </Field>
                  <Field label={t.phone}>
                    <input type="tel" value={general.phone} onChange={e => setGeneral(g => ({ ...g, phone: e.target.value }))} className={inputCls} placeholder="+46 70 000 00 00" disabled={loading} {...fo} />
                  </Field>
                  <Field label={t.jobTitle} required>
                    <input type="text" value={general.jobTitle} onChange={e => setGeneral(g => ({ ...g, jobTitle: e.target.value }))} className={inputCls} placeholder={t.jobTitlePlaceholder} disabled={loading} {...fo} />
                  </Field>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <SaveBtn
                    label={t.saveChanges}
                    disabled={loading}
                    onClick={() => save(async () => {
                      await saveSettings({
                        firstName: general.firstName,
                        lastName: general.lastName,
                        email: general.email,
                        phone: general.phone,
                        jobTitle: general.jobTitle,
                      })
                    })}
                  />
                </div>
              </div>
            )}

            {/* COMPANY */}
            {activeTab === "company" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t.companyLogo}</h2>
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div onClick={() => logoRef.current?.click()}
                      className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all overflow-hidden flex-shrink-0">
                      {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" /> : <Icon icon="tabler:upload" className="w-8 h-8 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{t.logoDesc}</p>
                      <p className="text-xs text-gray-400 mb-3">{t.logoHint}</p>
                      <div className="flex gap-2">
                        <button onClick={() => logoRef.current?.click()} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                          <Icon icon="tabler:upload" className="w-4 h-4 inline mr-1" />{t.uploadLogo}
                        </button>
                        {logoPreview && (
                          <button onClick={() => setLogoPreview(null)} className="px-4 py-2 text-sm rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all">
                            {t.removeLogo}
                          </button>
                        )}
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                      {/* NOTE: logo file isn't uploaded to Payload's media collection yet —
                          this only previews locally. Uploading needs multipart/form-data
                          to Payload's media endpoint, separate from this JSON settings route. */}
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t.companyInfo}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Field label={t.companyNameLabel} required>
                      <input type="text" value={company.companyName} onChange={e => setCompany(c => ({ ...c, companyName: e.target.value }))} className={inputCls} placeholder={t.companyNamePlaceholder} disabled={loading} {...fo} />
                    </Field>
                    <Field label={t.orgNumberLabel}>
                      <input type="text" value={company.orgNumber} onChange={e => setCompany(c => ({ ...c, orgNumber: e.target.value }))} className={inputCls} placeholder={t.orgNumberPlaceholder} disabled={loading} {...fo} />
                    </Field>
                    <Field label={t.industryLabel}>
                      <select value={company.industry} onChange={e => setCompany(c => ({ ...c, industry: e.target.value }))} className={`${inputCls} cursor-pointer`} disabled={loading} {...fo}>
                        <option value="">—</option>
                        {t.industries.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </Field>
                    <Field label={t.companySizeLabel}>
                      <select value={company.companySize} onChange={e => setCompany(c => ({ ...c, companySize: e.target.value }))} className={`${inputCls} cursor-pointer`} disabled={loading} {...fo}>
                        <option value="">—</option>
                        {t.companySizes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label={t.companyEmailLabel}>
                      <input type="email" value={company.companyEmail} onChange={e => setCompany(c => ({ ...c, companyEmail: e.target.value }))} className={inputCls} placeholder={t.companyEmailPlaceholder} disabled={loading} {...fo} />
                    </Field>
                    <Field label={t.companyPhoneLabel}>
                      <input type="tel" value={company.companyPhone} onChange={e => setCompany(c => ({ ...c, companyPhone: e.target.value }))} className={inputCls} placeholder={t.companyPhonePlaceholder} disabled={loading} {...fo} />
                    </Field>
                    <Field label={t.companyWebsiteLabel}>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                          <Icon icon="tabler:world" className="w-4 h-4 text-gray-500" />
                        </span>
                        <input type="text" value={company.companyWebsite} onChange={e => setCompany(c => ({ ...c, companyWebsite: e.target.value }))} className={`${inputCls} rounded-l-none`} placeholder={t.companyWebsitePlaceholder} disabled={loading} {...fo} />
                      </div>
                    </Field>
                    <Field label={t.companyAddressLabel}>
                      <input type="text" value={company.companyAddress} onChange={e => setCompany(c => ({ ...c, companyAddress: e.target.value }))} className={inputCls} placeholder={t.companyAddressPlaceholder} disabled={loading} {...fo} />
                    </Field>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <SaveBtn
                    label={t.saveCompany}
                    disabled={loading}
                    onClick={() => save(async () => {
                      await saveSettings({ company })
                    })}
                  />
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{t.notifTitle}</h2>
                <div className="space-y-3">
                  {([
                    { key: "emailNotif", label: t.emailNotif, desc: t.emailNotifDesc },
                    { key: "newManagerNotif", label: t.newManagerNotif, desc: t.newManagerNotifDesc },
                    { key: "placementAlert", label: t.placementAlert, desc: t.placementAlertDesc },
                    { key: "weeklyReport", label: t.weeklyReport, desc: t.weeklyReportDesc },
                  ] as const).map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 text-sm sm:text-base">{item.label}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{item.desc}</p>
                      </div>
                      <div className="ml-4">
                        <Toggle checked={notif[item.key]} onChange={v => setNotif(n => ({ ...n, [item.key]: v }))} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <SaveBtn
                    label={t.saveNotif}
                    disabled={loading}
                    onClick={() => save(async () => {
                      await saveSettings({ notificationPreferences: notif })
                    })}
                  />
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t.securityTitle}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-xl">
                    <Field label={t.currentPassword}>
                      <input type="password" value={security.currentPassword} onChange={e => setSecurity(s => ({ ...s, currentPassword: e.target.value }))} className={inputCls} {...fo} />
                    </Field>
                    <Field label={t.newPassword} hint={t.passwordHint}>
                      <input type="password" value={security.newPassword} onChange={e => setSecurity(s => ({ ...s, newPassword: e.target.value }))} className={inputCls} {...fo} />
                    </Field>
                    <Field label={t.confirmPassword}>
                      <input type="password" value={security.confirmPassword} onChange={e => setSecurity(s => ({ ...s, confirmPassword: e.target.value }))} className={inputCls} {...fo} />
                    </Field>
                  </div>
                  <div className="flex justify-start mt-4">
                    <SaveBtn label={t.savePassword} onClick={handlePasswordSave} />
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl max-w-xl">
                    <div>
                      <h3 className="font-semibold text-gray-800">{t.twoFactor}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{t.twoFactorDesc}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-xs font-semibold" style={{ color: twoFactor ? "rgb(22,101,52)" : "rgb(100,116,139)" }}>
                        {twoFactor ? t.twoFactorEnabled : t.twoFactorDisabled}
                      </span>
                      <Toggle checked={twoFactor} onChange={handleTwoFactorChange} />
                    </div>
                  </div>
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
