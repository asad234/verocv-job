"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/Businessadminhome.tsx   (REPLACE)
// WHAT IT DOES:   Business admin → Dashboard → Home. What you need to see first:
//   Left   • To do        — everything waiting for you (contracts to sign, days-off requests,
//                            managers without a contract, contracts ending, inactive managers…).
//                            Every item opens the right page.
//          • Your managers today — status, team, your contract with them, last seen
//          • Get started  — only while you have no managers yet
//   Right  • Key numbers  — managers, employees, active contracts, unread messages
//          • This week    — your interviews + managers away
//          • Latest messages (real chats)
// API:            GET /api/company/admin/home · chats via utils/chat (chatApi)
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useBusinessAdmin, type BusinessAdminView } from "./Businessadmincontext"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { chatApi, useChatUnread, CHAT_UNREAD_EVENT, type ChatConversation } from "@/utils/chat"
import { DAY_KIND_STYLE, TYPE_LABELS, type TimeOffType } from "@/utils/managerAvailability"
import type { AttentionItem, Kpi, ManagerReportRow } from "@/utils/adminReports"
import type { AdminHomeData, AdminHomeInterview } from "@/utils/adminHome"
// Same texts as the Reports page (your file is views/reportsTexts.ts)
import { MY_CONTRACT_LABEL, REPORTS_TEXT, attentionCopy } from "./views/reportsTexts"

const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"
type Lang = "sv" | "en"

const HX = {
  sv: {
    loadFailed: "Kunde inte ladda översikten.", retry: "Försök igen",
    todo: "Att göra", todoDesc: "Det här väntar på dig", allDone: "Allt är klart — inget väntar på dig just nu.",
    showAll: (n: number) => `Visa alla (${n})`, showLess: "Visa färre",
    managersToday: "Dina chefer idag", seeAll: "Visa alla", createManager: "Skapa chef", team: (n: number) => `${n} i teamet`,
    noManagers: "Du har inga chefer ännu. Skapa din första chef för att komma igång.",
    managers: "Chefer", activeWeek: (n: number) => `${n} aktiva denna vecka`, employees: "Medarbetare", newWeek: (n: number) => `+${n} nya denna vecka`,
    contracts: "Aktiva kontrakt", unread: "Olästa meddelanden", noNew: "Inga nya",
    thisWeek: "Den här veckan", yourInterviews: "Dina intervjuer", noInterviews: "Inga intervjuer de närmaste 7 dagarna.",
    away: "Borta", noAway: "Ingen chef är ledig de närmaste 7 dagarna.", join: "Anslut",
    messages: "Senaste meddelanden", noMessages: "Inga konversationer ännu.", openChats: "Öppna chattar", you: "Du: ",
    todayWord: "Idag", tomorrow: "Imorgon", lastSeen: "Senast aktiv", never: "Aldrig inloggad",
    formats: { video: "Video", phone: "Telefon", in_person: "På plats" } as Record<string, string>,
    reports: "Rapporter",
  },
  en: {
    loadFailed: "Couldn't load the overview.", retry: "Try again",
    todo: "To do", todoDesc: "This is waiting for you", allDone: "All done — nothing is waiting for you right now.",
    showAll: (n: number) => `Show all (${n})`, showLess: "Show less",
    managersToday: "Your managers today", seeAll: "See all", createManager: "Create manager", team: (n: number) => `${n} in team`,
    noManagers: "You have no managers yet. Create your first manager to get started.",
    managers: "Managers", activeWeek: (n: number) => `${n} active this week`, employees: "Employees", newWeek: (n: number) => `+${n} new this week`,
    contracts: "Active contracts", unread: "Unread messages", noNew: "Nothing new",
    thisWeek: "This week", yourInterviews: "Your interviews", noInterviews: "No interviews in the next 7 days.",
    away: "Away", noAway: "No manager is off in the next 7 days.", join: "Join",
    messages: "Latest messages", noMessages: "No conversations yet.", openChats: "Open chats", you: "You: ",
    todayWord: "Today", tomorrow: "Tomorrow", lastSeen: "Last seen", never: "Never signed in",
    formats: { video: "Video", phone: "Phone", in_person: "In person" } as Record<string, string>,
    reports: "Reports",
  },
}
type Hx = (typeof HX)["sv"]

const LEVEL_STYLE = {
  high: { color: "rgb(185,28,28)", bg: "rgb(254,242,242)" },
  medium: { color: "rgb(146,64,14)", bg: "rgb(255,251,235)" },
  low: { color: "rgb(30,64,175)", bg: "rgb(239,246,255)" },
} as const

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?"
const dayKey = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date(iso))

