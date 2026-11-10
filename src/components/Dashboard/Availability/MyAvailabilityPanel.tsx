"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Availability/MyAvailabilityPanel.tsx   (NEW)
// WHAT IT DOES:   "My availability" — one component for managers AND employees:
//   • Right now: my status (follow my week / available / limited / unavailable) + note + until
//   • The next two weeks at a glance (employees: incl. what they marked in the calendar)
//   • My working week (available / part of the day with hours / not working)
//   • Ask for time off → managers: their business admin answers · employees: their manager(s)
//     Sick / VAB are registered straight away.
//   • My requests: upcoming + history, withdraw / "I'm back"
// USED BY:        manager/views/ManagerMyAvailability.tsx  (audience "manager")
//                 the employee's Availability page          (audience "employee")
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import {
  DAY_KIND_STYLE,
  MANUAL_STATUS_LABELS,
  REPORTED_TYPES,
  STATUS_LABELS,
  TIME_OFF_TYPES,
  TYPE_LABELS,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  addDaysStr,
  countWorkingDays,
  daysLabel,
  fmtDay,
  fmtRange,
  todayStr,
  type DayCell,
  type DayMode,
  type HalfDay,
  type Lang,
  type ManualStatus,
  type MyAvailability,
  type TimeOffRequest,
  type TimeOffType,
  type WeekDay,
} from "@/utils/managerAvailability"
import { ApiError, type SelfAvailabilityApi } from "@/utils/myAvailabilityApi"

const NAVY = "rgb(5,22,80)"

const TX = {
  en: {
    title: "My availability", desc: "Tell your business admin when you work, how available you are, and ask for time off.",
    rightNow: "Right now", statusNote: "Short note (optional)", notePh: "e.g. Busy with the Q4 launch", until: "Until (optional)",
    untilHint: "Goes back to “Follow my working week” after this day.", save: "Save", saved: "Saved", saving: "Saving…",
    nextTwoWeeks: "The next two weeks", workingWeek: "My working week", workingWeekDesc: "Your usual week. Time off is counted from it.",
    modes: { available: "Available", partial: "Part of day", off: "Not working" } as Record<DayMode, string>,
    from: "From", to: "To", reset: "Undo changes",
    askTitle: "Ask for time off", askDesc: "Your business admin gets the request and approves or declines it.",
    reportDesc: "Sick and VAB are registered straight away — your business admin is notified.",
    type: "Type", start: "First day", end: "Last day", halfDay: "Half day", whole: "Whole day", am: "Morning", pm: "Afternoon",
    note: "Message (optional)", notePh2: "Anything your admin should know", send: "Send request", report: "Report",
    sending: "Sending…", requestSent: "Request sent to your business admin.", reportedOk: "Registered. Get well soon!",
    countIs: "That's", notWorking: "None of these days are working days in your week.",
    myRequests: "My requests", upcoming: "Upcoming & waiting", history: "History", none: "No requests yet.",
    withdraw: "Withdraw", back: "I'm back", confirmWithdraw: "Withdraw this request?", yes: "Yes, withdraw", no: "No",
    answer: "Answer", reportedLbl: "Registered", waiting: "Waiting for your business admin", loadFailed: "Couldn't load your availability.", retry: "Try again",
    today: "Today",
  },
  sv: {
    title: "Min tillgänglighet", desc: "Visa din business admin när du arbetar, hur tillgänglig du är och ansök om ledighet.",
    rightNow: "Just nu", statusNote: "Kort notering (valfritt)", notePh: "t.ex. Upptagen med Q4-lanseringen", until: "Till och med (valfritt)",
    untilHint: "Går tillbaka till ”Följ min arbetsvecka” efter den dagen.", save: "Spara", saved: "Sparat", saving: "Sparar…",
    nextTwoWeeks: "De kommande två veckorna", workingWeek: "Min arbetsvecka", workingWeekDesc: "Din vanliga vecka. Ledighet räknas utifrån den.",
    modes: { available: "Tillgänglig", partial: "Del av dagen", off: "Arbetar inte" } as Record<DayMode, string>,
    from: "Från", to: "Till", reset: "Ångra ändringar",
    askTitle: "Ansök om ledighet", askDesc: "Din business admin får förfrågan och godkänner eller nekar den.",
    reportDesc: "Sjuk och VAB registreras direkt — din business admin får en notis.",
    type: "Typ", start: "Första dagen", end: "Sista dagen", halfDay: "Halvdag", whole: "Heldag", am: "Förmiddag", pm: "Eftermiddag",
    note: "Meddelande (valfritt)", notePh2: "Något din admin bör veta", send: "Skicka förfrågan", report: "Anmäl",
    sending: "Skickar…", requestSent: "Förfrågan skickad till din business admin.", reportedOk: "Registrerat. Krya på dig!",
    countIs: "Det blir", notWorking: "Ingen av dagarna är en arbetsdag i din vecka.",
    myRequests: "Mina förfrågningar", upcoming: "Kommande & väntande", history: "Historik", none: "Inga förfrågningar ännu.",
    withdraw: "Återkalla", back: "Jag är tillbaka", confirmWithdraw: "Återkalla förfrågan?", yes: "Ja, återkalla", no: "Nej",
    answer: "Svar", reportedLbl: "Registrerad", waiting: "Väntar på din business admin", loadFailed: "Kunde inte ladda din tillgänglighet.", retry: "Försök igen",
    today: "Idag",
  },
}
type X = (typeof TX)["en"]
export type Audience = "manager" | "employee"

