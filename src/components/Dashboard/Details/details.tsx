"use client"

// ══════════════════════════════════════════════════════════════════════
// Replaces your current EmploymentDetailsForm (same file, same export name).
//
// Present Employment Details — 4 sections:
//   1. Current employment   2. Workplace   3. Salary & compensation
//   4. Work preferences & availability
//
// Fields appear only when they apply:
//   • Not currently employed → no employer / type / dates / workplace / salary
//   • Self-employed or Consultant → rate (arvode) instead of monthly salary
//   • End date → only for fixed-term employment or while serving notice
//
// Loads/saves through /api/user/employment-details (validation is shared
// with the server in utils/employmentDetails.ts).
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Card from "../ReUsable/Card"
import { useAuth } from "@/hooks/auth"
import { useEmploymentDetailsStore } from "@/utils/employmentDetailtsStore"
import { mutate as swrMutate } from "swr"
import { EMPLOYMENT_DETAILS_KEY, toEmploymentRecord } from "@/hooks/details/useUserEmploymentDetails"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import {
  ABROAD_OPTIONS, ARRANGEMENT_LABELS, CURRENCIES, CURRENCY_LABELS, EMPLOYMENT_RATES, EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES, EMPTY_EMPLOYMENT_DETAILS, NOTICE_LABELS, NOTICE_PERIODS, RATE_TYPES_OFFERED, RATE_TYPE_LABELS,
  STATUS_LABELS, TRAVEL_LABELS, TRAVEL_OPTIONS, TYPE_LABELS, WORK_ARRANGEMENTS, fieldRules, label,
  normalizeEmploymentDetails, type EmploymentDetailsData, type EmploymentErrors, type Lang,
} from "@/utils/employmentDetails"

const NAVY = "rgb(5, 22, 80)"

interface EmploymentDetailsFormProps {
  /** Kept for compatibility with existing usages — the logged-in user is always used. */
  userId?: string
  initialData?: unknown
}

interface AddressSuggestion { display_name?: string }

const STATUS_ICONS: Record<string, string> = {
  employed: "💼", self_employed: "🧑‍💻", not_employed: "🔎", notice_period: "⏳",
}

