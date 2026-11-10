"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/AdminNotificationBell.tsx   (REPLACE — adds days off)
// WHAT IT DOES:   The business admin's bell (same look as the manager bell):
//   • Contract signed by a manager — your signature needed  → opens Managers → Contracts
//     and the signing page (stays until you've signed)
//   • New employee in a manager's team                      → employee page
//   • Employee left a manager's team (removed access)       → employee page
//   • Substitute started / ended between your managers      → manager profile
//   • Days-off request from a manager (stays until answered) → Manager availability → Requests
//   • A manager reported sick / VAB                         → Manager availability
//   Dismissed notices are remembered in this browser. Refreshes every 30 s, when the
//   tab gets focus, when the bell is opened, and after a contract changes.
// NOTE:           Must be rendered inside BusinessAdminProvider (it uses useBusinessAdmin).
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, X, PenLine, UserPlus, UserMinus, UserCog, UserCheck, CalendarClock, Thermometer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useBusinessAdmin } from "./Businessadmincontext"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import type { AdminNotice, AdminNoticeKind } from "@/utils/adminNotifications"
import { TYPE_LABELS, daysLabel, fmtRange, type HalfDay, type TimeOffType } from "@/utils/managerAvailability"
import { TIME_OFF_CHANGED_EVENT } from "@/utils/myAvailabilityApi"

/** Fired after signing a contract (ManagerContractSign) — the bell refreshes right away. */
const CONTRACTS_CHANGED_EVENT = "verocv:contracts-changed"
const DISMISSED_KEY = "adminDismissedNotices"
const NAVY = "rgb(5,22,80)"

const translations = {
  en: {
    notifications: "Notifications",
    noNotifications: "No notifications",
    dismiss: "Dismiss",
    contractTitle: "Contract signed — your signature needed",
    contractMessage: (n: string) => `${n} has signed the contract. Sign it to complete it.`,
    signNow: "Sign now",
    joinedTitle: "New employee",
    joinedMessage: (e: string, m: string) => `${e} joined ${m}'s team.`,
    leftTitle: "Employee left a team",
    leftMessage: (e: string, m: string) => `${e} removed ${m}'s access to their information.`,
    coverStartedTitle: "Substitute started",
    coverStartedMessage: (s: string, m: string) => `${s} is covering for ${m}.`,
    coverEndedTitle: "Substitute ended",
    coverEndedMessage: (s: string, m: string) => `${s} no longer covers for ${m}.`,
    viewEmployee: "View employee",
    viewManager: "View manager",
    someone: "Someone",
    manager: "a manager",
    timeOffTitle: "Days-off request",
    timeOffMessage: (m: string, type: string) => `${m} asks for ${type.toLowerCase()}.`,
    reportedTitle: "Reported away",
    reportedMessage: (m: string, type: string) => `${m} reported: ${type.toLowerCase()}.`,
    answer: "Answer",
    viewAvailability: "View availability",
  },
  sv: {
    notifications: "Notifikationer",
    noNotifications: "Inga notifikationer",
    dismiss: "Avfärda",
    contractTitle: "Kontrakt signerat — din signatur behövs",
    contractMessage: (n: string) => `${n} har signerat kontraktet. Signera det för att slutföra det.`,
    signNow: "Signera nu",
    joinedTitle: "Ny medarbetare",
    joinedMessage: (e: string, m: string) => `${e} har gått med i ${m}s team.`,
    leftTitle: "Medarbetare lämnade ett team",
    leftMessage: (e: string, m: string) => `${e} har tagit bort ${m}s åtkomst till sin information.`,
    coverStartedTitle: "Ställföreträdare började",
    coverStartedMessage: (s: string, m: string) => `${s} täcker upp för ${m}.`,
    coverEndedTitle: "Ställföreträdare avslutad",
    coverEndedMessage: (s: string, m: string) => `${s} täcker inte längre upp för ${m}.`,
    viewEmployee: "Visa medarbetare",
    viewManager: "Visa chef",
    someone: "Någon",
    manager: "en chef",
    timeOffTitle: "Ledighetsförfrågan",
    timeOffMessage: (m: string, type: string) => `${m} ansöker om ${type.toLowerCase()}.`,
    reportedTitle: "Anmäld frånvaro",
    reportedMessage: (m: string, type: string) => `${m} har anmält: ${type.toLowerCase()}.`,
    answer: "Svara",
    viewAvailability: "Visa tillgänglighet",
  },
}