/* ─── Building blocks ─── */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={clsx("bg-white rounded-2xl border border-gray-200 shadow-sm", className)}>{children}</div>
)

const CardHeader: React.FC<{ icon: string; title: string; desc?: string; action?: React.ReactNode }> = ({ icon, title, desc, action }) => (
  <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: NAVY }}><Icon icon={icon} className="w-4 h-4 text-white" /></div>
      <div className="min-w-0">
        <h2 className="text-sm sm:text-base font-bold truncate" style={{ color: NAVY }}>{title}</h2>
        {desc && <p className="text-xs text-gray-500 truncate">{desc}</p>}
      </div>
    </div>
    {action}
  </div>
)

const StepRow: React.FC<{ num: number; title: string; desc: string; onClick: () => void }> = ({ num, title, desc, onClick }) => (
  <button onClick={onClick} className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-gray-200 transition-all hover:border-blue-200 hover:bg-blue-50/30">
    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: "rgba(176,196,222,0.3)", color: NAVY }}>{num}</div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
    </div>
    <Icon icon="tabler:chevron-right" className="w-5 h-5 text-gray-400 flex-shrink-0" />
  </button>
)

/* ═════════════════════════════════════════════════════════════════════ */
export default function BusinessAdminHome() {
  const nav = useBusinessAdmin()
  const { setView } = nav
  const { t, language } = useBusinessAdminTranslations()
  const lang: Lang = language === "en" ? "en" : "sv"
  const hx = HX[lang]
  const rx = REPORTS_TEXT[lang]
  const unread = useChatUnread()

  const [data, setData] = useState<AdminHomeData | null>(null)
  const [error, setError] = useState(false)
  const [chats, setChats] = useState<{ me: string; list: ChatConversation[] } | null>(null)
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(() => {
    fetch("/api/company/admin/home", { cache: "no-store", credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error()
        setData((await r.json()).data)
        setError(false)
      })
      .catch(() => setError(true))
  }, [])
  const loadChats = useCallback(() => {
    chatApi.conversations()
      .then((b) => setChats({
        me: b.me,
        list: [...b.data].filter((c) => c.lastMessage).sort((a, b2) => String(b2.lastMessage?.at).localeCompare(String(a.lastMessage?.at))).slice(0, 4),
      }))
      .catch(() => setChats({ me: "", list: [] }))
  }, [])

  useEffect(() => {
    load()
    loadChats()
    const again = () => { load(); loadChats() }
    window.addEventListener("focus", again)
    window.addEventListener("verocv:contracts-changed", load)
    window.addEventListener("verocv:time-off-changed", load)
    window.addEventListener(CHAT_UNREAD_EVENT, loadChats)
    return () => {
      window.removeEventListener("focus", again)
      window.removeEventListener("verocv:contracts-changed", load)
      window.removeEventListener("verocv:time-off-changed", load)
      window.removeEventListener(CHAT_UNREAD_EVENT, loadChats)
    }
  }, [load, loadChats])

  const fmtDate = useCallback((iso: string) => {
    const d = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso)
    return d.toLocaleDateString(lang === "en" ? "en-GB" : "sv-SE", { day: "numeric", month: "short", timeZone: "Europe/Stockholm" })
  }, [lang])
  const typeLabel = (k: string) => TYPE_LABELS[k as TimeOffType]?.[lang] ?? k

  /* Where each to-do goes (same as on Reports) */
  const openTodo = (a: AttentionItem) => {
    switch (a.kind) {
      case "contract_to_sign":
      case "manager_contract_waiting":
        if (a.contractId) nav.openManagerContract(a.contractId)
        return
      case "contract_expiring":
        if (a.forManager && a.contractId) nav.openManagerContract(a.contractId)
        else if (a.employeeId) nav.openEmployeeProfile(a.employeeId)
        return
      case "time_off_pending": {
        const url = new URL(window.location.href)
        url.searchParams.set("availability", "requests")
        window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
        setView("availability")
        return
      }
      case "manager_no_contract":
        setView("manager_contracts")
        return
      case "interviews_today":
        setView("interviews")
        return
      default:
        if (a.managerId) nav.openManagerProfile(a.managerId)
    }
  }

  const steps: { title: string; desc: string; view: BusinessAdminView }[] = [
    { title: t.step1Title, desc: t.step1Desc, view: "create_manager" },
    { title: t.step2Title, desc: t.step2Desc, view: "managers_list" },
    { title: t.step3Title, desc: t.step3Desc, view: "availability" },
    { title: t.step4Title, desc: t.step4Desc, view: "chat" },
  ]

  const report = data?.report
  const todos = report?.attention ?? []
  const shownTodos = showAll ? todos : todos.slice(0, 6)
  const noManagers = !!report && report.managers.length === 0
  const date = new Date().toLocaleDateString(lang === "en" ? "en-GB" : "sv-SE", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Stockholm" })

  return (
    <div className="p-4 sm:p-6 m-0 sm:m-4 min-h-screen">
      {/* Welcome */}
      <div className="mb-6 text-center mx-auto w-full md:w-[80%] lg:w-[60%]">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1 first-letter:uppercase">{date}</p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.welcomeTitle}</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">{t.welcomeSubtitle}</p>
      </div>

      {error && !data ? (
        <Card className="p-10 text-center max-w-md mx-auto">
          <p className="text-sm text-gray-500 mb-3">{hx.loadFailed}</p>
          <button onClick={load} className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: NAVY }}>{hx.retry}</button>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* ── LEFT 60% ── */}
          <div className="w-full lg:w-[60%] space-y-4 sm:space-y-6 min-w-0">
            {/* Get started — only until the first manager exists */}
            {noManagers && (
              <Card className="p-6">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}><Icon icon="tabler:rocket" className="w-6 h-6 text-white" /></div>
                  <h2 className="text-xl font-bold" style={{ color: NAVY }}>{t.setupTitle}</h2>
                </div>
                <div className="space-y-4">
                  {steps.map((s, i) => <StepRow key={s.view} num={i + 1} title={s.title} desc={s.desc} onClick={() => setView(s.view)} />)}
                </div>
                <p className="mt-6 text-center text-sm text-gray-500">{t.completionMessage}</p>
              </Card>
            )}

            {/* To do */}
            <Card>
              <CardHeader icon="tabler:checklist" title={hx.todo} desc={hx.todoDesc}
                action={todos.length > 0 && <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2 py-0.5">{todos.length}</span>} />
              {!report ? (
                <SkeletonList rows={4} />
              ) : todos.length === 0 ? (
                <div className="py-10 px-6 text-center">
                  <Icon icon="tabler:circle-check" className="w-9 h-9 mx-auto mb-2 text-green-500" />
                  <p className="text-sm text-gray-500">{hx.allDone}</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {shownTodos.map((a) => {
                    const c = attentionCopy(a, lang, typeLabel, fmtDate)
                    const st = LEVEL_STYLE[a.level]
                    return (
                      <li key={a.key}>
                        <button onClick={() => openTodo(a)} className="w-full text-left px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-gray-50/80 group">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: st.bg }}>
                            <Icon icon={c.icon} className="w-4 h-4" style={{ color: st.color }} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-gray-800">{c.text}</span>
                            <span className="flex items-center gap-2 mt-0.5 min-w-0">
                              <span className="text-[10px] font-semibold uppercase tracking-wide flex-shrink-0" style={{ color: st.color }}>{rx.levels[a.level]}</span>
                              {c.sub && <span className="text-xs text-gray-500 truncate">· {c.sub}</span>}
                            </span>
                          </span>
                          <Icon icon="tabler:chevron-right" className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              {todos.length > 6 && (
                <button onClick={() => setShowAll((v) => !v)} className="w-full py-2.5 text-xs font-semibold border-t border-gray-100 hover:bg-gray-50" style={{ color: NAVY }}>
                  {showAll ? hx.showLess : hx.showAll(todos.length)}
                </button>
              )}
            </Card>

            {/* Your managers today */}
            {!noManagers && (
              <Card>
                <CardHeader icon="tabler:users-group" title={hx.managersToday}
                  action={
                    <div className="flex items-center gap-2">
                      <button onClick={() => setView("create_manager")} title={hx.createManager} aria-label={hx.createManager}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: "rgb(20,184,166)" }}>
                        <Icon icon="tabler:plus" className="w-4 h-4" />
                      </button>
                      <button onClick={() => setView("managers_list")} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: NAVY, backgroundColor: LIGHT }}>{hx.seeAll}</button>
                    </div>
                  } />
                {!report ? <SkeletonList rows={3} /> : (
                  <ul className="divide-y divide-gray-50">
                    {report.managers.slice(0, 8).map((m) => (
                      <ManagerLine key={m.id} m={m} lang={lang} hx={hx} today={report.today} fmtDate={fmtDate} onOpen={() => nav.openManagerProfile(m.id)} onChat={() => nav.openChat(m.id)} />
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>

          {/* ── RIGHT 40% ── */}
          <div className="w-full lg:w-[40%] space-y-4 sm:space-y-6 min-w-0">
            {/* Key numbers */}
            <div className="grid grid-cols-2 gap-3">
              <Stat icon="tabler:users-group" label={hx.managers} value={report?.snapshot.managers} sub={report ? hx.activeWeek(report.snapshot.activeManagers) : ""} onClick={() => setView("managers_list")} />
              <Stat icon="tabler:users" label={hx.employees} value={report?.snapshot.employees} sub={report ? newSub(report.kpis.newEmployees, hx) : ""} onClick={() => setView("employees")} />
              <Stat icon="tabler:file-certificate" label={hx.contracts} value={report?.snapshot.activeContracts} onClick={() => setView("manager_contracts")} />
              <Stat icon="tabler:message-circle" label={hx.unread} value={unread} sub={unread ? "" : hx.noNew} highlight={unread > 0} onClick={() => setView("chat")} />
            </div>

            {/* This week */}
            <Card>
              <CardHeader icon="tabler:calendar-week" title={hx.thisWeek}
                action={<button onClick={() => setView("reports")} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: NAVY, backgroundColor: LIGHT }}>{hx.reports}</button>} />
              {!data ? <SkeletonList rows={3} /> : (
                <div className="px-4 sm:px-5 py-4 space-y-5">
                  <div>
                    <SubHead icon="tabler:calendar-user" text={hx.yourInterviews} onClick={() => setView("interviews")} />
                    {data.interviews.length === 0 ? <p className="text-xs text-gray-400">{hx.noInterviews}</p> : (
                      <ul className="space-y-2">{data.interviews.slice(0, 4).map((v) => <InterviewLine key={v.id} v={v} lang={lang} hx={hx} onOpen={() => setView("interviews")} />)}</ul>
                    )}
                  </div>
                  <div>
                    <SubHead icon="tabler:beach" text={hx.away} onClick={() => setView("availability")} />
                    {data.away.length === 0 ? <p className="text-xs text-gray-400">{hx.noAway}</p> : (
                      <ul className="space-y-2">
                        {data.away.slice(0, 5).map((r) => {
                          const tl = TYPE_LABELS[r.type]
                          return (
                            <li key={r.id}>
                              <button onClick={() => nav.openManagerProfile(r.managerId)} className="w-full flex items-center gap-3 text-left group">
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tl.bg }}>
                                  <Icon icon={tl.icon} className="w-4 h-4" style={{ color: tl.color }} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm text-gray-800 truncate group-hover:underline">{r.managerName}</span>
                                  <span className="block text-xs text-gray-500 truncate">{tl[lang]} · {r.startDate === r.endDate ? fmtDate(r.startDate) : `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}`}</span>
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Latest messages */}
            <Card>
              <CardHeader icon="tabler:message-circle" title={hx.messages}
                action={<button onClick={() => setView("chat")} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: NAVY, backgroundColor: LIGHT }}>{hx.openChats}</button>} />
              {!chats ? <SkeletonList rows={2} /> : chats.list.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">{hx.noMessages}</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {chats.list.map((c) => {
                    const mine = c.lastMessage?.senderId && c.lastMessage.senderId === chats.me
                    const p = c.other.presence?.status
                    return (
                      <li key={c.id}>
                        <button onClick={() => nav.openChat(c.other.id)} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-blue-50/30 transition-colors text-left">
                          <span className="relative flex-shrink-0">
                            <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: NAVY }}>{initials(c.other.name)}</span>
                            {p && <span className={clsx("absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
                              p === "available" ? "bg-green-400" : p === "offline" ? "bg-gray-300" : p === "busy" || p === "in_meeting" || p === "not_available" ? "bg-red-400" : "bg-amber-400")} />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center justify-between gap-2">
                              <span className={clsx("text-sm truncate", c.unread ? "font-semibold text-gray-900" : "font-medium text-gray-800")}>{c.other.name}</span>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">{c.lastMessage ? msgTime(c.lastMessage.at, lang, hx) : ""}</span>
                            </span>
                            <span className={clsx("block text-xs truncate", c.unread ? "text-gray-700" : "text-gray-400")}>
                              {mine ? hx.you : ""}{c.lastMessage?.body}
                            </span>
                          </span>
                          {c.unread > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-red-500 flex-shrink-0">{c.unread}</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═════════════════════════ Pieces ═════════════════════════ */

function newSub(k: Kpi, hx: Hx) {
  return k.value ? hx.newWeek(k.value) : ""
}

function msgTime(iso: string, lang: Lang, hx: Hx) {
  const locale = lang === "en" ? "en-GB" : "sv-SE"
  const today = dayKey(new Date().toISOString())
  const yesterday = dayKey(new Date(Date.now() - 86_400_000).toISOString())
  const k = dayKey(iso)
  if (k === today) return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" })
  if (k === yesterday) return lang === "en" ? "Yesterday" : "Igår"
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "Europe/Stockholm" })
}

function Stat({ icon, label, value, sub, onClick, highlight }: { icon: string; label: string; value?: number; sub?: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button onClick={onClick} className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: highlight ? "rgb(254,242,242)" : LIGHT }}>
        <Icon icon={icon} className="w-5 h-5" style={{ color: highlight ? "rgb(220,38,38)" : NAVY }} />
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{value ?? "–"}</div>
      <div className="text-xs text-gray-500 mt-0.5 leading-snug">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-1">{sub}</div>}
    </button>
  )
}

function SubHead({ icon, text, onClick }: { icon: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 mb-2">
      <Icon icon={icon} className="w-3.5 h-3.5" />{text}
    </button>
  )
}

function InterviewLine({ v, lang, hx, onOpen }: { v: AdminHomeInterview; lang: Lang; hx: Hx; onOpen: () => void }) {
  const locale = lang === "en" ? "en-GB" : "sv-SE"
  const k = dayKey(v.startAt)
  const isToday = k === dayKey(new Date().toISOString())
  const day = isToday ? hx.todayWord
    : k === dayKey(new Date(Date.now() + 86_400_000).toISOString()) ? hx.tomorrow
      : new Date(v.startAt).toLocaleDateString(locale, { weekday: "short", day: "numeric", timeZone: "Europe/Stockholm" })
  const time = new Date(v.startAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" })
  return (
    <li className="flex items-center gap-3">
      <div className={clsx("w-[68px] flex-shrink-0 rounded-xl py-1 text-center", isToday ? "bg-blue-50" : "bg-gray-50")}>
        <div className="text-[10px] font-semibold text-gray-500 first-letter:uppercase truncate px-1">{day}</div>
        <div className="text-sm font-bold text-gray-900 tabular-nums">{time}</div>
      </div>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="text-sm font-medium text-gray-800 truncate">{v.name || "—"}</div>
        <div className="text-xs text-gray-500 truncate">{[hx.formats[v.format] ?? v.format, v.position, v.location].filter(Boolean).join(" · ")}</div>
      </button>
      {v.meetingLink && isToday && (
        <a href={v.meetingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: NAVY }}>{hx.join}</a>
      )}
    </li>
  )
}

function ManagerLine({ m, lang, hx, today, fmtDate, onOpen, onChat }: {
  m: ManagerReportRow; lang: Lang; hx: Hx; today: string; fmtDate: (s: string) => string; onOpen: () => void; onChat: () => void
}) {
  const type = m.today.timeOffType ? TYPE_LABELS[m.today.timeOffType] : null
  const ds = DAY_KIND_STYLE[m.today.kind]
  const mine = MY_CONTRACT_LABEL[m.myContract]
  let seen = hx.never
  if (m.lastSeenAt) {
    const k = dayKey(m.lastSeenAt)
    const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${k}T00:00:00Z`)) / 86_400_000)
    seen = diff <= 0 ? hx.todayWord.toLowerCase() : diff === 1 ? (lang === "en" ? "yesterday" : "igår") : fmtDate(m.lastSeenAt)
  }
  return (
    <li className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-blue-50/20">
      <button onClick={onOpen} className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>{initials(m.name)}</span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-gray-800 truncate">{m.name}</span>
          <span className="block text-xs text-gray-400 truncate">
            {[m.department, hx.team(m.team), `${hx.lastSeen}: ${seen}`].filter(Boolean).join(" · ")}
          </span>
        </span>
      </button>
      <span title={lang === "en" ? "Your contract with them" : "Ditt kontrakt med chefen"} className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: mine.color, backgroundColor: mine.bg }}><Icon icon="tabler:file-text" className="w-3 h-3" />{mine[lang]}</span>
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1"
        style={{ color: type ? type.color : ds.color, backgroundColor: type ? type.bg : ds.bg }}>
        <Icon icon={type ? type.icon : ds.icon} className="w-3 h-3" />{type ? type[lang] : ds[lang]}
      </span>
      <button onClick={onChat} aria-label="Chat" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-900 hover:bg-blue-50 flex-shrink-0">
        <Icon icon="tabler:message-circle" className="w-4 h-4" />
      </button>
    </li>
  )
}

function SkeletonList({ rows }: { rows: number }) {
  return (
    <div className="divide-y divide-gray-50 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100" />
          <div className="flex-1 space-y-2"><div className="h-3 w-3/4 bg-gray-100 rounded" /><div className="h-2.5 w-1/3 bg-gray-100 rounded" /></div>
        </div>
      ))}
    </div>
  )
}