/* ─── Texts ─── */
const TX = {
  en: {
    title: "Present Employment Details",
    subtitle: "Information about your current employment and work preferences.",
    s1: "Current Employment", s2: "Workplace Details", s3: "Salary & Compensation", s4: "Work Preferences & Availability",
    s3desc: "Optional — share only what you're comfortable with.",
    status: "Employment Status", statusHint: "Select your current situation",
    employer: "Employer / Company Name", employerSelf: "Company Name",
    jobTitle: "Current Job Title", jobTitleLatest: "Latest Job Title",
    department: "Department / Field of Work", fieldOfWork: "Field of Work",
    type: "Employment Type", start: "Employment Start Date", end: "Employment End Date",
    endHint: "Leave blank if ongoing. Only needed for fixed-term or ended employment.",
    rate: "Employment Rate (%)", rateHint: "100% = full-time employment.",
    city: "Work City / Municipality", address: "Work Address", addressHint: "Optional — the city is usually enough.",
    arrangement: "Work Arrangement",
    salary: "Current Gross Monthly Salary", salaryHint: "Per month, before tax (bruttolön). Optional.",
    currency: "Currency", expected: "Expected Salary / Rate", consultantRate: "Your Rate (arvode)",
    rateType: "Rate Type",
    preferred: "Preferred Work Location", secondary: "Secondary Preferred Location",
    travel: "Willing to Travel for Work?", abroad: "Available for Assignments Abroad?",
    notice: "Notice Period (Uppsägningstid)", noticePick: "Select notice period",
    available: "Available From (Tillgänglig från)", availableHint: "Earliest date you could start a new role.",
    save: "Save Employment Details", saving: "Saving…", saved: "Employment details saved",
    saveFailed: "Couldn't save your employment details. Please try again.",
    loadFailed: "Couldn't load your employment details.", retry: "Try again",
    fixFields: "Please fill in the highlighted fields.",
    unsaved: "Unsaved changes", lastSaved: "Last saved",
    required: "This field is required.", invalid: "Please enter a valid date.",
    number: "Please enter an amount (numbers only).", endBeforeStart: "The end date can't be before the start date.",
    amountPh: "e.g. 45 000", select: "Select…",
    placeholders: {
      employer: "e.g. Volvo Cars", jobTitle: "e.g. Software Developer", department: "e.g. IT / Development",
      city: "e.g. Göteborg", address: "Street, postcode", preferred: "e.g. Stockholm", secondary: "e.g. Uppsala",
    },
  },
  sv: {
    title: "Nuvarande anställning",
    subtitle: "Information om din nuvarande anställning och dina arbetspreferenser.",
    s1: "Nuvarande anställning", s2: "Arbetsplats", s3: "Lön & ersättning", s4: "Arbetspreferenser & tillgänglighet",
    s3desc: "Valfritt — dela bara det du känner dig bekväm med.",
    status: "Anställningsstatus", statusHint: "Välj din nuvarande situation",
    employer: "Arbetsgivare / företagsnamn", employerSelf: "Företagsnamn",
    jobTitle: "Nuvarande befattning", jobTitleLatest: "Senaste befattning",
    department: "Avdelning / yrkesområde", fieldOfWork: "Yrkesområde",
    type: "Anställningsform", start: "Anställningens startdatum", end: "Anställningens slutdatum",
    endHint: "Lämna tomt om den pågår. Behövs bara för visstid eller avslutad anställning.",
    rate: "Sysselsättningsgrad (%)", rateHint: "100 % = heltid.",
    city: "Arbetsort / kommun", address: "Arbetsplatsens adress", addressHint: "Valfritt — orten räcker oftast.",
    arrangement: "Arbetsupplägg",
    salary: "Nuvarande bruttolön per månad", salaryHint: "Per månad, före skatt (bruttolön). Valfritt.",
    currency: "Valuta", expected: "Önskad lön / ersättning", consultantRate: "Ditt pris (arvode)",
    rateType: "Ersättningstyp",
    preferred: "Önskad arbetsort", secondary: "Alternativ arbetsort",
    travel: "Kan du resa i arbetet?", abroad: "Tillgänglig för uppdrag utomlands?",
    notice: "Uppsägningstid", noticePick: "Välj uppsägningstid",
    available: "Tillgänglig från", availableHint: "Tidigaste datum du kan börja en ny roll.",
    save: "Spara anställningsuppgifter", saving: "Sparar…", saved: "Anställningsuppgifterna har sparats",
    saveFailed: "Det gick inte att spara. Försök igen.",
    loadFailed: "Det gick inte att ladda dina anställningsuppgifter.", retry: "Försök igen",
    fixFields: "Fyll i de markerade fälten.",
    unsaved: "Osparade ändringar", lastSaved: "Senast sparad",
    required: "Fältet är obligatoriskt.", invalid: "Ange ett giltigt datum.",
    number: "Ange ett belopp (endast siffror).", endBeforeStart: "Slutdatumet kan inte vara före startdatumet.",
    amountPh: "t.ex. 45 000", select: "Välj…",
    placeholders: {
      employer: "t.ex. Volvo Cars", jobTitle: "t.ex. Systemutvecklare", department: "t.ex. IT / utveckling",
      city: "t.ex. Göteborg", address: "Gata, postnummer", preferred: "t.ex. Stockholm", secondary: "t.ex. Uppsala",
    },
  },
}

/* ─── Small building blocks ─── */
const baseInput = "w-full px-3 py-2.5 text-sm border rounded-lg bg-white outline-none transition-colors focus:ring-2 focus:ring-[rgba(176,196,222,0.5)] focus:border-[rgb(176,196,222)] placeholder:text-gray-400"
const inputCls = (error?: boolean) => `${baseInput} ${error ? "border-red-500 bg-pink-50" : "border-gray-300"}`

function Section({ n, title, desc, children }: { n: number; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: NAVY }}>{n}</span>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">{children}</div>
    </section>
  )
}

function Field({ id, label: text, required, hint, error, wide, children }: {
  id: string; label: string; required?: boolean; hint?: string; error?: string; wide?: boolean; children: React.ReactNode
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""} data-field={id}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {text} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? <p className="text-red-500 text-xs mt-1">{error}</p> : hint ? <p className="text-xs text-gray-400 mt-1">{hint}</p> : null}
    </div>
  )
}

