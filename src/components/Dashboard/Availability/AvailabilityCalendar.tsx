"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Availability/AvailabilityCalendar.tsx   (NEW)
// WHAT IT DOES:   The year calendar view — the same for employees and managers:
//   • Pick a tool and drag over days:
//       Mark: Available / Booked / Clear → saved straight away (your own calendar)
//       Time off: vacation, sick, VAB, parental leave … → the request form opens with those
//       days filled in (employees: your manager answers · managers: your business admin)
//   • Your requests are drawn on the calendar (solid = approved, dashed = waiting)
//   • Time off this year + requests waiting
// USED BY:        AvailabilityViews.tsx (employee Availability page + manager My availability)
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import axios from "axios"
import YearCalendar from "./Calendar/WeekCalendar"
import { AskCard, myAvailabilityTexts, type Audience } from "./MyAvailabilityPanel"
import type { SelfAvailabilityApi } from "@/utils/myAvailabilityApi"
import type { TimeOffRequest, TimeOffType, WeekDay } from "@/utils/managerAvailability"

type DateStatus = "booked" | "available" | "vacation" | "none"
type Lang = "sv" | "en"

const TX = {
  sv: {
    loading: "Laddar kalendern…", failed: "Kunde inte ladda din kalender.", retry: "Försök igen",
    hint: (who: string) => `Välj ett verktyg och dra över dagarna. Tillgänglig / Bokad sparas direkt. Semester, sjuk, VAB och övrig ledighet öppnar en ansökan med dagarna ifyllda — ${who} svarar på den.`,
    managerWho: "din business admin", employeeWho: "din chef",
    seenBy: { manager: "Din business admin ser din kalender i sin översikt.", employee: "Din chef ser din kalender i sin teamöversikt." },
    timeOffYear: "Ledigt i år", workingDays: "arbetsdagar", waiting: (who: string) => `Väntar på ${who}`, requests: "förfrågningar",
    booked: "Bokade dagar", available: "Markerat tillgänglig", days: "dagar", close: "Stäng",
    cal: { today: "Idag", available: "Tillgänglig", vacation: "Semester", booked: "Bokad", clear: "Rensa", showWeekNumbers: "Visa veckonummer", dragToSelectMultiple: "Dra för att markera flera dagar", none: "Ingen" },
  },
  en: {
    loading: "Loading the calendar…", failed: "Couldn't load your calendar.", retry: "Try again",
    hint: (who: string) => `Pick a tool and drag over the days. Available / Booked are saved straight away. Vacation, sick, VAB and other time off open a request with the days filled in — ${who} answers it.`,
    managerWho: "your business admin", employeeWho: "your manager",
    seenBy: { manager: "Your business admin sees your calendar in their overview.", employee: "Your manager sees your calendar in their team overview." },
    timeOffYear: "Time off this year", workingDays: "working days", waiting: (who: string) => `Waiting for ${who}`, requests: "requests",
    booked: "Booked days", available: "Marked available", days: "days", close: "Close",
    cal: { today: "Today", available: "Available", vacation: "Vacation", booked: "Booked", clear: "Clear", showWeekNumbers: "Show week numbers", dragToSelectMultiple: "Drag to select multiple days", none: "None" },
  },
}

