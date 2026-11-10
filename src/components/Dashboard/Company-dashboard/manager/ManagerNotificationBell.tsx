"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  REPLACES your existing ManagerNotificationBell.tsx — keep it where
//                 it is now (only fix the ManagerDashboardContext import path below
//                 if your folder differs).
// WHAT IT DOES:   Manager bell: invitation responses + contracts signed by an employee
//                 that now need the manager's signature (click → opens ManagerContractSign)
//                 + substitute requests ("cover for me" → Accept / Decline right here)
//                 and their answers (accepted / declined / ended)
//                 + FROM THE BUSINESS ADMIN: a contract sent to you (click → My contracts,
//                 signing page; stays until you've signed), the contract completed
//                 (admin signed too), and interviews booked with you (new / moved / cancelled)
//                 + your days-off requests approved / declined (click → My availability)
//                 + your EMPLOYEES' days-off requests (until answered) and sick / VAB they report
//                   (click → Employees → Availability).
// NOTE:           Must be rendered inside ManagerDashboardProvider (it uses useManagerDashboard).
// ══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, X, UserCheck, UserX, ShieldOff, Building2, Calendar, Mail, PenLine, UserCog, FileSignature, FileCheck, CalendarClock, CalendarCheck, CalendarX, Thermometer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useManagerDashboard } from "@/components/Dashboard/Company-dashboard/manager/ManagerDashboardContext"
import {
  DELEGATIONS_CHANGED_EVENT, REASON_LABELS, formatPeriod, getDelegations, respondDelegation, switchWorkspace,
  type Delegation,
} from "@/utils/delegations"
import { myManagerContractsApi, needsMySignature, type ReceivedContract } from "@/utils/myManagerContractsApi"
import { loadInterviewsWithMe, type InterviewWithMe } from "@/utils/interviewsWithMeApi"
import { managerAvailabilityApi, teamAvailabilityApi, timeOffDecisions, TIME_OFF_CHANGED_EVENT, type TeamTimeOffRequest } from "@/utils/myAvailabilityApi"
import { REPORTED_TYPES, TYPE_LABELS, daysLabel, fmtRange, type TimeOffRequest } from "@/utils/managerAvailability"

interface ManagerNotificationBellProps {
  language: "en" | "sv"
}

type InvitationStatus = "pending" | "accepted" | "declined"

interface EmployeeInvitationRow {
  id: string
  employeeEmail: string
  employeeName: string
  status: InvitationStatus
  createdAt: string
  respondedAt?: string | null
  revokedBy?: "manager" | "employee" | null
}

/** Contract signed by the employee, waiting for the manager — from GET /api/company/managers/employee-contracts */
interface ContractAwaitingSignature {
  id: string
  title: string
  employeeName: string
  signedAt: string
}

type NotificationKind = "accepted" | "declined" | "revoked"

