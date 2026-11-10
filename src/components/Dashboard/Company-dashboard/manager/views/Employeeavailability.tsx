"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/Employeeavailability.tsx   (REPLACE)
// WHAT IT DOES:   Manager → Employees → Availability — like the business admin's page for managers:
//   • Overview: every employee × the 7 days of a week — their working week, status, approved /
//     pending days off and what they marked in their own calendar (booked / vacation / available).
//     Week ←/→, search + filters, message an employee, open their profile.
//     While you cover for a colleague, their team is shown too (tagged).
//   • Requests: employees' days-off requests to approve / decline (with a note), then history.
//   Employees fill this in themselves (Availability → "Time off & week" / "Calendar").
// API:            GET /api/company/managers/team-availability · GET/PATCH /api/company/managers/team-time-off
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerDashboard } from "../ManagerDashboardContext"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { CoveringBadge, CoveringNotice } from "@/components/Dashboard/Company-dashboard/manager/delegation/CoveringBadge"
import {
  DAY_KIND_STYLE,
  MANUAL_STATUS_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  addDaysStr,
  daysLabel,
  fmtDay,
  fmtRange,
  mondayOf,
  todayStr,
  type DayCell,
  type DayKind,
  type Lang,
  type TeamAvailabilityRow,
  type TimeOffRequest,
} from "@/utils/managerAvailability"
import { teamAvailabilityApi, TIME_OFF_CHANGED_EVENT, type TeamGrid, type TeamTimeOffRequest } from "@/utils/myAvailabilityApi"

const NAVY = "rgb(5,22,80)"

const TX = {
  en: {
    title: "Employee availability", desc: "When your employees work, who is booked or away — and their days-off requests.",
    bookedWeek: "Booked this week", fBooked: "Booked", hidden: (n: number) => `${n} employee${n === 1 ? "" : "s"} shared only CVs or portfolio — not their availability.`,
    calendarNote: "From the employee's own calendar", employee: "Employee",
    overview: "Overview", requests: "Requests",
    availableToday: "Available today", offToday: "Away today", pending: "Pending requests", awayThisWeek: "Away this week",
    today: "Today", prevWeek: "Previous week", nextWeek: "Next week", week: "Week",
    search: "Search employee…", all: "All", fAvailable: "Available today", fAway: "Away today", fPending: "Has a request",
    manager: "Manager", now: "Now", noSchedule: "Hasn't filled in a schedule — standard week shown",
    nextOff: "Next time off", until: "until", noManagers: "No employees have shared their availability yet", noMatch: "No employee matches",
    pendingOn: "Request waiting", legend: "Legend", pendingLegend: "Request waiting for you",
    toDecide: "Waiting for your answer", nothingPending: "No requests are waiting — you're all caught up.",
    history: "History", noHistory: "Nothing here yet.", approve: "Approve", decline: "Decline",
    noteOptional: "Note to the employee (optional)", reasonRequired: "Reason (the employee sees it)",
    cancel: "Cancel", confirmApprove: "Approve request", confirmDecline: "Decline request",
    sent: "Sent", decidedBy: "by", reported: "Reported — no approval needed", overlaps: "Also away then",
    loadFailed: "Couldn't load availability.", retry: "Try again", message: "Message", profile: "Profile",
    statusFilter: { all: "All", approved: "Approved", declined: "Declined", cancelled: "Cancelled" },
    hours: "Hours",
  },
  sv: {
    title: "Medarbetarnas tillgänglighet", desc: "När dina medarbetare arbetar, vem som är bokad eller borta — och deras ledighetsförfrågningar.",
    bookedWeek: "Bokade denna vecka", fBooked: "Bokade", hidden: (n: number) => `${n} medarbetare har bara delat CV eller portfolio — inte sin tillgänglighet.`,
    calendarNote: "Från medarbetarens egen kalender", employee: "Medarbetare",
    overview: "Översikt", requests: "Förfrågningar",
    availableToday: "Tillgängliga idag", offToday: "Borta idag", pending: "Väntande förfrågningar", awayThisWeek: "Borta denna vecka",
    today: "Idag", prevWeek: "Föregående vecka", nextWeek: "Nästa vecka", week: "Vecka",
    search: "Sök medarbetare…", all: "Alla", fAvailable: "Tillgängliga idag", fAway: "Borta idag", fPending: "Har en förfrågan",
    manager: "Chef", now: "Nu", noSchedule: "Har inte fyllt i ett schema — standardvecka visas",
    nextOff: "Nästa ledighet", until: "till", noManagers: "Inga medarbetare har delat sin tillgänglighet ännu", noMatch: "Ingen medarbetare matchar",
    pendingOn: "Förfrågan väntar", legend: "Förklaring", pendingLegend: "Förfrågan väntar på dig",
    toDecide: "Väntar på ditt svar", nothingPending: "Inga förfrågningar väntar — allt är hanterat.",
    history: "Historik", noHistory: "Inget här ännu.", approve: "Godkänn", decline: "Neka",
    noteOptional: "Meddelande till medarbetaren (valfritt)", reasonRequired: "Anledning (medarbetaren ser den)",
    cancel: "Avbryt", confirmApprove: "Godkänn förfrågan", confirmDecline: "Neka förfrågan",
    sent: "Skickad", decidedBy: "av", reported: "Anmäld — behöver inget godkännande", overlaps: "Också borta då",
    loadFailed: "Kunde inte ladda tillgänglighet.", retry: "Försök igen", message: "Meddelande", profile: "Profil",
    statusFilter: { all: "Alla", approved: "Godkända", declined: "Nekade", cancelled: "Återkallade" },
    hours: "Tider",
  },
}