/** Employees ask their manager — not the business admin. */
const EMPLOYEE_TX = {
  en: {
    desc: "Show your manager when you work, how available you are, and ask for time off.",
    askDesc: "Your manager gets the request and approves or declines it.",
    reportDesc: "Sick and VAB are registered straight away — your manager is notified.",
    requestSent: "Request sent to your manager.",
    waiting: "Waiting for your manager",
    notePh2: "Anything your manager should know",
  },
  sv: {
    desc: "Visa din chef när du arbetar, hur tillgänglig du är och ansök om ledighet.",
    askDesc: "Din chef får förfrågan och godkänner eller nekar den.",
    reportDesc: "Sjuk och VAB registreras direkt — din chef får en notis.",
    requestSent: "Förfrågan skickad till din chef.",
    waiting: "Väntar på din chef",
    notePh2: "Något din chef bör veta",
  },
}

export function myAvailabilityTexts(lang: Lang, audience: Audience): X {
  return audience === "employee" ? { ...TX[lang], ...EMPLOYEE_TX[lang] } : TX[lang]
}

const sameWeek = (a: WeekDay[], b: WeekDay[]) => JSON.stringify(a) === JSON.stringify(b)

/** Everything below the page title. The page around it supplies the title. */
export default function MyAvailabilityPanel({ api, lang, audience }: { api: SelfAvailabilityApi; lang: Lang; audience: Audience }) {
  const x = myAvailabilityTexts(lang, audience)
  const [mine, setMine] = useState<MyAvailability | null>(null)
  const [days, setDays] = useState<DayCell[]>([])
  const [requests, setRequests] = useState<TimeOffRequest[] | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      const [a, r] = await Promise.all([api.get(), api.requests()])
      setMine(a.data)
      setDays(a.days)
      setRequests(r)
      setError(false)
    } catch {
      setError(true)
    }
  }, [api])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [load])

  const applySaved = (r: { data: MyAvailability; days: DayCell[] }) => { setMine(r.data); setDays(r.days) }
  const refreshAfterRequest = async () => {
    const [a, r] = await Promise.all([api.get(), api.requests()])
    applySaved(a)
    setRequests(r)
  }

  if (error && !mine) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
        <p className="text-sm text-gray-600 mb-3">{x.loadFailed}</p>
        <button onClick={load} className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: NAVY }}>{x.retry}</button>
      </div>
    )
  }
  if (!mine) {
    return <div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-56 rounded-2xl bg-white border border-gray-100 animate-pulse" />)}</div>
  }
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4 min-w-0">
        <StatusCard x={x} lang={lang} mine={mine} today={days[0]} api={api} onSaved={applySaved} />
        <NextDays x={x} lang={lang} days={days} />
        <WeekCard x={x} lang={lang} mine={mine} api={api} onSaved={applySaved} />
      </div>
      <div className="lg:col-span-2 space-y-4 min-w-0">
        <AskCard x={x} lang={lang} weekly={mine.weekly} api={api} onSent={refreshAfterRequest} />
        <RequestsCard x={x} lang={lang} requests={requests ?? []} api={api} onChanged={refreshAfterRequest} />
      </div>
    </div>
  )
}