const translations = {
  en: {
    notifications: "Notifications",
    noNotifications: "No notifications",
    acceptedTitle: "Invitation accepted",
    acceptedMessage: (name: string) => `${name} accepted your invitation.`,
    declinedTitle: "Invitation declined",
    declinedMessage: (name: string) => `${name} declined your invitation.`,
    revokedTitle: "Access revoked",
    revokedMessage: (name: string) => `${name} has revoked your access to their information.`,
    viewDetailsLabel: "View details",
    dismissBtn: "Dismiss",
    dialogFrom: "Employee",
    dialogSentOn: "Invited",
    dialogRespondedOn: "Responded",
    dialogEmail: "Email",
    closeLabel: "Close",
    contractToSignTitle: "Contract signed — your signature needed",
    contractToSignMessage: (name: string) => `${name} has signed the contract. Sign it to complete it.`,
    signNow: "Sign now",
    employeeFallback: "The employee",
    coverRequestTitle: "Can you cover for a colleague?",
    coverRequestMessage: (name: string) => `${name} asks you to take over their work while they're away.`,
    accept: "Accept",
    decline: "Decline",
    coverAcceptedTitle: "Substitute accepted",
    coverAcceptedMessage: (name: string) => `${name} will cover for you while you're away.`,
    coverDeclinedTitle: "Substitute declined",
    coverDeclinedMessage: (name: string) => `${name} can't cover for you. Choose someone else in Settings → Substitute.`,
    coverStoppedTitle: "Substitute stopped covering",
    coverStoppedMessage: (name: string) => `${name} is no longer covering for you.`,
    ownerBackTitle: "Your cover has ended",
    ownerBackMessage: (name: string) => `${name} is back — you no longer have access to their workspace.`,
    nowCoveringTitle: "You're now covering",
    nowCoveringMessage: (name: string) => `You can work in ${name}'s workspace.`,
    openWorkspace: "Open their workspace",
    myContractTitle: "New contract to sign",
    myContractMessage: (name: string) => `${name} has sent you a contract. Read it and sign.`,
    reviewSign: "Review & sign",
    myContractDoneTitle: "Your contract is complete",
    myContractDoneMessage: (name: string) => `${name} has signed too. You can download the signed PDF.`,
    openContract: "Open contract",
    employerFallback: "Your employer",
    teamRequestTitle: "Days-off request",
    teamRequestMessage: (name: string, type: string, when: string) => `${name} asks for ${type.toLowerCase()} · ${when}`,
    teamReportedTitle: "Reported away",
    teamReportedMessage: (name: string, type: string, when: string) => `${name} reported ${type.toLowerCase()} · ${when}`,
    answerRequest: "Answer",
    viewTeamAvailability: "View availability",
    timeOffApprovedTitle: "Time off approved",
    timeOffDeclinedTitle: "Time off declined",
    timeOffMessage: (type: string, when: string) => `${type} · ${when}`,
    openAvailability: "Open my availability",
    ivBookedTitle: "Interview booked with you",
    ivMovedTitle: "Your interview was moved",
    ivCancelledTitle: "Your interview was cancelled",
    ivMessage: (name: string, when: string) => `With ${name} · ${when}`,
    openInterview: "Open interview",
  },
  sv: {
    notifications: "Notifikationer",
    noNotifications: "Inga notifikationer",
    acceptedTitle: "Inbjudan accepterad",
    acceptedMessage: (name: string) => `${name} accepterade din inbjudan.`,
    declinedTitle: "Inbjudan avböjd",
    declinedMessage: (name: string) => `${name} avböjde din inbjudan.`,
    revokedTitle: "Åtkomst återkallad",
    revokedMessage: (name: string) => `${name} har återkallat din åtkomst till sin information.`,
    viewDetailsLabel: "Visa detaljer",
    dismissBtn: "Avfärda",
    dialogFrom: "Medarbetare",
    dialogSentOn: "Inbjuden",
    dialogRespondedOn: "Besvarad",
    dialogEmail: "E-post",
    closeLabel: "Stäng",
    contractToSignTitle: "Kontrakt signerat — din signatur behövs",
    contractToSignMessage: (name: string) => `${name} har signerat kontraktet. Signera det för att slutföra det.`,
    signNow: "Signera nu",
    employeeFallback: "Medarbetaren",
    coverRequestTitle: "Kan du täcka upp för en kollega?",
    coverRequestMessage: (name: string) => `${name} ber dig ta över hens arbete medan hen är borta.`,
    accept: "Acceptera",
    decline: "Avböj",
    coverAcceptedTitle: "Ställföreträdare accepterade",
    coverAcceptedMessage: (name: string) => `${name} täcker upp för dig medan du är borta.`,
    coverDeclinedTitle: "Ställföreträdare avböjde",
    coverDeclinedMessage: (name: string) => `${name} kan inte täcka upp. Välj någon annan under Inställningar → Ställföreträdare.`,
    coverStoppedTitle: "Ställföreträdaren har slutat",
    coverStoppedMessage: (name: string) => `${name} täcker inte längre upp för dig.`,
    ownerBackTitle: "Ditt uppdrag har avslutats",
    ownerBackMessage: (name: string) => `${name} är tillbaka — du har inte längre åtkomst till hens arbetsyta.`,
    nowCoveringTitle: "Du täcker nu upp",
    nowCoveringMessage: (name: string) => `Du kan arbeta i ${name}s arbetsyta.`,
    openWorkspace: "Öppna arbetsytan",
    myContractTitle: "Nytt kontrakt att signera",
    myContractMessage: (name: string) => `${name} har skickat ett kontrakt till dig. Läs och signera.`,
    reviewSign: "Granska & signera",
    myContractDoneTitle: "Ditt kontrakt är klart",
    myContractDoneMessage: (name: string) => `${name} har också signerat. Du kan ladda ned den signerade PDF:en.`,
    openContract: "Öppna kontrakt",
    employerFallback: "Din arbetsgivare",
    teamRequestTitle: "Ledighetsförfrågan",
    teamRequestMessage: (name: string, type: string, when: string) => `${name} ansöker om ${type.toLowerCase()} · ${when}`,
    teamReportedTitle: "Anmäld frånvaro",
    teamReportedMessage: (name: string, type: string, when: string) => `${name} har anmält ${type.toLowerCase()} · ${when}`,
    answerRequest: "Svara",
    viewTeamAvailability: "Visa tillgänglighet",
    timeOffApprovedTitle: "Ledighet godkänd",
    timeOffDeclinedTitle: "Ledighet nekad",
    timeOffMessage: (type: string, when: string) => `${type} · ${when}`,
    openAvailability: "Öppna min tillgänglighet",
    ivBookedTitle: "Intervju bokad med dig",
    ivMovedTitle: "Din intervju har flyttats",
    ivCancelledTitle: "Din intervju har ställts in",
    ivMessage: (name: string, when: string) => `Med ${name} · ${when}`,
    openInterview: "Öppna intervju",
  },
}