const AWAY: DayKind[] = ["time_off", "unavailable", "off"]
const isAway = (c: DayCell) => AWAY.includes(c.kind)
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?"
/** ISO week number */
function weekNo(d: string) {
  const thu = addDaysStr(mondayOf(d), 3)
  const jan4 = `${thu.slice(0, 4)}-01-04`
  return 1 + Math.round((Date.parse(mondayOf(thu)) - Date.parse(mondayOf(jan4))) / (7 * 86_400_000))
}

function readTabFromUrl(): "overview" | "requests" {
  if (typeof window === "undefined") return "overview"
  return new URLSearchParams(window.location.search).get("availability") === "requests" ? "requests" : "overview"
}

export default function EmployeeAvailability() {
  const { language } = useManagerTranslations()
  const lang: Lang = language === "en" ? "en" : "sv"
  const x = TX[lang]
  const { openChat } = useManagerDashboard()
  const [drawer, setDrawer] = useState<TeamAvailabilityRow | null>(null)
  const openProfile = (m: TeamAvailabilityRow) => setDrawer(m)

  const [tab, setTabState] = useState<"overview" | "requests">(readTabFromUrl)
  const [from, setFrom] = useState(() => mondayOf(todayStr()))
  const [grid, setGrid] = useState<TeamGrid | null>(null)
  const [requests, setRequests] = useState<TeamTimeOffRequest[] | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "available" | "away" | "booked" | "pending">("all")

  const setTab = (next: "overview" | "requests") => {
    setTabState(next)
    const url = new URL(window.location.href)
    if (next === "requests") url.searchParams.set("availability", "requests")
    else url.searchParams.delete("availability")
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
  }

  const load = useCallback(async () => {
    try {
      const [g, r] = await Promise.all([teamAvailabilityApi.grid(from, 7), teamAvailabilityApi.requests("all")])
      setGrid(g)
      setRequests(r)
      setError(false)
    } catch {
      setError(true)
    }
  }, [from])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onPop = () => setTabState(readTabFromUrl())
    const onChange = () => load()
    window.addEventListener("popstate", onPop)
    window.addEventListener(TIME_OFF_CHANGED_EVENT, onChange)
    window.addEventListener("focus", onChange)
    return () => {
      window.removeEventListener("popstate", onPop)
      window.removeEventListener(TIME_OFF_CHANGED_EVENT, onChange)
      window.removeEventListener("focus", onChange)
    }
  }, [load])

  const today = grid?.today ?? todayStr()
  const rows = grid?.data ?? []
  const pendingCount = (requests ?? []).filter((r) => r.status === "pending").length

  const stats = useMemo(() => ({
    available: rows.filter((r) => !isAway(r.today)).length,
    away: rows.filter((r) => isAway(r.today)).length,
    awayWeek: rows.filter((r) => r.days.some((d) => d.kind === "time_off")).length,
    bookedWeek: rows.filter((r) => r.bookedDays > 0).length,
  }), [rows])

  const shown = rows.filter((r) => {
    const q = query.trim().toLowerCase()
    if (q && ![r.name, r.email, r.department, r.jobTitle].some((v) => v.toLowerCase().includes(q))) return false
    if (filter === "available") return !isAway(r.today)
    if (filter === "away") return isAway(r.today)
    if (filter === "booked") return r.bookedDays > 0
    if (filter === "pending") return r.pendingCount > 0
    return true
  })

  const days = grid ? grid.data[0]?.days.map((d) => d.date) ?? Array.from({ length: 7 }, (_, i) => addDaysStr(from, i)) : Array.from({ length: 7 }, (_, i) => addDaysStr(from, i))

  return (
    <div className="p-4 sm:p-6 m-0 sm:m-4">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4 sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}><Icon icon="tabler:calendar-check" className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{x.title}</h1>
          </div>
          <p className="text-gray-500 text-sm sm:ml-12">{x.desc}</p>
        </div>
        <div className="inline-flex p-1 rounded-xl bg-gray-100 self-start sm:self-auto">
          {(["overview", "requests"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)}
              className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                tab === k ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
              {k === "overview" ? x.overview : x.requests}
              {k === "requests" && pendingCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold text-white flex items-center justify-center bg-red-500">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon="tabler:user-check" label={x.availableToday} value={grid ? stats.available : "–"} color="rgb(22,101,52)" bg="rgb(240,253,244)" />
        <Stat icon="tabler:user-off" label={x.offToday} value={grid ? stats.away : "–"} color="rgb(185,28,28)" bg="rgb(254,242,242)" />
        <Stat icon="tabler:inbox" label={x.pending} value={requests ? pendingCount : "–"} color="rgb(146,64,14)" bg="rgb(255,251,235)"
          onClick={pendingCount ? () => setTab("requests") : undefined} />
        <Stat icon="tabler:briefcase" label={x.bookedWeek} value={grid ? stats.bookedWeek : "–"} color="rgb(30,64,175)" bg="rgb(239,246,255)" />
      </div>

      <CoveringNotice language={language} />
      {!!grid?.hidden && (
        <p className="mb-4 text-xs text-gray-500 flex items-center gap-1.5">
          <Icon icon="tabler:eye-off" className="w-3.5 h-3.5 flex-shrink-0" />{x.hidden(grid.hidden)}
        </p>
      )}

      {error && !grid && (
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
          <p className="text-sm text-gray-600 mb-3">{x.loadFailed}</p>
          <button onClick={load} className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: NAVY }}>{x.retry}</button>
        </div>
      )}

      {tab === "overview" && !(error && !grid) && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setFrom(addDaysStr(from, -7))} aria-label={x.prevWeek} title={x.prevWeek}
                className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50">
                <Icon icon="tabler:chevron-left" className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={() => setFrom(mondayOf(todayStr()))}
                className={clsx("h-9 px-3 rounded-lg border text-sm font-medium", from === mondayOf(today) ? "border-transparent text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")}
                style={from === mondayOf(today) ? { backgroundColor: NAVY } : {}}>{x.today}</button>
              <button onClick={() => setFrom(addDaysStr(from, 7))} aria-label={x.nextWeek} title={x.nextWeek}
                className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50">
                <Icon icon="tabler:chevron-right" className="w-4 h-4 text-gray-600" />
              </button>
              <div className="ml-1 text-sm">
                <span className="font-semibold text-gray-800">{x.week} {weekNo(from)}</span>
                <span className="text-gray-400"> · {fmtDay(from, lang)} – {fmtDay(addDaysStr(from, 6), lang)}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
              <div className="relative">
                <Icon icon="tabler:search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={x.search}
                  className="h-9 w-full sm:w-56 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "available", "away", "booked", "pending"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={clsx("h-9 px-3 rounded-full text-xs font-medium border transition-all",
                      filter === f ? "text-white border-transparent" : "text-gray-600 border-gray-200 bg-white hover:border-blue-200")}
                    style={filter === f ? { backgroundColor: NAVY } : {}}>
                    {f === "all" ? x.all : f === "available" ? x.fAvailable : f === "away" ? x.fAway : f === "booked" ? x.fBooked : x.fPending}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid — desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold tracking-wider uppercase text-gray-400"
              style={{ gridTemplateColumns: "minmax(200px,1.6fr) repeat(7, minmax(40px,1fr)) 120px 88px" }}>
              <div>{x.employee}</div>
              {days.map((d, i) => (
                <div key={d} className={clsx("text-center rounded-md py-1", d === today && "text-white")} style={d === today ? { backgroundColor: NAVY } : {}}>
                  <div>{WEEKDAY_SHORT[lang][i]}</div>
                  <div className={clsx("text-[10px] font-medium normal-case tracking-normal", d === today ? "text-blue-100" : "text-gray-400")}>{fmtDay(d, lang, { day: "numeric" })}</div>
                </div>
              ))}
              <div className="text-center">{x.now}</div>
              <div />
            </div>

            {!grid && <SkeletonRows />}
            {grid && shown.length === 0 && <Empty text={rows.length ? x.noMatch : x.noManagers} />}

            {shown.map((m, i) => (
              <div key={m.id}
                className={clsx("grid items-center gap-2 px-5 py-3.5 hover:bg-blue-50/20 transition-colors", i < shown.length - 1 && "border-b border-gray-50")}
                style={{ gridTemplateColumns: "minmax(200px,1.6fr) repeat(7, minmax(40px,1fr)) 120px 88px" }}>
                <ManagerCell m={m} lang={lang} x={x} onOpen={() => openProfile(m)} />
                {m.days.map((c, di) => (
                  <div key={c.date} className="flex justify-center">
                    <Cell c={c} lang={lang} x={x} label={`${WEEKDAY_LONG[lang][di]} ${fmtDay(c.date, lang)}`} isToday={c.date === today} />
                  </div>
                ))}
                <div className="flex justify-center"><NowBadge m={m} lang={lang} /></div>
                <div className="flex justify-end">
                  <button onClick={() => openChat(m.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all hover:shadow-md"
                    style={{ backgroundColor: NAVY }}>
                    <Icon icon="tabler:message-circle" className="w-3.5 h-3.5" />{x.message}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {!grid && <div className="bg-white rounded-2xl border border-gray-100"><SkeletonRows /></div>}
            {grid && shown.length === 0 && <div className="bg-white rounded-2xl border border-gray-100"><Empty text={rows.length ? x.noMatch : x.noManagers} /></div>}
            {shown.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <ManagerCell m={m} lang={lang} x={x} onOpen={() => openProfile(m)} />
                  <NowBadge m={m} lang={lang} />
                </div>
                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {m.days.map((c, di) => (
                    <div key={c.date} className="flex flex-col items-center gap-1">
                      <span className={clsx("text-[10px] font-semibold", c.date === today ? "text-blue-900" : "text-gray-400")}>{WEEKDAY_SHORT[lang][di]}</span>
                      <Cell c={c} lang={lang} x={x} label={`${WEEKDAY_LONG[lang][di]} ${fmtDay(c.date, lang)}`} isToday={c.date === today} small />
                    </div>
                  ))}
                </div>
                <button onClick={() => openChat(m.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: NAVY }}>
                  <Icon icon="tabler:message-circle" className="w-4 h-4" />{x.message}
                </button>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 mb-3">{x.legend}</p>
            <div className="flex items-center flex-wrap gap-x-5 gap-y-2">
              {(["available", "booked", "partial", "limited", "time_off", "unavailable", "off"] as DayKind[]).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: DAY_KIND_STYLE[k].bg }}>
                    <Icon icon={DAY_KIND_STYLE[k].icon} className="w-3 h-3" style={{ color: DAY_KIND_STYLE[k].color }} />
                  </div>
                  <span className="text-xs text-gray-500">{DAY_KIND_STYLE[k][lang]}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border-2 border-dashed border-amber-400 bg-white" />
                <span className="text-xs text-gray-500">{x.pendingLegend}</span>
              </div>
            </div>
          </div>
        </>
      )}

      <EmployeeDrawer employee={drawer} onClose={() => setDrawer(null)} lang={lang} onChat={(id) => { setDrawer(null); openChat(id) }} />

      {tab === "requests" && (
        <RequestsPanel lang={lang} x={x} requests={requests} rows={rows} today={today}
          onDecided={(r) => setRequests((prev) => (prev ?? []).map((p) => (p.id === r.id ? { ...p, ...r } : p)))} />
      )}
    </div>
  )
}

/* ═════════════════════════ Pieces ═════════════════════════ */

type X = (typeof TX)["en"]

function Stat({ icon, label, value, color, bg, onClick }: { icon: string; label: string; value: number | string; color: string; bg: string; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag onClick={onClick} className={clsx("bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 text-left", onClick && "hover:border-amber-200 hover:shadow-sm transition-all")}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
        <Icon icon={icon} className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-gray-800 leading-tight">{value}</div>
        <div className="text-xs text-gray-500 truncate">{label}</div>
      </div>
    </Tag>
  )
}

function ManagerCell({ m, lang, x, onOpen }: { m: TeamAvailabilityRow; lang: Lang; x: X; onOpen: () => void }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <button onClick={onOpen} title={x.profile}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
        {initials(m.name)}
      </button>
      <div className="min-w-0">
        <button onClick={onOpen} className="text-sm font-medium text-gray-800 truncate hover:underline block max-w-full text-left">{m.name}</button>
        <div className="text-xs text-gray-400 truncate">{[m.jobTitle, m.department].filter(Boolean).join(" · ") || m.email}</div>
        {m.coveringFor && <CoveringBadge coveringFor={m.coveringFor} language={lang} />}
        {m.statusNote && (
          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 truncate">
            <Icon icon="tabler:info-circle" className="w-3 h-3 flex-shrink-0" /><span className="truncate">{m.statusNote}</span>
          </div>
        )}
        {m.nextTimeOff && (
          <div className="text-[11px] mt-0.5 flex items-center gap-1 truncate" style={{ color: TYPE_LABELS[m.nextTimeOff.type].color }}>
            <Icon icon={TYPE_LABELS[m.nextTimeOff.type].icon} className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{x.nextOff}: {fmtRange(m.nextTimeOff, lang)}</span>
          </div>
        )}
        {!m.hasSchedule && (
          <div className="text-[10px] text-gray-400 mt-0.5 italic truncate" title={x.noSchedule}>{x.noSchedule}</div>
        )}
      </div>
    </div>
  )
}

