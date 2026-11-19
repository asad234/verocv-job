"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE:  the business admin's Settings page — REPLACE the file your sidebar opens
//        (the one that calls /api/company/admin/settings).
// Works like the manager's settings:
//   • Phone fields accept digits only (PhoneInput) — letters can't be typed or pasted
//   • A wrong phone number is marked with a red border + pink background on save
//   • Your profile photo (General) is uploaded straight away (/api/company/admin/settings/avatar)
//     — it's the picture in the dashboard header, and your managers see it too
//   • Company logo (Company) is uploaded straight away (/api/company/admin/settings/logo)
//     — it's shown on the dashboard Home
//   Tabs: General · Company · Notifications · Security
//   API: GET/PUT /api/company/admin/settings      — name, phone, job title, company
//        POST/DELETE /api/company/admin/settings/avatar — your photo
//        POST/DELETE /api/company/admin/settings/logo — logo
//        GET/PUT /api/company/settings             — notification toggles + two-factor
//        /api/user/password                        — password (ChangePasswordForm)
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { toast } from "sonner"
import Card from "@/components/Dashboard/ReUsable/Card"
import ChangePasswordForm from "@/components/shared/ChangePasswordForm"
import PhoneInput from "@/components/shared/PhoneInput"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { isValidPhone, sanitizePhone } from "@/utils/phone"
import { IMAGE_ACCEPT, imageProblem } from "@/utils/imageRules"
import UnderDevelopmentBanner from "@/components/Common/underDevelopment"
import ProfilePhoto from "@/components/shared/ProfilePhoto"
import { notifyAdminProfileChanged } from "@/utils/adminProfile"

const NAVY = "rgb(5,22,80)"
const inputCls = "w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md bg-white outline-none transition-colors focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:bg-gray-50"
const badCls = "!border-red-400 !bg-red-50"

/* ─── Pieces ─── */
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
    className="relative w-11 h-6 rounded-full transition-all flex-shrink-0 disabled:opacity-50"
    style={{ backgroundColor: checked ? NAVY : "rgb(229,231,235)" }}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
  </button>
)

const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
)

const SaveBtn: React.FC<{ label: string; onClick: () => void; disabled?: boolean }> = ({ label, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ backgroundColor: NAVY }}>
    {label}
  </button>
)

/* ─── API ─── */
interface CompanyForm {
  companyName: string; orgNumber: string; industry: string; companySize: string
  companyEmail: string; companyPhone: string; companyWebsite: string; companyAddress: string
}
interface SettingsDto {
  loginEmail: string; firstName: string; lastName: string; phone: string; jobTitle: string
  avatar?: string | null
  company: CompanyForm & { logo: string | null }
}

/** A refused save: the server's message and which field it was. */
class SaveError extends Error {
  constructor(message: string, public field = "") { super(message) }
}

async function call<T>(url: string, init?: RequestInit): Promise<T & { warning?: string }> {
  const res = await fetch(url, { cache: "no-store", ...init })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new SaveError(body?.message || "Failed", body?.field ?? "")
  return body
}

type Notif = { emailNotif: boolean; newManagerNotif: boolean; placementAlert: boolean; weeklyReport: boolean }
const DEFAULT_NOTIF: Notif = { emailNotif: true, newManagerNotif: true, placementAlert: true, weeklyReport: false }

/** Notification toggles + two-factor live on /api/company/settings. */
const prefsApi = {
  get: () => call<{ data: { notificationPreferences?: Partial<Notif>; twoFactorEnabled?: boolean } | null }>("/api/company/settings"),
  save: (patch: Record<string, unknown>) => call("/api/company/admin/settings", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
  }),
}

const EMPTY_COMPANY: CompanyForm = {
  companyName: "", orgNumber: "", industry: "", companySize: "",
  companyEmail: "", companyPhone: "", companyWebsite: "", companyAddress: "",
}

