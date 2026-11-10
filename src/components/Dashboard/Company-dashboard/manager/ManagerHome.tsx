"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/ManagerHome.tsx   (REPLACE — same folder as ManagerDashboardContext)
// WHAT IT DOES:   Manager → Dashboard → Home.
//   Left:  • My team    — every employee: contract status, CVs (+ last updated), portfolio;
//                         the ones needing something first (replaces "Snabbåtgärder")
//          • Employee administration (unchanged)
//   Right (NEW — replaces "Consulting requests" and "Recently updated CVs"):
//     • Today      — my status today + team numbers (employees, invitations, contracts, interviews)
//     • To do      — contracts to sign / countersign, interviews without an outcome, contracts
//                    ending soon, waiting contracts / invitations, answers to my days-off requests
//     • Interviews — the next 7 days (incl. interviews my business admin booked with me)
// API:            GET /api/company/managers/home
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerDashboard } from "./ManagerDashboardContext"
import { useManagerTranslations } from "@/utils/Managertranslations"
import type { ManagerView } from "./ManagerDashboardContext"
import { DAY_KIND_STYLE, TYPE_LABELS, type TimeOffType } from "@/utils/managerAvailability"
import type { HomeInterview, HomeMember, HomeTodo, ManagerHomeData, MemberContract } from "@/utils/managerHome"

/* ─── Types ─── */
type InvitationStatus = "pending" | "accepted" | "declined"

interface EmployeeInvitationRow {
  id: string
  employeeEmail: string
  employeeName: string
  status: InvitationStatus
  createdAt: string
}


/* ─── Constants ─── */
const NAVY = "rgb(5,22,80)"
const NAVY_LIGHTER = "rgb(239,246,255)"

const statusStyles: Record<InvitationStatus, { bg: string; text: string; border: string; dot: string }> = {
  accepted: { bg: "rgb(240,253,244)", text: "rgb(22,101,52)", border: "rgb(187,247,208)", dot: "rgb(34,197,94)" },
  declined: { bg: "rgb(254,242,242)", text: "rgb(153,27,27)", border: "rgb(254,202,202)", dot: "rgb(239,68,68)" },
  pending: { bg: "rgb(255,251,235)", text: "rgb(146,64,14)", border: "rgb(253,230,138)", dot: "rgb(245,158,11)" },
}

const statusFallbackLabel: Record<InvitationStatus, string> = {
  accepted: "Accepted",
  declined: "Declined",
  pending: "Pending",
}

/* ─── Shared sub-components ─── */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={clsx("bg-white rounded-2xl border border-gray-200 shadow-sm", className)}>{children}</div>
)

const CardHeader: React.FC<{ icon: string; title: string; action?: React.ReactNode }> = ({ icon, title, action }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}><Icon icon={icon} className="w-5 h-5 text-white" /></div>
      <h2 className="text-lg font-bold" style={{ color: NAVY }}>{title}</h2>
    </div>
    {action}
  </div>
)

