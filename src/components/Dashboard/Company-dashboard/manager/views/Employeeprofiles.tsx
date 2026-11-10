"use client"

import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { loadManagedEmployees, type CoveringFor } from "@/utils/coveredTeam"
import { CoveringBadge, CoveringNotice } from "@/components/Dashboard/Company-dashboard/manager/delegation/CoveringBadge"
import {
  ARRANGEMENT_LABELS, NOTICE_LABELS, RATE_TYPE_LABELS, STATUS_LABELS, TRAVEL_LABELS, TYPE_LABELS,
  fieldRules, formatAmount, label, normalizeEmploymentDetails, type EmploymentDetailsData, type Lang,
} from "@/utils/employmentDetails"

const NAVY = "rgb(5,22,80)"
const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all bg-white"

interface EmployeeSummary {
  employeeId: string
  employeeName: string
  employeeEmail: string
  /** Set when this employee belongs to a colleague you're covering for. */
  coveringFor?: CoveringFor
}

interface PersonalInformation {
  firstName?: string
  lastName?: string
  title?: string
  homeAddress?: string
  phoneNumber?: string
  workPhoneNumber?: string
  privateEmail?: string
  workEmail?: string
  dateOfBirth?: string
  gender?: string
  professionalPresentation?: string
  personalPresentation?: string
  socialLinks?: { linkedIn?: string; x?: string; gitHub?: string; website?: string } | null
  emergencyContact?: {
    firstName?: string
    lastName?: string
    relationship?: string
    email?: string
    phoneNumber?: string
  } | null
}

interface CvExperience { employer?: string; title?: string; startDate?: string; endDate?: string; ongoing?: boolean; description?: string }
interface CvSkill { skillName?: string; skillRating?: number; skillYearsExperience?: number }
interface CvCertification { title?: string; issuer?: string; startDate?: string; validDate?: string; code?: string }
interface CvReference { firstName?: string; lastName?: string; email?: string; phoneNumber?: string; company?: string; positionTitle?: string }
interface CvLanguage { language?: string; level?: string }
interface CvProject { role?: string; company?: string; startDate?: string; endDate?: string; isCurrent?: boolean; description?: string }

interface CvData {
  name?: string
  experience: CvExperience[]
  skills: CvSkill[]
  certifications: CvCertification[]
  references: CvReference[]
  languages: CvLanguage[]
  projects: CvProject[]
}

interface ProfileViewData {
  hrInfo: any
  personalInformation: PersonalInformation | null
  cv: CvData | null
  employmentDetails: any
}


const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgb(239,246,255)" }}>
      <Icon icon={icon} className="w-4 h-4" style={{ color: NAVY }} />
    </div>
    <h3 className="text-sm font-bold text-gray-800">{title}</h3>
  </div>
)

const InfoField = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className="text-sm text-gray-800 mt-0.5">{value || "—"}</p>
  </div>
)

