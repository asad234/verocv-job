"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/interviews/EmployeeInterviews.tsx
// WHAT IT DOES:   Employee dashboard → Others → Interviews.
//                 The interviews a manager booked with this user: the next one up
//                 front (join Google Meet, add to calendar, message from the
//                 interviewer), other upcoming ones, and past / cancelled ones.
//                 Opening the page clears the interview notices in the bell.
//                 ?interview=<id> highlights one interview (used by the bell).
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import { interviewEnd, listMyInterviews, markInterviewsSeen, type MyInterview, type MyInterviewStatus } from "@/utils/Myinterviewsapi"

const NAVY = "rgb(5,22,80)"
const MEET_GREEN = "rgb(22,163,74)"

const STATUS: Record<MyInterviewStatus, { en: string; sv: string; bg: string; text: string; border: string }> = {
  scheduled: { en: "Upcoming", sv: "Kommande", bg: "rgb(239,246,255)", text: "rgb(30,64,175)", border: "rgb(191,219,254)" },
  completed: { en: "Completed", sv: "Genomförd", bg: "rgb(240,253,244)", text: "rgb(22,101,52)", border: "rgb(187,247,208)" },
  cancelled: { en: "Cancelled", sv: "Inställd", bg: "rgb(243,244,246)", text: "rgb(55,65,81)", border: "rgb(209,213,219)" },
  no_show: { en: "Missed", sv: "Missad", bg: "rgb(254,242,242)", text: "rgb(153,27,27)", border: "rgb(254,202,202)" },
}

const FORMAT = {
  video: { icon: "tabler:video", en: "Video call", sv: "Videosamtal" },
  phone: { icon: "tabler:phone", en: "Phone call", sv: "Telefonsamtal" },
  in_person: { icon: "tabler:building", en: "In person", sv: "På plats" },
} as const

/* ─── Date helpers ─── */
const locale = (isEn: boolean) => (isEn ? "en-GB" : "sv-SE")
const fmtTime = (d: string | Date) => new Date(d).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
const fmtDay = (d: string | Date, isEn: boolean) =>
  new Date(d).toLocaleDateString(locale(isEn), { weekday: "long", day: "numeric", month: "long" })
const fmtShort = (d: string | Date, isEn: boolean) =>
  new Date(d).toLocaleDateString(locale(isEn), { day: "numeric", month: "short", year: "numeric" })

function relative(startAt: string, endAt: Date, isEn: boolean, now: number) {
  const start = new Date(startAt).getTime()
  if (now >= start && now < endAt.getTime()) return isEn ? "Happening now" : "Pågår nu"
  const mins = Math.round((start - now) / 60_000)
  if (mins < 60) return isEn ? `Starts in ${mins} min` : `Börjar om ${mins} min`
  const today = new Date(now)
  const d = new Date(startAt)
  const dayDiff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000)
  if (dayDiff === 0) return isEn ? `Today at ${fmtTime(startAt)}` : `Idag kl. ${fmtTime(startAt)}`
  if (dayDiff === 1) return isEn ? `Tomorrow at ${fmtTime(startAt)}` : `Imorgon kl. ${fmtTime(startAt)}`
  return isEn ? `In ${dayDiff} days` : `Om ${dayDiff} dagar`
}

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
/** Monday of the week that contains `d`. */
const weekStartOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7))
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/* ─── "Add to calendar" (.ics) ─── */
const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, m => `\\${m}`)

