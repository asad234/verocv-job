"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/PersonalInfoDialog.tsx
// WHAT IT DOES:   The contract's information form (employer, employee, terms, salary…).
//                 Missing required fields get a red border + pink background (and a
//                 "Required" hint) after "Save Information", or right away when opened
//                 because "Send for Signature" was blocked. The first one is scrolled into view.
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useState, useMemo, useRef, useEffect } from "react"
import { Icon } from "@iconify/react"
import type {
  EmployeeContract, ContractType, EmploymentExtent,
  NoticePeriod, PayDay, VacationDaysOption, YesNo,
} from "@/utils/contractsStore"
import EmployeePicker, { type ManagedEmployee } from "./Employeepicker"

const NAVY = "rgb(5,22,80)"

const FieldLabel: React.FC<{ label: string; required?: boolean; invalid?: boolean }> = ({ label, required, invalid }) => (
  <label className={`block text-xs font-medium mb-1 ${invalid ? "text-red-600" : "text-gray-600"}`}>
    {label} {required && <span className="text-red-500">*</span>}
  </label>
)

/** Small "Required" hint under a field that's still empty. */
const MissingHint: React.FC<{ show: boolean; isEn: boolean }> = ({ show, isEn }) =>
  show ? (
    <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
      <Icon icon="tabler:alert-circle" className="w-3 h-3" />
      {isEn ? "Required" : "Obligatoriskt"}
    </p>
  ) : null

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100"
const selectCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100"
/** Missing required field: red border + pink background. */
const invalidCls = "w-full px-3 py-2 rounded-lg border-2 border-red-400 bg-red-50 text-sm outline-none focus:ring-2 focus:ring-red-100"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1
    ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

/** "" for an empty date input, otherwise an ISO string (never throws on empty input). */
const dateInputToIso = (value: string) => (value ? new Date(value).toISOString() : "")

export interface PersonalInfoFormData {
  companyName?: string
  orgNumber?: string
  companyAddress?: string
  contactPerson?: string
  employeeId: string
  employeeName: string
  employeeInitials: string
  employeeTitle: string
  /** The chosen employee's VeroCV account email — "" when no employee is chosen. */
  recipientEmail: string
  personalNumber?: string
  employeeAddress?: string
  positionTitle?: string
  workplace?: string
  contractType: ContractType
  startDate: string
  endDate: string | null
  employmentExtent: EmploymentExtent
  noticePeriod?: NoticePeriod
  monthlySalaryAmount?: string
  payDay?: PayDay
  vacationDaysPerYear?: VacationDaysOption
  otherBenefits?: string
  otherNotes?: string
  hasCollectiveAgreement?: YesNo
  signingPlace?: string
  signingDate?: string
}

interface PersonalInfoDialogProps {
  isEn: boolean
  initial: EmployeeContract
  onClose: () => void
  onSave: (data: PersonalInfoFormData) => void
  /** Highlight the missing required fields right away (e.g. opened because sending was blocked). */
  highlightMissing?: boolean
}

/** Required fields, in the order they appear in the form. */
type RequiredKey =
  | "companyName" | "orgNumber" | "companyAddress" | "employeeName" | "personalNumber"
  | "employeeAddress" | "positionTitle" | "workplace" | "startDate" | "noticePeriod"
  | "monthlySalaryAmount" | "payDay" | "vacationDaysPerYear" | "hasCollectiveAgreement"
  | "signingPlace" | "signingDate"