/* ═════════════════════════ Cards ═════════════════════════ */

function Card({ icon, title, desc, children, right }: { icon: string; title: string; desc?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-start gap-2.5">
          <Icon icon={icon} className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: NAVY }} />
          <div>
            <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
            {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function SaveButton({ x, state, disabled, onClick }: { x: X; state: "idle" | "saving" | "saved"; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled || state === "saving"}
      className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-1.5 disabled:opacity-50 transition-opacity"
      style={{ backgroundColor: state === "saved" ? "rgb(22,163,74)" : NAVY }}>
      {state === "saving" && <Icon icon="tabler:loader-2" className="w-4 h-4 animate-spin" />}
      {state === "saved" && <Icon icon="tabler:check" className="w-4 h-4" />}
      {state === "saving" ? x.saving : state === "saved" ? x.saved : x.save}
    </button>
  )
}

function useSaveState() {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle")
  const [err, setErr] = useState("")
  const run = async (fn: () => Promise<void>) => {
    setState("saving"); setErr("")
    try {
      await fn()
      setState("saved")
      setTimeout(() => setState("idle"), 1800)
    } catch (e: any) {
      setErr(e?.message ?? "Error")
      setState("idle")
    }
  }
  return { state, err, run }
}

function StatusCard({ x, lang, mine, today, api, onSaved }: { x: X; lang: Lang; mine: MyAvailability; today?: DayCell; api: SelfAvailabilityApi; onSaved: (r: any) => void }) {
  const [status, setStatus] = useState<ManualStatus>(mine.status)
  const [note, setNote] = useState(mine.statusNote)
  const [until, setUntil] = useState(mine.statusUntil)
  const { state, err, run } = useSaveState()
  useEffect(() => { setStatus(mine.status); setNote(mine.statusNote); setUntil(mine.statusUntil) }, [mine])
  const dirty = status !== mine.status || note !== mine.statusNote || until !== mine.statusUntil
  const s = today ? DAY_KIND_STYLE[today.kind] : null
  const type = today?.timeOffType ? TYPE_LABELS[today.timeOffType] : null

  return (
    <Card icon="tabler:broadcast" title={x.rightNow}
      right={today && (
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 whitespace-nowrap"
          style={{ color: type ? type.color : s!.color, backgroundColor: type ? type.bg : s!.bg }}>
          <Icon icon={type ? type.icon : s!.icon} className="w-3 h-3" />{x.today}: {type ? type[lang] : s![lang]}
        </span>
      )}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(["auto", "available", "limited", "unavailable"] as ManualStatus[]).map((k) => {
          const l = MANUAL_STATUS_LABELS[k]
          const on = status === k
          return (
            <button key={k} onClick={() => setStatus(k)}
              className={clsx("text-left rounded-xl border px-3 py-2.5 transition-all", on ? "border-blue-900/40 bg-blue-50/40 ring-1 ring-blue-900/20" : "border-gray-200 hover:border-gray-300")}>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.dot }} />{l[lang]}
                {on && <Icon icon="tabler:check" className="w-4 h-4 ml-auto" style={{ color: NAVY }} />}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 ml-[18px]">{lang === "en" ? l.hintEn : l.hintSv}</p>
            </button>
          )
        })}
      </div>
      {status !== "auto" && (
        <div className="grid sm:grid-cols-[1fr_180px] gap-3 mt-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-600">{x.statusNote}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder={x.notePh}
              className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-600">{x.until}</span>
            <input type="date" value={until} min={todayStr()} onChange={(e) => setUntil(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <p className="text-[11px] text-gray-400 sm:col-span-2 -mt-1">{x.untilHint}</p>
        </div>
      )}
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
      <div className="flex justify-end mt-4">
        <SaveButton x={x} state={state} disabled={!dirty && state === "idle"}
          onClick={() => run(async () => onSaved(await api.save({ status, statusNote: note, statusUntil: until })))} />
      </div>
    </Card>
  )
}