type TFunc = (typeof translations)["en"]

/** Fired by ManagerContractSign after signing, so the bell updates immediately. */
export const CONTRACTS_CHANGED_EVENT = "verocv:contracts-changed"

const DISMISSED_KEY = "mgrDismissedInvitationResponses"
const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000 // only surface responses from the last 14 days

function getDismissedIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addDismissedId(id: string) {
  if (typeof window === "undefined") return
  try {
    const current = getDismissedIds()
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]))
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

/* ─── Substitute (delegation) notices ─── */
type DelegationNoticeKind = "coverAccepted" | "coverDeclined" | "coverStopped" | "ownerBack" | "nowCovering"
interface DelegationNotice { key: string; kind: DelegationNoticeKind; delegation: Delegation; at: string }

const DELEGATION_DISMISSED_KEY = "mgrDismissedDelegationNotices"
function getDismissedDelegationKeys(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(window.localStorage.getItem(DELEGATION_DISMISSED_KEY) ?? "[]") } catch { return [] }
}
function dismissDelegationKey(key: string) {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(DELEGATION_DISMISSED_KEY, JSON.stringify([...getDismissedDelegationKeys(), key])) } catch { /* ignore */ }
}

/** Answers and endings worth telling the manager about (last 14 days, not dismissed). */
function delegationNotices(data: { me: string; outgoing: Delegation | null; incoming: Delegation[]; history: Delegation[] }): DelegationNotice[] {
  const now = Date.now()
  const recent = (at?: string | null) => !!at && now - new Date(at).getTime() < DISMISS_WINDOW_MS
  const dismissed = getDismissedDelegationKeys()
  const out: DelegationNotice[] = []
  const push = (kind: DelegationNoticeKind, d: Delegation, at: string | null) => {
    const key = `${kind}:${d.id}`
    if (at && recent(at) && !dismissed.includes(key)) out.push({ key, kind, delegation: d, at })
  }
  const all = [...(data.outgoing ? [data.outgoing] : []), ...data.incoming, ...data.history]
  for (const d of all) {
    const iAmOwner = d.owner.id === data.me
    if (iAmOwner) {
      if (d.respondedAt && (d.status === "accepted" || d.status === "ended")) push("coverAccepted", d, d.respondedAt)
      if (d.status === "declined") push("coverDeclined", d, d.respondedAt)
      if (d.status === "ended" && d.endedBy === "delegate") push("coverStopped", d, d.endedAt)
    } else {
      if (d.status === "accepted" && d.state === "active") push("nowCovering", d, d.respondedAt)
      if (d.status === "ended" && d.endedBy === "owner") push("ownerBack", d, d.endedAt)
    }
  }
  return out.sort((a, b) => b.at.localeCompare(a.at))
}

/* ─── From the business admin: contracts sent to me + interviews booked with me ─── */
const ADMIN_DISMISSED_KEY = "mgrDismissedFromAdminNotices"
function getDismissedAdminKeys(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(window.localStorage.getItem(ADMIN_DISMISSED_KEY) ?? "[]") } catch { return [] }
}
function dismissAdminKey(key: string) {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(ADMIN_DISMISSED_KEY, JSON.stringify([...getDismissedAdminKeys(), key].slice(-300))) } catch { /* ignore */ }
}

type InterviewNoticeKind = "ivBooked" | "ivMoved" | "ivCancelled"
interface InterviewNotice { key: string; kind: InterviewNoticeKind; interview: InterviewWithMe; at: string }

/** New / moved / cancelled interviews booked with me (last 14 days, not dismissed). */
function interviewNotices(list: InterviewWithMe[]): InterviewNotice[] {
  const now = Date.now()
  const recent = (at?: string | null) => !!at && now - new Date(at).getTime() < DISMISS_WINDOW_MS
  const dismissed = getDismissedAdminKeys()
  const out: InterviewNotice[] = []
  for (const iv of list) {
    let kind: InterviewNoticeKind | null = null
    let at: string | null = null
    if (iv.status === "cancelled" && recent(iv.cancelledAt)) { kind = "ivCancelled"; at = iv.cancelledAt }
    else if (iv.status === "scheduled" && new Date(iv.startAt).getTime() > now) {
      if (iv.rescheduledAt && recent(iv.rescheduledAt)) { kind = "ivMoved"; at = iv.rescheduledAt }
      else if (recent(iv.createdAt)) { kind = "ivBooked"; at = iv.createdAt }
    }
    if (!kind || !at) continue
    // The key includes the time, so a new move / booking shows again after an old one was dismissed.
    const key = `${kind}:${iv.id}:${at}`
    if (!dismissed.includes(key)) out.push({ key, kind, interview: iv, at })
  }
  return out.sort((a, b) => b.at.localeCompare(a.at))
}