export default function PersonalInfoDialog({ isEn, initial, onClose, onSave, highlightMissing = false }: PersonalInfoDialogProps) {
  const [form, setForm] = useState<PersonalInfoFormData>({
    companyName: initial.companyName ?? "",
    orgNumber: initial.orgNumber ?? "",
    companyAddress: initial.companyAddress ?? "",
    contactPerson: initial.contactPerson ?? "",
    employeeId: initial.employeeId ?? "",
    employeeName: initial.employeeName ?? "",
    employeeInitials: initial.employeeInitials ?? "",
    employeeTitle: initial.employeeTitle ?? "",
    recipientEmail: initial.recipientEmail ?? "",
    personalNumber: initial.personalNumber ?? "",
    employeeAddress: initial.employeeAddress ?? "",
    positionTitle: initial.positionTitle ?? "",
    workplace: initial.workplace ?? "",
    contractType: initial.contractType,
    startDate: initial.startDate,
    endDate: initial.endDate,
    employmentExtent: initial.employmentExtent,
    noticePeriod: initial.noticePeriod ?? "",
    monthlySalaryAmount: initial.monthlySalaryAmount ?? "",
    payDay: initial.payDay ?? "",
    vacationDaysPerYear: initial.vacationDaysPerYear ?? "",
    otherBenefits: initial.otherBenefits ?? "",
    otherNotes: initial.otherNotes ?? "",
    hasCollectiveAgreement: initial.hasCollectiveAgreement ?? "",
    signingPlace: initial.signingPlace ?? "",
    signingDate: initial.signingDate ?? new Date().toISOString(),
  })
  const [showValidation, setShowValidation] = useState(highlightMissing)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [prefilling, setPrefilling] = useState(false)
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false)
  const latestPickRef = useRef<string>("")

  const set = <K extends keyof PersonalInfoFormData>(key: K, value: PersonalInfoFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  /* ── Employee picker: link the account and pre-fill from their profile ── */
  const handlePickEmployee = async (emp: ManagedEmployee | null) => {
    latestPickRef.current = emp?.employeeId ?? ""
    setPrefilledFromProfile(false)

    if (!emp) {
      setForm(prev => ({ ...prev, employeeId: "", recipientEmail: "" }))
      return
    }

    const name = emp.employeeName || emp.employeeEmail
    setForm(prev => {
      const switchedPerson = prev.employeeId !== emp.employeeId
      return {
        ...prev,
        employeeId: emp.employeeId,
        recipientEmail: emp.employeeEmail,
        employeeName: name,
        employeeInitials: initials(name),
        // These belonged to the previously chosen person — don't carry them over.
        ...(switchedPerson ? { personalNumber: "", employeeAddress: "", employeeTitle: "" } : {}),
      }
    })

    // Same data source as the Employee Profile page (accepted-invitation check server-side).
    setPrefilling(true)
    try {
      const res = await fetch(`/api/company/managers/employees/${emp.employeeId}/hr-info`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error()
      const body = await res.json()
      if (latestPickRef.current !== emp.employeeId) return // a different employee was picked meanwhile

      const pi = body.personalInformation
      const ed = body.employmentDetails
      const hr = body.hrInfo

      const fullName = [pi?.firstName, pi?.lastName].filter(Boolean).join(" ").trim()
      const address: string = pi?.homeAddress || ed?.homeAddress || ""
      const jobTitle: string = hr?.employmentInfo?.jobTitle || ed?.presentTitle || pi?.title || ""
      const office: string = ed?.officeLocation || ""

      // Only fill fields that are still empty — never overwrite what the manager typed.
      setForm(prev => {
        if (prev.employeeId !== emp.employeeId) return prev
        const resolvedName = fullName || prev.employeeName
        return {
          ...prev,
          employeeName: resolvedName,
          employeeInitials: initials(resolvedName),
          employeeTitle: prev.employeeTitle?.trim() ? prev.employeeTitle : jobTitle,
          employeeAddress: prev.employeeAddress?.trim() ? prev.employeeAddress : address,
          positionTitle: prev.positionTitle?.trim() ? prev.positionTitle : jobTitle,
          workplace: prev.workplace?.trim() ? prev.workplace : office,
        }
      })
      setPrefilledFromProfile(true)
    } catch {
      // Pre-filling is a convenience — the link to the employee is already set.
    } finally {
      if (latestPickRef.current === emp.employeeId) setPrefilling(false)
    }
  }

  const missingFields = useMemo(() => {
    const req: [RequiredKey, string][] = [
      ["companyName", isEn ? "Company name" : "Företagsnamn"],
      ["orgNumber", isEn ? "Organization number" : "Organisationsnummer"],
      ["companyAddress", isEn ? "Company address" : "Företagets adress"],
      ["employeeName", isEn ? "Employee name" : "Arbetstagarens namn"],
      ["personalNumber", isEn ? "Personal number" : "Personnummer"],
      ["employeeAddress", isEn ? "Employee address" : "Arbetstagarens adress"],
      ["positionTitle", isEn ? "Position / Title" : "Befattning/Titel"],
      ["workplace", isEn ? "Workplace" : "Arbetsplats"],
      ["startDate", isEn ? "Start date" : "Tillträdesdatum"],
      ["noticePeriod", isEn ? "Notice period" : "Uppsägningstid"],
      ["monthlySalaryAmount", isEn ? "Monthly salary" : "Månadslön"],
      ["payDay", isEn ? "Pay day" : "Löneutbetalningsdag"],
      ["vacationDaysPerYear", isEn ? "Vacation days" : "Semesterdagar"],
      ["hasCollectiveAgreement", isEn ? "Collective agreement" : "Kollektivavtal"],
      ["signingPlace", isEn ? "Place" : "Ort"],
      ["signingDate", isEn ? "Date" : "Datum"],
    ]
    return req.filter(([key]) => {
      const val = form[key]
      return !val || (typeof val === "string" && val.trim() === "")
    })
  }, [form, isEn])

  const missingRequired = missingFields.map(([, label]) => label)
  const missingKeys = useMemo(() => new Set(missingFields.map(([key]) => key)), [missingFields])

  /** true → this required field is empty and should be shown in red. */
  const isInvalid = (key: RequiredKey) => showValidation && missingKeys.has(key)
  const inputClass = (key: RequiredKey) => (isInvalid(key) ? invalidCls : inputCls)
  const selectClass = (key: RequiredKey) => (isInvalid(key) ? invalidCls : selectCls)

  /** Scroll to (and focus) the first missing field so the manager sees it straight away. */
  const scrollToFirstMissing = () => {
    const first = missingFields[0]?.[0]
    if (!first) return
    requestAnimationFrame(() => {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)
      if (!el) return
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.focus({ preventScroll: true })
    })
  }

  // Opened because sending was blocked → jump to the first missing field.
  useEffect(() => {
    if (highlightMissing) scrollToFirstMissing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = () => {
    if (missingRequired.length > 0) {
      setShowValidation(true)
      scrollToFirstMissing()
      return
    }
    onSave(form)
    onClose()
  }

  const handleSaveAnyway = () => {
    // Lets the manager close the dialog and keep working even with gaps —
    // "Send for Signature" still enforces completeness (client and server).
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={scrollRef} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10">

        <div className="sticky top-0 bg-white z-20 flex items-center justify-between px-5 py-4 border-b border-gray-100 rounded-t-2xl">
          <div>
            <h2 className="font-semibold text-gray-800 text-base">
              {isEn ? "Fill In Employment Agreement" : "Fyll i Anställningsavtal"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEn
                ? "Fill in the form below to generate your employment agreement as a PDF."
                : "Fyll i formuläret nedan för att generera ditt anställningsavtal som PDF."}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 flex-shrink-0">
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {showValidation && missingRequired.length > 0 && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
              <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {isEn ? "Please fill in the following required fields: " : "Fyll i följande obligatoriska fält: "}
                <span className="font-medium">{missingRequired.join(", ")}</span>
              </span>
            </div>
          )}

          {/* ── Arbetsgivare ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 pt-1">
              <Icon icon="tabler:building" className="w-3.5 h-3.5" />
              {isEn ? "Employer" : "Arbetsgivare"}
            </div>
            <div>
              <FieldLabel label={isEn ? "Company Name" : "Företagsnamn"} required invalid={isInvalid("companyName")} />
              <input type="text" value={form.companyName} onChange={e => set("companyName", e.target.value)} data-field="companyName" aria-invalid={isInvalid("companyName")} className={inputClass("companyName")} />
              <MissingHint show={isInvalid("companyName")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Organization Number" : "Organisationsnummer"} required invalid={isInvalid("orgNumber")} />
              <input type="text" value={form.orgNumber} onChange={e => set("orgNumber", e.target.value)} placeholder="XXXXXX-XXXX" data-field="orgNumber" aria-invalid={isInvalid("orgNumber")} className={inputClass("orgNumber")} />
              <MissingHint show={isInvalid("orgNumber")} isEn={isEn} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel label={isEn ? "Address" : "Adress"} required invalid={isInvalid("companyAddress")} />
              <input type="text" value={form.companyAddress} onChange={e => set("companyAddress", e.target.value)} data-field="companyAddress" aria-invalid={isInvalid("companyAddress")} className={inputClass("companyAddress")} />
              <MissingHint show={isInvalid("companyAddress")} isEn={isEn} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel label={isEn ? "Contact Person" : "Kontaktperson"} />
              <input type="text" value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* ── Arbetstagare ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 pt-3">
              <Icon icon="tabler:user" className="w-3.5 h-3.5" />
              {isEn ? "Employee" : "Arbetstagare"}
            </div>

            <div className="sm:col-span-2">
              <FieldLabel label={isEn ? "Choose Employee" : "Välj Medarbetare"} />
              <EmployeePicker
                isEn={isEn}
                value={form.employeeId}
                fallbackName={form.employeeName}
                onSelect={handlePickEmployee}
              />
              <div className="mt-1.5 min-h-[16px] text-[11px]">
                {prefilling && (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    {isEn ? "Fetching employee details…" : "Hämtar medarbetarens uppgifter…"}
                  </span>
                )}
                {!prefilling && prefilledFromProfile && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Icon icon="tabler:check" className="w-3 h-3" />
                    {isEn
                      ? "Details filled in from the employee's profile — review before saving."
                      : "Uppgifter ifyllda från medarbetarens profil — granska innan du sparar."}
                  </span>
                )}
                {!prefilling && !prefilledFromProfile && !form.employeeId && (
                  <span className="text-gray-400">
                    {isEn
                      ? "Optional — the contract is sent to the chosen employee's VeroCV dashboard. If you don't choose anyone, you'll enter the email of their VeroCV account when sending."
                      : "Valfritt — kontraktet skickas till den valda medarbetarens VeroCV-dashboard. Väljer du ingen anger du e-postadressen till deras VeroCV-konto när du skickar."}
                  </span>
                )}
                {!prefilling && !prefilledFromProfile && form.employeeId && form.recipientEmail && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <Icon icon="tabler:mail" className="w-3 h-3" />
                    {isEn ? "Will be sent to" : "Skickas till"} {form.recipientEmail}
                  </span>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel label={isEn ? "Employee Name" : "Arbetstagarens Namn"} required invalid={isInvalid("employeeName")} />
              <input type="text" value={form.employeeName}
                onChange={e => { set("employeeName", e.target.value); set("employeeInitials", initials(e.target.value)) }}
                placeholder={isEn ? "e.g. Jonas Ekström" : "t.ex. Jonas Ekström"} data-field="employeeName" aria-invalid={isInvalid("employeeName")} className={inputClass("employeeName")} />
              <MissingHint show={isInvalid("employeeName")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Personal Number" : "Personnummer"} required invalid={isInvalid("personalNumber")} />
              <input type="text" value={form.personalNumber} onChange={e => set("personalNumber", e.target.value)} placeholder="ÅÅÅÅMMDD-XXXX" data-field="personalNumber" aria-invalid={isInvalid("personalNumber")} className={inputClass("personalNumber")} />
              <MissingHint show={isInvalid("personalNumber")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Address" : "Adress"} required invalid={isInvalid("employeeAddress")} />
              <input type="text" value={form.employeeAddress} onChange={e => set("employeeAddress", e.target.value)} data-field="employeeAddress" aria-invalid={isInvalid("employeeAddress")} className={inputClass("employeeAddress")} />
              <MissingHint show={isInvalid("employeeAddress")} isEn={isEn} />
            </div>
          </div>

          {/* ── Anställningsvillkor ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 pt-3">
              <Icon icon="tabler:briefcase" className="w-3.5 h-3.5" />
              {isEn ? "Employment Terms" : "Anställningsvillkor"}
            </div>
            <div>
              <FieldLabel label={isEn ? "Position / Title" : "Befattning/Titel"} required invalid={isInvalid("positionTitle")} />
              <input type="text" value={form.positionTitle} onChange={e => set("positionTitle", e.target.value)} data-field="positionTitle" aria-invalid={isInvalid("positionTitle")} className={inputClass("positionTitle")} />
              <MissingHint show={isInvalid("positionTitle")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Workplace" : "Arbetsplats"} required invalid={isInvalid("workplace")} />
              <input type="text" value={form.workplace} onChange={e => set("workplace", e.target.value)} data-field="workplace" aria-invalid={isInvalid("workplace")} className={inputClass("workplace")} />
              <MissingHint show={isInvalid("workplace")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Employment Form" : "Anställningsform"} required />
              <select value={form.contractType} onChange={e => set("contractType", e.target.value as ContractType)} className={selectCls}>
                <option value="permanent">{isEn ? "Permanent Employment" : "Tillsvidareanställning"}</option>
                <option value="temporary">{isEn ? "Fixed-term Employment" : "Visstidsanställning"}</option>
                <option value="on_call">{isEn ? "On-call / Flexible Employment" : "Behovsanställning"}</option>
              </select>
            </div>
            <div>
              <FieldLabel label={isEn ? "Start Date" : "Tillträdesdatum"} required invalid={isInvalid("startDate")} />
              <input type="date" value={form.startDate ? form.startDate.slice(0, 10) : ""}
                onChange={e => set("startDate", dateInputToIso(e.target.value))} data-field="startDate" aria-invalid={isInvalid("startDate")} className={inputClass("startDate")} />
              <MissingHint show={isInvalid("startDate")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Working Hours" : "Arbetstid"} required />
              <select value={form.employmentExtent} onChange={e => set("employmentExtent", e.target.value as EmploymentExtent)} className={selectCls}>
                <option value="full_time">{isEn ? "Full-time (40 hrs/week)" : "Heltid (40 tim/vecka)"}</option>
                <option value="part_time">{isEn ? "Part-time" : "Deltid"}</option>
              </select>
            </div>
            <div>
              <FieldLabel label={isEn ? "Notice Period" : "Uppsägningstid"} required invalid={isInvalid("noticePeriod")} />
              <select value={form.noticePeriod} onChange={e => set("noticePeriod", e.target.value as NoticePeriod)} data-field="noticePeriod" aria-invalid={isInvalid("noticePeriod")} className={selectClass("noticePeriod")}>
                <option value="" disabled>{isEn ? "Choose…" : "Välj…"}</option>
                <option value="1_month">{isEn ? "1 month" : "1 månad"}</option>
                <option value="2_months">{isEn ? "2 months" : "2 månader"}</option>
                <option value="3_months">{isEn ? "3 months" : "3 månader"}</option>
              </select>
              <MissingHint show={isInvalid("noticePeriod")} isEn={isEn} />
            </div>
            {form.contractType !== "permanent" && (
              <div>
                <FieldLabel label={isEn ? "End Date" : "Slutdatum"} />
                <input type="date" value={form.endDate ? form.endDate.slice(0, 10) : ""}
                  onChange={e => set("endDate", e.target.value ? dateInputToIso(e.target.value) : null)} className={inputCls} />
              </div>
            )}
          </div>

          {/* ── Lön och förmåner ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 pt-3">
              <Icon icon="tabler:coin" className="w-3.5 h-3.5" />
              {isEn ? "Salary & Benefits" : "Lön och Förmåner"}
            </div>
            <div>
              <FieldLabel label={isEn ? "Monthly Salary (SEK)" : "Månadslön (SEK)"} required invalid={isInvalid("monthlySalaryAmount")} />
              <input type="text" inputMode="numeric" value={form.monthlySalaryAmount} onChange={e => set("monthlySalaryAmount", e.target.value)} placeholder="45 000" data-field="monthlySalaryAmount" aria-invalid={isInvalid("monthlySalaryAmount")} className={inputClass("monthlySalaryAmount")} />
              <MissingHint show={isInvalid("monthlySalaryAmount")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Pay Day" : "Löneutbetalningsdag"} required invalid={isInvalid("payDay")} />
              <select value={form.payDay} onChange={e => set("payDay", e.target.value as PayDay)} data-field="payDay" aria-invalid={isInvalid("payDay")} className={selectClass("payDay")}>
                <option value="" disabled>{isEn ? "Choose…" : "Välj…"}</option>
                <option value="25th">{isEn ? "The 25th every month" : "Den 25:e varje månad"}</option>
                <option value="last_business_day">{isEn ? "Last business day of the month" : "Sista vardagen varje månad"}</option>
              </select>
              <MissingHint show={isInvalid("payDay")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Vacation Days per Year" : "Semesterdagar per år"} required invalid={isInvalid("vacationDaysPerYear")} />
              <select value={form.vacationDaysPerYear} onChange={e => set("vacationDaysPerYear", e.target.value as VacationDaysOption)} data-field="vacationDaysPerYear" aria-invalid={isInvalid("vacationDaysPerYear")} className={selectClass("vacationDaysPerYear")}>
                <option value="" disabled>{isEn ? "Choose…" : "Välj…"}</option>
                <option value="25">{isEn ? "25 days" : "25 dagar"}</option>
                <option value="28">{isEn ? "28 days" : "28 dagar"}</option>
                <option value="30">{isEn ? "30 days" : "30 dagar"}</option>
              </select>
              <MissingHint show={isInvalid("vacationDaysPerYear")} isEn={isEn} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel label={isEn ? "Other Benefits" : "Övriga Förmåner"} />
              <textarea value={form.otherBenefits} onChange={e => set("otherBenefits", e.target.value)} rows={2}
                placeholder={isEn ? "e.g. wellness allowance, company phone…" : "t.ex. friskvårdsbidrag, tjänstetelefon…"}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          {/* ── Övrigt & Kollektivavtal ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 pt-3">
              <Icon icon="tabler:file-info" className="w-3.5 h-3.5" />
              {isEn ? "Other & Collective Agreement" : "Övrigt & Kollektivavtal"}
            </div>
            <div className="sm:col-span-2">
              <FieldLabel label={isEn ? "Other" : "Övrigt"} />
              <textarea value={form.otherNotes} onChange={e => set("otherNotes", e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <FieldLabel label={isEn ? "Collective Agreement" : "Kollektivavtal"} required invalid={isInvalid("hasCollectiveAgreement")} />
              <select value={form.hasCollectiveAgreement} onChange={e => set("hasCollectiveAgreement", e.target.value as YesNo)} data-field="hasCollectiveAgreement" aria-invalid={isInvalid("hasCollectiveAgreement")} className={selectClass("hasCollectiveAgreement")}>
                <option value="" disabled>{isEn ? "Choose…" : "Välj…"}</option>
                <option value="yes">{isEn ? "Yes" : "Ja"}</option>
                <option value="no">{isEn ? "No" : "Nej"}</option>
              </select>
              <MissingHint show={isInvalid("hasCollectiveAgreement")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Place" : "Ort"} required invalid={isInvalid("signingPlace")} />
              <input type="text" value={form.signingPlace} onChange={e => set("signingPlace", e.target.value)} data-field="signingPlace" aria-invalid={isInvalid("signingPlace")} className={inputClass("signingPlace")} />
              <MissingHint show={isInvalid("signingPlace")} isEn={isEn} />
            </div>
            <div>
              <FieldLabel label={isEn ? "Date" : "Datum"} required invalid={isInvalid("signingDate")} />
              <input type="date" value={form.signingDate ? form.signingDate.slice(0, 10) : ""}
                onChange={e => set("signingDate", dateInputToIso(e.target.value))} data-field="signingDate" aria-invalid={isInvalid("signingDate")} className={inputClass("signingDate")} />
              <MissingHint show={isInvalid("signingDate")} isEn={isEn} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <span className={`text-xs ${showValidation && missingRequired.length > 0 ? "text-red-500 font-medium" : "text-gray-400"}`}>
            {missingRequired.length > 0
              ? (isEn ? `${missingRequired.length} required field(s) remaining` : `${missingRequired.length} obligatoriska fält kvar`)
              : (isEn ? "All required fields filled" : "Alla obligatoriska fält ifyllda")}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveAnyway} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
              {isEn ? "Save & Close" : "Spara & Stäng"}
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
              style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:check" className="w-4 h-4" />
              {isEn ? "Save Information" : "Spara Information"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