const KIND_META: Record<AdminNoticeKind, { dot: string; hover: string; Icon: typeof Bell; iconColor: string }> = {
  contract_to_sign: { dot: "bg-violet-500", hover: "hover:bg-violet-50/70", Icon: PenLine, iconColor: "text-violet-600" },
  employee_joined: { dot: "bg-green-500", hover: "hover:bg-green-50/60", Icon: UserPlus, iconColor: "text-green-600" },
  employee_left: { dot: "bg-red-500", hover: "hover:bg-red-50/60", Icon: UserMinus, iconColor: "text-red-600" },
  cover_started: { dot: "bg-blue-500", hover: "hover:bg-blue-50/60", Icon: UserCog, iconColor: "text-blue-700" },
  cover_ended: { dot: "bg-gray-400", hover: "hover:bg-gray-50", Icon: UserCheck, iconColor: "text-gray-500" },
  time_off_request: { dot: "bg-amber-500", hover: "hover:bg-amber-50/60", Icon: CalendarClock, iconColor: "text-amber-600" },
  time_off_reported: { dot: "bg-rose-500", hover: "hover:bg-rose-50/60", Icon: Thermometer, iconColor: "text-rose-600" },
}

function getDismissed(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(window.localStorage.getItem(DISMISSED_KEY) ?? "[]") } catch { return [] }
}
function addDismissed(key: string) {
  if (typeof window === "undefined") return
  try {
    // Keep the list short — notices older than 14 days never come back anyway.
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...getDismissed(), key].slice(-300)))
  } catch { /* private browsing etc. */ }
}