function Choice({ name, value, options, labels, lang, onChange }: {
  name: string; value: string; options: readonly string[]; labels: Record<string, { en: string; sv: string }>; lang: Lang
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" id={name}>
      {options.map((o) => {
        const active = value === o
        return (
          <button key={o} type="button" role="radio" aria-checked={active} onClick={() => onChange(o)}
            className={`px-3.5 py-2 rounded-lg border text-sm transition-colors ${active ? "text-white border-transparent" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            style={active ? { backgroundColor: NAVY } : undefined}>
            {label(labels, o, lang)}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Form ─── */
export const EmploymentDetailsForm = (_props: EmploymentDetailsFormProps) => {
  const { language } = useDashboardTranslations()
  const lang: Lang = language === "sv" ? "sv" : "en"
  const tx = TX[lang]

  const { session } = useAuth()
  const store = useEmploymentDetailsStore(session?.user?.id)

  const [form, setForm] = useState<EmploymentDetailsData>(EMPTY_EMPLOYMENT_DETAILS)
  const [saved, setSaved] = useState<EmploymentDetailsData>(EMPTY_EMPLOYMENT_DETAILS)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<EmploymentErrors>({})
  const formRef = useRef<HTMLFormElement>(null)

  // Work address suggestions (your existing /api/address-suggestions)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addressBoxRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch("/api/user/employment-details", { credentials: "include", cache: "no-store" })
      if (!res.ok) throw new Error()
      const body = await res.json()
      const data: EmploymentDetailsData = body.data ?? EMPTY_EMPLOYMENT_DETAILS
      setForm(data)
      setSaved(data)
      setUpdatedAt(body.updatedAt ?? null)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (addressBoxRef.current && !addressBoxRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const rules = useMemo(
    () => fieldRules({ employmentStatus: form.employmentStatus, employmentType: form.employmentType }),
    [form.employmentStatus, form.employmentType],
  )
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved])

  const set = <K extends keyof EmploymentDetailsData>(key: K, value: EmploymentDetailsData[K]) => {
    setForm((p) => ({ ...p, [key]: value }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }
  const text = (key: keyof EmploymentDetailsData) => ({
    id: key,
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(key, e.target.value as any),
    className: inputCls(!!errors[key]),
  })
  const err = (key: keyof EmploymentDetailsData) => {
    const code = errors[key]
    return code ? tx[code] : undefined
  }

  const changeStatus = (status: EmploymentDetailsData["employmentStatus"]) => {
    setForm((p) => {
      const next = { ...p, employmentStatus: status }
      // Sensible defaults when switching situation.
      if (status === "self_employed") {
        next.employmentType = "consultant"
        if (p.feeRateType === "monthly") next.feeRateType = "hourly"
      }
      if (status !== "self_employed" && p.employmentStatus === "self_employed" && p.employmentType === "consultant") {
        next.employmentType = "permanent"
      }
      return next
    })
    setErrors({})
  }

  const onAddressChange = (value: string) => {
    set("homeAddress", value)
    if (typingRef.current) clearTimeout(typingRef.current)
    if (value.trim().length < 3) { setShowSuggestions(false); return }
    typingRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address-suggestions?q=${encodeURIComponent(value)}`)
        if (!res.ok) return
        const list = await res.json()
        setSuggestions(Array.isArray(list) ? list : [])
        setShowSuggestions(true)
      } catch { /* suggestions are optional */ }
    }, 450)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { errors: found } = normalizeEmploymentDetails(form)
    const firstKey = Object.keys(found)[0]
    if (firstKey) {
      setErrors(found)
      toast.error(tx.fixFields)
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      })
      return
    }

    setSaving(true)
    const toastId = toast.loading(tx.saving)
    try {
      const res = await fetch("/api/user/employment-details", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (body?.errors) setErrors(body.errors)
        throw new Error()
      }
      setForm(body.data)
      setSaved(body.data)
      setUpdatedAt(body.updatedAt ?? new Date().toISOString())
      setErrors({})
      // Keep your existing store in sync for other parts of the dashboard.
      try { (store as any)?.setDetails?.({ ...body.data, id: body.id }) } catch { /* optional */ }
      // …and every other component using useUserEmploymentDetails.
      swrMutate(EMPLOYMENT_DETAILS_KEY, toEmploymentRecord(body, session?.user?.id), false)
      toast.success(tx.saved, { id: toastId })
    } catch {
      toast.error(tx.saveFailed, { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: NAVY }} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between gap-4">
        <p className="font-medium">{tx.loadFailed}</p>
        <button onClick={load} className="px-4 py-2 rounded-lg bg-white border border-red-200 text-sm font-medium hover:bg-red-100">{tx.retry}</button>
      </div>
    )
  }

  const selfEmployed = form.employmentStatus === "self_employed"
  let n = 0

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{tx.title}</h2>
        <p className="text-sm text-gray-500 mt-1">{tx.subtitle}</p>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-5" noValidate>
        {/* ── 1. Current employment ── */}
        <Section n={++n} title={tx.s1}>
          <div className="sm:col-span-2" data-field="employmentStatus">
            <p className="block text-sm font-medium text-gray-700 mb-0.5">{tx.status} <span className="text-red-500">*</span></p>
            <p className="text-xs text-gray-400 mb-2">{tx.statusHint}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
              {EMPLOYMENT_STATUSES.map((s) => {
                const active = form.employmentStatus === s
                return (
                  <button key={s} type="button" role="radio" aria-checked={active} onClick={() => changeStatus(s)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${active ? "shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
                    style={active ? { borderColor: NAVY, backgroundColor: "rgba(5,22,80,0.05)" } : undefined}>
                    <span className="text-lg" aria-hidden>{STATUS_ICONS[s]}</span>
                    <span className={`flex-1 ${active ? "font-semibold text-gray-900" : "text-gray-700"}`}>{label(STATUS_LABELS, s, lang)}</span>
                    <span className={`w-4 h-4 rounded-full flex-shrink-0 ${active ? "border-[5px]" : "border-2 border-gray-300"}`}
                      style={active ? { borderColor: NAVY } : undefined} />
                  </button>
                )
              })}
            </div>
          </div>

          {rules.showEmployer && (
            <Field id="employerName" label={selfEmployed ? tx.employerSelf : tx.employer} wide error={err("employerName")}>
              <input {...text("employerName")} placeholder={tx.placeholders.employer} />
            </Field>
          )}

          <Field id="presentTitle" label={rules.working ? tx.jobTitle : tx.jobTitleLatest} required={rules.required.presentTitle} error={err("presentTitle")}>
            <input {...text("presentTitle")} placeholder={tx.placeholders.jobTitle} />
          </Field>
          <Field id="workArea" label={rules.working ? tx.department : tx.fieldOfWork} required={rules.required.workArea} error={err("workArea")}>
            <input {...text("workArea")} placeholder={tx.placeholders.department} />
          </Field>

          {rules.showEmploymentType && (
            <Field id="employmentType" label={tx.type} required wide error={err("employmentType")}>
              <select {...text("employmentType")} className={`${inputCls(!!errors.employmentType)} cursor-pointer`}>
                <option value="">{tx.select}</option>
                {EMPLOYMENT_TYPES.map((v) => <option key={v} value={v}>{label(TYPE_LABELS, v, lang)}</option>)}
              </select>
            </Field>
          )}

          {rules.showStartDate && (
            <Field id="employmentDate" label={tx.start} error={err("employmentDate")}>
              <input type="date" {...text("employmentDate")} min="1950-01-01" max={new Date().toISOString().slice(0, 10)} />
            </Field>
          )}
          {rules.showEndDate && (
            <Field id="employmentEndDate" label={tx.end} hint={tx.endHint} error={err("employmentEndDate")}>
              <input type="date" {...text("employmentEndDate")} min={form.employmentDate || "1950-01-01"} />
            </Field>
          )}

          {rules.showEmploymentRate && (
            <Field id="employmentRate" label={tx.rate} hint={tx.rateHint}>
              <select {...text("employmentRate")} className={`${inputCls(false)} cursor-pointer`}>
                {EMPLOYMENT_RATES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          )}
        </Section>

        {/* ── 2. Workplace ── */}
        {rules.showWorkplace && (
          <Section n={++n} title={tx.s2}>
            <Field id="officeLocation" label={tx.city} required error={err("officeLocation")}>
              <input {...text("officeLocation")} placeholder={tx.placeholders.city} />
            </Field>
            <Field id="workArrangement" label={tx.arrangement}>
              <Choice name="workArrangement" value={form.workArrangement} options={WORK_ARRANGEMENTS} labels={ARRANGEMENT_LABELS} lang={lang}
                onChange={(v) => set("workArrangement", v)} />
            </Field>
            <Field id="homeAddress" label={tx.address} hint={tx.addressHint} wide>
              <div className="relative" ref={addressBoxRef}>
                <input {...text("homeAddress")} onChange={(e) => onAddressChange(e.target.value)} placeholder={tx.placeholders.address} autoComplete="off" />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((s, i) => (
                      <button key={i} type="button" onClick={() => { set("homeAddress", s.display_name ?? ""); setShowSuggestions(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0">
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          </Section>
        )}

        {/* ── 3. Salary & compensation ── */}
        <Section n={++n} title={tx.s3} desc={tx.s3desc}>
          {rules.showCurrentSalary && (
            <>
              <Field id="salaryLevel" label={tx.salary} hint={tx.salaryHint} error={err("salaryLevel")}>
                <input inputMode="decimal" {...text("salaryLevel")} placeholder={tx.amountPh} />
              </Field>
              <Field id="salaryCurrency" label={tx.currency}>
                <select {...text("salaryCurrency")} className={`${inputCls(false)} cursor-pointer`}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{label(CURRENCY_LABELS, c, lang)}</option>)}
                </select>
              </Field>
            </>
          )}

          <Field id="feeRate" label={rules.consultant ? tx.consultantRate : tx.expected} error={err("feeRate")}>
            <input inputMode="decimal" {...text("feeRate")} placeholder={tx.amountPh} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="feeCurrency" label={tx.currency}>
              <select {...text("feeCurrency")} className={`${inputCls(false)} cursor-pointer`}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field id="feeRateType" label={tx.rateType}>
              <select {...text("feeRateType")} className={`${inputCls(false)} cursor-pointer`}>
                {RATE_TYPES_OFFERED.map((r) => <option key={r} value={r}>{label(RATE_TYPE_LABELS, r, lang)}</option>)}
                {/* Older rows may still say "weekly". */}
                {form.feeRateType === "weekly" && <option value="weekly">{label(RATE_TYPE_LABELS, "weekly", lang)}</option>}
              </select>
            </Field>
          </div>
        </Section>

        {/* ── 4. Work preferences & availability ── */}
        <Section n={++n} title={tx.s4}>
          <Field id="preferredLocation" label={tx.preferred}>
            <input {...text("preferredLocation")} placeholder={tx.placeholders.preferred} />
          </Field>
          <Field id="secondaryLocation" label={tx.secondary}>
            <input {...text("secondaryLocation")} placeholder={tx.placeholders.secondary} />
          </Field>
          <Field id="canTravel" label={tx.travel}>
            <Choice name="canTravel" value={form.canTravel} options={TRAVEL_OPTIONS} labels={TRAVEL_LABELS} lang={lang} onChange={(v) => set("canTravel", v)} />
          </Field>
          <Field id="assignmentAbroad" label={tx.abroad}>
            <Choice name="assignmentAbroad" value={form.assignmentAbroad} options={ABROAD_OPTIONS} labels={TRAVEL_LABELS} lang={lang} onChange={(v) => set("assignmentAbroad", v)} />
          </Field>
          {rules.showNoticePeriod && (
            <Field id="noticePeriod" label={tx.notice}>
              <select {...text("noticePeriod")} className={`${inputCls(false)} cursor-pointer`}>
                <option value="">{tx.noticePick}</option>
                {NOTICE_PERIODS.map((p) => <option key={p} value={p}>{label(NOTICE_LABELS, p, lang)}</option>)}
              </select>
            </Field>
          )}
          <Field id="availableFrom" label={tx.available} hint={tx.availableHint} error={err("availableFrom")}>
            <input type="date" {...text("availableFrom")} />
          </Field>
        </Section>

        {/* Save bar */}
        <div className="sticky bottom-0 z-10 py-3 bg-white/95 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {dirty
              ? <span className="text-amber-600 font-medium">● {tx.unsaved}</span>
              : updatedAt ? `${tx.lastSaved}: ${new Date(updatedAt).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}
          </p>
          <button type="submit" disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            style={{ backgroundColor: NAVY }}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? tx.saving : tx.save}
          </button>
        </div>
      </form>
    </Card>
  )
}

export default EmploymentDetailsForm