/* ─── Main component — no language prop, reads from hook ─── */
const ManagerHome: React.FC = () => {
  const { setView, setSelectedContractId, openChat } = useManagerDashboard()
  const { t, language } = useManagerTranslations()
  const lang: Lang = language === "en" ? "en" : "sv"
  const hx = HX[lang]

  const [invitations, setInvitations] = useState<EmployeeInvitationRow[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(true)

  const [home, setHome] = useState<ManagerHomeData | null>(null)
  const [homeError, setHomeError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/company/managers/invitations")
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const body = await res.json()
        if (!cancelled) setInvitations((body.data ?? []).slice(0, 5))
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoadingInvitations(false) })
    return () => { cancelled = true }
  }, [])

  const loadHome = useCallback(() => {
    fetch("/api/company/managers/home", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        setHome((await res.json()).data)
        setHomeError(false)
      })
      .catch(() => setHomeError(true))
  }, [])
  useEffect(() => {
    loadHome()
    // Refresh when coming back to the tab, and after contracts / days off change elsewhere.
    const again = () => loadHome()
    window.addEventListener("focus", again)
    window.addEventListener("verocv:contracts-changed", again)
    window.addEventListener("verocv:time-off-changed", again)
    return () => {
      window.removeEventListener("focus", again)
      window.removeEventListener("verocv:contracts-changed", again)
      window.removeEventListener("verocv:time-off-changed", again)
    }
  }, [loadHome])

  /* Where each to-do goes */
  const openTodo = (td: HomeTodo) => {
    switch (td.kind) {
      case "sign_my_contract": {
        const url = new URL(window.location.href)
        if (td.contractId) url.searchParams.set("contract", td.contractId)
        window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
        setView("my_contracts")
        window.dispatchEvent(new PopStateEvent("popstate"))
        return
      }
      case "countersign":
      case "contract_expiring":
        if (td.contractId) setSelectedContractId(td.contractId)
        setView("contracts")
        return
      case "waiting_employee":
        setView("contracts")
        return
      case "interview_outcome":
        setView("interviews")
        return
      case "invites_pending":
        setView("invitation")
        return
      case "time_off_answered":
        setView("my_availability")
        return
      case "team_time_off": {
        const url = new URL(window.location.href)
        url.searchParams.set("availability", "requests")
        window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
        setView("availability")
        return
      }
    }
  }

  const initials = (name: string, email: string) => {
    const source = name?.trim() || email
    const parts = source.split(" ")
    return parts.length > 1 ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() : source.slice(0, 2).toUpperCase()
  }

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4 min-h-screen">

      {/* Welcome */}
      <div className="mb-6 text-center mx-auto w-full md:w-[80%] lg:w-[60%]">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.welcomeTitle}</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">{t.welcomeSubtitle}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">

        {/* ── LEFT 60% ── */}
        <div className="w-full lg:w-[60%] space-y-4 sm:space-y-6 flex-grow">

          {/* My team — who needs something (replaces the old quick-actions card) */}
          <TeamCard members={home?.members ?? null} lang={lang} hx={hx} setView={setView}
            onContract={(id) => { setSelectedContractId(id); setView("contracts") }}
            onChat={(id) => openChat(id)} />

          {/* Employee Administration — real invitations, no fake role/status editing */}
          <Card>
            <CardHeader icon="tabler:users-group" title={t.employeeAdminTitle}
              action={
                <button onClick={() => setView("administration")}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:shadow-md hover:scale-105"
                  style={{ backgroundColor: "rgb(20,184,166)" }}>
                  <Icon icon="tabler:plus" className="w-5 h-5" />
                </button>
              }
            />
            <div className="grid grid-cols-12 gap-1.5 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 text-[9px] sm:text-xs font-semibold tracking-wide sm:tracking-widest uppercase text-gray-400 bg-gray-50/70 border-b border-gray-100">
              <div className="col-span-6 sm:col-span-7">{t.nameCol}</div>
              <div className="col-span-3">{t.statusCol}</div>
              <div className="col-span-3 sm:col-span-2">{"Sent"}</div>
            </div>

            {loadingInvitations && (
              <div className="py-10 flex items-center justify-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            )}

            {!loadingInvitations && invitations.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-400 px-4">{t.noEmployeesFound ?? "No employees invited yet."}</div>
            )}

            {!loadingInvitations && invitations.map((inv, i) => {
              const ss = statusStyles[inv.status]
              return (
                <div key={inv.id} className={clsx("grid grid-cols-12 gap-1.5 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 items-center hover:bg-blue-50/20 transition-colors", i < invitations.length - 1 && "border-b border-gray-50")}>
                  <div className="col-span-6 sm:col-span-7 flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                      {initials(inv.employeeName, inv.employeeEmail)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">{inv.employeeName || inv.employeeEmail}</div>
                      <div className="text-[10px] sm:text-xs text-gray-400 truncate">{inv.employeeEmail}</div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-semibold border whitespace-nowrap"
                      style={{ color: ss.text, backgroundColor: ss.bg, borderColor: ss.border }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ss.dot }} />
                      {(t[inv.status as keyof typeof t] as string) || statusFallbackLabel[inv.status]}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-[10px] sm:text-xs text-gray-400 truncate">
                    {new Date(inv.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                </div>
              )
            })}

            <div className="px-4 sm:px-6 py-4 border-t border-gray-50">
              <button onClick={() => setView("administration")} className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70" style={{ color: NAVY }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style={{ backgroundColor: "rgb(20,184,166)" }}>
                  <Icon icon="tabler:plus" className="w-4 h-4" />
                </div>
                {t.addEmployee}
              </button>
            </div>
          </Card>
        </div>

        {/* ── RIGHT 40% — what to see first ── */}
        <div className="w-full lg:w-[40%] space-y-4 sm:space-y-6 flex-grow">
          {homeError && !home ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-gray-500 mb-3">{hx.loadFailed}</p>
              <button onClick={loadHome} className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: NAVY }}>{hx.retry}</button>
            </Card>
          ) : !home ? (
            <>
              <Card className="h-40 animate-pulse"><span className="sr-only">{hx.loading}</span></Card>
              <Card className="h-64 animate-pulse"><span /></Card>
              <Card className="h-56 animate-pulse"><span /></Card>
            </>
          ) : (
            <>
              <TodayCard home={home} lang={lang} hx={hx} setView={setView} />
              <TodoCard todos={home.todos} lang={lang} hx={hx} onOpen={openTodo} />
              <InterviewsCard items={home.interviews} lang={lang} hx={hx} setView={setView} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManagerHome

/* ═════════════════════════ Right column ═════════════════════════ */

type Lang = "sv" | "en"

const HX = {
  sv: {
    loading: "Laddar…", loadFailed: "Kunde inte ladda översikten.", retry: "Försök igen",
    today: "Idag", you: "Du", employees: "Medarbetare", invites: "Väntande inbjudningar", contracts: "Aktiva kontrakt", interviews: "Intervjuer (7 d)",
    changeStatus: "Ändra",
    todo: "Att göra", allDone: "Allt är klart — inget väntar på dig.", showAll: (n: number) => `Visa alla (${n})`, showLess: "Visa färre",
    levels: { high: "Gör nu", medium: "Följ upp", low: "Bra att veta" },
    upcoming: "Kommande intervjuer", noInterviews: "Inga intervjuer de närmaste 7 dagarna.", book: "Boka intervju", all: "Alla intervjuer",
    withMe: "Med dig", bookedBy: (n: string) => `Bokad av ${n}`, join: "Anslut", todayWord: "Idag", tomorrow: "Imorgon",
    formats: { video: "Video", phone: "Telefon", in_person: "På plats" } as Record<string, string>,
    myTeam: "Mitt team", myTeamDesc: "Vem behöver något från dig?", invite: "Bjud in", seeAllEmployees: "Visa alla medarbetare",
    noTeam: "Inga medarbetare ännu. Bjud in din första medarbetare.", fNoContract: "Utan kontrakt", fToSign: "Att signera", fNoCv: "Utan CV", fAll: "Alla",
    noMatch: "Ingen medarbetare här — bra jobbat!", cvCount: (n: number) => `${n} CV`, noCv: "Inget CV", noAccess: "Ingen åtkomst",
    updated: (d: string) => `uppd. ${d}`, joined: (d: string) => `Med sedan ${d}`, chat: "Chatta", openContract: "Öppna kontrakt",
    contract: {
      none: "Inget kontrakt", draft: "Utkast", awaiting_employee: "Väntar på medarbetaren", awaiting_me: "Du ska signera",
      active: "Aktivt kontrakt", ending: "Slutar snart", ended: "Avslutat", terminated: "Uppsagt",
    } as Record<MemberContract, string>,
  },
  en: {
    loading: "Loading…", loadFailed: "Couldn't load the overview.", retry: "Try again",
    today: "Today", you: "You", employees: "Employees", invites: "Pending invitations", contracts: "Active contracts", interviews: "Interviews (7 d)",
    changeStatus: "Change",
    todo: "To do", allDone: "All done — nothing is waiting for you.", showAll: (n: number) => `Show all (${n})`, showLess: "Show less",
    levels: { high: "Act now", medium: "Follow up", low: "Good to know" },
    upcoming: "Upcoming interviews", noInterviews: "No interviews in the next 7 days.", book: "Book interview", all: "All interviews",
    withMe: "With you", bookedBy: (n: string) => `Booked by ${n}`, join: "Join", todayWord: "Today", tomorrow: "Tomorrow",
    formats: { video: "Video", phone: "Phone", in_person: "In person" } as Record<string, string>,
    myTeam: "My team", myTeamDesc: "Who needs something from you?", invite: "Invite", seeAllEmployees: "See all employees",
    noTeam: "No employees yet. Invite your first employee.", fNoContract: "No contract", fToSign: "To sign", fNoCv: "No CV", fAll: "All",
    noMatch: "No one here — nice work!", cvCount: (n: number) => `${n} CV${n === 1 ? "" : "s"}`, noCv: "No CV", noAccess: "No access",
    updated: (d: string) => `upd. ${d}`, joined: (d: string) => `Joined ${d}`, chat: "Chat", openContract: "Open contract",
    contract: {
      none: "No contract", draft: "Draft", awaiting_employee: "Waiting for employee", awaiting_me: "You to sign",
      active: "Active contract", ending: "Ending soon", ended: "Ended", terminated: "Terminated",
    } as Record<MemberContract, string>,
  },
}
type Hx = (typeof HX)["sv"]

const LEVEL_STYLE = {
  high: { color: "rgb(185,28,28)", bg: "rgb(254,242,242)" },
  medium: { color: "rgb(146,64,14)", bg: "rgb(255,251,235)" },
  low: { color: "rgb(30,64,175)", bg: "rgb(239,246,255)" },
} as const

const fmtDay = (iso: string, lang: Lang) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString(lang === "en" ? "en-GB" : "sv-SE", { day: "numeric", month: "short", timeZone: "Europe/Stockholm" })

function todoCopy(td: HomeTodo, lang: Lang): { icon: string; text: string; sub?: string } {
  const E = lang === "en"
  const n = td.count ?? 0
  const name = td.name || (E ? "An employee" : "En medarbetare")
  switch (td.kind) {
    case "sign_my_contract":
      return { icon: "tabler:signature", text: E ? "A contract is waiting for your signature" : "Ett kontrakt väntar på din signatur", sub: td.title }
    case "countersign":
      return { icon: "tabler:pencil-check", text: E ? `${name} signed — sign to complete the contract` : `${name} har signerat — signera för att slutföra kontraktet`, sub: td.title }
    case "interview_outcome":
      return { icon: "tabler:clipboard-check", text: E ? `${n} interview${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} an outcome` : `${n} intervju${n === 1 ? "" : "er"} saknar resultat`, sub: n === 1 && td.name ? td.name : undefined }
    case "contract_expiring":
      return { icon: "tabler:calendar-due", text: E ? `${name}'s contract ends ${fmtDay(td.at!, lang)}` : `${name}s kontrakt slutar ${fmtDay(td.at!, lang)}`, sub: td.title }
    case "waiting_employee":
      return { icon: "tabler:hourglass", text: E ? `${n} contract${n === 1 ? "" : "s"} waiting 7+ days for the employee` : `${n} kontrakt har väntat på medarbetaren i 7+ dagar` }
    case "invites_pending":
      return { icon: "tabler:mail-question", text: E ? `${n} invitation${n === 1 ? "" : "s"} unanswered for 7+ days` : `${n} ${n === 1 ? "inbjudan" : "inbjudningar"} obesvarade i 7+ dagar` }
    case "team_time_off":
      return { icon: "tabler:calendar-question", text: E ? `${n} days-off request${n === 1 ? "" : "s"} from your employees` : `${n} ${n === 1 ? "ledighetsförfrågan" : "ledighetsförfrågningar"} från dina medarbetare` }
    case "time_off_answered": {
      const type = TYPE_LABELS[td.title as TimeOffType]?.[lang] ?? ""
      const ok = td.status === "approved"
      return {
        icon: ok ? "tabler:calendar-check" : "tabler:calendar-x",
        text: E ? `Your ${type.toLowerCase()} from ${fmtDay(td.at!, lang)} was ${ok ? "approved" : "declined"}` : `Din ${type.toLowerCase()} från ${fmtDay(td.at!, lang)} blev ${ok ? "godkänd" : "nekad"}`,
        sub: td.note ? `“${td.note}”` : undefined,
      }
    }
  }
}

function TodayCard({ home, lang, hx, setView }: { home: ManagerHomeData; lang: Lang; hx: Hx; setView: (v: ManagerView) => void }) {
  const type = home.today.timeOffType ? TYPE_LABELS[home.today.timeOffType] : null
  const ds = DAY_KIND_STYLE[home.today.kind]
  const date = new Date(`${home.today.date}T12:00:00Z`).toLocaleDateString(lang === "en" ? "en-GB" : "sv-SE", { weekday: "long", day: "numeric", month: "long" })
  const stats: { label: string; value: number; icon: string; view: ManagerView }[] = [
    { label: hx.employees, value: home.team.employees, icon: "tabler:users", view: "employee_profiles" },
    { label: hx.invites, value: home.team.pendingInvites, icon: "tabler:mail", view: "invitation" },
    { label: hx.contracts, value: home.team.activeContracts, icon: "tabler:file-certificate", view: "contracts" },
    { label: hx.interviews, value: home.team.interviewsThisWeek, icon: "tabler:calendar-user", view: "interviews" },
  ]
  return (
    <Card>
      <CardHeader icon="tabler:sun" title={hx.today} action={<span className="text-xs text-gray-400 first-letter:uppercase">{date}</span>} />
      <div className="px-4 sm:px-6 py-4">
        <button onClick={() => setView("my_availability")}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 text-left transition-colors">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: type ? type.bg : ds.bg }}>
            <Icon icon={type ? type.icon : ds.icon} className="w-4 h-4" style={{ color: type ? type.color : ds.color }} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs text-gray-400">{hx.you}</span>
            <span className="block text-sm font-semibold text-gray-800 truncate">
              {type ? type[lang] : ds[lang]}{home.today.hours ? ` · ${home.today.hours}` : ""}
            </span>
            {home.today.statusNote && <span className="block text-xs text-gray-500 truncate">{home.today.statusNote}</span>}
          </span>
          <span className="text-xs font-semibold" style={{ color: NAVY }}>{hx.changeStatus}</span>
        </button>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {stats.map((s) => (
            <button key={s.label} onClick={() => setView(s.view)}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-blue-50/60 text-left transition-colors">
              <Icon icon={s.icon} className="w-4 h-4 flex-shrink-0" style={{ color: NAVY }} />
              <span className="min-w-0">
                <span className="block text-lg font-bold text-gray-900 leading-tight tabular-nums">{s.value}</span>
                <span className="block text-[11px] text-gray-500 truncate">{s.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

function TodoCard({ todos, lang, hx, onOpen }: { todos: HomeTodo[]; lang: Lang; hx: Hx; onOpen: (t: HomeTodo) => void }) {
  const [all, setAll] = useState(false)
  const shown = all ? todos : todos.slice(0, 5)
  return (
    <Card>
      <CardHeader icon="tabler:checklist" title={hx.todo}
        action={todos.length > 0 ? <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2 py-0.5">{todos.length}</span> : undefined} />
      {todos.length === 0 ? (
        <div className="py-10 px-6 text-center">
          <Icon icon="tabler:circle-check" className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm text-gray-500">{hx.allDone}</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {shown.map((td) => {
            const c = todoCopy(td, lang)
            const st = LEVEL_STYLE[td.level]
            return (
              <li key={td.key}>
                <button onClick={() => onOpen(td)} className="w-full text-left px-4 sm:px-6 py-3 flex items-center gap-3 hover:bg-gray-50/80 group">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: st.bg }}>
                    <Icon icon={c.icon} className="w-4 h-4" style={{ color: st.color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-800">{c.text}</span>
                    <span className="flex items-center gap-2 mt-0.5 min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wide flex-shrink-0" style={{ color: st.color }}>{hx.levels[td.level]}</span>
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
      {todos.length > 5 && (
        <button onClick={() => setAll((v) => !v)} className="w-full py-2.5 text-xs font-semibold border-t border-gray-100 hover:bg-gray-50" style={{ color: NAVY }}>
          {all ? hx.showLess : hx.showAll(todos.length)}
        </button>
      )}
    </Card>
  )
}

function InterviewsCard({ items, lang, hx, setView }: { items: HomeInterview[]; lang: Lang; hx: Hx; setView: (v: ManagerView) => void }) {
  const locale = lang === "en" ? "en-GB" : "sv-SE"
  const dayKey = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date(iso))
  const today = dayKey(new Date().toISOString())
  const tomorrow = dayKey(new Date(Date.now() + 86_400_000).toISOString())
  const dayLabel = (iso: string) => {
    const k = dayKey(iso)
    if (k === today) return hx.todayWord
    if (k === tomorrow) return hx.tomorrow
    return new Date(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", timeZone: "Europe/Stockholm" })
  }
  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" })
  const fmtIcon: Record<string, string> = { video: "tabler:video", phone: "tabler:phone", in_person: "tabler:map-pin" }

  return (
    <Card>
      <CardHeader icon="tabler:calendar-event" title={hx.upcoming}
        action={
          <button onClick={() => setView("interviews")} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: NAVY, backgroundColor: NAVY_LIGHTER }}>
            {hx.all}
          </button>
        } />
      {items.length === 0 ? (
        <div className="py-10 px-6 text-center">
          <Icon icon="tabler:calendar-off" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500 mb-3">{hx.noInterviews}</p>
          <button onClick={() => setView("interviews")} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: NAVY }}>{hx.book}</button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {items.slice(0, 6).map((v) => {
            const isToday = dayKey(v.startAt) === today
            return (
              <li key={`${v.withMe ? "w" : "m"}${v.id}`} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                <div className={clsx("w-[68px] flex-shrink-0 rounded-xl py-1.5 text-center", v.withMe ? "bg-purple-50" : isToday ? "bg-blue-50" : "bg-gray-50")}>
                  <div className={clsx("text-[10px] font-semibold first-letter:uppercase truncate px-1", v.withMe ? "text-purple-700" : "text-gray-500")}>{dayLabel(v.startAt)}</div>
                  <div className={clsx("text-sm font-bold tabular-nums", v.withMe ? "text-purple-800" : "text-gray-900")}>{time(v.startAt)}</div>
                </div>
                <button onClick={() => setView("interviews")} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {v.withMe ? (v.position || hx.withMe) : v.name || "—"}
                    </span>
                    {v.withMe && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">{hx.withMe}</span>}
                  </div>
                  <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <Icon icon={fmtIcon[v.format] ?? "tabler:calendar"} className="w-3 h-3 flex-shrink-0" />
                    {[hx.formats[v.format] ?? v.format, v.withMe ? (v.name ? hx.bookedBy(v.name) : "") : v.position, v.location].filter(Boolean).join(" · ")}
                  </div>
                </button>
                {v.meetingLink && isToday && (
                  <a href={v.meetingLink} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: v.withMe ? "rgb(126,34,206)" : NAVY }}>
                    {hx.join}
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

const CONTRACT_STYLE: Record<MemberContract, { color: string; bg: string; icon: string }> = {
  none: { color: "rgb(185,28,28)", bg: "rgb(254,242,242)", icon: "tabler:file-off" },
  draft: { color: "rgb(146,64,14)", bg: "rgb(255,251,235)", icon: "tabler:file-pencil" },
  awaiting_employee: { color: "rgb(146,64,14)", bg: "rgb(255,251,235)", icon: "tabler:hourglass" },
  awaiting_me: { color: "rgb(109,40,217)", bg: "rgb(245,243,255)", icon: "tabler:signature" },
  active: { color: "rgb(22,101,52)", bg: "rgb(240,253,244)", icon: "tabler:file-check" },
  ending: { color: "rgb(146,64,14)", bg: "rgb(255,251,235)", icon: "tabler:calendar-due" },
  ended: { color: "rgb(100,116,139)", bg: "rgb(248,250,252)", icon: "tabler:file-x" },
  terminated: { color: "rgb(100,116,139)", bg: "rgb(248,250,252)", icon: "tabler:file-x" },
}

type TeamFilter = "all" | "no_contract" | "to_sign" | "no_cv"

function TeamCard({ members, lang, hx, setView, onContract, onChat }: {
  members: HomeMember[] | null; lang: Lang; hx: Hx; setView: (v: ManagerView) => void
  onContract: (id: string) => void; onChat: (id: string) => void
}) {
  const [filter, setFilter] = useState<TeamFilter>("all")
  const [all, setAll] = useState(false)
  const list = members ?? []
  const counts = {
    no_contract: list.filter((m) => m.contract === "none" || m.contract === "draft" || m.contract === "ended" || m.contract === "terminated").length,
    to_sign: list.filter((m) => m.contract === "awaiting_me").length,
    no_cv: list.filter((m) => m.cvs === 0).length,
  }
  const shown = list.filter((m) =>
    filter === "all" ? true
      : filter === "no_contract" ? ["none", "draft", "ended", "terminated"].includes(m.contract)
        : filter === "to_sign" ? m.contract === "awaiting_me"
          : m.cvs === 0)
  const visible = all ? shown : shown.slice(0, 6)
  const date = (iso: string) => fmtDay(iso, lang)

  return (
    <Card>
      <CardHeader icon="tabler:users" title={hx.myTeam}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setView("invitation")} title={hx.invite} aria-label={hx.invite}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:shadow-md hover:scale-105" style={{ backgroundColor: "rgb(20,184,166)" }}>
              <Icon icon="tabler:user-plus" className="w-4 h-4" />
            </button>
          </div>
        } />
      {!members ? (
        <div className="divide-y divide-gray-50 animate-pulse">
          {[0, 1, 2].map((i) => <div key={i} className="px-6 py-4 flex gap-3"><div className="w-9 h-9 rounded-full bg-gray-100" /><div className="flex-1 space-y-2"><div className="h-3 w-1/2 bg-gray-100 rounded" /><div className="h-2.5 w-1/3 bg-gray-100 rounded" /></div></div>)}
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 px-6 text-center">
          <Icon icon="tabler:users-plus" className="w-9 h-9 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500 mb-3">{hx.noTeam}</p>
          <button onClick={() => setView("invitation")} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: NAVY }}>{hx.invite}</button>
        </div>
      ) : (
        <>
          {/* Filters with counts — shows at a glance what's missing */}
          <div className="px-4 sm:px-6 pt-3 pb-1 flex gap-1.5 flex-wrap">
            {([
              ["all", hx.fAll, list.length],
              ["to_sign", hx.fToSign, counts.to_sign],
              ["no_contract", hx.fNoContract, counts.no_contract],
              ["no_cv", hx.fNoCv, counts.no_cv],
            ] as [TeamFilter, string, number][]).map(([k, label, n]) => (
              <button key={k} onClick={() => { setFilter(k); setAll(false) }}
                className={clsx("px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                  filter === k ? "text-white border-transparent" : "text-gray-600 border-gray-200 bg-white hover:border-blue-200")}
                style={filter === k ? { backgroundColor: NAVY } : {}}>
                {label}
                <span className={clsx("min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                  filter === k ? "bg-white/20 text-white" : k !== "all" && n > 0 ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500")}>{n}</span>
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">{hx.noMatch}</p>
          ) : (
            <ul className="divide-y divide-gray-50 mt-2">
              {visible.map((m) => {
                const cs = CONTRACT_STYLE[m.contract]
                return (
                  <li key={m.id} className="px-4 sm:px-6 py-3 flex items-center gap-3 hover:bg-blue-50/20">
                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                      {m.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?"}
                    </span>
                    <button onClick={() => setView("employee_profiles")} className="min-w-0 flex-1 text-left">
                      <span className="block text-sm font-medium text-gray-800 truncate">{m.name}</span>
                      <span className="block text-xs text-gray-400 truncate">
                        {m.cvs === null ? hx.noAccess : m.cvs === 0 ? hx.noCv : `${hx.cvCount(m.cvs)}${m.lastCvAt ? ` · ${hx.updated(date(m.lastCvAt))}` : ""}`}
                        {m.joinedAt ? ` · ${hx.joined(date(m.joinedAt))}` : ""}
                      </span>
                    </button>
                    <button onClick={() => (m.contractId ? onContract(m.contractId) : setView("contracts"))}
                      title={m.contract === "ending" && m.contractEndsAt ? date(m.contractEndsAt) : hx.openContract}
                      className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap hover:opacity-80"
                      style={{ color: cs.color, backgroundColor: cs.bg }}>
                      <Icon icon={cs.icon} className="w-3 h-3" />
                      {hx.contract[m.contract]}{m.contract === "ending" && m.contractEndsAt ? ` ${date(m.contractEndsAt)}` : ""}
                    </button>
                    <span className="sm:hidden w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cs.color }} title={hx.contract[m.contract]} />
                    <button onClick={() => onChat(m.id)} aria-label={hx.chat} title={hx.chat}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-900 hover:bg-blue-50 flex-shrink-0">
                      <Icon icon="tabler:message-circle" className="w-4 h-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="px-4 sm:px-6 py-3 border-t border-gray-50 flex items-center justify-between gap-3 flex-wrap">
            {shown.length > 6 ? (
              <button onClick={() => setAll((v) => !v)} className="text-xs font-semibold" style={{ color: NAVY }}>
                {all ? hx.showLess : hx.showAll(shown.length)}
              </button>
            ) : <span />}
            <button onClick={() => setView("employee_profiles")} className="text-xs font-semibold flex items-center gap-1" style={{ color: NAVY }}>
              {hx.seeAllEmployees}<Icon icon="tabler:arrow-right" className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </Card>
  )
}