function Cell({ c, lang, x, label, isToday, small }: { c: DayCell; lang: Lang; x: X; label: string; isToday: boolean; small?: boolean }) {
  const s = DAY_KIND_STYLE[c.kind]
  const type = c.timeOffType ? TYPE_LABELS[c.timeOffType] : null
  const half = c.halfDay === "am" ? (lang === "en" ? " (morning)" : " (förmiddag)") : c.halfDay === "pm" ? (lang === "en" ? " (afternoon)" : " (eftermiddag)") : ""
  const title = [label, type ? `${type[lang]}${half}` : s[lang], c.hours, c.fromCalendar ? x.calendarNote : "", c.pending ? `${x.pendingOn}: ${TYPE_LABELS[c.pending.type][lang]}` : ""]
    .filter(Boolean).join(" · ")
  return (
    <div title={title} aria-label={title}
      className={clsx("relative rounded-xl flex items-center justify-center", small ? "w-9 h-9" : "w-10 h-10",
        isToday && "ring-2 ring-offset-1 ring-blue-900/30",
        c.pending && "outline-2 outline-dashed outline-amber-400 outline-offset-1")}
      style={{ backgroundColor: type ? type.bg : s.bg }}>
      <Icon icon={type ? type.icon : s.icon} className="w-4 h-4" style={{ color: type ? type.color : s.color }} />
      {c.halfDay && c.halfDay !== "none" && (
        <span className="absolute bottom-0.5 right-1 text-[8px] font-bold" style={{ color: type?.color }}>½</span>
      )}
      {c.kind === "partial" && c.hours && !small && (
        <span className="absolute -bottom-0.5 left-0 right-0 text-center text-[8px] font-semibold leading-none" style={{ color: s.color }}>{c.hours.split("–")[0]}</span>
      )}
      {c.pending && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />}
    </div>
  )
}