function downloadIcs(iv: MyInterview, isEn: boolean) {
  const title = `${isEn ? "Interview" : "Intervju"}: ${iv.position}${iv.companyName ? ` – ${iv.companyName}` : ""}`
  const details = [
    iv.interviewerName && `${isEn ? "Interviewer" : "Intervjuare"}: ${iv.interviewerName}`,
    iv.meetingLink && `Google Meet: ${iv.meetingLink}`,
    iv.phone && `${isEn ? "You will be called on" : "Du blir uppringd på"} ${iv.phone}`,
    iv.message,
  ].filter(Boolean).join("\n\n")
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VeroCV//Interviews//EN", "BEGIN:VEVENT",
    `UID:interview-${iv.id}@verocv`, `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(new Date(iv.startAt))}`, `DTEND:${icsDate(interviewEnd(iv))}`,
    `SUMMARY:${icsText(title)}`, `DESCRIPTION:${icsText(details)}`,
    ...(iv.location ? [`LOCATION:${icsText(iv.location)}`] : iv.meetingLink ? [`LOCATION:${icsText(iv.meetingLink)}`] : []),
    ...(iv.meetingLink ? [`URL:${iv.meetingLink}`] : []),
    "END:VEVENT", "END:VCALENDAR",
  ]
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `interview-${iv.id}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ─── Pieces ─── */
const StatusChip: React.FC<{ status: MyInterviewStatus; isEn: boolean }> = ({ status, isEn }) => {
  const s = STATUS[status]
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}>
      {isEn ? s.en : s.sv}
    </span>
  )
}

/** "Time changed — was Tue 13 Oct 10:00" (shown for 14 days after the employer moved it). */
const MovedNote: React.FC<{ iv: MyInterview; isEn: boolean; dark?: boolean }> = ({ iv, isEn, dark }) => {
  if (iv.status !== "scheduled" || !iv.rescheduledAt || !iv.previousStartAt) return null
  if (Date.now() - new Date(iv.rescheduledAt).getTime() > 14 * 24 * 60 * 60_000) return null
  const was = `${new Date(iv.previousStartAt).toLocaleDateString(locale(isEn), { weekday: "short", day: "numeric", month: "short" })} ${fmtTime(iv.previousStartAt)}`
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
      dark ? "bg-amber-400/15 border-amber-300/40 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800")}>
      <Icon icon="tabler:calendar-repeat" className="w-3.5 h-3.5" />
      {isEn ? `Time changed — was ${was}` : `Ny tid — var ${was}`}
    </span>
  )
}

/** How to attend — Meet link, phone note or address. */
const HowToJoin: React.FC<{ iv: MyInterview; isEn: boolean; dark?: boolean }> = ({ iv, isEn, dark }) => {
  const muted = dark ? "text-white/70" : "text-gray-500"
  if (iv.format === "video") {
    return iv.meetingLink
      ? <span className={clsx("truncate", muted)}>{iv.meetingLink.replace(/^https:\/\//, "")}</span>
      : <span className={muted}>{isEn ? "The video link will appear here." : "Videolänken visas här."}</span>
  }
  if (iv.format === "phone") {
    return <span className={muted}>{iv.phone ? (isEn ? `You'll be called on ${iv.phone}` : `Du blir uppringd på ${iv.phone}`) : (isEn ? "The interviewer will call you." : "Intervjuaren ringer dig.")}</span>
  }
  return <span className={muted}>{iv.location || (isEn ? "Address to be confirmed" : "Adress meddelas")}</span>
}