export default function EmployeeProfileManagement() {
  const { t, language } = useManagerTranslations()
  const locale = language === "en" ? "en-US" : "sv-SE"
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString(locale, { month: "short", year: "numeric" }) : "")
  const fmtFullDate = (d?: string) => (d ? new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "")

  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [selected, setSelected] = useState<EmployeeSummary | null>(null)

  const [data, setData] = useState<ProfileViewData | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")

  // Employee's own employment details — loaded from their own route so the
  // fields always match the employee form (and access is checked there).
  const [employment, setEmployment] = useState<EmploymentDetailsData | null>(null)
  const [employmentUpdatedAt, setEmploymentUpdatedAt] = useState<string | null>(null)
  const [employmentState, setEmploymentState] = useState<"idle" | "loading" | "ok" | "forbidden" | "error">("idle")

  // Manager-editable state
  const [employmentInfo, setEmploymentInfo] = useState({ jobTitle: "", department: "", employmentType: "full-time", startDate: "", status: "active" })
  const [events, setEvents] = useState<any[]>([])
  const [leaveBalance, setLeaveBalance] = useState({ vacationDaysTotal: 25, vacationDaysUsed: 0, sickDaysTotal: 10, sickDaysUsed: 0, otherLeaveDays: 0 })

  useEffect(() => {
    let cancelled = false
    // Your employees + the team of any colleague you're covering for.
    loadManagedEmployees<EmployeeSummary>()
      .then((list) => { if (!cancelled) setEmployees(list) })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoadingList(false) })
    return () => { cancelled = true }
  }, [])

  const loadEmployee = (emp: EmployeeSummary) => {
    setSelected(emp)
    setData(null)
    setError("")
    setLoadingData(true)
    loadEmployment(emp.employeeId)
    fetch(`/api/company/managers/employees/${emp.employeeId}/hr-info`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.message || t.loadProfileFailed)
        }
        return res.json()
      })
      .then((body: ProfileViewData) => {
        setData(body)
        const hr = body.hrInfo
        setEmploymentInfo({
          jobTitle: hr?.employmentInfo?.jobTitle ?? "",
          department: hr?.employmentInfo?.department ?? "",
          employmentType: hr?.employmentInfo?.employmentType ?? "full-time",
          startDate: hr?.employmentInfo?.startDate ? hr.employmentInfo.startDate.slice(0, 10) : "",
          status: hr?.employmentInfo?.status ?? "active",
        })
        setEvents(hr?.upcomingEvents ?? [])
        setLeaveBalance({
          vacationDaysTotal: hr?.leaveBalance?.vacationDaysTotal ?? 25,
          vacationDaysUsed: hr?.leaveBalance?.vacationDaysUsed ?? 0,
          sickDaysTotal: hr?.leaveBalance?.sickDaysTotal ?? 10,
          sickDaysUsed: hr?.leaveBalance?.sickDaysUsed ?? 0,
          otherLeaveDays: hr?.leaveBalance?.otherLeaveDays ?? 0,
        })
      })
      .catch((err) => setError(err.message || t.loadProfileFailed))
      .finally(() => setLoadingData(false))
  }

  const loadEmployment = (employeeId: string) => {
    setEmployment(null)
    setEmploymentUpdatedAt(null)
    setEmploymentState("loading")
    fetch(`/api/company/managers/employees/${employeeId}/employment-details`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) { setEmploymentState("forbidden"); return }
        if (!res.ok) throw new Error()
        const body = await res.json()
        setEmployment(body.data ?? null)
        setEmploymentUpdatedAt(body.updatedAt ?? null)
        setEmploymentState("ok")
      })
      .catch(() => setEmploymentState("error"))
  }

  const save = async (patch: Record<string, unknown>) => {
    if (!selected) return
    setSaving(true)
    setSaveMsg("")
    try {
      const res = await fetch(`/api/company/managers/employees/${selected.employeeId}/hr-info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error(t.failedToSave)
      setSaveMsg(t.saved)
      setTimeout(() => setSaveMsg(""), 2000)
    } catch {
      setSaveMsg(t.failedToSave)
    } finally {
      setSaving(false)
    }
  }

  const addEvent = () => setEvents((p) => [...p, { title: "", date: "", eventType: "meeting", notes: "" }])
  const updateEvent = (i: number, key: string, value: string) =>
    setEvents((p) => p.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)))
  const removeEvent = (i: number) => setEvents((p) => p.filter((_, idx) => idx !== i))

  const pi = data?.personalInformation
  const cv = data?.cv
  const lang: Lang = language === "en" ? "en" : "sv"
  const isEn = lang === "en"
  // Prefer the dedicated route; fall back to what hr-info returned (older backends).
  const ed: EmploymentDetailsData | null =
    employment ?? (data?.employmentDetails ? normalizeEmploymentDetails(data.employmentDetails).data : null)
  const edRules = ed ? fieldRules({ employmentStatus: ed.employmentStatus, employmentType: ed.employmentType }) : null
  const money = (amount?: string, currency?: string, per?: string) =>
    amount ? `${formatAmount(amount, lang)} ${currency ?? ""}${per ? ` · ${per}` : ""}`.trim() : undefined
  const hasSocial = !!(pi?.socialLinks?.linkedIn || pi?.socialLinks?.x || pi?.socialLinks?.gitHub || pi?.socialLinks?.website)

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:user-cog" className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.profileTitle}</h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">
          {t.profileDesc}
        </p>
      </div>

      <CoveringNotice language={language} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Employee list */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t.employeesListLabel} ({employees.length})
            </div>
            {loadingList && (
              <div className="p-6 flex justify-center text-gray-400 text-sm gap-2 items-center">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                {t.loading}
              </div>
            )}
            {!loadingList && employees.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">{t.noEmployees}</div>
            )}
            {!loadingList && employees.map((emp) => (
              <button key={emp.employeeId} onClick={() => loadEmployee(emp)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors ${selected?.employeeId === emp.employeeId ? "bg-blue-50/60" : "hover:bg-gray-50"}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                  {(emp.employeeName || emp.employeeEmail)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 truncate">{emp.employeeName || emp.employeeEmail}</div>
                  <div className="text-xs text-gray-400 truncate">{emp.employeeEmail}</div>
                  {emp.coveringFor && <div className="mt-1"><CoveringBadge coveringFor={emp.coveringFor} language={language} /></div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {!selected && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
              <Icon icon="tabler:user-search" className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm">{t.selectEmployeePrompt}</p>
            </div>
          )}

          {selected && loadingData && (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              {t.loading}
            </div>
          )}

          {selected && !loadingData && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {selected && !loadingData && !error && data && (
            <>
              {selected.coveringFor && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
                  <Icon icon="tabler:user-share" className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {isEn
                    ? <>{selected.employeeName || selected.employeeEmail} is on <b>{selected.coveringFor.name}</b>'s team. Changes you make here are saved for {selected.coveringFor.name}.</>
                    : <>{selected.employeeName || selected.employeeEmail} tillhör <b>{selected.coveringFor.name}</b>s team. Ändringar du gör här sparas för {selected.coveringFor.name}.</>}
                </div>
              )}

              {saveMsg && (
                <div className={`rounded-xl px-4 py-2.5 text-sm ${saveMsg === t.saved ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                  {saveMsg}
                </div>
              )}

              {/* ── Personal Information ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader icon="tabler:id-badge-2" title={t.personalInfoSection} />
                {pi ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <InfoField label={t.nameLabel} value={`${pi.firstName ?? ""} ${pi.lastName ?? ""}`.trim()} />
                      <InfoField label={t.titleLabel} value={pi.title} />
                      <InfoField label={t.phoneLabel} value={pi.phoneNumber} />
                      <InfoField label={t.workPhoneLabel} value={pi.workPhoneNumber} />
                      <InfoField label={t.privateEmailLabel} value={pi.privateEmail} />
                      <InfoField label={t.workEmailLabel} value={pi.workEmail} />
                      <InfoField label={t.addressLabel} value={pi.homeAddress} />
                      <InfoField label={t.dateOfBirthLabel} value={fmtDate(pi.dateOfBirth)} />
                      <InfoField label={t.genderLabel} value={pi.gender} />
                    </div>

                    {pi.professionalPresentation && (
                      <div className="mt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{t.professionalSummaryLabel}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{pi.professionalPresentation}</p>
                      </div>
                    )}
                    {pi.personalPresentation && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{t.aboutLabel}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{pi.personalPresentation}</p>
                      </div>
                    )}

                    {hasSocial && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                        {pi.socialLinks?.linkedIn && (
                          <a href={pi.socialLinks.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-700">
                            <Icon icon="tabler:brand-linkedin" className="w-4 h-4" /> LinkedIn
                          </a>
                        )}
                        {pi.socialLinks?.x && (
                          <a href={pi.socialLinks.x} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-700">
                            <Icon icon="tabler:brand-x" className="w-4 h-4" /> X
                          </a>
                        )}
                        {pi.socialLinks?.gitHub && (
                          <a href={pi.socialLinks.gitHub} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-700">
                            <Icon icon="tabler:brand-github" className="w-4 h-4" /> GitHub
                          </a>
                        )}
                        {pi.socialLinks?.website && (
                          <a href={pi.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-700">
                            <Icon icon="tabler:world" className="w-4 h-4" /> Website
                          </a>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">{t.noPersonalInfo}</p>
                )}
              </div>

              {/* ── Emergency Contact (read-only — employee's own data) ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader icon="tabler:phone-call" title={t.emergencyContactSection} />
                {pi?.emergencyContact && (pi.emergencyContact.firstName || pi.emergencyContact.lastName || pi.emergencyContact.relationship || pi.emergencyContact.email || pi.emergencyContact.phoneNumber) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InfoField label={t.emergencyContactNameLabel} value={`${pi.emergencyContact.firstName ?? ""} ${pi.emergencyContact.lastName ?? ""}`.trim()} />
                    <InfoField label={t.emergencyRelationshipLabel} value={pi.emergencyContact.relationship} />
                    <InfoField label={t.emergencyPhoneLabel} value={pi.emergencyContact.phoneNumber} />
                    <InfoField label={t.emergencyEmailLabel} value={pi.emergencyContact.email} />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t.noEmergencyContact}</p>
                )}
              </div>

              {/* ── Employee Details (read-only — the employee's own "Present Employment Details") ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-3">
                  <SectionHeader icon="tabler:file-description" title={t.employeeDetailsSection} />
                  {ed && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100 flex-shrink-0">
                      {label(STATUS_LABELS, ed.employmentStatus, lang)}
                    </span>
                  )}
                </div>

                {employmentState === "loading" && !ed && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    {t.loading}
                  </div>
                )}
                {employmentState === "forbidden" && (
                  <p className="text-sm text-gray-400">
                    {isEn ? "Your access level doesn't include employment details." : "Din åtkomstnivå omfattar inte anställningsuppgifter."}
                  </p>
                )}
                {employmentState === "error" && !ed && (
                  <div className="flex items-center gap-3 text-sm text-red-600">
                    {isEn ? "Couldn't load employment details." : "Kunde inte ladda anställningsuppgifterna."}
                    <button onClick={() => selected && loadEmployment(selected.employeeId)} className="underline font-medium">
                      {isEn ? "Try again" : "Försök igen"}
                    </button>
                  </div>
                )}
                {employmentState === "ok" && !ed && (
                  <p className="text-sm text-gray-400">{t.noEmploymentDetails}</p>
                )}

                {ed && edRules && (
                  <div className="space-y-5">
                    {/* 1. Current employment */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2.5">{isEn ? "Current employment" : "Nuvarande anställning"}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {edRules.showEmployer && <InfoField label={ed.employmentStatus === "self_employed" ? (isEn ? "Company" : "Företag") : (isEn ? "Employer" : "Arbetsgivare")} value={ed.employerName} />}
                        <InfoField label={edRules.working ? (isEn ? "Current job title" : "Nuvarande befattning") : (isEn ? "Latest job title" : "Senaste befattning")} value={ed.presentTitle} />
                        <InfoField label={isEn ? "Department / field" : "Avdelning / område"} value={ed.workArea} />
                        {edRules.showEmploymentType && <InfoField label={isEn ? "Employment type" : "Anställningsform"} value={label(TYPE_LABELS, ed.employmentType, lang)} />}
                        {edRules.showStartDate && <InfoField label={isEn ? "Start date" : "Startdatum"} value={fmtFullDate(ed.employmentDate)} />}
                        {edRules.showEndDate && <InfoField label={isEn ? "End date" : "Slutdatum"} value={fmtFullDate(ed.employmentEndDate) || (isEn ? "Ongoing" : "Pågående")} />}
                        {edRules.showEmploymentRate && <InfoField label={isEn ? "Employment rate" : "Sysselsättningsgrad"} value={ed.employmentRate} />}
                      </div>
                    </div>

                    {/* 2. Workplace */}
                    {edRules.showWorkplace && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2.5">{isEn ? "Workplace" : "Arbetsplats"}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <InfoField label={isEn ? "Work city / municipality" : "Arbetsort / kommun"} value={ed.officeLocation} />
                          <InfoField label={isEn ? "Work arrangement" : "Arbetsupplägg"} value={label(ARRANGEMENT_LABELS, ed.workArrangement, lang)} />
                          <InfoField label={isEn ? "Work address" : "Adress"} value={ed.homeAddress} />
                        </div>
                      </div>
                    )}

                    {/* 3. Salary & compensation */}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2.5">{isEn ? "Salary & compensation" : "Lön & ersättning"}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {edRules.showCurrentSalary && (
                          <InfoField label={isEn ? "Gross monthly salary" : "Bruttolön / månad"} value={money(ed.salaryLevel, ed.salaryCurrency)} />
                        )}
                        <InfoField
                          label={edRules.consultant ? (isEn ? "Rate (arvode)" : "Arvode") : (isEn ? "Expected salary / rate" : "Önskad lön / ersättning")}
                          value={money(ed.feeRate, ed.feeCurrency, label(RATE_TYPE_LABELS, ed.feeRateType, lang))}
                        />
                      </div>
                    </div>

                    {/* 4. Preferences & availability */}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2.5">{isEn ? "Preferences & availability" : "Preferenser & tillgänglighet"}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {edRules.showNoticePeriod && <InfoField label={isEn ? "Notice period" : "Uppsägningstid"} value={label(NOTICE_LABELS, ed.noticePeriod, lang)} />}
                        <InfoField label={isEn ? "Available from" : "Tillgänglig från"} value={fmtFullDate(ed.availableFrom)} />
                        <InfoField label={isEn ? "Preferred location" : "Önskad arbetsort"} value={ed.preferredLocation} />
                        <InfoField label={isEn ? "Secondary location" : "Alternativ arbetsort"} value={ed.secondaryLocation} />
                        <InfoField label={isEn ? "Willing to travel" : "Kan resa i arbetet"} value={label(TRAVEL_LABELS, ed.canTravel, lang)} />
                        <InfoField label={isEn ? "Assignments abroad" : "Uppdrag utomlands"} value={label(TRAVEL_LABELS, ed.assignmentAbroad, lang)} />
                      </div>
                    </div>

                    {employmentUpdatedAt && (
                      <p className="text-xs text-gray-300 pt-3 border-t border-gray-100">
                        {isEn ? "Last updated by the employee" : "Senast uppdaterad av medarbetaren"}: {fmtFullDate(employmentUpdatedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Work Experience ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader icon="tabler:briefcase" title={t.workExperienceSection} />
                {cv?.experience && cv.experience.length > 0 ? (
                  <div className="space-y-4">
                    {cv.experience.map((exp, i) => (
                      <div key={i} className={i > 0 ? "pt-4 border-t border-gray-100" : ""}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{exp.title}</p>
                            <p className="text-xs text-gray-500">{exp.employer}</p>
                          </div>
                          <p className="text-xs text-gray-400 flex-shrink-0">
                            {fmtDate(exp.startDate)} – {exp.ongoing ? t.present : fmtDate(exp.endDate)}
                          </p>
                        </div>
                        {exp.description && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t.noWorkExperience}</p>
                )}
              </div>

              {/* ── Qualifications & Background ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader icon="tabler:award" title={t.qualificationsSection} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Skills */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.skills}</p>
                    {cv?.skills && cv.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {cv.skills.map((s, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{s.skillName}</span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-gray-400">{t.noneListed}</p>}
                  </div>

                  {/* Languages */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.languagesLabel}</p>
                    {cv?.languages && cv.languages.length > 0 ? (
                      <div className="space-y-1">
                        {cv.languages.map((l, i) => (
                          <p key={i} className="text-sm text-gray-700">{l.language} <span className="text-gray-400 text-xs capitalize">— {l.level}</span></p>
                        ))}
                      </div>
                    ) : <p className="text-sm text-gray-400">{t.noneListed}</p>}
                  </div>

                  {/* Certifications */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.certificationsLabel}</p>
                    {cv?.certifications && cv.certifications.length > 0 ? (
                      <div className="space-y-2">
                        {cv.certifications.map((c, i) => (
                          <div key={i}>
                            <p className="text-sm text-gray-700 font-medium">{c.title}</p>
                            {c.issuer && <p className="text-xs text-gray-400">{c.issuer}</p>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-gray-400">{t.noneListed}</p>}
                  </div>

                  {/* Projects */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.projectsLabel}</p>
                    {cv?.projects && cv.projects.length > 0 ? (
                      <div className="space-y-2">
                        {cv.projects.map((p, i) => (
                          <div key={i}>
                            <p className="text-sm text-gray-700 font-medium">{p.role}{p.company ? ` · ${p.company}` : ""}</p>
                            {p.description && <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-gray-400">{t.noneListed}</p>}
                  </div>

                  {/* References */}
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.referencesLabel}</p>
                    {cv?.references && cv.references.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {cv.references.map((r, i) => (
                          <div key={i} className="p-3 rounded-xl bg-gray-50/70">
                            <p className="text-sm text-gray-800 font-medium">{r.firstName} {r.lastName}</p>
                            <p className="text-xs text-gray-500">{r.positionTitle}{r.company ? ` at ${r.company}` : ""}</p>
                            {r.email && <p className="text-xs text-gray-400 mt-0.5">{r.email}</p>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-gray-400">{t.noneListed}</p>}
                  </div>
                </div>

                {cv?.name && <p className="text-xs text-gray-300 mt-5 pt-4 border-t border-gray-100">{t.sourceLabel}: {cv.name}</p>}
                {!cv && <p className="text-sm text-gray-400">{t.noCVYet}</p>}
              </div>

              {/* ── Employment Information (editable) ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader icon="tabler:building-store" title={t.employmentDetailsSection} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.jobTitleLabel}</label>
                    <input className={inputCls} value={employmentInfo.jobTitle} onChange={(e) => setEmploymentInfo((p) => ({ ...p, jobTitle: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.departmentLabelProfile}</label>
                    <input className={inputCls} value={employmentInfo.department} onChange={(e) => setEmploymentInfo((p) => ({ ...p, department: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.employmentTypeLabel}</label>
                    <select className={`${inputCls} cursor-pointer`} value={employmentInfo.employmentType} onChange={(e) => setEmploymentInfo((p) => ({ ...p, employmentType: e.target.value }))}>
                      <option value="full-time">{t.fullTime}</option>
                      <option value="part-time">{t.partTime}</option>
                      <option value="contract">{t.contractType}</option>
                      <option value="intern">{t.internType}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.startDateLabel}</label>
                    <input type="date" className={inputCls} value={employmentInfo.startDate} onChange={(e) => setEmploymentInfo((p) => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.statusLabel}</label>
                    <select className={`${inputCls} cursor-pointer`} value={employmentInfo.status} onChange={(e) => setEmploymentInfo((p) => ({ ...p, status: e.target.value }))}>
                      <option value="active">{t.activeStatus}</option>
                      <option value="on-leave">{t.onLeaveStatus}</option>
                      <option value="terminated">{t.terminatedStatus}</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => save({ employmentInfo })} disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:shadow-md transition-all" style={{ backgroundColor: NAVY }}>
                    {t.saveBtn}
                  </button>
                </div>
              </div>

              {/* ── Upcoming Events (editable) ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader icon="tabler:calendar-event" title={t.upcomingEventsSection} />
                  <button onClick={addEvent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <Icon icon="tabler:plus" className="w-3.5 h-3.5" /> {t.addEventBtn}
                  </button>
                </div>
                {events.length === 0 && <p className="text-sm text-gray-400">{t.noUpcomingEvents}</p>}
                <div className="space-y-3">
                  {events.map((ev, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-3 rounded-xl bg-gray-50/70">
                      <input className={`${inputCls} sm:col-span-4`} placeholder={t.eventTitlePlaceholder} value={ev.title} onChange={(e) => updateEvent(i, "title", e.target.value)} />
                      <input type="date" className={`${inputCls} sm:col-span-3`} value={ev.date ? ev.date.slice(0, 10) : ""} onChange={(e) => updateEvent(i, "date", e.target.value)} />
                      <select className={`${inputCls} sm:col-span-3 cursor-pointer`} value={ev.eventType} onChange={(e) => updateEvent(i, "eventType", e.target.value)}>
                        <option value="meeting">{t.meetingType}</option>
                        <option value="review">{t.reviewType}</option>
                        <option value="training">{t.trainingType}</option>
                        <option value="other">{t.otherType}</option>
                      </select>
                      <button onClick={() => removeEvent(i)} className="sm:col-span-2 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-xs font-medium">
                        <Icon icon="tabler:trash" className="w-3.5 h-3.5" /> {t.removeBtn}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => save({ upcomingEvents: events })} disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:shadow-md transition-all" style={{ backgroundColor: NAVY }}>
                    {t.saveBtn}
                  </button>
                </div>
              </div>

              {/* ── Leave & Vacation Balance (editable) ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader icon="tabler:beach" title={t.leaveBalanceSection} />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { key: "vacationDaysTotal" as const, label: t.vacationTotalLabel },
                    { key: "vacationDaysUsed" as const, label: t.vacationUsedLabel },
                    { key: "sickDaysTotal" as const, label: t.sickTotalLabel },
                    { key: "sickDaysUsed" as const, label: t.sickUsedLabel },
                    { key: "otherLeaveDays" as const, label: t.otherLeaveLabel },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                      <input type="number" min={0} className={inputCls} value={leaveBalance[f.key]}
                        onChange={(e) => setLeaveBalance((p) => ({ ...p, [f.key]: Number(e.target.value) }))} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => save({ leaveBalance })} disabled={saving}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:shadow-md transition-all" style={{ backgroundColor: NAVY }}>
                    {t.saveBtn}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