export default function AdminNotificationBell() {
  const { language } = useBusinessAdminTranslations()
  const t = translations[language === "en" ? "en" : "sv"]
  const locale = language === "en" ? "en-GB" : "sv-SE"
  const { openManagerContract, openEmployeeProfile, openManagerProfile, setView } = useBusinessAdmin()
  const router = useRouter()
  const pathname = usePathname()

  const [notices, setNotices] = useState<AdminNotice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const mounted = useRef(true)
  const busy = useRef(false)

  const fetchNotices = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      const res = await fetch("/api/company/admin/notifications", { cache: "no-store", credentials: "include" })
      if (!res.ok || !mounted.current) return
      const body = await res.json()
      const dismissed = getDismissed()
      setNotices(((body.data ?? []) as AdminNotice[]).filter((n) => n.persistent || !dismissed.includes(n.key)))
    } catch {
      // the bell just stays quiet
    } finally {
      busy.current = false
      if (mounted.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    fetchNotices()
    const interval = setInterval(fetchNotices, 30_000)
    const refresh = () => fetchNotices()
    window.addEventListener("focus", refresh)
    window.addEventListener(CONTRACTS_CHANGED_EVENT, refresh)
    window.addEventListener(TIME_OFF_CHANGED_EVENT, refresh)
    return () => {
      window.removeEventListener(TIME_OFF_CHANGED_EVENT, refresh)
      mounted.current = false
      clearInterval(interval)
      window.removeEventListener("focus", refresh)
      window.removeEventListener(CONTRACTS_CHANGED_EVENT, refresh)
    }
  }, [fetchNotices])

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) fetchNotices()
  }

  const dismiss = (key: string) => {
    addDismissed(key)
    setNotices((prev) => prev.filter((n) => n.key !== key))
  }

  /** Opens the target page; a non-persistent notice is dismissed once acted on. */
  const act = (n: AdminNotice) => {
    setOpen(false)
    if (!n.persistent) dismiss(n.key)
    if (n.kind === "time_off_request" || n.kind === "time_off_reported") {
      // Manager availability reads ?availability=requests to open on the Requests tab.
      const url = new URL(window.location.href)
      if (n.kind === "time_off_request") url.searchParams.set("availability", "requests")
      else url.searchParams.delete("availability")
      window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
      setView("availability")
      window.dispatchEvent(new PopStateEvent("popstate"))
    } else if (n.kind === "contract_to_sign" && n.contractId) openManagerContract(n.contractId)
    else if ((n.kind === "employee_joined" || n.kind === "employee_left") && n.employeeId) openEmployeeProfile(n.employeeId)
    else if (n.managerId) openManagerProfile(n.managerId)
    // Settings pages are separate routes — come back to the dashboard (same as the sidebar does).
    if (!pathname.endsWith("/business-admin")) router.push("/companies/company-dashboard/business-admin")
  }

  const copy = (n: AdminNotice): { title: string; message: string; action: string } => {
    const m = n.managerName || t.manager
    switch (n.kind) {
      case "contract_to_sign": return { title: t.contractTitle, message: t.contractMessage(n.managerName || t.someone), action: t.signNow }
      case "employee_joined": return { title: t.joinedTitle, message: t.joinedMessage(n.employeeName || t.someone, m), action: t.viewEmployee }
      case "employee_left": return { title: t.leftTitle, message: t.leftMessage(n.employeeName || t.someone, m), action: t.viewEmployee }
      case "cover_started": return { title: t.coverStartedTitle, message: t.coverStartedMessage(n.substituteName || t.someone, m), action: t.viewManager }
      case "cover_ended": return { title: t.coverEndedTitle, message: t.coverEndedMessage(n.substituteName || t.someone, m), action: t.viewManager }
      case "time_off_request":
      case "time_off_reported": {
        const lang = language === "en" ? "en" : "sv"
        const type = TYPE_LABELS[n.timeOffType as TimeOffType]?.[lang] ?? ""
        const when = n.startDate && n.endDate
          ? ` ${fmtRange({ startDate: n.startDate, endDate: n.endDate, halfDay: (n.halfDay ?? "none") as HalfDay }, lang)} · ${daysLabel(n.workingDays ?? 0, lang)}`
          : ""
        return n.kind === "time_off_request"
          ? { title: t.timeOffTitle, message: `${t.timeOffMessage(m, type)}${when}`, action: t.answer }
          : { title: t.reportedTitle, message: `${t.reportedMessage(m, type)}${when}`, action: t.viewAvailability }
      }
    }
  }

  const total = notices.length

  if (isLoading && total === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled aria-label={t.notifications}>
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={total ? `${t.notifications} (${total})` : t.notifications}>
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs">
              {total > 99 ? "99+" : total}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <div className="p-2">
          <h3 className="font-semibold text-sm mb-2">{t.notifications}</h3>

          {total === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t.noNotifications}</p>
            </div>
          )}

          {notices.map((n) => {
            const meta = KIND_META[n.kind]
            const c = copy(n)
            return (
              <div key={n.key} className={`group relative rounded-md transition-colors ${meta.hover}`}>
                <button onClick={() => act(n)} className="w-full text-left p-3">
                  <div className="flex items-start gap-3 w-full">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.dot}`} />
                    <div className={`flex-1 min-w-0 ${n.persistent ? "" : "pr-5"}`}>
                      <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                        <meta.Icon className={`w-3.5 h-3.5 flex-shrink-0 ${meta.iconColor}`} />
                        {c.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{c.message}</p>
                      {n.contractTitle && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{n.contractTitle}</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(n.at).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs font-semibold mt-2" style={{ color: NAVY }}>{c.action} →</p>
                    </div>
                  </div>
                </button>
                {!n.persistent && (
                  <button onClick={() => dismiss(n.key)} aria-label={t.dismiss} title={t.dismiss}
                    className="absolute top-2.5 right-2 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
