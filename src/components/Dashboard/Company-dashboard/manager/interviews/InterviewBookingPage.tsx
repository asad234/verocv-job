"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/interviews/InterviewBookingPage.tsx
// WHAT IT DOES:   Full page for booking (or rescheduling) an interview — replaces the old
//                 "Book Interview" dialog. Candidate, date + time (with free/busy time slots
//                 from the manager's other interviews), duration, format, Google Meet /
//                 Google Calendar invitation and a message to the candidate.
//                 The candidate can be picked from the manager's employees (optional) or typed in.
//                 Shown by ManagerInterviews (URL: ?interview=new  or  ?interview=<id>).
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import {
  ApiError, bookInterview, updateInterview,
  type BookingInput, type Interview, type InterviewFormat, type SaveResult,
} from "@/utils/interviewsApi"
import type { useGoogleCalendar } from "./GoogleCalendarConnect"
import { GoogleConnectResult } from "./GoogleCalendarConnect"
import EmployeePicker, { type ManagedEmployee } from "../views/Employeepicker"
import {
  DURATIONS, FORMAT_CFG, LIGHT, MEET_GREEN, NAVY, browserTimeZone, endOf, fmtLongDate, fmtTime,
  initials, isSameDay, isValidEmail, localToIso, toDateInput, toTimeInput,
} from "./interviewShared"

const DRAFT_KEY = "veroCvInterviewDraft"
const SLOT_START_HOUR = 8
const SLOT_END_HOUR = 18 // last slot starts before this hour
const SLOT_STEP_MIN = 30

interface FormState {
  /** One of the manager's employees ("" = candidate typed by hand). Optional. */
  employeeId: string
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  position: string
  date: string // YYYY-MM-DD (local)
  time: string // HH:MM (local)
  durationMinutes: number
  format: InterviewFormat
  location: string
  meetingLink: string
  messageToCandidate: string
  addToCalendar: boolean
  sendInvite: boolean
}

type FieldKey = "candidateName" | "candidateEmail" | "position" | "date" | "time" | "candidatePhone" | "location" | "meetingLink"

interface Props {
  isEn: boolean
  /** Set when rescheduling / editing an existing interview. */
  interview?: Interview | null
  /** Pre-selected date (e.g. the "+" on a calendar day). */
  defaultDate?: Date | null
  /** "Book again": a cancelled / missed interview whose details pre-fill a NEW booking. */
  copyFrom?: Interview | null
  /** The manager's interviews — used for busy time slots and overlap warnings. */
  interviews: Interview[]
  google: ReturnType<typeof useGoogleCalendar>
  onBack: () => void
  onSaved: (result: SaveResult, mode: "booked" | "updated") => void
}

function initialForm(editing?: Interview | null, defaultDate?: Date | null, copyFrom?: Interview | null): FormState {
  const interview = editing ?? copyFrom
  if (interview) {
    // Editing → the interview's own date/time. Book again → same candidate + setup,
    // but today (or the picked day) at the same time of day.
    let start = new Date(interview.startAt)
    if (!editing) {
      const day = defaultDate ? new Date(defaultDate) : new Date()
      day.setHours(start.getHours(), start.getMinutes(), 0, 0)
      start = day
    }
    return {
      employeeId: interview.employeeId ?? "",
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      candidatePhone: interview.candidatePhone,
      position: interview.position,
      date: toDateInput(start),
      time: toTimeInput(start),
      durationMinutes: interview.durationMinutes,
      format: interview.format,
      location: interview.location,
      meetingLink: interview.meetingLink && !/meet\.google\.com/i.test(interview.meetingLink) ? interview.meetingLink : "",
      messageToCandidate: interview.messageToCandidate,
      addToCalendar: interview.google.addToCalendar,
      sendInvite: interview.google.sendInvite,
    }
  }
  const base = defaultDate ? new Date(defaultDate) : new Date()
  return {
    employeeId: "", candidateName: "", candidateEmail: "", candidatePhone: "", position: "",
    date: toDateInput(base), time: "10:00", durationMinutes: 45, format: "video",
    location: "", meetingLink: "", messageToCandidate: "", addToCalendar: true, sendInvite: true,
  }
}