/** Opens a dashboard view with a URL parameter the page reads (?contract= / ?interview=). */
function openWithParam(setView: (v: any) => void, view: string, param: string, value: string) {
  const url = new URL(window.location.href)
  for (const k of ["contract", "interview", "mode", "date", "from"]) url.searchParams.delete(k)
  url.searchParams.set(param, value)
  window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
  setView(view)
  // The page may already be open — tell it the URL changed.
  window.dispatchEvent(new PopStateEvent("popstate"))
}

const KIND_META: Record<NotificationKind, { dot: string; iconBg: string; hoverBg: string }> = {
  accepted: { dot: "bg-green-500", iconBg: "rgb(22,163,74)", hoverBg: "hover:bg-green-50/60" },
  declined: { dot: "bg-amber-500", iconBg: "rgb(217,119,6)", hoverBg: "hover:bg-amber-50/60" },
  revoked: { dot: "bg-red-500", iconBg: "rgb(220,38,38)", hoverBg: "hover:bg-red-50/60" },
}

/* ─────────────────────────────────────────────
   DETAILS DIALOG — shared shell for all three invitation notice kinds
───────────────────────────────────────────── */
function NotificationDetailsDialog({
  invitation, kind, t, locale, onClose,
}: {
  invitation: EmployeeInvitationRow
  kind: NotificationKind
  t: TFunc
  locale: string
  onClose: () => void
}) {
  const name = invitation.employeeName || invitation.employeeEmail
  const title = kind === "accepted" ? t.acceptedTitle : kind === "declined" ? t.declinedTitle : t.revokedTitle
  const message = kind === "accepted" ? t.acceptedMessage(name) : kind === "declined" ? t.declinedMessage(name) : t.revokedMessage(name)
  const Icon = kind === "accepted" ? UserCheck : kind === "declined" ? UserX : ShieldOff

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: KIND_META[kind].iconBg }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>

          <div className="rounded-xl bg-gray-50/70 border border-gray-100 p-4 space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 w-[80px] flex-shrink-0">{t.dialogFrom}</span>
              <span className="font-medium text-gray-800">{name}</span>
            </div>
            {invitation.employeeEmail && (
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 w-[80px] flex-shrink-0">{t.dialogEmail}</span>
                <span className="font-medium text-gray-800">{invitation.employeeEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 w-[80px] flex-shrink-0">{t.dialogSentOn}</span>
              <span className="font-medium text-gray-800">
                {new Date(invitation.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            {invitation.respondedAt && (
              <div className="flex items-center gap-2.5 text-sm">
                <span className="text-gray-400 w-[80px] flex-shrink-0 ml-[22px]">{t.dialogRespondedOn}</span>
                <span className="font-medium text-gray-800">
                  {new Date(invitation.respondedAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 bg-gray-50/60 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow-lg transition-all"
            style={{ backgroundColor: "rgb(5,22,80)" }}
          >
            {t.closeLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManagerNotificationBell({ language }: ManagerNotificationBellProps) {
  const { setView, setSelectedContractId } = useManagerDashboard()
  const [accepted, setAccepted] = useState<EmployeeInvitationRow[]>([])
  const [declined, setDeclined] = useState<EmployeeInvitationRow[]>([])
  const [revoked, setRevoked] = useState<EmployeeInvitationRow[]>([])
  const [contractsToSign, setContractsToSign] = useState<ContractAwaitingSignature[]>([])
  const [myContractsToSign, setMyContractsToSign] = useState<ReceivedContract[]>([])
  const [myContractsDone, setMyContractsDone] = useState<ReceivedContract[]>([])
  const [interviewNoticeList, setInterviewNoticeList] = useState<InterviewNotice[]>([])
  const [timeOffAnswers, setTimeOffAnswers] = useState<TimeOffRequest[]>([])
  // From your employees: requests waiting for your answer (stay until answered) + sick / VAB reported
  const [teamRequests, setTeamRequests] = useState<TeamTimeOffRequest[]>([])
  const [teamReported, setTeamReported] = useState<TeamTimeOffRequest[]>([])
  const [coverRequests, setCoverRequests] = useState<Delegation[]>([])
  const [delegationNoticeList, setDelegationNoticeList] = useState<DelegationNotice[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [detailsItem, setDetailsItem] = useState<{ invitation: EmployeeInvitationRow; kind: NotificationKind } | null>(null)

  const isMountedRef = useRef(true)
  const isRefreshingRef = useRef(false)
  const t = translations[language]
  const locale = language === "en" ? "en-US" : "sv-SE"

  const fetchNotifications = useCallback(async () => {
    if (isRefreshingRef.current) return
    try {
      isRefreshingRef.current = true
      const [invitationsRes, contractsRes, delegations, myContracts, withMe, myTimeOff, teamTimeOff] = await Promise.all([
        fetch("/api/company/managers/invitations", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch("/api/company/managers/employee-contracts", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        // Substitute requests are always about the logged-in manager.
        getDelegations().catch(() => null),
        // From the business admin (you are the recipient / candidate).
        myManagerContractsApi.list().catch(() => null),
        loadInterviewsWithMe().catch(() => [] as InterviewWithMe[]),
        managerAvailabilityApi.requests().catch(() => null),
        teamAvailabilityApi.requests("all").catch(() => null),
      ])
      if (!isMountedRef.current) return

      /* ── Invitation responses ── */
      if (invitationsRes.ok) {
        const body = await invitationsRes.json()
        const all: EmployeeInvitationRow[] = body.data ?? []
        const dismissed = getDismissedIds()
        const now = Date.now()
        const inWindow = (respondedAt?: string | null) =>
          !!respondedAt && now - new Date(respondedAt).getTime() < DISMISS_WINDOW_MS

        setAccepted(all.filter((inv) =>
          !dismissed.includes(inv.id) && inv.status === "accepted" && inWindow(inv.respondedAt)))

        // Plain decline of a pending invite — never accepted, no revokedBy set.
        setDeclined(all.filter((inv) =>
          !dismissed.includes(inv.id) && inv.status === "declined" && !inv.revokedBy && inWindow(inv.respondedAt)))

        // Was accepted before; the employee has now cut off access.
        setRevoked(all.filter((inv) =>
          !dismissed.includes(inv.id) && inv.status === "declined" && inv.revokedBy === "employee" && inWindow(inv.respondedAt)))
      }

      /* ── Substitute requests + answers ── */
      if (delegations) {
        setCoverRequests(delegations.incoming.filter((d) => d.state === "pending"))
        setDelegationNoticeList(delegationNotices(delegations))
      }

      /* ── From the business admin ── */
      if (myContracts) {
        const dismissedAdmin = getDismissedAdminKeys()
        const now = Date.now()
        // Waiting for MY signature — stays until I've signed.
        setMyContractsToSign(myContracts.filter(needsMySignature))
        // The admin signed too → complete (last 14 days, dismissable).
        setMyContractsDone(myContracts.filter((c) =>
          c.signedAt && c.managerSignedAt && c.status !== "terminated"
          && now - new Date(c.managerSignedAt).getTime() < DISMISS_WINDOW_MS
          && !dismissedAdmin.includes(`myContractDone:${c.id}`)))
      }
      setInterviewNoticeList(interviewNotices(withMe))
      /* ── Days off: the admin answered (last 14 days, dismissable) ── */
      /* ── Days off from your employees ── */
      if (teamTimeOff) {
        const dismissedAdmin = getDismissedAdminKeys()
        const since = Date.now() - 14 * 24 * 60 * 60 * 1000
        setTeamRequests(teamTimeOff.filter((r) => r.status === "pending"))
        setTeamReported(teamTimeOff.filter((r) =>
          r.status === "approved" && REPORTED_TYPES.includes(r.type) && !r.decidedByName
          && new Date(r.createdAt).getTime() > since && !dismissedAdmin.includes(`teamReported:${r.id}`)))
      }
      if (myTimeOff) {
        const dismissedAdmin = getDismissedAdminKeys()
        setTimeOffAnswers(timeOffDecisions(myTimeOff).filter((r) => !dismissedAdmin.includes(`timeOff:${r.id}:${r.status}`)))
      }

      /* ── Contracts the employee signed — the manager must sign too ──
         These stay until the manager has signed (no manual dismissal). */
      if (contractsRes.ok) {
        const body = await contractsRes.json()
        const docs: any[] = body.docs ?? []
        setContractsToSign(
          docs
            // Employee signed, manager hasn't — also catches contracts stored as "active"
            // before two-party signing existed.
            .filter((d) => d.signedAt && !d.managerSignedAt && d.status !== "terminated")
            .map((d) => ({
              id: String(d.id),
              title: d.title ?? "",
              employeeName: d.signedByName || d.employeeName || "",
              signedAt: d.signedAt,
            })),
        )
      }
    } catch {
      // silent — bell just stays quiet on failure
    } finally {
      if (isMountedRef.current) setIsLoading(false)
      isRefreshingRef.current = false
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    // Refresh right away when the manager comes back to the tab, and when a
    // contract changes in this app (e.g. ManagerContractSign after signing).
    const onFocus = () => fetchNotifications()
    window.addEventListener("focus", onFocus)
    window.addEventListener(CONTRACTS_CHANGED_EVENT, onFocus)
    window.addEventListener(DELEGATIONS_CHANGED_EVENT, onFocus)
    window.addEventListener(TIME_OFF_CHANGED_EVENT, onFocus)
    return () => {
      window.removeEventListener(TIME_OFF_CHANGED_EVENT, onFocus)
      window.removeEventListener(DELEGATIONS_CHANGED_EVENT, onFocus)
      isMountedRef.current = false
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener(CONTRACTS_CHANGED_EVENT, onFocus)
    }
  }, [fetchNotifications])

  // Always show fresh data when the bell is opened.
  const handleOpenChange = (open: boolean) => {
    setIsDropdownOpen(open)
    if (open) fetchNotifications()
  }

  const dismiss = useCallback((id: string, kind: NotificationKind) => {
    addDismissedId(id)
    if (kind === "accepted") setAccepted((prev) => prev.filter((inv) => inv.id !== id))
    else if (kind === "declined") setDeclined((prev) => prev.filter((inv) => inv.id !== id))
    else setRevoked((prev) => prev.filter((inv) => inv.id !== id))
  }, [])

  /** Opens ManagerContractSign: ManagerContracts picks up selectedContractId. */
  const openContractToSign = (id: string) => {
    setIsDropdownOpen(false)
    setSelectedContractId(id)
    setView("contracts")
  }

  const answerCoverRequest = async (id: string, action: "accept" | "decline") => {
    setRespondingId(id)
    try {
      await respondDelegation(id, action) // also fires DELEGATIONS_CHANGED_EVENT → refetch
      setCoverRequests((prev) => prev.filter((d) => d.id !== id))
    } catch {
      // leave it in the list so they can retry
    } finally {
      if (isMountedRef.current) setRespondingId(null)
    }
  }

  const dismissDelegationNotice = (key: string) => {
    dismissDelegationKey(key)
    setDelegationNoticeList((prev) => prev.filter((n) => n.key !== key))
  }

  const openMyContract = (id: string) => {
    setIsDropdownOpen(false)
    openWithParam(setView, "my_contracts", "contract", id)
  }
  const openMyInterview = (n: InterviewNotice) => {
    setIsDropdownOpen(false)
    dismissAdminKey(n.key)
    setInterviewNoticeList((prev) => prev.filter((x) => x.key !== n.key))
    openWithParam(setView, "interviews", "interview", n.interview.id)
  }
  const dismissMyContractDone = (id: string) => {
    dismissAdminKey(`myContractDone:${id}`)
    setMyContractsDone((prev) => prev.filter((c) => c.id !== id))
  }
  /** Employees → Availability (on the Requests tab for a request). */
  const openTeamAvailability = (requests: boolean) => {
    setIsDropdownOpen(false)
    const url = new URL(window.location.href)
    if (requests) url.searchParams.set("availability", "requests")
    else url.searchParams.delete("availability")
    window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    setView("availability")
    window.dispatchEvent(new PopStateEvent("popstate"))
  }
  const dismissTeamReported = (r: TeamTimeOffRequest) => {
    dismissAdminKey(`teamReported:${r.id}`)
    setTeamReported((prev) => prev.filter((x) => x.id !== r.id))
  }
  const dismissTimeOff = (r: TimeOffRequest) => {
    dismissAdminKey(`timeOff:${r.id}:${r.status}`)
    setTimeOffAnswers((prev) => prev.filter((x) => x.id !== r.id))
  }
  const openTimeOff = (r: TimeOffRequest) => {
    setIsDropdownOpen(false)
    dismissTimeOff(r)
    setView("my_availability")
  }
  const dismissInterviewNotice = (key: string) => {
    dismissAdminKey(key)
    setInterviewNoticeList((prev) => prev.filter((x) => x.key !== key))
  }

  const totalCount = accepted.length + declined.length + revoked.length + contractsToSign.length
    + coverRequests.length + delegationNoticeList.length
    + myContractsToSign.length + myContractsDone.length + interviewNoticeList.length + timeOffAnswers.length
    + teamRequests.length + teamReported.length
  const hasAnyNotification = totalCount > 0

  if (isLoading && totalCount === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  const openDetails = (invitation: EmployeeInvitationRow, kind: NotificationKind) => {
    setDetailsItem({ invitation, kind })
    setIsDropdownOpen(false)
  }

  const sections: { kind: NotificationKind; rows: EmployeeInvitationRow[]; title: string; message: (name: string) => string }[] = [
    { kind: "accepted", rows: accepted, title: t.acceptedTitle, message: t.acceptedMessage },
    { kind: "declined", rows: declined, title: t.declinedTitle, message: t.declinedMessage },
    { kind: "revoked", rows: revoked, title: t.revokedTitle, message: t.revokedMessage },
  ]

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {totalCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
              >
                {totalCount > 99 ? "99+" : totalCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
          <div className="p-2">
            <h3 className="font-semibold text-sm mb-2">{t.notifications}</h3>

            {!hasAnyNotification && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t.noNotifications}</p>
              </div>
            )}

            {/* From the business admin: a contract waiting for YOUR signature (stays until signed) */}
            {myContractsToSign.map((c) => (
              <button key={`my-contract-${c.id}`} onClick={() => openMyContract(c.id)}
                className="w-full text-left p-3 rounded-md transition-colors bg-amber-50/50 hover:bg-amber-50 mb-1">
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-amber-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                      <FileSignature className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      {t.myContractTitle}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{t.myContractMessage(c.senderName || c.companyName || t.employerFallback)}</p>
                    {c.title && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{c.title}</p>}
                    <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>{t.reviewSign} →</p>
                  </div>
                </div>
              </button>
            ))}

            {/* From the business admin: your contract is complete */}
            {myContractsDone.map((c) => (
              <div key={`my-contract-done-${c.id}`} className="group relative rounded-md hover:bg-green-50/60">
                <button onClick={() => { dismissMyContractDone(c.id); openMyContract(c.id) }} className="w-full text-left p-3">
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-green-500" />
                    <div className="flex-1 min-w-0 pr-5">
                      <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        {t.myContractDoneTitle}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{t.myContractDoneMessage(c.senderName || c.companyName || t.employerFallback)}</p>
                      {c.title && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{c.title}</p>}
                      <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>{t.openContract} →</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => dismissMyContractDone(c.id)} aria-label={t.dismissBtn}
                  className="absolute top-2.5 right-2 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* From your employees: days-off requests (stay until you answer) */}
            {teamRequests.map((r) => (
              <div key={`team-req-${r.id}`} className="relative rounded-md hover:bg-amber-50/60">
                <button onClick={() => openTeamAvailability(true)} className="w-full text-left p-3">
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />{t.teamRequestTitle}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {t.teamRequestMessage(r.managerName, TYPE_LABELS[r.type]?.[language] ?? "", `${fmtRange(r, language)} · ${daysLabel(r.workingDays, language)}`)}
                      </p>
                      {r.coveringFor && <p className="text-[11px] text-amber-700 mt-0.5">{language === "en" ? `${r.coveringFor.name}'s team` : `${r.coveringFor.name}s team`}</p>}
                      {r.note && <p className="text-[11px] text-gray-500 mt-1 italic line-clamp-2">“{r.note}”</p>}
                      <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>{t.answerRequest} →</p>
                    </div>
                  </div>
                </button>
              </div>
            ))}

            {/* From your employees: sick / VAB reported (dismissable) */}
            {teamReported.map((r) => (
              <div key={`team-rep-${r.id}`} className="group relative rounded-md hover:bg-rose-50/60">
                <button onClick={() => { dismissTeamReported(r); openTeamAvailability(false) }} className="w-full text-left p-3">
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-rose-500" />
                    <div className="flex-1 min-w-0 pr-5">
                      <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />{t.teamReportedTitle}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {t.teamReportedMessage(r.managerName, TYPE_LABELS[r.type]?.[language] ?? "", fmtRange(r, language))}
                      </p>
                      <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>{t.viewTeamAvailability} →</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => dismissTeamReported(r)} aria-label={t.dismissBtn}
                  className="absolute top-2.5 right-2 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* From the business admin: answers to your days-off requests */}
            {timeOffAnswers.map((r) => {
              const ok = r.status === "approved"
              const Ico = ok ? CalendarCheck : CalendarX
              return (
                <div key={`timeoff-${r.id}`} className={`group relative rounded-md ${ok ? "hover:bg-green-50/60" : "hover:bg-red-50/60"}`}>
                  <button onClick={() => openTimeOff(r)} className="w-full text-left p-3">
                    <div className="flex items-start gap-3 w-full">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ok ? "bg-green-500" : "bg-red-500"}`} />
                      <div className="flex-1 min-w-0 pr-5">
                        <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                          <Ico className={`w-3.5 h-3.5 flex-shrink-0 ${ok ? "text-green-600" : "text-red-600"}`} />
                          {ok ? t.timeOffApprovedTitle : t.timeOffDeclinedTitle}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{t.timeOffMessage(TYPE_LABELS[r.type]?.[language] ?? "", fmtRange(r, language))}</p>
                        {r.decisionNote && <p className="text-[11px] text-gray-500 mt-1 italic line-clamp-2">“{r.decisionNote}”</p>}
                        <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>{t.openAvailability} →</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => dismissTimeOff(r)} aria-label={t.dismissBtn}
                    className="absolute top-2.5 right-2 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}

            {/* From the business admin: interviews booked with you */}
            {interviewNoticeList.map((n) => {
              const iv = n.interview
              const when = new Date(iv.startAt).toLocaleString(locale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
              const [title, dot] = n.kind === "ivBooked" ? [t.ivBookedTitle, "bg-violet-500"]
                : n.kind === "ivMoved" ? [t.ivMovedTitle, "bg-amber-500"] : [t.ivCancelledTitle, "bg-red-500"]
              return (
                <div key={n.key} className="group relative rounded-md hover:bg-violet-50/60">
                  <button onClick={() => openMyInterview(n)} className="w-full text-left p-3">
                    <div className="flex items-start gap-3 w-full">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                      <div className="flex-1 min-w-0 pr-5">
                        <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                          {title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{t.ivMessage(iv.withMe.bookedBy || t.employerFallback, when)}</p>
                        {iv.position && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{iv.position}</p>}
                        <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>{t.openInterview} →</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => dismissInterviewNotice(n.key)} aria-label={t.dismissBtn}
                    className="absolute top-2.5 right-2 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}

            {/* Substitute requests — need an answer, so they come first */}
            {coverRequests.map((d) => (
              <div key={`cover-${d.id}`} className="p-3 rounded-md bg-blue-50/50 mb-1">
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "rgb(5,22,80)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                      <UserCog className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgb(5,22,80)" }} />
                      {t.coverRequestTitle}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{t.coverRequestMessage(d.owner.name || d.owner.email)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {REASON_LABELS[d.reason]?.[language] ?? ""} · {formatPeriod(d, language)}
                    </p>
                    {d.message && <p className="text-[11px] text-gray-500 mt-1 italic line-clamp-2">“{d.message}”</p>}
                    <div className="flex gap-2 mt-2.5">
                      <button onClick={() => answerCoverRequest(d.id, "accept")} disabled={respondingId === d.id}
                        className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
                        style={{ backgroundColor: "rgb(5,22,80)" }}>
                        {t.accept}
                      </button>
                      <button onClick={() => answerCoverRequest(d.id, "decline")} disabled={respondingId === d.id}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50">
                        {t.decline}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Substitute answers / endings */}
            {delegationNoticeList.map((n) => {
              const other = n.kind === "nowCovering" || n.kind === "ownerBack" ? n.delegation.owner : n.delegation.delegate
              const name = other.name || other.email
              const copy = {
                coverAccepted: [t.coverAcceptedTitle, t.coverAcceptedMessage(name), "bg-green-500"],
                coverDeclined: [t.coverDeclinedTitle, t.coverDeclinedMessage(name), "bg-amber-500"],
                coverStopped: [t.coverStoppedTitle, t.coverStoppedMessage(name), "bg-red-500"],
                ownerBack: [t.ownerBackTitle, t.ownerBackMessage(name), "bg-gray-400"],
                nowCovering: [t.nowCoveringTitle, t.nowCoveringMessage(name), "bg-green-500"],
              }[n.kind]
              return (
                <div key={n.key} className="group relative p-3 rounded-md hover:bg-gray-50">
                  <div className="flex items-start gap-3 w-full">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${copy[2]}`} />
                    <div className="flex-1 min-w-0 pr-5">
                      <p className="font-medium text-sm text-gray-800">{copy[0]}</p>
                      <p className="text-xs text-gray-600 mt-1">{copy[1]}</p>
                      {n.kind === "nowCovering" && (
                        <button onClick={() => { dismissDelegationNotice(n.key); switchWorkspace(n.delegation.owner.id) }}
                          className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>
                          {t.openWorkspace} →
                        </button>
                      )}
                    </div>
                  </div>
                  <button onClick={() => dismissDelegationNotice(n.key)} aria-label={t.dismissBtn}
                    className="absolute top-2.5 right-2 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}

            {/* Contracts waiting for the manager's signature — most important, shown first */}
            {contractsToSign.map((c) => (
              <button
                key={`contract-${c.id}`}
                onClick={() => openContractToSign(c.id)}
                className="w-full text-left p-3 rounded-md transition-colors hover:bg-violet-50/70"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-violet-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                      <PenLine className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                      {t.contractToSignTitle}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t.contractToSignMessage(c.employeeName || t.employeeFallback)}
                    </p>
                    {c.title && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{c.title}</p>}
                    <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>
                      {t.signNow} →
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {sections.map(({ kind, rows, title, message }) =>
              rows.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => openDetails(inv, kind)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${KIND_META[kind].hoverBg}`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${KIND_META[kind].dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800">{title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {message(inv.employeeName || inv.employeeEmail)}
                      </p>
                      <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>
                        {t.viewDetailsLabel} →
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {detailsItem && (
        <NotificationDetailsDialog
          invitation={detailsItem.invitation}
          kind={detailsItem.kind}
          t={t}
          locale={locale}
          onClose={() => {
            dismiss(detailsItem.invitation.id, detailsItem.kind)
            setDetailsItem(null)
          }}
        />
      )}
    </>
  )
}