function NowBadge({ m, lang }: { m: TeamAvailabilityRow; lang: Lang }) {
  const c = m.today
  const type = c.timeOffType ? TYPE_LABELS[c.timeOffType] : null
  const s = DAY_KIND_STYLE[c.kind]
  const text = type ? type[lang] : c.kind === "available" && m.status === "available" ? MANUAL_STATUS_LABELS.available[lang] : s[lang]
  return (
    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap inline-flex items-center gap-1 max-w-[120px]"
      style={{ color: type ? type.color : s.color, backgroundColor: type ? type.bg : s.bg, borderColor: "transparent" }}>
      <Icon icon={type ? type.icon : s.icon} className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  )
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-gray-50">
      {[0, 1, 2].map((i) => (
        <div key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2"><div className="h-3 w-40 bg-gray-100 rounded" /><div className="h-2.5 w-24 bg-gray-100 rounded" /></div>
          <div className="hidden md:flex gap-2">{Array.from({ length: 7 }).map((_, j) => <div key={j} className="w-10 h-10 rounded-xl bg-gray-100" />)}</div>
        </div>
      ))}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-14 text-center text-gray-400">
      <Icon icon="tabler:users" className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

/* ═════════════════════════ Requests tab ═════════════════════════ */

function RequestsPanel({ lang, x, requests, rows, today, onDecided }: {
  lang: Lang; x: X; requests: TeamTimeOffRequest[] | null; rows: TeamAvailabilityRow[]; today: string
  onDecided: (r: TimeOffRequest) => void
}) {
  const [hist, setHist] = useState<"all" | "approved" | "declined" | "cancelled">("all")
  if (!requests) return <div className="bg-white rounded-2xl border border-gray-100"><SkeletonRows /></div>
  const pending = requests.filter((r) => r.status === "pending")
  const history = requests.filter((r) => r.status !== "pending" && (hist === "all" || r.status === hist))

  /** Other managers already away (approved) on any day of this request. */
  const overlaps = (r: TimeOffRequest) =>
    requests
      .filter((o) => o.id !== r.id && o.managerId !== r.managerId && o.status === "approved" && o.startDate <= r.endDate && o.endDate >= r.startDate)
      .map((o) => o.managerName)

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Icon icon="tabler:inbox" className="w-4 h-4 text-amber-600" />{x.toDecide}
          {pending.length > 0 && <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2">{pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center text-gray-400">
            <Icon icon="tabler:circle-check" className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm">{x.nothingPending}</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {pending.map((r) => (
              <PendingCard key={r.id} r={r} lang={lang} x={x} overlaps={[...new Set(overlaps(r))]} onDecided={onDecided}
                startsSoon={r.startDate <= addDaysStr(today, 7)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Icon icon="tabler:history" className="w-4 h-4 text-gray-400" />{x.history}</h2>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "approved", "declined", "cancelled"] as const).map((k) => (
              <button key={k} onClick={() => setHist(k)}
                className={clsx("px-3 py-1 rounded-full text-xs font-medium border", hist === k ? "text-white border-transparent" : "text-gray-600 border-gray-200 bg-white")}
                style={hist === k ? { backgroundColor: NAVY } : {}}>{x.statusFilter[k]}</button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {history.length === 0 && <p className="py-10 text-center text-sm text-gray-400">{x.noHistory}</p>}
          {history.map((r) => {
            const tl = TYPE_LABELS[r.type]
            const sl = STATUS_LABELS[r.status]
            const reported = r.status === "approved" && !r.decidedByName
            return (
              <div key={r.id} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tl.bg }}>
                    <Icon icon={tl.icon} className="w-4 h-4" style={{ color: tl.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{r.managerName} · <span className="font-normal text-gray-600">{tl[lang]}</span></div>
                    <div className="text-xs text-gray-500">{fmtRange(r, lang)} · {daysLabel(r.workingDays, lang)}</div>
                    {(r.decisionNote || reported) && (
                      <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {reported ? x.reported : `“${r.decisionNote}”`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border" style={{ color: sl.color, backgroundColor: sl.bg, borderColor: sl.border }}>{sl[lang]}</span>
                  {r.decidedAt && (
                    <span className="text-[11px] text-gray-400">
                      {fmtDay(r.decidedAt.slice(0, 10), lang)}{r.decidedByName ? ` ${x.decidedBy} ${r.decidedByName}` : ""}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function PendingCard({ r, lang, x, overlaps, startsSoon, onDecided }: {
  r: TeamTimeOffRequest; lang: Lang; x: X; overlaps: string[]; startsSoon: boolean; onDecided: (r: TimeOffRequest) => void
}) {
  const [mode, setMode] = useState<null | "approve" | "decline">(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const tl = TYPE_LABELS[r.type]

  const submit = async () => {
    if (!mode) return
    if (mode === "decline" && !note.trim()) { setErr(x.reasonRequired); return }
    setBusy(true); setErr("")
    try {
      onDecided(await teamAvailabilityApi.decide(r.id, mode, note.trim()))
    } catch (e: any) {
      setErr(e?.message ?? "Error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>{initials(r.managerName)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{r.managerName}</span>
            {r.coveringFor && <CoveringBadge coveringFor={r.coveringFor} language={lang} />}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ color: tl.color, backgroundColor: tl.bg }}>
              <Icon icon={tl.icon} className="w-3 h-3" />{tl[lang]}
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-1 font-medium">{fmtRange(r, lang)}</div>
          <div className="text-xs text-gray-500">
            {daysLabel(r.workingDays, lang)} · {x.sent} {fmtDay(r.createdAt.slice(0, 10), lang)}
            {startsSoon && <span className="ml-1.5 text-amber-700 font-semibold">· {lang === "en" ? "starts soon" : "börjar snart"}</span>}
          </div>
        </div>
      </div>
      {r.note && <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 whitespace-pre-line">{r.note}</p>}
      {overlaps.length > 0 && (
        <p className="mt-2 text-xs text-amber-800 flex items-start gap-1.5">
          <Icon icon="tabler:users-group" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{x.overlaps}: {overlaps.join(", ")}</span>
        </p>
      )}

      {mode ? (
        <div className="mt-3 space-y-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} autoFocus
            placeholder={mode === "decline" ? x.reasonRequired : x.noteOptional}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setMode(null); setNote(""); setErr("") }} disabled={busy}
              className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">{x.cancel}</button>
            <button onClick={submit} disabled={busy}
              className={clsx("px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-1.5 disabled:opacity-60", mode === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}>
              {busy && <Icon icon="tabler:loader-2" className="w-4 h-4 animate-spin" />}
              {mode === "approve" ? x.confirmApprove : x.confirmDecline}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button onClick={() => setMode("approve")}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-1.5">
            <Icon icon="tabler:check" className="w-4 h-4" />{x.approve}
          </button>
          <button onClick={() => setMode("decline")}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center gap-1.5">
            <Icon icon="tabler:x" className="w-4 h-4" />{x.decline}
          </button>
        </div>
      )}
    </div>
  )
}

/* ═════════════════════════ Profile drawer ═════════════════════════ */

const DRAWER_TX = {
  sv: { loadProfileFailed: "Kunde inte ladda profilen.", loading: "Laddar…", contact: "Kontakt", currentRole: "Nuvarande roll", skills: "Kompetenser", noProfile: "Ingen profil ännu.", message: "Skicka meddelande" },
  en: { loadProfileFailed: "Couldn't load the profile.", loading: "Loading…", contact: "Contact", currentRole: "Current role", skills: "Skills", noProfile: "No profile yet.", message: "Send a message" },
}

interface ProfileData {
  personalInformation: {
    firstName?: string; lastName?: string; title?: string
    phoneNumber?: string; workEmail?: string; homeAddress?: string
  } | null
  cv: {
    experience: Array<{ employer?: string; title?: string }>
    skills: Array<{ skillName?: string }>
  } | null
}

function EmployeeDrawer({ employee: row, onClose, lang, onChat }: { employee: TeamAvailabilityRow | null; onClose: () => void; lang: Lang; onChat: (id: string) => void }) {
  const t = DRAWER_TX[lang]
  const employee = row ? { employeeId: row.id, employeeName: row.name, employeeEmail: row.email, coveringFor: row.coveringFor } : null
  const language = lang
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!employee) return
    setData(null)
    setError("")
    setLoading(true)
    fetch(`/api/company/managers/employees/${employee.employeeId}/hr-info`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load profile")
        return res.json()
      })
      .then((body) => setData({ personalInformation: body.personalInformation, cv: body.cv }))
      .catch(() => setError(t.loadProfileFailed))
      .finally(() => setLoading(false))
  }, [row?.id, t.loadProfileFailed])

  if (!employee) return null
  const pi = data?.personalInformation
  const cv = data?.cv

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
              {employee.employeeName?.[0]?.toUpperCase() || employee.employeeEmail?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{employee.employeeName || employee.employeeEmail}</p>
              {pi?.title && <p className="text-xs text-gray-400 truncate">{pi.title}</p>}
              {employee.coveringFor && <div className="mt-1"><CoveringBadge coveringFor={employee.coveringFor} language={language} /></div>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            {t.loading}
          </div>
        )}
        {!loading && error && (
          <div className="p-6"><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div></div>
        )}
        {!loading && !error && (
          <div className="p-6 space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.contact}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon icon="tabler:mail" className="w-4 h-4 text-gray-400" /> {pi?.workEmail || employee.employeeEmail}
                </div>
                {pi?.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon icon="tabler:phone" className="w-4 h-4 text-gray-400" /> {pi.phoneNumber}
                  </div>
                )}
                {pi?.homeAddress && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon icon="tabler:map-pin" className="w-4 h-4 text-gray-400" /> {pi.homeAddress}
                  </div>
                )}
              </div>
            </div>
            {cv?.experience && cv.experience.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.currentRole}</p>
                <p className="text-sm font-medium text-gray-800">{cv.experience[0]?.title}</p>
                <p className="text-xs text-gray-500">{cv.experience[0]?.employer}</p>
              </div>
            )}
            {cv?.skills && cv.skills.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.skills}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cv.skills.slice(0, 10).map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{s.skillName}</span>
                  ))}
                </div>
              </div>
            )}
            {!pi && !cv && <p className="text-sm text-gray-400">{t.noProfile}</p>}
            <button onClick={() => onChat(employee.employeeId)} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:message-circle" className="w-4 h-4" />{t.message}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