/* ─── Small building blocks ─── */
const inputBase = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
const okCls = `${inputBase} border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100`
const badCls = `${inputBase} border-2 border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100`

const Label: React.FC<{ text: string; required?: boolean; invalid?: boolean; hint?: string }> = ({ text, required, invalid, hint }) => (
  <label className={clsx("flex items-baseline justify-between text-xs font-medium mb-1.5", invalid ? "text-red-600" : "text-gray-600")}>
    <span>{text} {required && <span className="text-red-500">*</span>}</span>
    {hint && <span className="text-[10px] font-normal text-gray-400">{hint}</span>}
  </label>
)

const FieldError: React.FC<{ message?: string | null }> = ({ message }) =>
  message ? (
    <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
      <Icon icon="tabler:alert-circle" className="w-3 h-3" />
      {message}
    </p>
  ) : null

const Section: React.FC<{ step: number; title: string; subtitle?: string; children: React.ReactNode }> = ({ step, title, subtitle, children }) => (
  <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: NAVY }}>
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </section>
)

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
    className={clsx("relative w-10 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-40", checked ? "" : "bg-gray-200")}
    style={checked ? { backgroundColor: MEET_GREEN } : {}}>
    <span className={clsx("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
  </button>
)

/* ═════════════════════════════════════════════════════════════
   PAGE
═════════════════════════════════════════════════════════════ */
export default function InterviewBookingPage({ isEn, interview, defaultDate, copyFrom, interviews, google, onBack, onSaved }: Props) {
  const isEdit = !!interview
  const isCopy = !isEdit && !!copyFrom
  const draftFor = interview?.id ?? (copyFrom ? `copy-${copyFrom.id}` : "new")

  const [form, setForm] = useState<FormState>(() => {
    // Coming back from Google's consent screen → restore what was typed.
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw)
        if (draft?.for === draftFor && draft.form) return { ...initialForm(interview, defaultDate, copyFrom), ...draft.form }
      }
    } catch { /* storage unavailable */ }
    return initialForm(interview, defaultDate, copyFrom)
  })
  useEffect(() => {
    try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
  }, [])

  const [showErrors, setShowErrors] = useState(false)
  const [serverFieldError, setServerFieldError] = useState<{ field: string; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  /* ── Optional: pick one of the manager's employees and fill in their details ── */
  const [prefill, setPrefill] = useState<"idle" | "loading" | "done" | "failed">("idle")
  const [employeeTitle, setEmployeeTitle] = useState("")
  const latestPick = useRef("")

  const handlePickEmployee = async (emp: ManagedEmployee | null) => {
    latestPick.current = emp?.employeeId ?? ""
    setEmployeeTitle("")
    if (!emp) {
      // Unlink only — keep whatever is typed so the manager can carry on by hand.
      setForm(prev => ({ ...prev, employeeId: "" }))
      setPrefill("idle")
      return
    }
    setServerFieldError(null)
    setForm(prev => ({
      ...prev,
      employeeId: emp.employeeId,
      candidateName: emp.employeeName || emp.employeeEmail,
      candidateEmail: emp.employeeEmail,
      // The phone belonged to the previously chosen person.
      candidatePhone: prev.employeeId && prev.employeeId !== emp.employeeId ? "" : prev.candidatePhone,
    }))

    // Same profile data as the Employee Profile page (accepted invitations only, checked server-side).
    setPrefill("loading")
    try {
      const res = await fetch(`/api/company/managers/employees/${emp.employeeId}/hr-info`, { credentials: "include" })
      if (!res.ok) throw new Error()
      const body = await res.json()
      if (latestPick.current !== emp.employeeId) return // another employee was picked meanwhile
      const pi = body.personalInformation ?? {}
      const ed = body.employmentDetails ?? {}
      const hr = body.hrInfo ?? {}
      const fullName = [pi.firstName, pi.lastName].filter(Boolean).join(" ").trim()
      const phone: string = pi.phone || pi.phoneNumber || pi.mobile || pi.mobileNumber || ed.phone || ed.workPhone || ""
      const title: string = hr.employmentInfo?.jobTitle || ed.presentTitle || pi.title || ""
      setForm(prev => prev.employeeId !== emp.employeeId ? prev : {
        ...prev,
        candidateName: fullName || prev.candidateName,
        candidatePhone: prev.candidatePhone.trim() ? prev.candidatePhone : phone,
      })
      setEmployeeTitle(title)
      setPrefill("done")
    } catch {
      if (latestPick.current === emp.employeeId) setPrefill("failed") // name + email are already filled in
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (serverFieldError?.field === key) setServerFieldError(null)
  }

  const gStatus = google.status
  const googleReady = !!gStatus?.configured && !!gStatus?.connected
  const useGoogle = googleReady && form.addToCalendar

  /* ── Derived: start / end, other interviews that day, conflicts ── */
  const startIso = form.date && form.time ? localToIso(form.date, form.time) : null
  const endDate = startIso ? endOf(startIso, form.durationMinutes) : null
  const selectedDay = useMemo(() => (form.date ? new Date(`${form.date}T00:00:00`) : null), [form.date])

  const sameDay = useMemo(() => {
    if (!selectedDay) return []
    return interviews
      .filter(iv => iv.id !== interview?.id && iv.status === "scheduled" && isSameDay(new Date(iv.startAt), selectedDay))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [interviews, selectedDay, interview?.id])

  const overlaps = (startMs: number, endMs: number) =>
    sameDay.filter(iv => {
      const s = new Date(iv.startAt).getTime()
      const e = endOf(iv.startAt, iv.durationMinutes).getTime()
      return s < endMs && e > startMs
    })

  const conflicts = startIso && endDate ? overlaps(new Date(startIso).getTime(), endDate.getTime()) : []

  const slots = useMemo(() => {
    if (!form.date) return []
    const out: { time: string; busy: boolean; past: boolean }[] = []
    for (let m = SLOT_START_HOUR * 60; m < SLOT_END_HOUR * 60; m += SLOT_STEP_MIN) {
      const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
      const s = new Date(localToIso(form.date, time)).getTime()
      out.push({ time, busy: overlaps(s, s + form.durationMinutes * 60_000).length > 0, past: s < Date.now() })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, form.durationMinutes, sameDay])

  /* ── Validation ── */
  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {}
    const req = isEn ? "Required" : "Obligatoriskt"
    if (!form.candidateName.trim()) e.candidateName = req
    if (!form.candidateEmail.trim()) e.candidateEmail = req
    else if (!isValidEmail(form.candidateEmail)) e.candidateEmail = isEn ? "Enter a valid email" : "Ange en giltig e-post"
    if (!form.position.trim()) e.position = req
    if (!form.date) e.date = req
    if (!form.time) e.time = req
    if (startIso && !isEdit && new Date(startIso).getTime() < Date.now() - 5 * 60_000) {
      e.time = isEn ? "Choose a time in the future" : "Välj en tid framåt i tiden"
    }
    if (form.format === "phone" && !form.candidatePhone.trim()) e.candidatePhone = isEn ? "Add the number to call" : "Ange numret att ringa"
    if (form.format === "in_person" && !form.location.trim()) e.location = isEn ? "Add the address" : "Ange adressen"
    if (form.format === "video" && !useGoogle && form.meetingLink.trim() && !/^https:\/\//i.test(form.meetingLink.trim())) {
      e.meetingLink = isEn ? "Must start with https://" : "Måste börja med https://"
    }
    return e
  }, [form, isEn, startIso, isEdit, useGoogle])

  const errorOf = (k: FieldKey) =>
    (showErrors ? errors[k] : null) ?? (serverFieldError?.field === k ? serverFieldError.message : null)
  const cls = (k: FieldKey) => (errorOf(k) ? badCls : okCls)

  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const el = pageRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      el?.focus({ preventScroll: true })
    })
  }

  /* ── Save ── */
  const handleSubmit = async () => {
    setError(null)
    if (Object.keys(errors).length > 0 || !startIso) {
      setShowErrors(true)
      scrollToFirstError()
      return
    }
    const input: BookingInput = {
      candidateName: form.candidateName.trim(),
      candidateEmail: form.candidateEmail.trim().toLowerCase(),
      candidatePhone: form.candidatePhone.trim(),
      employeeId: form.employeeId || null,
      position: form.position.trim(),
      startAt: startIso,
      durationMinutes: form.durationMinutes,
      timeZone: browserTimeZone(),
      format: form.format,
      location: form.format === "in_person" ? form.location.trim() : "",
      meetingLink: form.format === "video" && !useGoogle ? form.meetingLink.trim() || null : undefined,
      messageToCandidate: form.messageToCandidate.trim(),
      google: { addToCalendar: useGoogle, sendInvite: useGoogle && form.sendInvite },
    }
    setSaving(true)
    try {
      const result = isEdit && interview ? await updateInterview(interview.id, input) : await bookInterview(input)
      onSaved(result, isEdit ? "updated" : "booked")
    } catch (e) {
      if (e instanceof ApiError && e.field) {
        setServerFieldError({ field: e.field, message: e.message })
        scrollToFirstError()
      } else {
        setError((e as Error).message || (isEn ? "Couldn't save the interview." : "Kunde inte spara intervjun."))
      }
    } finally {
      setSaving(false)
    }
  }

  const connectGoogle = () =>
    google.connect(() => {
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ for: draftFor, form })) } catch { /* ignore */ }
    })

  const fmtCfg = FORMAT_CFG[form.format]
  const missingCount = Object.keys(errors).length

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div ref={pageRef} className="p-4 sm:p-6 m-2 sm:m-4">

      {/* Header */}
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-3 transition-colors">
          <Icon icon="tabler:arrow-left" className="w-4 h-4" />
          {isEn ? "Back to Interviews" : "Tillbaka till Intervjuer"}
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
            <Icon icon={isEdit ? "tabler:calendar-repeat" : "tabler:calendar-plus"} className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {isEdit ? (isEn ? "Reschedule Interview" : "Boka om Intervju") : (isEn ? "Book Interview" : "Boka Intervju")}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEdit
                ? (isEn ? `Change the details for ${interview?.candidateName}. The candidate's calendar invitation is updated.` : `Ändra uppgifterna för ${interview?.candidateName}. Kandidatens kalenderinbjudan uppdateras.`)
                : isCopy
                  ? (isEn ? `Booking a new interview with ${copyFrom?.candidateName} — the details are copied, pick a new time.` : `Ny intervju med ${copyFrom?.candidateName} — uppgifterna är kopierade, välj en ny tid.`)
                  : (isEn ? "Pick a time, choose how you'll meet, and send the candidate an invitation." : "Välj en tid, hur ni ska ses och skicka en inbjudan till kandidaten.")}
            </p>
          </div>
        </div>
      </div>

      <GoogleConnectResult isEn={isEn} onConnected={() => { google.refresh(); set("addToCalendar", true) }} />

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ═════ FORM ═════ */}
        <div className="flex-1 min-w-0 space-y-5 w-full">

          {/* 1 — Candidate */}
          <Section step={1} title={isEn ? "Candidate" : "Kandidat"} subtitle={isEn ? "Who are you interviewing, and for which role?" : "Vem intervjuar du, och för vilken tjänst?"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label text={isEn ? "Choose from your employees" : "Välj bland dina medarbetare"}
                  hint={isEn ? "Optional — or type the details below" : "Valfritt — eller skriv in uppgifterna nedan"} />
                <EmployeePicker
                  isEn={isEn}
                  value={form.employeeId}
                  fallbackName={form.employeeId ? form.candidateName : undefined}
                  onSelect={handlePickEmployee}
                  invalid={serverFieldError?.field === "employeeId"}
                />
                <div className="mt-1.5 min-h-[16px] text-[11px]">
                  {serverFieldError?.field === "employeeId" ? (
                    <span className="flex items-center gap-1 text-red-500">
                      <Icon icon="tabler:alert-circle" className="w-3 h-3" />{serverFieldError.message}
                    </span>
                  ) : prefill === "loading" ? (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      {isEn ? "Fetching employee details…" : "Hämtar medarbetarens uppgifter…"}
                    </span>
                  ) : form.employeeId ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Icon icon="tabler:check" className="w-3 h-3" />
                      {isEn ? "Details filled in from the employee's profile — you can still edit them." : "Uppgifter ifyllda från medarbetarens profil — du kan fortfarande ändra dem."}
                      {employeeTitle && <span className="text-gray-400"> {isEn ? "Current role:" : "Nuvarande roll:"} {employeeTitle}</span>}
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      {isEn ? "Interviewing someone new? Just fill in their name and email below." : "Intervjuar du någon ny? Fyll bara i namn och e-post nedan."}
                    </span>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 -my-1">
                <span className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">{isEn ? "Candidate details" : "Kandidatens uppgifter"}</span>
                <span className="h-px flex-1 bg-gray-100" />
              </div>

              <div className="sm:col-span-2">
                <Label text={isEn ? "Candidate name" : "Kandidatens namn"} required invalid={!!errorOf("candidateName")} />
                <input type="text" value={form.candidateName} onChange={e => set("candidateName", e.target.value)}
                  aria-invalid={!!errorOf("candidateName")} placeholder={isEn ? "e.g. Jonas Ekström" : "t.ex. Jonas Ekström"} className={cls("candidateName")} />
                <FieldError message={errorOf("candidateName")} />
              </div>
              <div>
                <Label text={isEn ? "Candidate email" : "Kandidatens e-post"} required invalid={!!errorOf("candidateEmail")}
                  hint={isEn ? "Invitation is sent here" : "Inbjudan skickas hit"} />
                <input type="email" value={form.candidateEmail} onChange={e => set("candidateEmail", e.target.value)}
                  aria-invalid={!!errorOf("candidateEmail")} placeholder="candidate@example.com" className={cls("candidateEmail")} />
                <FieldError message={errorOf("candidateEmail")} />
              </div>
              <div>
                <Label text={isEn ? "Position" : "Tjänst"} required invalid={!!errorOf("position")} />
                <input type="text" value={form.position} onChange={e => set("position", e.target.value)}
                  aria-invalid={!!errorOf("position")} placeholder={isEn ? "e.g. Senior Frontend Developer" : "t.ex. Senior Frontend-utvecklare"} className={cls("position")} />
                <FieldError message={errorOf("position")} />
              </div>
            </div>
          </Section>

          {/* 2 — Date & time */}
          <Section step={2} title={isEn ? "Date & time" : "Datum & tid"}
            subtitle={isEn ? "Grey slots overlap one of your other interviews." : "Grå tider krockar med en av dina andra intervjuer."}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label text={isEn ? "Date" : "Datum"} required invalid={!!errorOf("date")} />
                <input type="date" value={form.date} min={isEdit ? undefined : toDateInput(new Date())}
                  onChange={e => set("date", e.target.value)} aria-invalid={!!errorOf("date")} className={cls("date")} />
                <FieldError message={errorOf("date")} />
              </div>
              <div>
                <Label text={isEn ? "Start time" : "Starttid"} required invalid={!!errorOf("time")} />
                <input type="time" value={form.time} step={300} onChange={e => set("time", e.target.value)}
                  aria-invalid={!!errorOf("time")} className={cls("time")} />
                <FieldError message={errorOf("time")} />
              </div>
            </div>

            {form.date && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  {isEn ? "Quick pick" : "Snabbval"} · <span className="text-gray-400 font-normal">{fmtLongDate(`${form.date}T12:00:00`, isEn)}</span>
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-5 xl:grid-cols-10 gap-1.5">
                  {slots.map(s => {
                    const active = s.time === form.time
                    const disabled = s.past && !isEdit
                    return (
                      <button key={s.time} type="button" disabled={disabled} onClick={() => set("time", s.time)}
                        title={s.busy ? (isEn ? "You have another interview then" : "Du har en annan intervju då") : undefined}
                        className={clsx(
                          "py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          active ? "text-white" : s.busy ? "bg-gray-100 border-gray-100 text-gray-400 line-through" : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50",
                          disabled && "opacity-30 cursor-not-allowed hover:bg-white hover:border-gray-200",
                        )}
                        style={active ? { backgroundColor: NAVY, borderColor: NAVY } : {}}>
                        {s.time}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-5">
              <Label text={isEn ? "Duration" : "Längd"} required />
              <div className="flex items-center gap-2 flex-wrap">
                {DURATIONS.map(n => (
                  <button key={n} type="button" onClick={() => set("durationMinutes", n)}
                    className={clsx("px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all",
                      form.durationMinutes === n ? "text-white" : "text-gray-600 border-gray-200 hover:bg-gray-50")}
                    style={form.durationMinutes === n ? { backgroundColor: NAVY, borderColor: NAVY } : {}}>
                    {n} min
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* 3 — Format */}
          <Section step={3} title={isEn ? "How you'll meet" : "Hur ni ses"}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(Object.keys(FORMAT_CFG) as InterviewFormat[]).map(f => {
                const cfg = FORMAT_CFG[f]
                const active = form.format === f
                return (
                  <button key={f} type="button" onClick={() => set("format", f)}
                    className={clsx("flex items-center sm:flex-col sm:items-center gap-3 sm:gap-1.5 p-3.5 rounded-xl border-2 text-left sm:text-center transition-all",
                      active ? "border-blue-300 bg-blue-50 text-blue-900" : "border-gray-100 text-gray-600 hover:border-gray-200")}>
                    <Icon icon={f === "video" ? "logos:google-meet" : cfg.icon} className={clsx("w-5 h-5", f !== "video" && "opacity-80")} />
                    <span>
                      <span className="block text-sm font-semibold">{isEn ? cfg.en : cfg.sv}</span>
                      <span className="block text-[11px] text-gray-400">{isEn ? cfg.hintEn : cfg.hintSv}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {form.format === "phone" && (
              <div className="mt-4">
                <Label text={isEn ? "Candidate's phone number" : "Kandidatens telefonnummer"} required invalid={!!errorOf("candidatePhone")} />
                <input type="tel" value={form.candidatePhone} onChange={e => set("candidatePhone", e.target.value)}
                  aria-invalid={!!errorOf("candidatePhone")} placeholder="+46 70 123 45 67" className={cls("candidatePhone")} />
                <FieldError message={errorOf("candidatePhone")} />
              </div>
            )}
            {form.format === "in_person" && (
              <div className="mt-4">
                <Label text={isEn ? "Address" : "Adress"} required invalid={!!errorOf("location")} />
                <input type="text" value={form.location} onChange={e => set("location", e.target.value)}
                  aria-invalid={!!errorOf("location")} placeholder={isEn ? "e.g. Lindholmspiren 3, Göteborg — reception, floor 2" : "t.ex. Lindholmspiren 3, Göteborg — reception, plan 2"} className={cls("location")} />
                <FieldError message={errorOf("location")} />
              </div>
            )}

            {/* Google Calendar / Meet */}
            <div className="mt-5 rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/70 border-b border-gray-100">
                <Icon icon="logos:google-calendar" className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Google Calendar {form.format === "video" && "& Meet"}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {google.loading ? (isEn ? "Checking connection…" : "Kontrollerar anslutning…")
                      : googleReady ? (isEn ? `Connected as ${gStatus?.email ?? "your Google account"}` : `Ansluten som ${gStatus?.email ?? "ditt Google-konto"}`)
                        : !gStatus?.configured ? (isEn ? "Not set up on the server yet" : "Inte konfigurerat på servern än")
                          : (isEn ? "Not connected" : "Inte ansluten")}
                  </p>
                </div>
                {!google.loading && gStatus?.configured && !gStatus.connected && (
                  <button type="button" onClick={connectGoogle}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: NAVY }}>
                    <Icon icon="tabler:plug-connected" className="w-3.5 h-3.5" />
                    {isEn ? "Connect" : "Anslut"}
                  </button>
                )}
              </div>

              {googleReady ? (
                <div className="divide-y divide-gray-100">
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">
                        {form.format === "video"
                          ? (isEn ? "Create a Google Meet link" : "Skapa en Google Meet-länk")
                          : (isEn ? "Add to my Google Calendar" : "Lägg till i min Google Kalender")}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {form.format === "video"
                          ? (isEn ? "The interview is added to your Google Calendar with a Meet link." : "Intervjun läggs i din Google Kalender med en Meet-länk.")
                          : (isEn ? "Blocks the time in your Google Calendar." : "Blockerar tiden i din Google Kalender.")}
                      </p>
                    </div>
                    <Toggle checked={form.addToCalendar} onChange={v => set("addToCalendar", v)} />
                  </label>
                  <label className={clsx("flex items-center gap-3 px-4 py-3 cursor-pointer", !form.addToCalendar && "opacity-50")}>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">{isEn ? "Email the candidate a calendar invitation" : "Mejla kandidaten en kalenderinbjudan"}</p>
                      <p className="text-[11px] text-gray-400">
                        {isEn ? `Google sends it to ${form.candidateEmail || "the candidate"} — and updates if you reschedule or cancel.`
                          : `Google skickar den till ${form.candidateEmail || "kandidaten"} — och uppdaterar om du bokar om eller avbokar.`}
                      </p>
                    </div>
                    <Toggle checked={form.sendInvite && form.addToCalendar} disabled={!form.addToCalendar} onChange={v => set("sendInvite", v)} />
                  </label>
                </div>
              ) : (
                <div className="px-4 py-3 text-xs text-gray-500 leading-relaxed">
                  {gStatus?.configured === false
                    ? (isEn ? "Ask your administrator to add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google Meet links." : "Be administratören lägga till GOOGLE_CLIENT_ID och GOOGLE_CLIENT_SECRET för att aktivera Google Meet-länkar.")
                    : (isEn ? "Connect your Google account to create Google Meet links automatically and email the candidate a calendar invitation. What you've typed here is kept." : "Anslut ditt Google-konto för att skapa Google Meet-länkar automatiskt och mejla kandidaten en kalenderinbjudan. Det du har skrivit sparas.")}
                </div>
              )}
            </div>

            {form.format === "video" && !useGoogle && (
              <div className="mt-4">
                <Label text={isEn ? "Video link (optional)" : "Videolänk (valfritt)"} invalid={!!errorOf("meetingLink")}
                  hint={isEn ? "Teams, Zoom or an existing Meet link" : "Teams, Zoom eller en befintlig Meet-länk"} />
                <input type="url" value={form.meetingLink} onChange={e => set("meetingLink", e.target.value)}
                  aria-invalid={!!errorOf("meetingLink")} placeholder="https://" className={cls("meetingLink")} />
                <FieldError message={errorOf("meetingLink")} />
              </div>
            )}
          </Section>

          {/* 4 — Message */}
          <Section step={4} title={isEn ? "Message to the candidate" : "Meddelande till kandidaten"}
            subtitle={isEn ? "Optional — included in the calendar invitation." : "Valfritt — ingår i kalenderinbjudan."}>
            <textarea value={form.messageToCandidate} onChange={e => set("messageToCandidate", e.target.value)} rows={4}
              placeholder={isEn ? "e.g. Looking forward to meeting you! The interview is with me and our tech lead. Please have your portfolio ready." : "t.ex. Ser fram emot att träffa dig! Intervjun är med mig och vår tech lead. Ha gärna din portfolio redo."}
              className={`${okCls} resize-none leading-relaxed`} />
          </Section>
        </div>

        {/* ═════ SUMMARY (sticky) ═════ */}
        <aside className="w-full lg:w-[340px] flex-shrink-0 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, rgb(15,32,90) 100%)` }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{isEn ? "Summary" : "Sammanfattning"}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {form.candidateName.trim() ? initials(form.candidateName) : <Icon icon="tabler:user" className="w-5 h-5 text-white/60" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{form.candidateName.trim() || (isEn ? "Candidate" : "Kandidat")}</p>
                  <p className="text-xs text-white/60 truncate">{form.position.trim() || (isEn ? "Position" : "Tjänst")}</p>
                  {form.employeeId && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/15">
                      <Icon icon="tabler:user-check" className="w-3 h-3" />
                      {isEn ? "Your employee" : "Din medarbetare"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-gray-700">
                <Icon icon="tabler:calendar" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{form.date ? fmtLongDate(`${form.date}T12:00:00`, isEn) : "—"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700">
                <Icon icon="tabler:clock" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{startIso && endDate ? `${fmtTime(startIso)} – ${fmtTime(endDate)}` : "—"} <span className="text-gray-400">· {form.durationMinutes} min</span></span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700">
                <Icon icon={form.format === "video" ? "logos:google-meet" : fmtCfg.icon} className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>
                  {isEn ? fmtCfg.en : fmtCfg.sv}
                  {form.format === "video" && (
                    <span className="text-gray-400"> · {useGoogle ? (isEn ? "Meet link created on booking" : "Meet-länk skapas vid bokning") : form.meetingLink ? (isEn ? "own link" : "egen länk") : (isEn ? "no link yet" : "ingen länk än")}</span>
                  )}
                </span>
              </div>
              {useGoogle && form.sendInvite && (
                <div className="flex items-center gap-2.5 text-gray-700">
                  <Icon icon="tabler:mail-forward" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{isEn ? "Invitation to" : "Inbjudan till"} {form.candidateEmail || "—"}</span>
                </div>
              )}
            </div>

            {/* Day agenda */}
            <div className="px-5 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {isEn ? "Your interviews that day" : "Dina intervjuer den dagen"}
              </p>
              <div className="space-y-1.5">
                {[...sameDay.map(iv => ({ key: iv.id, start: iv.startAt, end: endOf(iv.startAt, iv.durationMinutes).toISOString(), name: iv.candidateName, isNew: false })),
                ...(startIso && endDate ? [{ key: "new", start: startIso, end: endDate.toISOString(), name: form.candidateName.trim() || (isEn ? "This interview" : "Denna intervju"), isNew: true }] : [])]
                  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .map(item => {
                    const clash = item.isNew ? conflicts.length > 0 : conflicts.some(c => c.id === item.key)
                    return (
                      <div key={item.key}
                        className={clsx("flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs",
                          item.isNew ? (clash ? "border-amber-300 bg-amber-50" : "border-blue-200 bg-blue-50") : clash ? "border-amber-200 bg-amber-50/60" : "border-gray-100 bg-gray-50")}>
                        <span className={clsx("font-bold tabular-nums", item.isNew ? "text-blue-900" : "text-gray-500")}>
                          {fmtTime(item.start)}–{fmtTime(item.end)}
                        </span>
                        <span className={clsx("truncate", item.isNew ? "font-semibold text-blue-900" : "text-gray-600")}>{item.name}</span>
                        {item.isNew && <span className="ml-auto text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white text-blue-800 border border-blue-200">{isEn ? "New" : "Ny"}</span>}
                      </div>
                    )
                  })}
                {sameDay.length === 0 && (
                  <p className="text-[11px] text-gray-400">{isEn ? "No other interviews booked — the day is free." : "Inga andra intervjuer bokade — dagen är ledig."}</p>
                )}
              </div>

              {conflicts.length > 0 && (
                <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  <Icon icon="tabler:alert-triangle" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {isEn
                    ? `Overlaps with ${conflicts.map(c => c.candidateName).join(", ")}. You can still book it.`
                    : `Krockar med ${conflicts.map(c => c.candidateName).join(", ")}. Du kan ändå boka.`}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60">
              {error && (
                <div className="flex items-start gap-2 mb-3 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  <Icon icon="tabler:alert-circle" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
              {showErrors && missingCount > 0 && (
                <p className="text-[11px] text-red-500 font-medium mb-2">
                  {isEn ? `${missingCount} field(s) need your attention` : `${missingCount} fält behöver åtgärdas`}
                </p>
              )}
              <button onClick={handleSubmit} disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 hover:shadow-md disabled:opacity-60"
                style={{ backgroundColor: NAVY }}>
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Icon icon="tabler:calendar-check" className="w-4 h-4" />}
                {saving
                  ? (useGoogle ? (isEn ? "Creating Google Meet…" : "Skapar Google Meet…") : (isEn ? "Saving…" : "Sparar…"))
                  : isEdit ? (isEn ? "Save Changes" : "Spara Ändringar") : (isEn ? "Book Interview" : "Boka Intervju")}
              </button>
              <button onClick={onBack} disabled={saving}
                className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-40">
                {isEn ? "Cancel" : "Avbryt"}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-[11px] text-gray-500" style={{ backgroundColor: LIGHT }}>
            <Icon icon="tabler:notes" className="w-4 h-4 flex-shrink-0" style={{ color: NAVY }} />
            {isEn
              ? "After the interview, open it from the Interviews page to write notes and fill in the evaluation form."
              : "Efter intervjun, öppna den från Intervjuer-sidan för att skriva anteckningar och fylla i utvärderingen."}
          </div>
        </aside>
      </div>
    </div>
  )
}