/* ═════════════════════════════════════════════════════════════
   PAGE
═════════════════════════════════════════════════════════════ */
export default function EmployeeInterviews() {
  const { language } = useDashboardTranslations()
  const isEn = language === "en"
  const searchParams = useSearchParams()
  const focusId = searchParams.get("interview")

  const [interviews, setInterviews] = useState<MyInterview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()))
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const load = useCallback(async () => {
    setError(null)
    try {
      const list = await listMyInterviews()
      setInterviews(list)
      markInterviewsSeen(list) // clears the bell notices for these
    } catch (e) {
      setError((e as Error).message || (isEn ? "Couldn't load your interviews." : "Kunde inte ladda dina intervjuer."))
    } finally {
      setLoading(false)
    }
  }, [isEn])

  useEffect(() => { load() }, [load])

  // Keep "Starts in 5 min" / "Happening now" fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const { upcoming, past } = useMemo(() => {
    const up: MyInterview[] = []
    const old: MyInterview[] = []
    for (const iv of interviews) {
      if (iv.status === "scheduled" && interviewEnd(iv).getTime() > now) up.push(iv)
      else old.push(iv)
    }
    up.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    old.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    return { upcoming: up, past: old }
  }, [interviews, now])

  const next = upcoming[0] ?? null
  const laterUpcoming = upcoming.slice(1)

  // ?interview=<id> → scroll to it (opening "past" if needed).
  useEffect(() => {
    if (!focusId || loading) return
    if (past.some(p => p.id === focusId)) setShowPast(true)
    const t = setTimeout(() => cardRefs.current[focusId]?.scrollIntoView({ behavior: "smooth", block: "center" }), 150)
    return () => clearTimeout(t)
  }, [focusId, loading, past])

  /** Interviews on the day picked in the mini calendar. */
  const dayInterviews = useMemo(() =>
    interviews
      .filter(iv => sameDay(new Date(iv.startAt), selectedDay))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [interviews, selectedDay])

  /** Scroll to an interview's card (opening "Past & cancelled" when needed). */
  const jumpTo = (id: string) => {
    if (past.some(p => p.id === id)) setShowPast(true)
    setTimeout(() => cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" }), 120)
  }

  /* ── Render ── */
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:calendar-event" className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{isEn ? "My Interviews" : "Mina Intervjuer"}</h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">
          {isEn ? "Interviews booked with you — join, add them to your calendar and see the details." : "Intervjuer som bokats med dig — anslut, lägg till i din kalender och se detaljerna."}
        </p>
      </div>

      {/* Mini week calendar */}
      <WeekStrip
        isEn={isEn}
        selected={selectedDay}
        onSelect={setSelectedDay}
        interviews={interviews}
        now={now}
      />
      {!loading && (
        <div className="mb-6 -mt-2 bg-white rounded-b-2xl border border-t-0 border-gray-200 px-4 sm:px-5 py-3">
          {dayInterviews.length === 0 ? (
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <Icon icon="tabler:calendar-off" className="w-3.5 h-3.5" />
              {isEn ? "No interviews on this day." : "Inga intervjuer den här dagen."}
            </p>
          ) : (
            <div className="space-y-1.5">
              {dayInterviews.map(iv => {
                const ended = interviewEnd(iv).getTime() <= now
                const status: MyInterviewStatus = iv.status === "scheduled" && ended ? "completed" : iv.status
                return (
                  <button key={iv.id} onClick={() => jumpTo(iv.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-left transition-colors">
                    <span className="text-xs font-bold tabular-nums w-[84px] flex-shrink-0" style={{ color: NAVY }}>
                      {fmtTime(iv.startAt)}–{fmtTime(interviewEnd(iv))}
                    </span>
                    <Icon icon={FORMAT[iv.format].icon} className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className={clsx("text-sm text-gray-700 truncate flex-1", iv.status === "cancelled" && "line-through text-gray-400")}>
                      {iv.position}{iv.companyName && <span className="text-gray-400"> · {iv.companyName}</span>}
                    </span>
                    <StatusChip status={status} isEn={isEn} />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600 mb-4">
          <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => { setLoading(true); load() }} className="font-semibold hover:underline">{isEn ? "Try again" : "Försök igen"}</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-800 rounded-full animate-spin" />
        </div>
      ) : interviews.length === 0 && !error ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgb(239,246,255)" }}>
            <Icon icon="tabler:calendar-off" className="w-7 h-7" style={{ color: NAVY }} />
          </div>
          <p className="text-gray-700 font-semibold">{isEn ? "No interviews yet" : "Inga intervjuer än"}</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {isEn ? "When an employer books an interview with you, it shows up here and in your notifications." : "När en arbetsgivare bokar en intervju med dig visas den här och bland dina notifikationer."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Next interview ── */}
          {next ? (() => {
            const end = interviewEnd(next)
            const startMs = new Date(next.startAt).getTime()
            const joinable = !!next.meetingLink && startMs - now < 15 * 60_000 && end.getTime() > now
            const fmt = FORMAT[next.format]
            return (
              <div ref={el => { cardRefs.current[next.id] = el }}
                className={clsx("rounded-2xl overflow-hidden shadow-sm", focusId === next.id && "ring-4 ring-blue-200")}>
                <div className="px-6 py-6 text-white" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, rgb(15,32,90) 100%)` }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{isEn ? "Your next interview" : "Din nästa intervju"}</p>
                      <h2 className="text-xl font-bold mt-1 truncate">{next.position}</h2>
                      <p className="text-sm text-white/70 mt-0.5">
                        {[next.companyName, next.interviewerName && `${isEn ? "with" : "med"} ${next.interviewerName}`].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-2"><MovedNote iv={next} isEn={isEn} dark /></div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                      <Icon icon="tabler:clock" className="w-3.5 h-3.5" />
                      {relative(next.startAt, end, isEn, now)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="tabler:calendar" className="w-4 h-4 text-white/50 flex-shrink-0" />
                      <span className="capitalize">{fmtDay(next.startAt, isEn)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Icon icon="tabler:clock-hour-4" className="w-4 h-4 text-white/50 flex-shrink-0" />
                      <span>{fmtTime(next.startAt)} – {fmtTime(end)} <span className="text-white/50">· {next.durationMinutes} min</span></span>
                    </div>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon icon={fmt.icon} className="w-4 h-4 text-white/50 flex-shrink-0" />
                      <span className="truncate">{isEn ? fmt.en : fmt.sv}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white px-6 py-5 border border-t-0 border-gray-200 rounded-b-2xl space-y-4">
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <Icon icon={next.format === "video" ? "logos:google-meet" : fmt.icon} className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <HowToJoin iv={next} isEn={isEn} />
                  </div>

                  {next.message && (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                        {isEn ? `Message from ${next.interviewerName || "the interviewer"}` : `Meddelande från ${next.interviewerName || "intervjuaren"}`}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{next.message}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    {next.format === "video" && next.meetingLink && (
                      <a href={next.meetingLink} target="_blank" rel="noopener noreferrer"
                        className={clsx("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md",
                          joinable && "ring-4 ring-green-100")}
                        style={{ backgroundColor: MEET_GREEN }}>
                        <Icon icon="tabler:video" className="w-4 h-4" />
                        {isEn ? "Join Google Meet" : "Anslut till Google Meet"}
                      </a>
                    )}
                    {next.format === "in_person" && next.location && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(next.location)}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: NAVY }}>
                        <Icon icon="tabler:map-pin" className="w-4 h-4" />
                        {isEn ? "Open in Maps" : "Öppna i Kartor"}
                      </a>
                    )}
                    <button onClick={() => downloadIcs(next, isEn)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
                      <Icon icon="tabler:calendar-plus" className="w-4 h-4" />
                      {isEn ? "Add to my calendar" : "Lägg till i min kalender"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex items-center gap-3 text-sm text-gray-500">
              <Icon icon="tabler:calendar-check" className="w-5 h-5 text-gray-300" />
              {isEn ? "You have no upcoming interviews." : "Du har inga kommande intervjuer."}
            </div>
          )}

          {/* ── More upcoming ── */}
          {laterUpcoming.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">{isEn ? "Also coming up" : "Också på gång"}</h3>
              <div className="space-y-2.5">
                {laterUpcoming.map(iv => <InterviewRow key={iv.id} iv={iv} isEn={isEn} focused={focusId === iv.id}
                  setRef={el => { cardRefs.current[iv.id] = el }} />)}
              </div>
            </section>
          )}

          {/* ── Past & cancelled ── */}
          {past.length > 0 && (
            <section>
              <button onClick={() => setShowPast(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 mb-2.5">
                <Icon icon={showPast ? "tabler:chevron-down" : "tabler:chevron-right"} className="w-3.5 h-3.5" />
                {isEn ? `Past & cancelled (${past.length})` : `Tidigare & inställda (${past.length})`}
              </button>
              {showPast && (
                <div className="space-y-2.5">
                  {past.map(iv => <InterviewRow key={iv.id} iv={iv} isEn={isEn} focused={focusId === iv.id}
                    setRef={el => { cardRefs.current[iv.id] = el }} />)}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Compact row for later / past interviews ─── */
function InterviewRow({ iv, isEn, focused, setRef }: {
  iv: MyInterview; isEn: boolean; focused: boolean; setRef: (el: HTMLDivElement | null) => void
}) {
  const [open, setOpen] = useState(focused)
  const fmt = FORMAT[iv.format]
  const end = interviewEnd(iv)
  const isUpcoming = iv.status === "scheduled" && end.getTime() > Date.now()
  const d = new Date(iv.startAt)

  return (
    <div ref={setRef}
      className={clsx("bg-white rounded-2xl border shadow-sm transition-all",
        focused ? "border-blue-300 ring-4 ring-blue-100" : "border-gray-200",
        iv.status === "cancelled" && "opacity-75")}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-4 p-4 text-left">
        <div className="w-12 flex-shrink-0 text-center rounded-xl border border-gray-100 py-1.5">
          <p className="text-[10px] font-semibold uppercase text-gray-400">{d.toLocaleDateString(locale(isEn), { month: "short" })}</p>
          <p className="text-lg font-bold leading-tight" style={{ color: NAVY }}>{d.getDate()}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className={clsx("text-sm font-semibold text-gray-800 truncate flex items-center gap-1.5", iv.status === "cancelled" && "line-through")}>
            <span className="truncate">{iv.position}</span>
            {iv.status === "scheduled" && iv.rescheduledAt && Date.now() - new Date(iv.rescheduledAt).getTime() < 14 * 24 * 60 * 60_000 && (
              <span className="no-underline text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                {isEn ? "New time" : "Ny tid"}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
            <span>{fmtTime(iv.startAt)}–{fmtTime(end)}</span>
            <span className="text-gray-300">·</span>
            <Icon icon={fmt.icon} className="w-3 h-3" />
            <span>{isEn ? fmt.en : fmt.sv}</span>
            {(iv.companyName || iv.interviewerName) && <><span className="text-gray-300">·</span><span className="truncate">{iv.companyName || iv.interviewerName}</span></>}
          </p>
        </div>
        <StatusChip status={isUpcoming ? "scheduled" : iv.status === "scheduled" ? "completed" : iv.status} isEn={isEn} />
        <Icon icon={open ? "tabler:chevron-up" : "tabler:chevron-down"} className="w-4 h-4 text-gray-300 flex-shrink-0" />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 text-gray-600">
            <div className="flex items-center gap-2"><Icon icon="tabler:calendar" className="w-4 h-4 text-gray-400" /><span className="capitalize">{isUpcoming ? fmtDay(iv.startAt, isEn) : fmtShort(iv.startAt, isEn)}</span></div>
            {iv.interviewerName && <div className="flex items-center gap-2"><Icon icon="tabler:user" className="w-4 h-4 text-gray-400" />{iv.interviewerName}</div>}
            {isUpcoming && (
              <div className="flex items-center gap-2 sm:col-span-2 min-w-0">
                <Icon icon={iv.format === "video" ? "logos:google-meet" : fmt.icon} className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <HowToJoin iv={iv} isEn={isEn} />
              </div>
            )}
          </div>
          {iv.status === "cancelled" && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <Icon icon="tabler:calendar-x" className="w-3.5 h-3.5" />
              {iv.cancelledAt
                ? (isEn ? `Cancelled by the employer on ${fmtShort(iv.cancelledAt, isEn)}.` : `Inställd av arbetsgivaren ${fmtShort(iv.cancelledAt, isEn)}.`)
                : (isEn ? "This interview was cancelled by the employer." : "Intervjun ställdes in av arbetsgivaren.")}
            </p>
          )}
          <MovedNote iv={iv} isEn={isEn} />
          {iv.message && isUpcoming && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap rounded-xl bg-gray-50 px-3 py-2.5">{iv.message}</p>
          )}
          {isUpcoming && (
            <div className="flex flex-col sm:flex-row gap-2">
              {iv.format === "video" && iv.meetingLink && (
                <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: MEET_GREEN }}>
                  <Icon icon="tabler:video" className="w-4 h-4" />
                  {isEn ? "Join Google Meet" : "Anslut till Google Meet"}
                </a>
              )}
              <button onClick={() => downloadIcs(iv, isEn)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
                <Icon icon="tabler:calendar-plus" className="w-4 h-4" />
                {isEn ? "Add to my calendar" : "Lägg till i min kalender"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Mini week calendar (like Google Calendar's day strip) ─── */
const WEEKDAYS = {
  en: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
  sv: ["MÅN", "TIS", "ONS", "TORS", "FRE", "LÖR", "SÖN"],
}

function WeekStrip({ isEn, selected, onSelect, interviews, now }: {
  isEn: boolean
  selected: Date
  onSelect: (d: Date) => void
  interviews: MyInterview[]
  now: number
}) {
  const [weekStart, setWeekStart] = useState(() => weekStartOf(selected))
  const dateInputRef = useRef<HTMLInputElement>(null)
  const today = startOfDay(new Date(now))
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const labels = isEn ? WEEKDAYS.en : WEEKDAYS.sv

  // Keep the visible week in step when a date is picked from the calendar.
  useEffect(() => {
    if (selected < weekStart || selected >= addDays(weekStart, 7)) setWeekStart(weekStartOf(selected))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  /** Days with an interview → small dot (blue = upcoming, grey = past / cancelled). */
  const marks = useMemo(() => {
    const m = new Map<string, "upcoming" | "other">()
    for (const iv of interviews) {
      const key = startOfDay(new Date(iv.startAt)).toDateString()
      const upcoming = iv.status === "scheduled" && interviewEnd(iv).getTime() > now
      if (upcoming || !m.has(key)) m.set(key, upcoming ? "upcoming" : m.get(key) ?? "other")
    }
    return m
  }, [interviews, now])

  const openPicker = () => {
    const el = dateInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null
    if (!el) return
    try { el.showPicker ? el.showPicker() : el.click() } catch { el.click() }
  }

  const label = selected.toLocaleDateString(isEn ? "en-GB" : "sv-SE", { weekday: "short", day: "numeric", month: "short" })

  return (
    <div className="bg-white rounded-t-2xl border border-gray-200 px-4 sm:px-5 py-3 mb-2 flex items-center justify-between gap-3 flex-wrap">
      {/* Selected date + calendar picker */}
      <div className="relative flex items-center gap-2">
        <span className="text-lg text-gray-900">{label}</span>
        <button type="button" onClick={openPicker} aria-label={isEn ? "Pick a date" : "Välj datum"}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100">
          <Icon icon="tabler:calendar-month" className="w-5 h-5" />
        </button>
        {!sameDay(selected, today) && (
          <button type="button" onClick={() => onSelect(today)}
            className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">
            {isEn ? "Today" : "Idag"}
          </button>
        )}
        <input ref={dateInputRef} type="date" tabIndex={-1} aria-hidden
          value={toDateInput(selected)}
          onChange={e => { if (e.target.value) onSelect(startOfDay(new Date(`${e.target.value}T00:00:00`))) }}
          className="absolute left-0 top-full w-0 h-0 opacity-0 pointer-events-none" />
      </div>

      {/* Week strip */}
      <div className="flex items-center justify-between sm:justify-end gap-0 sm:gap-2 w-full sm:w-auto sm:ml-auto">
        <button type="button" onClick={() => setWeekStart(w => addDays(w, -7))} aria-label={isEn ? "Previous week" : "Föregående vecka"}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 flex-shrink-0">
          <Icon icon="tabler:chevron-left" className="w-5 h-5" />
        </button>
        {days.map((d, i) => {
          const isSelected = sameDay(d, selected)
          const isToday = sameDay(d, today)
          const mark = marks.get(d.toDateString())
          return (
            <button key={d.toISOString()} type="button" onClick={() => onSelect(d)}
              aria-pressed={isSelected}
              className={clsx("relative flex flex-col items-center justify-center w-[38px] sm:w-12 h-14 rounded-full transition-colors flex-shrink-0",
                isSelected ? "bg-blue-100" : "hover:bg-gray-100")}>
              <span className={clsx("text-[10px] font-medium tracking-wide",
                isSelected || isToday ? "text-blue-900" : "text-gray-500")}>{labels[i]}</span>
              <span className={clsx("text-base leading-tight",
                isSelected ? "font-bold text-blue-900" : isToday ? "font-bold text-blue-800" : "text-gray-800")}>{d.getDate()}</span>
              {mark && (
                <span className={clsx("absolute bottom-1 w-1.5 h-1.5 rounded-full", mark === "upcoming" ? "bg-blue-600" : "bg-gray-300")} />
              )}
            </button>
          )
        })}
        <button type="button" onClick={() => setWeekStart(w => addDays(w, 7))} aria-label={isEn ? "Next week" : "Nästa vecka"}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 flex-shrink-0">
          <Icon icon="tabler:chevron-right" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
