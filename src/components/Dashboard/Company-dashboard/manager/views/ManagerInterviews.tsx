"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/ManagerInterviews.tsx
// WHAT IT DOES:   The manager's Interviews page (week calendar / list / up next), saved in
//                 the "interviews" collection. Booking and rescheduling open a full page
//                 (InterviewBookingPage) instead of a dialog; notes + evaluation live in
//                 InterviewDetailDrawer. Google Calendar / Meet via GoogleCalendarConnect.
//
// URL (works with the browser's back button, other query params are kept):
//   ?interview=new[&date=YYYY-MM-DD]     → booking page
//   ?interview=new&from=<id>              → "book again" (copy of a cancelled / missed interview)
//   ?interview=<id>&mode=reschedule       → reschedule page
//   ?interview=<id>                       → interview drawer (notes / evaluation)
//
// Interviews the business admin booked WITH you (you are the candidate) are shown in
// the same calendar / list / "Up next" — in purple, read-only (InterviewWithMeDrawer).
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"
import {
  listInterviews, setInterviewStatus,
  type Interview, type InterviewStatus, type SaveResult,
} from "@/utils/interviewsApi"
import { loadWithCovered, type CoveringFor } from "@/utils/coveredTeam"
import { CoveringBadge, CoveringNotice } from "@/components/Dashboard/Company-dashboard/manager/delegation/CoveringBadge"
import InterviewDetailDrawer from "../interviews/InterviewDetailDrawer"
import { GoogleCalendarBadge, GoogleConnectResult, useGoogleCalendar } from "../interviews/GoogleCalendarConnect"
import InterviewBookingPage from "../interviews/InterviewBookingPage"
import InterviewWithMeDrawer, { WITH_ME_STYLE } from "../interviews/InterviewWithMeDrawer"
import { isWithMe, loadInterviewsWithMe, type InterviewWithMe } from "@/utils/interviewsWithMeApi"
import {
  FORMAT_CFG, MEET_GREEN, NAVY, STATUS_STYLE, addDays, fmtDate, fmtLongDate, fmtTime, initials,
  isSameDay, startOfWeek, toDateInput, weekLabel,
} from "../interviews/interviewShared"


/** An interview, plus `coveringFor` when it belongs to a colleague you're covering for. */
type ListedInterview = Interview & { coveringFor?: CoveringFor }

/* ─── URL state ─── */
type PageState =
  | { kind: "list"; openId: string | null }
  | { kind: "book"; date: string | null; fromId?: string | null }
  | { kind: "reschedule"; id: string }

function readPage(): PageState {
  if (typeof window === "undefined") return { kind: "list", openId: null }
  const sp = new URLSearchParams(window.location.search)
  const iv = sp.get("interview")
  if (iv === "new") return { kind: "book", date: sp.get("date"), fromId: sp.get("from") }
  if (iv && sp.get("mode") === "reschedule") return { kind: "reschedule", id: iv }
  return { kind: "list", openId: iv }
}

function writePage(page: PageState, replace = false) {
  const url = new URL(window.location.href)
  for (const k of ["interview", "date", "mode", "from"]) url.searchParams.delete(k)
  if (page.kind === "book") {
    url.searchParams.set("interview", "new")
    if (page.date) url.searchParams.set("date", page.date)
    if (page.fromId) url.searchParams.set("from", page.fromId)
  } else if (page.kind === "reschedule") {
    url.searchParams.set("interview", page.id)
    url.searchParams.set("mode", "reschedule")
  } else if (page.openId) {
    url.searchParams.set("interview", page.openId)
  }
  const next = `${url.pathname}${url.search}${url.hash}`
  if (replace) window.history.replaceState(window.history.state, "", next)
  else window.history.pushState(window.history.state, "", next)
}