/* ═════════════════════════════════════════════
   PAGE
═════════════════════════════════════════════ */
export default function BusinessAdminSettings() {
  const { t, ...tRest } = useBusinessAdminTranslations()
  const isEn = ((tRest as { language?: string }).language ?? (String(t.saving).startsWith("Sav") ? "en" : "sv")) === "en"

  const [tab, setTab] = useState<"general" | "company" | "notifications" | "security">("general")
  const [loading, setLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState("")
  const [general, setGeneral] = useState({ firstName: "", lastName: "", phone: "", jobTitle: "" })
  const [company, setCompany] = useState<CompanyForm>(EMPTY_COMPANY)
  const [logo, setLogo] = useState<string | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const [notif, setNotif] = useState<Notif>(DEFAULT_NOTIF)
  const [twoFactor, setTwoFactor] = useState(false)

  /** Fields refused on save → red border + pink background until edited. */
  const [bad, setBad] = useState<string[]>([])
  const clearBad = (k: string) => setBad(b => b.filter(x => x !== k))
  const isBad = (k: string) => bad.includes(k)

  const phoneMsg = isEn
    ? "Check the phone number — 6 to 15 digits only, may start with +."
    : "Kontrollera telefonnumret — endast 6 till 15 siffror, får börja med +."

  const apply = (d: SettingsDto) => {
    setLoginEmail(d.loginEmail ?? "")
    setGeneral({ firstName: d.firstName ?? "", lastName: d.lastName ?? "", phone: sanitizePhone(d.phone ?? ""), jobTitle: d.jobTitle ?? "" })
    const { logo: l, ...c } = d.company ?? { ...EMPTY_COMPANY, logo: null }
    setCompany({ ...EMPTY_COMPANY, ...c, companyPhone: sanitizePhone(c.companyPhone ?? "") })
    setLogo(l ?? null)
    setAvatar(d.avatar ?? null)
  }

  useEffect(() => {
    // Opened from Home → "Add logo": start on the Company tab (?settingsTab=company).
    const url = new URL(window.location.href)
    const wanted = url.searchParams.get("settingsTab")
    if (wanted === "company" || wanted === "notifications" || wanted === "security" || wanted === "general") {
      setTab(wanted)
      url.searchParams.delete("settingsTab")
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    }
    call<{ data: SettingsDto }>("/api/company/admin/settings")
      .then(r => apply(r.data))
      .catch(() => toast.error(isEn ? "Couldn't load your settings." : "Kunde inte ladda inställningarna."))
      .finally(() => setLoading(false))
    // Notification toggles + two-factor (a separate record route) — defaults if it can't load.
    prefsApi.get().then(r => {
      setNotif({ ...DEFAULT_NOTIF, ...(r.data?.notificationPreferences ?? {}) })
      setTwoFactor(!!r.data?.twoFactorEnabled)
    }).catch(() => { /* keep defaults */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveNotif = async () => {
    const id = toast.loading(t.saving)
    try { await prefsApi.save({ notificationPreferences: notif }); toast.success(t.saved, { id }) }
    catch { toast.error(t.failedToSave, { id }) }
  }

  const changeTwoFactor = async (value: boolean) => {
    const previous = twoFactor
    setTwoFactor(value)
    try { await prefsApi.save({ twoFactorEnabled: value }) }
    catch { setTwoFactor(previous); toast.error(t.failedToSave) }
  }

  /** Saves a part of the settings. Wrong fields are marked; a logo warning is shown but doesn't block. */
  const save = async (patch: Record<string, unknown>) => {
    const id = toast.loading(t.saving)
    try {
      const r = await call<{ data: SettingsDto }>("/api/company/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      apply(r.data)
      setBad([])
      // Header, Home and the organisation page show the new name / company name right away.
      notifyAdminProfileChanged({
        name: [r.data.firstName, r.data.lastName].filter(Boolean).join(" ").trim(),
        jobTitle: r.data.jobTitle ?? "",
        companyName: r.data.company?.companyName ?? "",
      })
      toast.success(t.saved, { id })
      if (r.warning) toast.warning(r.warning)
    } catch (err) {
      const field = err instanceof SaveError ? err.field.replace(/^company\./, "") : ""
      if (field) setBad([field])
      toast.error(/phone/i.test(field) ? phoneMsg : (err as Error).message || t.failedToSave, { id })
    }
  }

  const saveGeneral = () => {
    const missing = (["firstName", "lastName", "jobTitle"] as const).filter(k => !general[k].trim())
    const badPhone = !isValidPhone(general.phone) ? ["phone"] : []
    setBad([...missing, ...badPhone])
    if (badPhone.length) return toast.error(phoneMsg)
    if (missing.length) return toast.error(isEn ? "Fill in the required fields." : "Fyll i de obligatoriska fälten.")
    save({ firstName: general.firstName, lastName: general.lastName, phone: general.phone, jobTitle: general.jobTitle })
  }

  const saveCompany = () => {
    const issues = [
      ...(!company.companyName.trim() ? ["companyName"] : []),
      ...(!isValidPhone(company.companyPhone) ? ["companyPhone"] : []),
    ]
    setBad(issues)
    if (issues.includes("companyPhone")) return toast.error(phoneMsg)
    if (issues.length) return toast.error(isEn ? "Enter the company name." : "Ange företagets namn.")
    save({ company })
  }

  /* ── Photo + logo: uploaded / removed straight away ── */
  const IMAGE = {
    avatar: { url: "/api/company/admin/settings/avatar", setBusy: setAvatarBusy, set: setAvatar },
    logo: { url: "/api/company/admin/settings/logo", setBusy: setLogoBusy, set: setLogo },
  } as const
  const imageCall = async (kind: keyof typeof IMAGE, init: RequestInit) => {
    const k = IMAGE[kind]
    k.setBusy(true)
    const id = toast.loading(t.saving)
    try {
      const r = await call<{ data: { url: string | null } }>(k.url, init)
      const url = r.data?.url ?? null
      k.set(url)
      notifyAdminProfileChanged(kind === "avatar" ? { avatar: url } : { logo: url })
      toast.success(t.saved, { id })
    } catch (err) {
      toast.error((err as Error).message || t.failedToSave, { id })
    } finally {
      k.setBusy(false)
    }
  }
  const onImageFile = (kind: keyof typeof IMAGE) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const problem = imageProblem(file, isEn)
    if (problem) { toast.error(problem); return }
    const form = new FormData()
    form.append("file", file)
    imageCall(kind, { method: "POST", body: form })
  }

  const fullName = `${general.firstName} ${general.lastName}`.trim() || loginEmail

  const tabs = [
    { id: "general" as const, label: t.tabGeneral, icon: "tabler:user" },
    { id: "company" as const, label: t.tabCompany, icon: "tabler:building" },
    { id: "notifications" as const, label: t.tabNotifications, icon: "tabler:bell" },
    { id: "security" as const, label: t.tabSecurity, icon: "tabler:shield-lock" },
  ]

  return (
    <div className="w-full min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="w-full max-w-5xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{t.settingsTitle}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t.settingsSubtitle}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map(x => (
              <button key={x.id} onClick={() => { setTab(x.id); setBad([]) }}
                className={clsx("flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap transition-colors",
                  tab === x.id ? "border-b-2" : "text-gray-600 hover:bg-gray-50")}
                style={tab === x.id ? { color: NAVY, borderColor: NAVY, backgroundColor: "rgba(176,196,222,0.1)" } : {}}>
                <Icon icon={x.icon} className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                {x.label}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <div className="p-3 sm:p-5 lg:p-6">

            {/* GENERAL */}
            {tab === "general" && (
              <div className="space-y-6">
                {/* Profile photo — the picture in the header; your managers see it too */}
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{isEn ? "Profile photo" : "Profilbild"}</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <button type="button" onClick={() => !avatarBusy && avatarRef.current?.click()}
                      aria-label={isEn ? "Upload profile photo" : "Ladda upp profilbild"}
                      className="relative w-24 h-24 rounded-full flex-shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                      <ProfilePhoto src={avatar} name={fullName || "?"} size={96} />
                      <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon icon={avatarBusy ? "tabler:loader-2" : "tabler:camera"} className={clsx("w-7 h-7 text-white", avatarBusy && "animate-spin")} />
                      </span>
                      {avatarBusy && (
                        <span className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center">
                          <Icon icon="tabler:loader-2" className="w-7 h-7 text-gray-500 animate-spin" />
                        </span>
                      )}
                    </button>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        {isEn
                          ? "Shown in the dashboard header and to your managers when they look at your profile."
                          : "Visas i dashboardens sidhuvud och för dina chefer när de tittar på din profil."}
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        {isEn ? "JPG, PNG, GIF or WebP · max 2 MB · saved straight away" : "JPG, PNG, GIF eller WebP · max 2 MB · sparas direkt"}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => avatarRef.current?.click()} disabled={avatarBusy || loading}
                          className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">
                          <Icon icon="tabler:upload" className="w-4 h-4 inline mr-1" />
                          {avatar ? (isEn ? "Change photo" : "Byt bild") : (isEn ? "Upload photo" : "Ladda upp bild")}
                        </button>
                        {avatar && (
                          <button onClick={() => imageCall("avatar", { method: "DELETE" })} disabled={avatarBusy}
                            className="px-4 py-2 text-sm rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                            {isEn ? "Remove" : "Ta bort"}
                          </button>
                        )}
                      </div>
                      <input ref={avatarRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={onImageFile("avatar")} />
                    </div>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 pt-2 border-t border-gray-100">{t.personalInfo}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Field label={t.firstName} required>
                    <input value={general.firstName} disabled={loading} placeholder="Anna"
                      onChange={e => { clearBad("firstName"); setGeneral(g => ({ ...g, firstName: e.target.value })) }}
                      className={clsx(inputCls, isBad("firstName") && badCls)} />
                  </Field>
                  <Field label={t.lastName} required>
                    <input value={general.lastName} disabled={loading} placeholder="Karlsson"
                      onChange={e => { clearBad("lastName"); setGeneral(g => ({ ...g, lastName: e.target.value })) }}
                      className={clsx(inputCls, isBad("lastName") && badCls)} />
                  </Field>
                  <Field label={t.email} hint={isEn ? "Your login email — it can't be changed here." : "Din inloggningsadress — den kan inte ändras här."}>
                    <input type="email" value={loginEmail} disabled className={inputCls} />
                  </Field>
                  <Field label={t.phone}>
                    <PhoneInput value={general.phone} disabled={loading} placeholder="0701234567"
                      onChange={v => { clearBad("phone"); setGeneral(g => ({ ...g, phone: v })) }}
                      invalid={isBad("phone")} className={inputCls} />
                  </Field>
                  <Field label={t.jobTitle} required>
                    <input value={general.jobTitle} disabled={loading} placeholder={t.jobTitlePlaceholder}
                      onChange={e => { clearBad("jobTitle"); setGeneral(g => ({ ...g, jobTitle: e.target.value })) }}
                      className={clsx(inputCls, isBad("jobTitle") && badCls)} />
                  </Field>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <SaveBtn label={t.saveChanges} disabled={loading} onClick={saveGeneral} />
                </div>
              </div>
            )}

            {/* COMPANY */}
            {tab === "company" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t.companyLogo}</h2>
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <button type="button" onClick={() => !logoBusy && logoRef.current?.click()}
                      className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-300 hover:bg-blue-50/30 transition-all overflow-hidden flex-shrink-0">
                      {logoBusy
                        ? <Icon icon="tabler:loader-2" className="w-8 h-8 text-gray-400 animate-spin" />
                        : logo
                          ? <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                          : <Icon icon="tabler:upload" className="w-8 h-8 text-gray-400" />}
                    </button>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{t.logoDesc}</p>
                      <p className="text-xs text-gray-500 mb-1">
                        {isEn ? "Shown at the top of your dashboard Home." : "Visas högst upp på din dashboards startsida."}
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        {isEn ? "JPG, PNG, GIF or WebP · max 2 MB · saved straight away" : "JPG, PNG, GIF eller WebP · max 2 MB · sparas direkt"}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => logoRef.current?.click()} disabled={logoBusy}
                          className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">
                          <Icon icon="tabler:upload" className="w-4 h-4 inline mr-1" />{t.uploadLogo}
                        </button>
                        {logo && (
                          <button onClick={() => imageCall("logo", { method: "DELETE" })} disabled={logoBusy}
                            className="px-4 py-2 text-sm rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                            {t.removeLogo}
                          </button>
                        )}
                      </div>
                      <input ref={logoRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={onImageFile("logo")} />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t.companyInfo}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Field label={t.companyNameLabel} required>
                      <input value={company.companyName} disabled={loading} placeholder={t.companyNamePlaceholder}
                        onChange={e => { clearBad("companyName"); setCompany(c => ({ ...c, companyName: e.target.value })) }}
                        className={clsx(inputCls, isBad("companyName") && badCls)} />
                    </Field>
                    <Field label={t.orgNumberLabel}>
                      <input value={company.orgNumber} disabled={loading} placeholder={t.orgNumberPlaceholder}
                        onChange={e => setCompany(c => ({ ...c, orgNumber: e.target.value }))} className={inputCls} />
                    </Field>
                    <Field label={t.industryLabel}>
                      <select value={company.industry} disabled={loading} className={clsx(inputCls, "cursor-pointer")}
                        onChange={e => setCompany(c => ({ ...c, industry: e.target.value }))}>
                        <option value="">—</option>
                        {(t.industries as readonly string[]).map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </Field>
                    <Field label={t.companySizeLabel}>
                      <select value={company.companySize} disabled={loading} className={clsx(inputCls, "cursor-pointer")}
                        onChange={e => setCompany(c => ({ ...c, companySize: e.target.value }))}>
                        <option value="">—</option>
                        {(t.companySizes as readonly string[]).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label={t.companyEmailLabel}>
                      <input type="email" value={company.companyEmail} disabled={loading} placeholder={t.companyEmailPlaceholder}
                        onChange={e => { clearBad("companyEmail"); setCompany(c => ({ ...c, companyEmail: e.target.value })) }}
                        className={clsx(inputCls, isBad("companyEmail") && badCls)} />
                    </Field>
                    <Field label={t.companyPhoneLabel}>
                      <PhoneInput value={company.companyPhone} disabled={loading} placeholder="081234567"
                        onChange={v => { clearBad("companyPhone"); setCompany(c => ({ ...c, companyPhone: v })) }}
                        invalid={isBad("companyPhone")} className={inputCls} />
                    </Field>
                    <Field label={t.companyWebsiteLabel}>
                      <input value={company.companyWebsite} disabled={loading} placeholder={t.companyWebsitePlaceholder}
                        onChange={e => setCompany(c => ({ ...c, companyWebsite: e.target.value }))} className={inputCls} />
                    </Field>
                    <Field label={t.companyAddressLabel}>
                      <input value={company.companyAddress} disabled={loading} placeholder={t.companyAddressPlaceholder}
                        onChange={e => setCompany(c => ({ ...c, companyAddress: e.target.value }))} className={inputCls} />
                    </Field>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <SaveBtn label={t.saveCompany} disabled={loading} onClick={saveCompany} />
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {tab === "notifications" && (
              <div className="space-y-6">
                <UnderDevelopmentBanner />
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
                  <SaveBtn label={t.saveNotif} disabled={loading} onClick={saveNotif} />
                </div>
              </div>
            )}

            {/* SECURITY */}
            {tab === "security" && (
              <div className="space-y-8">
                <ChangePasswordForm
                  endpoint="/api/user/password"
                  language={isEn ? "en" : "sv"}
                  onSuccess={(message: string) => toast.success(message)}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