function NextDays({ x, lang, days }: { x: X; lang: Lang; days: DayCell[] }) {
  return (
    <Card icon="tabler:calendar-week" title={x.nextTwoWeeks}>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((c, i) => {
          const type = c.timeOffType ? TYPE_LABELS[c.timeOffType] : null
          const s = DAY_KIND_STYLE[c.kind]
          const wd = (new Date(`${c.date}T12:00:00Z`).getUTCDay() + 6) % 7
          const label = type ? type[lang] : s[lang]
          return (
            <div key={c.date} title={`${WEEKDAY_LONG[lang][wd]} ${fmtDay(c.date, lang)} · ${label}${c.hours ? ` · ${c.hours}` : ""}${c.pending ? ` · ${STATUS_LABELS.pending[lang]}: ${TYPE_LABELS[c.pending.type][lang]}` : ""}`}
              className={clsx("relative min-w-0 rounded-xl p-1 sm:p-2 text-center", i === 0 && "ring-2 ring-blue-900/30",
                c.pending && "outline-2 outline-dashed outline-amber-400 outline-offset-1")}
              style={{ backgroundColor: type ? type.bg : s.bg }}>
              <div className="text-[10px] font-semibold" style={{ color: type ? type.color : s.color }}>{WEEKDAY_SHORT[lang][wd]}</div>
              <div className="text-sm font-bold text-gray-800 leading-tight">{fmtDay(c.date, lang, { day: "numeric" })}</div>
              <Icon icon={type ? type.icon : s.icon} className="w-3.5 h-3.5 mx-auto mt-0.5" style={{ color: type ? type.color : s.color }} />
              {c.hours && <div className="hidden sm:block text-[9px] font-medium mt-0.5" style={{ color: s.color }}>{c.hours}</div>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function WeekCard({ x, lang, mine, api, onSaved }: { x: X; lang: Lang; mine: MyAvailability; api: SelfAvailabilityApi; onSaved: (r: any) => void }) {
  const [week, setWeek] = useState<WeekDay[]>(mine.weekly)
  const { state, err, run } = useSaveState()
  useEffect(() => { setWeek(mine.weekly) }, [mine])
  const dirty = !sameWeek(week, mine.weekly)
  const set = (day: number, patch: Partial<WeekDay>) => setWeek((w) => w.map((d) => (d.day === day ? { ...d, ...patch } : d)))
  const badHours = week.some((d) => d.mode === "partial" && d.start >= d.end)

  return (
    <Card icon="tabler:calendar-time" title={x.workingWeek} desc={x.workingWeekDesc}>
      <div className="divide-y divide-gray-50">
        {week.map((d) => (
          <div key={d.day} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="w-24 text-sm font-medium text-gray-700">{WEEKDAY_LONG[lang][d.day - 1]}</div>
            <div className="inline-flex p-0.5 rounded-lg bg-gray-100 self-start">
              {(["available", "partial", "off"] as DayMode[]).map((m) => (
                <button key={m} onClick={() => set(d.day, { mode: m })}
                  className={clsx("px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    d.mode === m ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  style={d.mode === m ? { color: DAY_KIND_STYLE[m].color } : {}}>
                  {x.modes[m]}
                </button>
              ))}
            </div>
            {d.mode === "partial" && (
              <div className="flex items-center gap-2 sm:ml-auto">
                <input type="time" value={d.start} onChange={(e) => set(d.day, { start: e.target.value })} aria-label={x.from}
                  className={clsx("h-8 rounded-lg border px-2 text-sm", d.start >= d.end ? "border-red-300" : "border-gray-200")} />
                <span className="text-gray-400 text-sm">–</span>
                <input type="time" value={d.end} onChange={(e) => set(d.day, { end: e.target.value })} aria-label={x.to}
                  className={clsx("h-8 rounded-lg border px-2 text-sm", d.start >= d.end ? "border-red-300" : "border-gray-200")} />
              </div>
            )}
          </div>
        ))}
      </div>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
      <div className="flex justify-end gap-2 mt-3">
        {dirty && <button onClick={() => setWeek(mine.weekly)} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">{x.reset}</button>}
        <SaveButton x={x} state={state} disabled={(!dirty || badHours) && state === "idle"}
          onClick={() => run(async () => onSaved(await api.save({ weekly: week })))} />
      </div>
    </Card>
  )
}

/** The "ask for time off" form. Exported so the calendar can open it with the dragged days filled in. */
export function AskCard({ x, lang, weekly, api, onSent, initial }: {
  x: X; lang: Lang; weekly: WeekDay[]; api: SelfAvailabilityApi; onSent: () => Promise<void>
  initial?: { type: TimeOffType; start: string; end: string }
}) {
  const today = todayStr()
  const [type, setType] = useState<TimeOffType>(initial?.type ?? "vacation")
  const [start, setStart] = useState(initial?.start ?? today)
  const [end, setEnd] = useState(initial?.end ?? today)
  const [half, setHalf] = useState<HalfDay>("none")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const reported = REPORTED_TYPES.includes(type)
  const minStart = reported ? addDaysStr(today, -14) : today

  const count = useMemo(() => (start && end && end >= start ? countWorkingDays(start, end, weekly, start === end ? half : "none") : 0), [start, end, half, weekly])

  const submit = async () => {
    setBusy(true); setMsg(null)
    try {
      await api.request({ type, startDate: start, endDate: end, halfDay: start === end ? half : "none", note })
      setMsg({ ok: true, text: reported ? x.reportedOk : x.requestSent })
      setNote(""); setHalf("none")
      await onSent()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card icon="tabler:beach" title={x.askTitle} desc={reported ? x.reportDesc : x.askDesc}>
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {TIME_OFF_TYPES.map((k) => {
          const l = TYPE_LABELS[k]
          const on = type === k
          return (
            <button key={k} onClick={() => { setType(k); setMsg(null); if (!REPORTED_TYPES.includes(k) && start < today) { setStart(today); if (end < today) setEnd(today) } }}
              className={clsx("flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium text-left transition-all",
                on ? "border-transparent" : "border-gray-200 text-gray-600 hover:border-gray-300")}
              style={on ? { backgroundColor: l.bg, color: l.color, boxShadow: `inset 0 0 0 1.5px ${l.color}` } : {}}>
              <Icon icon={l.icon} className="w-4 h-4 flex-shrink-0" /><span className="truncate">{l[lang]}</span>
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-600">{x.start}</span>
          <input type="date" value={start} min={minStart}
            onChange={(e) => { setStart(e.target.value); if (!end || end < e.target.value) setEnd(e.target.value) }}
            className="mt-1 w-full min-w-0 h-10 rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">{x.end}</span>
          <input type="date" value={end} min={start || minStart} onChange={(e) => setEnd(e.target.value)}
            className="mt-1 w-full min-w-0 h-10 rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </label>
      </div>
      {start && start === end && (
        <div className="mt-3">
          <span className="text-xs font-medium text-gray-600">{x.halfDay}</span>
          <div className="mt-1 inline-flex p-0.5 rounded-lg bg-gray-100">
            {(["none", "am", "pm"] as HalfDay[]).map((h) => (
              <button key={h} onClick={() => setHalf(h)}
                className={clsx("px-3 py-1 rounded-md text-xs font-medium", half === h ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>
                {h === "none" ? x.whole : h === "am" ? x.am : x.pm}
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="block mt-3">
        <span className="text-xs font-medium text-gray-600">{x.note}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} placeholder={x.notePh2}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
      </label>

      <div className="mt-3 rounded-xl px-3 py-2 text-xs flex items-center gap-2" style={{ backgroundColor: count ? "rgb(240,249,255)" : "rgb(255,251,235)", color: count ? "rgb(3,105,161)" : "rgb(146,64,14)" }}>
        <Icon icon={count ? "tabler:calendar-stats" : "tabler:alert-circle"} className="w-4 h-4 flex-shrink-0" />
        {count ? <span>{x.countIs} <b>{daysLabel(count, lang)}</b> · {fmtRange({ startDate: start, endDate: end, halfDay: start === end ? half : "none" }, lang)}</span> : <span>{x.notWorking}</span>}
      </div>

      {msg && <p className={clsx("text-xs mt-2", msg.ok ? "text-green-700" : "text-red-600")}>{msg.text}</p>}
      <button onClick={submit} disabled={busy || !start || !end || end < start || (!count && !reported)}
        className="mt-4 w-full py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
        style={{ backgroundColor: reported ? TYPE_LABELS[type].color : NAVY }}>
        {busy ? <Icon icon="tabler:loader-2" className="w-4 h-4 animate-spin" /> : <Icon icon={reported ? "tabler:flag" : "tabler:send"} className="w-4 h-4" />}
        {busy ? x.sending : reported ? `${x.report}: ${TYPE_LABELS[type][lang]}` : x.send}
      </button>
    </Card>
  )
}

function RequestsCard({ x, lang, requests, api, onChanged }: { x: X; lang: Lang; requests: TimeOffRequest[]; api: SelfAvailabilityApi; onChanged: () => Promise<void> }) {
  const today = todayStr()
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming")
  const [confirm, setConfirm] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState("")

  const upcoming = requests
    .filter((r) => r.status === "pending" || (r.status === "approved" && r.endDate >= today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const history = requests.filter((r) => !upcoming.includes(r))
  const list = tab === "upcoming" ? upcoming : history

  const action = (r: TimeOffRequest): "withdraw" | "back" | null => {
    if (r.status === "pending") return "withdraw"
    if (r.status !== "approved") return null
    if (r.startDate > today) return "withdraw"
    if (REPORTED_TYPES.includes(r.type) && r.endDate >= today) return "back"
    return null
  }

  const cancel = async (id: string) => {
    setBusy(id); setErr("")
    try {
      await api.cancel(id)
      setConfirm(null)
      await onChanged()
    } catch (e: any) {
      setErr(e?.message ?? "Error")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card icon="tabler:list-check" title={x.myRequests}
      right={
        <div className="inline-flex p-0.5 rounded-lg bg-gray-100">
          {(["upcoming", "history"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)}
              className={clsx("px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap", tab === k ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>
              {k === "upcoming" ? x.upcoming : x.history}
            </button>
          ))}
        </div>
      }>
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      {list.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{x.none}</p>}
      <div className="space-y-2">
        {list.map((r) => {
          const tl = TYPE_LABELS[r.type]
          const sl = STATUS_LABELS[r.status]
          const act = action(r)
          const reported = REPORTED_TYPES.includes(r.type) && r.status === "approved" && !r.decidedByName
          return (
            <div key={r.id} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tl.bg }}>
                  <Icon icon={tl.icon} className="w-4 h-4" style={{ color: tl.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{tl[lang]}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap"
                      style={{ color: sl.color, backgroundColor: sl.bg, borderColor: sl.border }}>{reported ? x.reportedLbl : sl[lang]}</span>
                  </div>
                  <div className="text-xs text-gray-500">{fmtRange(r, lang)} · {daysLabel(r.workingDays, lang)}</div>
                  {r.status === "pending" && <div className="text-[11px] text-amber-700 mt-0.5">{x.waiting}</div>}
                  {r.decisionNote && (
                    <div className="text-[11px] text-gray-600 mt-1 bg-gray-50 rounded-lg px-2 py-1">
                      <b>{x.answer}{r.decidedByName ? ` · ${r.decidedByName}` : ""}:</b> {r.decisionNote}
                    </div>
                  )}
                </div>
              </div>
              {act && (
                confirm === r.id ? (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-600 mr-auto">{act === "back" ? `${x.back}?` : x.confirmWithdraw}</span>
                    <button onClick={() => setConfirm(null)} className="px-2.5 py-1 rounded-md text-xs text-gray-600 hover:bg-gray-100">{x.no}</button>
                    <button onClick={() => cancel(r.id)} disabled={busy === r.id}
                      className="px-2.5 py-1 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">
                      {busy === r.id ? "…" : act === "back" ? x.back : x.yes}
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => setConfirm(r.id)} className="text-xs font-medium text-gray-500 hover:text-red-600 flex items-center gap-1">
                      <Icon icon={act === "back" ? "tabler:arrow-back-up" : "tabler:x"} className="w-3.5 h-3.5" />{act === "back" ? x.back : x.withdraw}
                    </button>
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