/* ─────────────────────────────────────────────
   CANCEL DIALOG
───────────────────────────────────────────── */
const CancelDialog: React.FC<{
  interview: Interview; isEn: boolean; busy: boolean; error: string | null
  onClose: () => void
  onConfirm: (opts: { noShow: boolean; reason: string; notifyCandidate: boolean }) => void
}> = ({ interview, isEn, busy, error, onClose, onConfirm }) => {
  const [noShow, setNoShow] = useState(false)
  const [reason, setReason] = useState("")
  const [notify, setNotify] = useState(true)
  const inCalendar = interview.google.synced

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Icon icon="tabler:calendar-x" className="w-5 h-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900">{isEn ? "Cancel Interview" : "Avboka Intervju"}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {interview.candidateName} — {fmtDate(interview.startAt, isEn)} {fmtTime(interview.startAt)}
            </p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={noShow} onChange={e => setNoShow(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-gray-600">{isEn ? "Candidate didn't show up (mark as no-show instead)" : "Kandidaten kom inte (markera som uteblev istället)"}</span>
          </label>
          {!noShow && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{isEn ? "Reason (optional, internal)" : "Anledning (valfritt, internt)"}</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              {inCalendar && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="w-4 h-4 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    {isEn ? "Email the candidate that the interview is cancelled" : "Mejla kandidaten att intervjun är avbokad"}
                    <span className="block text-[11px] text-gray-400">{isEn ? "The Google Calendar event is removed." : "Händelsen i Google Kalender tas bort."}</span>
                  </span>
                </label>
              )}
            </>
          )}
          {!noShow && (
            <p className="flex items-start gap-2 text-[11px] text-gray-500 rounded-lg bg-gray-50 px-3 py-2">
              <Icon icon="tabler:bell" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {isEn
                ? "If the candidate has a VeroCV account, they get a notification that the interview is cancelled."
                : "Om kandidaten har ett VeroCV-konto får hen en notis om att intervjun är avbokad."}
            </p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={busy} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-40">
            {isEn ? "Back" : "Tillbaka"}
          </button>
          <button onClick={() => onConfirm({ noShow, reason, notifyCandidate: notify })} disabled={busy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
            style={{ backgroundColor: "rgb(220,38,38)" }}>
            {busy ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Icon icon="tabler:calendar-x" className="w-4 h-4" />}
            {noShow ? (isEn ? "Mark No-show" : "Markera Uteblev") : (isEn ? "Cancel Interview" : "Avboka")}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   WEEK CALENDAR
───────────────────────────────────────────── */
const WeekCalendar: React.FC<{
  isEn: boolean; interviews: ListedInterview[]; weekStart: Date
  onSelectInterview: (i: Interview) => void
  onBookAt: (date: Date) => void
  onReschedule: (i: Interview) => void
  onCancel: (i: Interview) => void
}> = ({ isEn, interviews, weekStart, onSelectInterview, onBookAt, onReschedule, onCancel }) => {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const labels = isEn ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"]
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="grid grid-cols-7 gap-2 sm:gap-3 min-w-[720px]">
        {days.map((day, idx) => {
          const dayInterviews = interviews
            .filter(iv => isSameDay(new Date(iv.startAt), day))
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          const isToday = isSameDay(day, new Date())
          const isPast = day.getTime() < todayStart.getTime()

          return (
            <div key={idx} className={clsx("rounded-2xl border flex flex-col min-h-[220px]", isToday ? "border-blue-200 bg-blue-50/30" : "border-gray-100 bg-white")}>
              <div className={clsx("px-2.5 py-2 border-b flex items-center justify-between", isToday ? "border-blue-100" : "border-gray-50")}>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{labels[idx]}</p>
                  <p className={clsx("text-sm font-bold", isToday ? "text-blue-900" : isPast ? "text-gray-400" : "text-gray-700")}>{day.getDate()}</p>
                </div>
                {!isPast && (
                  <button onClick={() => onBookAt(day)} title={isEn ? "Book on this day" : "Boka denna dag"}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-blue-800 transition-all flex-shrink-0">
                    <Icon icon="tabler:plus" className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="p-1.5 space-y-1.5 flex-1">
                {dayInterviews.length === 0 && <p className="text-[10px] text-gray-300 text-center py-4">—</p>}
                {dayInterviews.map(iv => {
                  const withMe = isWithMe(iv)
                  const ss = STATUS_STYLE[iv.status]
                  // Interviews booked with you can't be changed by you.
                  const canChange = iv.status === "scheduled" && !withMe
                  return (
                    <div key={iv.id} role="button" tabIndex={0}
                      onClick={() => onSelectInterview(iv)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectInterview(iv) } }}
                      className={clsx("group relative w-full text-left p-2 rounded-lg border transition-all hover:shadow-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-300", iv.status === "cancelled" && "opacity-60")}
                      style={withMe ? { backgroundColor: WITH_ME_STYLE.bg, borderColor: WITH_ME_STYLE.border } : { backgroundColor: ss.bg, borderColor: ss.border }}>
                      {canChange && (
                        <div className="absolute top-1 right-1 hidden group-hover:flex group-focus-within:flex items-center gap-0.5">
                          <button type="button" title={isEn ? "Edit / reschedule" : "Ändra / boka om"}
                            onClick={e => { e.stopPropagation(); onReschedule(iv) }}
                            className="w-5 h-5 rounded-md bg-white/90 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-800">
                            <Icon icon="tabler:edit" className="w-3 h-3" />
                          </button>
                          <button type="button" title={isEn ? "Cancel interview" : "Avboka intervju"}
                            onClick={e => { e.stopPropagation(); onCancel(iv) }}
                            className="w-5 h-5 rounded-md bg-white/90 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50">
                            <Icon icon="tabler:x" className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <p className="flex items-center gap-1 text-[10px] font-bold" style={{ color: withMe ? WITH_ME_STYLE.text : ss.text }}>
                        {fmtTime(iv.startAt)}
                        {withMe && <Icon icon="tabler:user-check" className="w-2.5 h-2.5" aria-label={isEn ? "You're interviewed" : "Du intervjuas"} />}
                        {iv.format === "video" && iv.meetingLink && <Icon icon="logos:google-meet" className="w-2.5 h-2.5 ml-auto" />}
                      </p>
                      <p className={clsx("text-[11px] font-semibold text-gray-800 truncate mt-0.5", iv.status === "cancelled" && "line-through")}>{iv.candidateName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{iv.position}</p>
                      {withMe && <p className="text-[9px] font-semibold mt-0.5" style={{ color: WITH_ME_STYLE.text }}>{isEn ? "You're interviewed" : "Du intervjuas"}</p>}
                      {iv.coveringFor && <div className="mt-1"><CoveringBadge coveringFor={iv.coveringFor} language={isEn ? "en" : "sv"} compact /></div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ManagerInterviews() {
  const { language } = useManagerTranslations()
  const isEn = language === "en"
  const google = useGoogleCalendar()

  const [interviews, setInterviews] = useState<ListedInterview[]>([])
  // Interviews booked WITH you (by the business admin) — shown read-only.
  const [withMe, setWithMe] = useState<InterviewWithMe[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [page, setPage] = useState<PageState>({ kind: "list", openId: null })
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()))
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | "all">("all")
  const [search, setSearch] = useState("")

  const [cancelling, setCancelling] = useState<Interview | null>(null)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ tone: "success" | "warning"; text: string } | null>(null)

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoadError(null)
    try {
      // Yours + those of any colleague you're covering for (marked with a badge).
      const [own, mine] = await Promise.all([loadWithCovered(() => listInterviews(), "interview"), loadInterviewsWithMe()])
      setInterviews(own)
      setWithMe(mine)
    } catch (e) {
      setLoadError((e as Error).message || (isEn ? "Couldn't load interviews." : "Kunde inte ladda intervjuer."))
    } finally {
      setLoading(false)
    }
  }, [isEn])

  useEffect(() => { load() }, [load])

  /* ── URL ↔ page (browser back / forward work) ── */
  useEffect(() => {
    setPage(readPage())
    const onPop = () => setPage(readPage())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const go = (next: PageState, replace = false) => {
    writePage(next, replace)
    setPage(next)
    if (next.kind !== "list") window.scrollTo({ top: 0 })
  }

  // Keeps the "colleague's team" marker when an interview comes back from the server.
  const upsert = (iv: Interview) =>
    setInterviews(prev => (prev.some(p => p.id === iv.id)
      ? prev.map(p => (p.id === iv.id ? { ...iv, coveringFor: p.coveringFor } : p))
      : [iv, ...prev]))

  /** Your interviews + the ones booked with you (calendar, list, "Up next"). */
  const allInterviews = useMemo<ListedInterview[]>(() => [...interviews, ...withMe], [interviews, withMe])

  const openCancel = (iv: Interview) => { setCancelError(null); setCancelling(iv) }
  const bookAgain = (iv: Interview) => go({ kind: "book", date: null, fromId: iv.id })
  const copyFrom = page.kind === "book" && page.fromId ? interviews.find(iv => iv.id === page.fromId) ?? null : null

  const selected = page.kind === "list" && page.openId ? interviews.find(iv => iv.id === page.openId) ?? null : null
  const selectedWithMe = page.kind === "list" && page.openId ? withMe.find(iv => iv.id === page.openId) ?? null : null
  const rescheduling = page.kind === "reschedule" ? interviews.find(iv => iv.id === page.id) ?? null : null

  /* ── Derived ── */
  const counts = useMemo(() => {
    const c: Record<InterviewStatus | "all", number> = { all: allInterviews.length, scheduled: 0, completed: 0, cancelled: 0, no_show: 0 }
    allInterviews.forEach(iv => { c[iv.status]++ })
    return c
  }, [allInterviews])

  const upcoming = useMemo(() =>
    allInterviews
      .filter(iv => iv.status === "scheduled" && new Date(iv.startAt).getTime() + iv.durationMinutes * 60_000 >= Date.now())
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5),
    [allInterviews])

  const needsEvaluation = useMemo(() =>
    interviews.filter(iv => iv.status === "completed" && !iv.evaluation.evaluatedAt).length,
    [interviews])

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allInterviews
      .filter(iv =>
        (statusFilter === "all" || iv.status === statusFilter) &&
        (!q || iv.candidateName.toLowerCase().includes(q) || iv.position.toLowerCase().includes(q) || iv.candidateEmail.includes(q)))
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
  }, [allInterviews, statusFilter, search])

  /* ── Actions ── */
  const handleSaved = (result: SaveResult, mode: "booked" | "updated") => {
    const iv = result.interview
    upsert(iv)
    setWeekStart(startOfWeek(new Date(iv.startAt)))
    setViewMode("calendar")

    const when = `${fmtLongDate(iv.startAt, isEn)} ${fmtTime(iv.startAt)}`
    const parts = [
      mode === "booked"
        ? (isEn ? `Interview with ${iv.candidateName} booked for ${when}.` : `Intervju med ${iv.candidateName} bokad ${when}.`)
        : (isEn ? `Interview with ${iv.candidateName} moved to ${when}.` : `Intervjun med ${iv.candidateName} flyttad till ${when}.`),
    ]
    if (iv.format === "video" && iv.meetingLink && iv.google.synced) parts.push(isEn ? "Google Meet link created." : "Google Meet-länk skapad.")
    if (iv.google.synced && iv.google.sendInvite) {
      parts.push(mode === "booked"
        ? (isEn ? "The candidate gets a calendar invitation by email." : "Kandidaten får en kalenderinbjudan via e-post.")
        : (isEn ? "Google emails the candidate the updated invitation." : "Google mejlar kandidaten den uppdaterade inbjudan."))
    }
    if (result.inApp) {
      parts.push(mode === "booked"
        ? (isEn ? `${iv.candidateName} also sees it in their VeroCV dashboard.` : `${iv.candidateName} ser den även i sin VeroCV-dashboard.`)
        : (isEn ? `${iv.candidateName} gets a notification in VeroCV about the change.` : `${iv.candidateName} får en notis i VeroCV om ändringen.`))
    }
    if (result.conflicts.length) parts.push(isEn ? `Note: overlaps with ${result.conflicts.map(c => c.candidateName).join(", ")}.` : `Obs: krockar med ${result.conflicts.map(c => c.candidateName).join(", ")}.`)
    if (result.warning) parts.push(isEn ? `Google Calendar: ${result.warning.message}` : `Google Kalender: ${result.warning.message}`)

    setBanner({ tone: result.warning ? "warning" : "success", text: parts.join(" ") })
    go({ kind: "list", openId: null }, true)
  }

  const handleCancelConfirm = async ({ noShow, reason, notifyCandidate }: { noShow: boolean; reason: string; notifyCandidate: boolean }) => {
    if (!cancelling) return
    setCancelBusy(true)
    setCancelError(null)
    try {
      const res = await setInterviewStatus(cancelling.id, noShow ? "no_show" : "cancelled", { reason, notifyCandidate })
      upsert(res.interview)
      const name = cancelling.candidateName
      const parts = [noShow
        ? (isEn ? `${name} was marked as a no-show.` : `${name} markerades som utebliven.`)
        : (isEn ? `Interview with ${name} cancelled.` : `Intervjun med ${name} är avbokad.`)]
      if (!noShow && res.inApp) parts.push(isEn ? `${name} gets a notification in VeroCV.` : `${name} får en notis i VeroCV.`)
      if (!noShow && cancelling.google.synced && notifyCandidate) parts.push(isEn ? "Google emails the cancellation." : "Google mejlar avbokningen.")
      if (res.warning) parts.push(`Google Calendar: ${res.warning.message}`)
      setBanner({ tone: res.warning ? "warning" : "success", text: parts.join(" ") })
      setCancelling(null)
    } catch (e) {
      setCancelError((e as Error).message)
    } finally {
      setCancelBusy(false)
    }
  }

  // Only scheduled interviews can be rescheduled — otherwise show the interview instead.
  useEffect(() => {
    if (page.kind === "reschedule" && rescheduling && rescheduling.status !== "scheduled") {
      go({ kind: "list", openId: rescheduling.id }, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rescheduling])

  const STATUS_TABS: (InterviewStatus | "all")[] = ["all", "scheduled", "completed", "cancelled", "no_show"]

  /* ═══════════════ FULL-PAGE BOOKING / RESCHEDULE ═══════════════ */
  if (page.kind === "book" || page.kind === "reschedule") {
    if (page.kind === "reschedule" && !rescheduling) {
      return (
        <div className="p-4 sm:p-6 m-2 sm:m-4">
          {loading
            ? <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-gray-200 border-t-blue-800 rounded-full animate-spin" /></div>
            : (
              <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
                <Icon icon="tabler:calendar-question" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">{isEn ? "This interview could not be found." : "Intervjun kunde inte hittas."}</p>
                <button onClick={() => go({ kind: "list", openId: null })} className="mt-4 text-sm font-semibold text-blue-800 hover:underline">
                  {isEn ? "Back to Interviews" : "Tillbaka till Intervjuer"}
                </button>
              </div>
            )}
        </div>
      )
    }
    if (page.kind === "reschedule" && rescheduling && rescheduling.status !== "scheduled") return null // effect below opens the drawer
    return (
      <InterviewBookingPage
        key={page.kind === "reschedule" ? `edit-${page.id}` : `new-${page.date ?? ""}-${copyFrom?.id ?? ""}`}
        isEn={isEn}
        interview={rescheduling}
        defaultDate={page.kind === "book" && page.date ? new Date(`${page.date}T00:00:00`) : null}
        copyFrom={copyFrom}
        interviews={allInterviews}
        google={google}
        onBack={() => go({ kind: "list", openId: null })}
        onSaved={handleSaved}
      />
    )
  }

  /* ═══════════════ OVERVIEW ═══════════════ */
  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
                <Icon icon="tabler:calendar-event" className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{isEn ? "Interviews" : "Intervjuer"}</h1>
            </div>
            <p className="text-gray-500 text-sm ml-12">
              {isEn ? `${counts.scheduled} upcoming · ${counts.completed} completed` : `${counts.scheduled} kommande · ${counts.completed} genomförda`}
              {withMe.some(iv => iv.status === "scheduled" && new Date(iv.startAt).getTime() > Date.now()) && (
                <span style={{ color: WITH_ME_STYLE.text }}> · {(() => {
                  const n = withMe.filter(iv => iv.status === "scheduled" && new Date(iv.startAt).getTime() > Date.now()).length
                  return isEn ? `${n} where you're interviewed` : `${n} där du intervjuas`
                })()}</span>
              )}
              {needsEvaluation > 0 && (
                <span className="text-amber-600"> · {isEn ? `${needsEvaluation} to evaluate` : `${needsEvaluation} att utvärdera`}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <GoogleCalendarBadge isEn={isEn} google={google} />
            <button onClick={() => go({ kind: "book", date: null })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:calendar-plus" className="w-4 h-4" />
              {isEn ? "Book Interview" : "Boka Intervju"}
            </button>
          </div>
        </div>
      </div>

      <GoogleConnectResult isEn={isEn} onConnected={google.refresh} />
      <CoveringNotice language={isEn ? "en" : "sv"} />

      {banner && (
        <div className={clsx("flex items-start gap-2 px-4 py-3 rounded-xl border text-sm mb-4",
          banner.tone === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800")}>
          <Icon icon={banner.tone === "success" ? "tabler:circle-check" : "tabler:alert-triangle"} className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{banner.text}</span>
          <button onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100"><Icon icon="tabler:x" className="w-4 h-4" /></button>
        </div>
      )}

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600 mb-4">
          <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{loadError}</span>
          <button onClick={() => { setLoading(true); load() }} className="font-semibold hover:underline">{isEn ? "Try again" : "Försök igen"}</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── MAIN AREA ── */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {(["calendar", "list"] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    viewMode === m ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700")}>
                  <Icon icon={m === "calendar" ? "tabler:calendar" : "tabler:list"} className="w-3.5 h-3.5" />
                  {m === "calendar" ? (isEn ? "Week" : "Vecka") : (isEn ? "List" : "Lista")}
                </button>
              ))}
            </div>

            {viewMode === "calendar" && (
              <div className="flex items-center gap-2">
                <button onClick={() => setWeekStart(w => addDays(w, -7))}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                  <Icon icon="tabler:chevron-left" className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-gray-700 w-40 text-center">{weekLabel(weekStart, isEn)}</span>
                <button onClick={() => setWeekStart(w => addDays(w, 7))}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                  <Icon icon="tabler:chevron-right" className="w-4 h-4" />
                </button>
                <button onClick={() => setWeekStart(startOfWeek(new Date()))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50">
                  {isEn ? "Today" : "Idag"}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-gray-200 border-t-blue-800 rounded-full animate-spin" /></div>
          ) : viewMode === "calendar" ? (
            <WeekCalendar
              isEn={isEn} interviews={allInterviews} weekStart={weekStart}
              onSelectInterview={iv => go({ kind: "list", openId: iv.id })}
              onBookAt={d => go({ kind: "book", date: toDateInput(d) })}
              onReschedule={iv => go({ kind: "reschedule", id: iv.id })}
              onCancel={openCancel}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto w-fit max-w-full">
                {STATUS_TABS.map(s => {
                  const active = statusFilter === s
                  const label = s === "all" ? (isEn ? "All" : "Alla") : (isEn ? STATUS_STYLE[s].en : STATUS_STYLE[s].sv)
                  return (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                        active ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700")}>
                      {label}
                      <span className={clsx("text-xs px-1.5 rounded-full", active ? "bg-gray-100 text-gray-600" : "text-gray-400")}>{counts[s]}</span>
                    </button>
                  )
                })}
              </div>

              <div className="relative">
                <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={isEn ? "Search candidates or positions…" : "Sök kandidater eller tjänster…"}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200" />
              </div>

              {filteredList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
                  <Icon icon="tabler:calendar-off" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">
                    {interviews.length === 0
                      ? (isEn ? "No interviews yet — book your first one." : "Inga intervjuer än — boka din första.")
                      : (isEn ? "No interviews match your filters." : "Inga intervjuer matchar dina filter.")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredList.map(iv => {
                    const ss = STATUS_STYLE[iv.status]
                    const fmt = FORMAT_CFG[iv.format]
                    const withMeRow = isWithMe(iv)
                    return (
                      <div key={iv.id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all"
                        style={{ borderColor: withMeRow ? WITH_ME_STYLE.border : "rgb(229,231,235)" }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: withMeRow ? WITH_ME_STYLE.text : NAVY }}>
                          {initials(iv.candidateName)}
                        </div>
                        <button onClick={() => go({ kind: "list", openId: iv.id })} className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{iv.candidateName}</p>
                            <CoveringBadge coveringFor={iv.coveringFor} language={isEn ? "en" : "sv"} />
                            {withMeRow && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ color: WITH_ME_STYLE.text, backgroundColor: WITH_ME_STYLE.bg }}>
                                {isEn ? "You're interviewed" : "Du intervjuas"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-400 truncate">{iv.position}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{fmtDate(iv.startAt, isEn)} {fmtTime(iv.startAt)}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-400"><Icon icon={fmt.icon} className="w-3 h-3" />{isEn ? fmt.en : fmt.sv}</span>
                            {iv.status === "completed" && !withMeRow && !iv.evaluation.evaluatedAt && (
                              <span className="text-[10px] font-semibold text-amber-600">{isEn ? "Needs evaluation" : "Behöver utvärderas"}</span>
                            )}
                          </div>
                        </button>
                        <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border flex-shrink-0"
                          style={{ color: ss.text, backgroundColor: ss.bg, borderColor: ss.border }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ss.dot }} />
                          {isEn ? ss.en : ss.sv}
                        </span>
                        {(iv.status === "cancelled" || iv.status === "no_show") && !withMeRow && (
                          <button onClick={() => bookAgain(iv)} title={isEn ? "Book again" : "Boka igen"}
                            className="flex items-center gap-1 px-2.5 h-8 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 flex-shrink-0">
                            <Icon icon="tabler:calendar-plus" className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isEn ? "Book again" : "Boka igen"}</span>
                          </button>
                        )}
                        {iv.status === "scheduled" && withMeRow && iv.format === "video" && iv.meetingLink && (
                          <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" title={isEn ? "Join Google Meet" : "Anslut till Google Meet"}
                            className="w-8 h-8 rounded-lg border border-green-200 flex items-center justify-center hover:bg-green-50 flex-shrink-0">
                            <Icon icon="logos:google-meet" className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {iv.status === "scheduled" && !withMeRow && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {iv.format === "video" && iv.meetingLink && (
                              <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" title={isEn ? "Join Google Meet" : "Anslut till Google Meet"}
                                className="w-8 h-8 rounded-lg border border-green-200 flex items-center justify-center hover:bg-green-50">
                                <Icon icon="logos:google-meet" className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button onClick={() => go({ kind: "reschedule", id: iv.id })} title={isEn ? "Reschedule" : "Boka om"}
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                              <Icon icon="tabler:edit" className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openCancel(iv)} title={isEn ? "Cancel" : "Avboka"}
                              className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50">
                              <Icon icon="tabler:calendar-x" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SIDEBAR: Up next ── */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm lg:sticky lg:top-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Icon icon="tabler:clock" className="w-4 h-4" style={{ color: NAVY }} />
              <h3 className="text-sm font-bold" style={{ color: NAVY }}>{isEn ? "Up Next" : "Kommande"}</h3>
            </div>
            {upcoming.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400 px-4">
                {isEn ? "No upcoming interviews scheduled." : "Inga kommande intervjuer bokade."}
                <button onClick={() => go({ kind: "book", date: null })} className="block mx-auto mt-3 text-xs font-semibold text-blue-800 hover:underline">
                  {isEn ? "Book an interview" : "Boka en intervju"}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcoming.map(iv => {
                  const withMeRow = isWithMe(iv)
                  return (
                    <div key={iv.id} className="px-5 py-3.5 hover:bg-blue-50/30 transition-colors flex items-center gap-3">
                      <button onClick={() => go({ kind: "list", openId: iv.id })} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: withMeRow ? WITH_ME_STYLE.text : NAVY }}>
                          {initials(iv.candidateName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{iv.candidateName}</p>
                          {withMeRow && <p className="text-[10px] font-semibold" style={{ color: WITH_ME_STYLE.text }}>{isEn ? "You're interviewed" : "Du intervjuas"}</p>}
                          <p className="text-xs text-gray-400 truncate">{iv.position}</p>
                          {iv.coveringFor && <div className="mt-0.5"><CoveringBadge coveringFor={iv.coveringFor} language={isEn ? "en" : "sv"} /></div>}
                          <p className="text-xs font-semibold mt-0.5" style={{ color: NAVY }}>
                            {fmtDate(iv.startAt, isEn)} · {fmtTime(iv.startAt)}
                          </p>
                        </div>
                      </button>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {iv.format === "video" && iv.meetingLink && (
                          <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
                            style={{ backgroundColor: MEET_GREEN }}>
                            <Icon icon="tabler:video" className="w-3 h-3" />
                            {isEn ? "Join" : "Anslut"}
                          </a>
                        )}
                        {!withMeRow && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => go({ kind: "reschedule", id: iv.id })} title={isEn ? "Edit / reschedule" : "Ändra / boka om"}
                              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                              <Icon icon="tabler:edit" className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openCancel(iv)} title={isEn ? "Cancel interview" : "Avboka intervju"}
                              className="w-7 h-7 rounded-lg border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50">
                              <Icon icon="tabler:calendar-x" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer + dialogs */}
      {selectedWithMe && (
        <InterviewWithMeDrawer interview={selectedWithMe} isEn={isEn} onClose={() => go({ kind: "list", openId: null }, true)} />
      )}
      {selected && (
        <InterviewDetailDrawer
          interview={selected}
          isEn={isEn}
          googleConnected={!!google.status?.connected}
          onClose={() => go({ kind: "list", openId: null }, true)}
          onUpdated={upsert}
          onReschedule={iv => go({ kind: "reschedule", id: iv.id })}
          onCancel={openCancel}
          onBookAgain={bookAgain}
        />
      )}
      {cancelling && (
        <CancelDialog
          interview={cancelling} isEn={isEn} busy={cancelBusy} error={cancelError}
          onClose={() => setCancelling(null)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </div>
  )
}