export default function AvailabilityCalendar({ lang, audience, api }: { lang: Lang; audience: Audience; api: SelfAvailabilityApi }) {
  const c = TX[lang]
  const who = audience === "manager" ? c.managerWho : c.employeeWho
  const x = myAvailabilityTexts(lang, audience)

  const [marks, setMarks] = useState<Record<string, DateStatus>>({})
  const [calendarId, setCalendarId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [weekly, setWeekly] = useState<WeekDay[] | null>(null)
  const [asking, setAsking] = useState<{ type: TimeOffType; start: string; end: string } | null>(null)

  /** Your calendar marks (always your own — the API uses your session). */
  const loadMarks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/calendar-availability")
      const doc = (res.data?.docs ?? [])[0]
      const next: Record<string, DateStatus> = {}
      for (const e of doc?.dateStatus ?? []) next[String(e.date).slice(0, 10)] = e.status
      setMarks(next)
      setCalendarId(doc?.id ?? null)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  /** Your days-off requests (drawn on the calendar) + your week (to count working days). */
  const loadRequests = useCallback(async () => {
    try {
      const [a, r] = await Promise.all([api.get(), api.requests()])
      setWeekly(a.data.weekly)
      setRequests(r)
    } catch { /* the calendar still works without them */ }
  }, [api])

  useEffect(() => { loadMarks(); loadRequests() }, [loadMarks, loadRequests])

  const onDateSelect = (date: string, status: DateStatus) =>
    setMarks((prev) => {
      const next = { ...prev }
      if (status === "none") delete next[date]
      else next[date] = status
      return next
    })

  if (loading) return <div className="py-10 text-center text-sm text-gray-400">{c.loading}</div>
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
        <p className="text-sm text-gray-600 mb-3">{c.failed}</p>
        <button onClick={loadMarks} className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: "rgb(5,22,80)" }}>{c.retry}</button>
      </div>
    )
  }

  const y = String(new Date().getFullYear())
  const approvedDays = requests.filter((r) => r.status === "approved" && r.startDate.startsWith(y)).reduce((n, r) => n + r.workingDays, 0)
  const pending = requests.filter((r) => r.status === "pending").length
  const bookedDays = Object.entries(marks).filter(([d, s]) => s === "booked" && d.startsWith(y)).length
  const availableDays = Object.entries(marks).filter(([d, s]) => s === "available" && d.startsWith(y)).length
  const stats = [
    { icon: "tabler:beach", color: "rgb(3,105,161)", label: c.timeOffYear, value: String(Math.round(approvedDays * 10) / 10).replace(".", ","), unit: c.workingDays },
    { icon: "tabler:hourglass", color: "rgb(217,119,6)", label: c.waiting(who), value: String(pending), unit: c.requests },
    { icon: "tabler:briefcase", color: "rgb(30,64,175)", label: c.booked, value: String(bookedDays), unit: c.days },
    { icon: "tabler:circle-check", color: "rgb(22,101,52)", label: c.available, value: String(availableDays), unit: c.days },
  ]

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-900">
        <Icon icon="tabler:info-circle" className="w-4 h-4 flex-shrink-0 mt-px" />
        <span>{c.hint(who)} {c.seenBy[audience]}</span>
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Icon icon={s.icon} className="w-4 h-4 flex-shrink-0" style={{ color: s.color }} /><span className="truncate">{s.label}</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{s.value}<span className="text-sm font-normal text-gray-500 ml-1">{s.unit}</span></div>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden shadow-sm">
        <YearCalendar
          calendarId={calendarId}
          initialYear={new Date().getFullYear()}
          onDateSelect={onDateSelect}
          initialDateStatuses={marks}
          requests={requests}
          lang={lang}
          audience={audience}
          onTimeOffRange={(start, end, type) => setAsking({ type, start, end })}
          translations={c.cal}
        />
      </div>

      {/* Dragged with a time-off tool → the request form, with those days filled in */}
      {asking && weekly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAsking(null)} />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
            <button onClick={() => setAsking(null)} aria-label={c.close}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-white/80 text-gray-500 hover:text-gray-800 hover:bg-gray-100">
              <Icon icon="tabler:x" className="w-4 h-4" />
            </button>
            <AskCard key={`${asking.type}-${asking.start}-${asking.end}`} x={x} lang={lang} weekly={weekly} api={api}
              initial={asking}
              onSent={async () => { await loadRequests(); setTimeout(() => setAsking(null), 1200) }} />
          </div>
        </div>
      )}
    </div>
  )
}
