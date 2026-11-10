// FILE LOCATION:  src/components/Common/notification-bell.tsx   (REPLACE)
// NEW: "Ledighet godkänd / nekad" — when a manager answers the employee's days-off request.
//      Click → the Availability page. Shown for 14 days or until clicked.
"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { interviewNotices, listMyInterviews, markInterviewsSeen, type InterviewNotice } from "@/utils/Myinterviewsapi"
import { notifyManagerAccessChanged } from "@/hooks/useManagerAccess"
import { Bell, Check, X, Mail, Building2, ShieldCheck, User, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import VerificationDialog from "./verification-dialog"
import type { DashboardLanguage } from "@/hooks/useDashboardTranslation"
import AccessRevokedDialog from "../shared/Accessrevokeddialog"
import { useEmployeeTimeOffAnswers } from "@/utils/myAvailabilityApi"
import { TYPE_LABELS, type TimeOffRequest } from "@/utils/managerAvailability"

interface NotificationBellProps {
  userId: string
  language?: DashboardLanguage
}

interface VerificationStatus {
  recoveryEmailVerified: boolean
  hasPersonalInfo: boolean
  recoveryEmail?: string
  authType?: string
  requiresVerification?: boolean
}

type AccessLevel = "full" | "cv_only" | "portfolio_only"

interface Invitation {
  id: string
  bossName: string
  companyName: string
  status: "pending" | "accepted" | "declined"
  createdAt: string
  accessLevel?: AccessLevel // not always present on older/simpler invitations — treated as "full" when missing

  // Optional snapshot of the inviting manager's profile + their note, taken
  // from manager-info at invite time. Only renders if the backend actually
  // populates these on the invitation record — safe to omit otherwise.
  personalMessage?: string
  bossJobTitle?: string
  bossDepartment?: string

  // Set when a manager revokes their own access to an already-accepted
  // connection (status flips back to "declined" with this marker attached,
  // rather than a genuine decline of a pending invite).
  respondedAt?: string
  revokedBy?: "manager" | "employee"
}

// A contract sent to this user that still needs their signature —
// from GET /api/user/contracts, filtered on the client.
interface PendingContract {
  id: string
  title: string
  companyName: string
  managerName: string
  signingMethod: "bankid" | "verocv" | null
  status: string
  signedAt: string | null
  managerSignedAt: string | null
}

const translations = {
  en: {
    notifications: "Notifications",
    emailVerificationRequired: "Email Verification Required",
    verifyEmailMessage: "Please verify your email address to secure your account",
    noNotifications: "No notifications",
    invitationTitle: "Invitation from your boss",
    invitationMessage: (boss: string, company: string) =>
      company ? `${boss} from ${company} wants to view your portfolio.` : `${boss} wants to view your portfolio.`,
    accept: "Accept",
    decline: "Decline",
    invitationAccepted: "Invitation accepted",
    invitationDeclined: "Invitation declined",
    respondFailed: "Failed to respond. Please try again.",
    reviewInvitation: "Review invitation",
    dialogTitle: "Invitation details",
    dialogFrom: "From",
    dialogCompany: "Company",
    dialogSentOn: "Sent on",
    dialogAccessTitle: "If you accept, they will be able to see:",
    dialogNoCompany: "No company listed",
    dialogPersonalMessage: "Personal message",
    accessCvs: "CVs & templates",
    accessPortfolio: "Portfolio",
    accessPersonalInfo: "Personal information",
    accessStats: "Work stats",
    accessAvailability: "Availability",
    accessCertifications: "Certifications",
    accessLevelFull: "Full access",
    accessLevelCv: "CVs only",
    accessLevelPortfolio: "Portfolio only",
    dialogRevokeNote: "You can revoke this access at any time from your settings, even after accepting.",
    confirmAccept: "Accept invitation",
    confirmDecline: "Decline invitation",
    cancelLabel: "Cancel",
    connectionEndedTitle: "Connection ended",
    connectionEndedMessage: (boss: string) => `${boss} no longer has access to your information.`,
    dismissBtn: "Dismiss",
    viewDetailsLabel: "View details",
    contractToSignTitle: "Contract to sign",
    contractToSignMessage: (from: string) => `${from} sent you an employment contract to sign.`,
    contractFromFallback: "Your employer",
    reviewContract: "Review contract",
    contractCompleteTitle: "Contract complete",
    contractCompleteMessage: (from: string) => `${from} has also signed your contract. It's now complete and sealed.`,
    viewContract: "View contract",
    interviewBookedTitle: "Interview booked",
    interviewMovedTitle: "Interview moved",
    interviewCancelledTitle: "Interview cancelled",
    interviewMessage: (position: string, when: string) => `${position} — ${when}`,
    interviewMovedMessage: (position: string, from: string, to: string) => `${position}: moved from ${from} to ${to}.`,
    interviewCancelledMessage: (position: string, when: string) => `${position} on ${when} has been cancelled.`,
    viewInterview: "View interview",
    timeOffApprovedTitle: "Time off approved",
    timeOffDeclinedTitle: "Time off declined",
    timeOffMessage: (type: string, dates: string, by: string) => `${type} ${dates}${by ? ` — answered by ${by}` : ""}`,
    viewAvailability: "View availability",
  },
  sv: {
    notifications: "Notifikationer",
    emailVerificationRequired: "E-postverifiering Krävs",
    verifyEmailMessage: "Vänligen verifiera din e-postadress för att säkra ditt konto",
    noNotifications: "Inga notifikationer",
    invitationTitle: "Inbjudan från din chef",
    invitationMessage: (boss: string, company: string) =>
      company ? `${boss} från ${company} vill se ditt portfolio.` : `${boss} vill se ditt portfolio.`,
    accept: "Acceptera",
    decline: "Avböj",
    invitationAccepted: "Inbjudan accepterad",
    invitationDeclined: "Inbjudan avböjd",
    respondFailed: "Kunde inte svara. Försök igen.",
    reviewInvitation: "Granska inbjudan",
    dialogTitle: "Inbjudningsdetaljer",
    dialogFrom: "Från",
    dialogCompany: "Företag",
    dialogSentOn: "Skickad",
    dialogAccessTitle: "Om du accepterar kommer de att kunna se:",
    dialogNoCompany: "Inget företag angivet",
    dialogPersonalMessage: "Personligt meddelande",
    accessCvs: "CV:n & mallar",
    accessPortfolio: "Portfolio",
    accessPersonalInfo: "Personlig information",
    accessStats: "Arbetsstatistik",
    accessAvailability: "Tillgänglighet",
    accessCertifications: "Certifieringar",
    accessLevelFull: "Full åtkomst",
    accessLevelCv: "Endast CV:n",
    accessLevelPortfolio: "Endast portfolio",
    dialogRevokeNote: "Du kan återkalla denna åtkomst när som helst från dina inställningar, även efter att du accepterat.",
    confirmAccept: "Acceptera inbjudan",
    confirmDecline: "Avböj inbjudan",
    cancelLabel: "Avbryt",
    connectionEndedTitle: "Anslutning avslutad",
    connectionEndedMessage: (boss: string) => `${boss} har inte längre åtkomst till din information.`,
    dismissBtn: "Avfärda",
    viewDetailsLabel: "Visa detaljer",
    contractToSignTitle: "Kontrakt att signera",
    contractToSignMessage: (from: string) => `${from} har skickat ett anställningsavtal till dig att signera.`,
    contractFromFallback: "Din arbetsgivare",
    reviewContract: "Granska kontraktet",
    contractCompleteTitle: "Kontraktet är klart",
    contractCompleteMessage: (from: string) => `${from} har också signerat ditt kontrakt. Det är nu klart och förseglat.`,
    viewContract: "Visa kontraktet",
    interviewBookedTitle: "Intervju bokad",
    interviewMovedTitle: "Intervju flyttad",
    interviewCancelledTitle: "Intervju inställd",
    interviewMessage: (position: string, when: string) => `${position} — ${when}`,
    interviewMovedMessage: (position: string, from: string, to: string) => `${position}: flyttad från ${from} till ${to}.`,
    interviewCancelledMessage: (position: string, when: string) => `${position} den ${when} har ställts in.`,
    viewInterview: "Visa intervjun",
    timeOffApprovedTitle: "Ledighet godkänd",
    timeOffDeclinedTitle: "Ledighet nekad",
    timeOffMessage: (type: string, dates: string, by: string) => `${type} ${dates}${by ? ` — besvarad av ${by}` : ""}`,
    viewAvailability: "Visa tillgänglighet",
  },
}

type TFunc = (typeof translations)["en"]

/* Which access items each level unlocks — used to render the checklist in the details dialog */
const ACCESS_ITEMS: Record<AccessLevel, (keyof Pick<TFunc,
  "accessCvs" | "accessPortfolio" | "accessPersonalInfo" | "accessStats" | "accessAvailability" | "accessCertifications"
>)[]> = {
  full: ["accessCvs", "accessPortfolio", "accessPersonalInfo", "accessStats", "accessAvailability", "accessCertifications"],
  cv_only: ["accessCvs", "accessCertifications"],
  portfolio_only: ["accessPortfolio"],
}

const ACCESS_LEVEL_LABEL_KEY: Record<AccessLevel, keyof Pick<TFunc,
  "accessLevelFull" | "accessLevelCv" | "accessLevelPortfolio"
>> = {
  full: "accessLevelFull",
  cv_only: "accessLevelCv",
  portfolio_only: "accessLevelPortfolio",
}

/* ─── "Connection ended" dismissal tracking ───
   There's no notifications/read-tracking collection backing this yet, so
   dismissal is stored client-side per browser. Once a real notifications
   mechanism exists, this whole block should be replaced by a server-tracked
   read/dismissed flag instead. */
const DISMISSED_KEY = "dismissedEndedConnections"
const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000 // only surface revokes from the last 14 days

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

/* "Contract complete" notices are dismissed the same way (per browser). */
const DISMISSED_COMPLETED_KEY = "dismissedCompletedContracts"

function getDismissedCompleted(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(DISMISSED_COMPLETED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addDismissedCompleted(id: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(DISMISSED_COMPLETED_KEY, JSON.stringify([...getDismissedCompleted(), id]))
  } catch {
    // ignore storage errors
  }
}

/* ─────────────────────────────────────────────
   INVITATION DETAILS DIALOG — shown before the person accepts/declines,
   so they know exactly who is asking and what access they'd be granting.
───────────────────────────────────────────── */
function InvitationDetailsDialog({
  invitation, t, locale, onAccept, onDecline, onClose, responding,
}: {
  invitation: Invitation
  t: TFunc
  locale: string
  onAccept: () => void
  onDecline: () => void
  onClose: () => void
  responding: boolean
}) {
  const level: AccessLevel = invitation.accessLevel ?? "full"
  const items = ACCESS_ITEMS[level]
  const levelLabel = t[ACCESS_LEVEL_LABEL_KEY[level]]
  const bossRole = [invitation.bossJobTitle, invitation.bossDepartment].filter(Boolean).join(" · ")

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgb(5,22,80)" }}>
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-gray-900">{t.dialogTitle}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="rounded-xl bg-gray-50/70 border border-gray-100 p-4 space-y-2.5">
            <div className="flex items-start gap-2.5 text-sm">
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-400 w-[68px] flex-shrink-0">{t.dialogFrom}</span>
              <div>
                <span className="font-medium text-gray-800">{invitation.bossName || "—"}</span>
                {bossRole && <p className="text-xs text-gray-500 mt-0.5">{bossRole}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 w-[68px] flex-shrink-0">{t.dialogCompany}</span>
              <span className="font-medium text-gray-800">{invitation.companyName || t.dialogNoCompany}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <span className="text-gray-400 w-[68px] flex-shrink-0 ml-[22px]">{t.dialogSentOn}</span>
              <span className="font-medium text-gray-800">
                {new Date(invitation.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {invitation.personalMessage && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Quote className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgb(5,22,80)" }} />
                <p className="text-xs font-semibold text-gray-700">{t.dialogPersonalMessage}</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{invitation.personalMessage}</p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: "rgb(5,22,80)" }} />
              <p className="text-xs font-semibold text-gray-700">{t.dialogAccessTitle}</p>
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgb(239,246,255)", color: "rgb(5,22,80)" }}>
                {levelLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((key) => (
                <div key={key} className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-blue-50/60 rounded-lg px-2.5 py-2">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgb(22,101,52)" }} />
                  {t[key]}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">{t.dialogRevokeNote}</p>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex-shrink-0">
          <button onClick={onDecline} disabled={responding}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all">
            <X className="w-4 h-4" />
            {t.confirmDecline}
          </button>
          <button onClick={onAccept} disabled={responding}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
            style={{ backgroundColor: "rgb(22,163,74)" }}>
            {responding
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Check className="w-4 h-4" />}
            {t.confirmAccept}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NotificationBell({ userId, language = "en" }: NotificationBellProps) {
  const router = useRouter()
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [endedConnections, setEndedConnections] = useState<Invitation[]>([])
  const [pendingContracts, setPendingContracts] = useState<PendingContract[]>([])
  const [completedContracts, setCompletedContracts] = useState<PendingContract[]>([])
  const [interviewNoticeList, setInterviewNoticeList] = useState<InterviewNotice[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [detailsInvitation, setDetailsInvitation] = useState<Invitation | null>(null)
  const [revokedDetails, setRevokedDetails] = useState<Invitation | null>(null)

  // Days-off requests your manager approved / declined (last 14 days) — refreshes on its own.
  const { answers: timeOffAnswers, dismiss: dismissTimeOffAnswer } = useEmployeeTimeOffAnswers()

  const isMountedRef = useRef(true)
  const isRefreshingRef = useRef(false)
  const t = translations[language]
  const locale = language === "en" ? "en-US" : "sv-SE"

  // Memoized fetch function to prevent recreating on every render
  const fetchVerificationStatus = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isRefreshingRef.current) {
      console.log('🔄 Fetch already in progress, skipping...')
      return
    }

    try {
      isRefreshingRef.current = true
      setIsLoading(true)

      const [verificationRes, invitationsRes, contractsRes, myInterviews] = await Promise.all([
        fetch('/api/user/verification-status', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch('/api/user/invitations', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch('/api/user/contracts', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }),
        // Interviews booked with this user (new / moved / cancelled → notice).
        listMyInterviews().catch(() => []),
      ])

      if (!verificationRes.ok) {
        console.error('❌ Failed to fetch verification status:', verificationRes.status)
      }

      const data = verificationRes.ok ? await verificationRes.json() : null
      const invitationsData = invitationsRes.ok ? await invitationsRes.json() : { data: [] }
      const contractsData = contractsRes.ok ? await contractsRes.json() : { data: [] }

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, skipping state update')
        return
      }

      if (data) {
        setVerificationStatus(data)
      }

      const allInvitations: Invitation[] = invitationsData.data ?? []
      // Keeps the "Others" menu (Contracts + Interviews) in sync — e.g. when a
      // manager revokes access, the menu disappears on this refresh.
      if (invitationsRes.ok) notifyManagerAccessChanged(allInvitations.some((inv) => inv.status === "accepted"))
      const pendingInvitations = allInvitations.filter((inv) => inv.status === "pending")
      setInvitations(pendingInvitations)

      // Connections a manager recently ended (status flipped back to
      // "declined" with revokedBy: "manager") — surfaced as a distinct,
      // dismissible notice rather than mixed into the pending-invite list.
      const dismissed = getDismissedIds()
      const now = Date.now()
      const recentlyEnded = allInvitations.filter((inv) => {
        if (inv.status !== "declined" || inv.revokedBy !== "manager" || !inv.respondedAt) return false
        if (dismissed.includes(inv.id)) return false
        return now - new Date(inv.respondedAt).getTime() < DISMISS_WINDOW_MS
      })
      setEndedConnections(recentlyEnded)

      // Contracts waiting for this user's signature. These stay in the bell
      // until they are signed (or terminated) — no manual dismissal.
      const allContracts: PendingContract[] = contractsData.data ?? []
      const toSign = allContracts.filter((c) => c.status === "pending_signature" && !c.signedAt)
      setPendingContracts(toSign)

      // Contracts the employer has now signed too (complete) — shown until opened,
      // for 14 days after the employer signed.
      const dismissedCompleted = getDismissedCompleted()
      const completed = allContracts.filter((c) =>
        !!c.signedAt && !!c.managerSignedAt &&
        !dismissedCompleted.includes(c.id) &&
        now - new Date(c.managerSignedAt).getTime() < DISMISS_WINDOW_MS,
      )
      setCompletedContracts(completed)

      // Interviews: new, moved or cancelled since the user last saw them.
      const notices = interviewNotices(myInterviews)
      setInterviewNoticeList(notices)

      // Calculate unread count based on unverified recovery email + pending invitations + ended connections + contracts to sign
      let count = 0
      if (data?.hasPersonalInfo && data?.requiresVerification) {
        const hasRecoveryEmail = data.recoveryEmail && data.recoveryEmail.trim() !== ''
        if (hasRecoveryEmail && !data.recoveryEmailVerified) {
          count += 1
          console.log('🔴 Recovery email needs verification')
        }
      }
      count += pendingInvitations.length
      count += recentlyEnded.length
      count += toSign.length
      count += completed.length
      count += notices.length

      console.log('🔔 Notification count:', count)
      setUnreadCount(count)

    } catch (error) {
      console.error('❌ Error fetching notifications:', error)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
      isRefreshingRef.current = false
    }
  }, []) // Empty deps - function never changes

  // Initial fetch and polling
  useEffect(() => {
    isMountedRef.current = true

    fetchVerificationStatus()
    const interval = setInterval(fetchVerificationStatus, 30000)

    return () => {
      isMountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchVerificationStatus, userId])

  // Memoized handlers to prevent recreating on every render
  const handleVerificationDialogOpen = useCallback(() => {
    console.log('🔔 Opening verification dialog')
    // CRITICAL FIX: Close the dropdown FIRST before opening the dialog
    setIsDropdownOpen(false)

    // Small delay to allow dropdown to close before opening dialog
    setTimeout(() => {
      setShowVerificationDialog(true)
    }, 100)
  }, [])

  const handleVerificationDialogClose = useCallback(() => {
    console.log('🔔 Closing verification dialog')

    // IMPORTANT: Close dialog FIRST (synchronous, immediate)
    setShowVerificationDialog(false)

    // Don't refresh immediately - let the dialog close animation complete
    // The interval will pick up any changes within 30 seconds
    console.log('ℹ️ Dialog closed, status will refresh on next interval')
  }, [])

  const handleVerificationComplete = useCallback(() => {
    console.log('✅ Verification email sent')

    // Close dialog first
    setShowVerificationDialog(false)

    // Wait for dialog close animation, then refresh
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current && !isRefreshingRef.current) {
        console.log('🔄 Refreshing status after email sent')
        fetchVerificationStatus()
      }
    }, 500) // Longer delay to ensure dialog is fully closed

    // Cleanup timeout if component unmounts
    return () => clearTimeout(timeoutId)
  }, [fetchVerificationStatus])

  const dismissEndedConnection = useCallback((id: string) => {
    addDismissedId(id)
    setEndedConnections((prev) => prev.filter((inv) => inv.id !== id))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const openContract = useCallback((id: string) => {
    setIsDropdownOpen(false)
    router.push(`/dashboard/others/contracts?contract=${id}`)
  }, [router])

  const openCompletedContract = useCallback((id: string) => {
    addDismissedCompleted(id)
    setCompletedContracts((prev) => prev.filter((c) => c.id !== id))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    openContract(id)
  }, [openContract])

  const openInterview = useCallback((notice: InterviewNotice) => {
    markInterviewsSeen([notice.interview])
    setInterviewNoticeList((prev) => prev.filter((n) => n.interview.id !== notice.interview.id))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    setIsDropdownOpen(false)
    router.push(`/dashboard/others/my-interviews?interview=${notice.interview.id}`)
  }, [router])

  const openTimeOffAnswer = useCallback((r: TimeOffRequest) => {
    dismissTimeOffAnswer(r)
    setIsDropdownOpen(false)
    router.push("/dashboard/availability")
  }, [dismissTimeOffAnswer, router])

  // The Interviews page marks everything as seen → refresh the bell.
  useEffect(() => {
    const onSeen = () => fetchVerificationStatus()
    window.addEventListener("veroCv:interviews-seen", onSeen)
    return () => window.removeEventListener("veroCv:interviews-seen", onSeen)
  }, [fetchVerificationStatus])

  const respondToInvitation = useCallback(async (id: string, action: "accept" | "decline") => {
    setRespondingId(id)
    try {
      const res = await fetch(`/api/user/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Failed to respond")

      // Remove it from the pending list immediately (optimistic-ish — response already confirmed)
      setInvitations((prev) => prev.filter((inv) => inv.id !== id))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setDetailsInvitation(null)
      // Accepting unlocks Contracts + Interviews under "Others" right away.
      if (action === "accept") notifyManagerAccessChanged(true)
    } catch (error) {
      console.error("❌ Failed to respond to invitation:", error)
      // Leave it in the list so the person can retry
    } finally {
      if (isMountedRef.current) setRespondingId(null)
    }
  }, [])

  // Only show verification notification if user requires verification (credential-based)
  const needsVerification = verificationStatus?.hasPersonalInfo &&
    verificationStatus?.requiresVerification &&
    !verificationStatus?.recoveryEmailVerified

  const hasAnyNotification =
    needsVerification || invitations.length > 0 || endedConnections.length > 0 ||
    pendingContracts.length > 0 || completedContracts.length > 0 || interviewNoticeList.length > 0 ||
    timeOffAnswers.length > 0
  const badgeCount = unreadCount + timeOffAnswers.length

  if (isLoading && !verificationStatus) {
    return (
      <div className="relative">
        <Button variant="ghost" size="icon" disabled>
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {badgeCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {badgeCount > 9 ? "9+" : badgeCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="p-2">
            <h3 className="font-semibold text-sm mb-2">{t.notifications}</h3>

            {!hasAnyNotification && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t.noNotifications}</p>
              </div>
            )}

            {needsVerification && (
              <DropdownMenuItem
                onClick={handleVerificationDialogOpen}
                className="cursor-pointer p-3 hover:bg-red-50"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-red-600">
                      {t.emailVerificationRequired}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t.verifyEmailMessage}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            )}

            {pendingContracts.map((contract) => (
              <button
                key={`contract-${contract.id}`}
                onClick={() => openContract(contract.id)}
                className="w-full text-left p-3 rounded-md hover:bg-amber-50/70 transition-colors"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800">{t.contractToSignTitle}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t.contractToSignMessage(
                        contract.companyName || contract.managerName || t.contractFromFallback,
                      )}
                    </p>
                    <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>
                      {t.reviewContract} →
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {completedContracts.map((contract) => (
              <button
                key={`completed-${contract.id}`}
                onClick={() => openCompletedContract(contract.id)}
                className="w-full text-left p-3 rounded-md hover:bg-green-50/70 transition-colors"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800">{t.contractCompleteTitle}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t.contractCompleteMessage(contract.companyName || contract.managerName || t.contractFromFallback)}
                    </p>
                    <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>
                      {t.viewContract} →
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {interviewNoticeList.map((notice) => {
              const iv = notice.interview
              const fmtWhen = (d: string) => `${new Date(d).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })} ${new Date(d).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`
              const when = fmtWhen(iv.startAt)
              const message =
                notice.kind === "moved" && iv.previousStartAt ? t.interviewMovedMessage(iv.position, fmtWhen(iv.previousStartAt), when)
                  : notice.kind === "cancelled" ? t.interviewCancelledMessage(iv.position, when)
                    : t.interviewMessage(iv.position, when)
              const title = notice.kind === "booked" ? t.interviewBookedTitle : notice.kind === "moved" ? t.interviewMovedTitle : t.interviewCancelledTitle
              const dot = notice.kind === "cancelled" ? "bg-red-500" : notice.kind === "moved" ? "bg-amber-500" : "bg-indigo-500"
              return (
                <button
                  key={`interview-${iv.id}-${notice.kind}`}
                  onClick={() => openInterview(notice)}
                  className="w-full text-left p-3 rounded-md hover:bg-indigo-50/60 transition-colors"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`w-2 h-2 ${dot} rounded-full mt-1.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800">{title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {message}
                        {(iv.companyName || iv.interviewerName) && ` · ${iv.companyName || iv.interviewerName}`}
                      </p>
                      <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>
                        {t.viewInterview} →
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}

            {timeOffAnswers.map((r) => {
              const approved = r.status === "approved"
              const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" })
              const dates = r.startDate === r.endDate ? fmt(r.startDate) : `${fmt(r.startDate)}–${fmt(r.endDate)}`
              const type = TYPE_LABELS[r.type]?.[language === "en" ? "en" : "sv"] ?? r.type
              return (
                <button
                  key={`timeoff-${r.id}-${r.status}`}
                  onClick={() => openTimeOffAnswer(r)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${approved ? "hover:bg-green-50/70" : "hover:bg-red-50/60"}`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`w-2 h-2 ${approved ? "bg-green-500" : "bg-red-500"} rounded-full mt-1.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800">{approved ? t.timeOffApprovedTitle : t.timeOffDeclinedTitle}</p>
                      <p className="text-xs text-gray-600 mt-1">{t.timeOffMessage(type, dates, r.decidedByName)}</p>
                      {r.decisionNote && <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">“{r.decisionNote}”</p>}
                      <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>
                        {t.viewAvailability} →
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}

            {invitations.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setDetailsInvitation(inv)}
                className="w-full text-left p-3 rounded-md hover:bg-blue-50/60 transition-colors"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800">{t.invitationTitle}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t.invitationMessage(inv.bossName || "—", inv.companyName || "")}
                    </p>
                    <p className="text-xs font-semibold mt-2" style={{ color: "rgb(5,22,80)" }}>
                      {t.reviewInvitation} →
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {endedConnections.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setRevokedDetails(inv)}
                className="w-full text-left p-3 rounded-md hover:bg-gray-100/70 transition-colors"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-700">{t.connectionEndedTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.connectionEndedMessage(inv.bossName || "—")}
                    </p>
                    <p className="text-xs font-semibold mt-2 text-gray-500">
                      {t.viewDetailsLabel} →
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {detailsInvitation && (
        <InvitationDetailsDialog
          invitation={detailsInvitation}
          t={t}
          locale={locale}
          responding={respondingId === detailsInvitation.id}
          onAccept={() => respondToInvitation(detailsInvitation.id, "accept")}
          onDecline={() => respondToInvitation(detailsInvitation.id, "decline")}
          onClose={() => setDetailsInvitation(null)}
        />
      )}

      {revokedDetails && (
        <AccessRevokedDialog
          invitation={revokedDetails}
          language={language}
          onClose={() => {
            dismissEndedConnection(revokedDetails.id)
            setRevokedDetails(null)
          }}
        />
      )}

      {showVerificationDialog && (
        <VerificationDialog
          isOpen={showVerificationDialog}
          onClose={handleVerificationDialogClose}
          verificationStatus={verificationStatus}
          onVerificationSent={handleVerificationComplete}
          language={language}
          userId={userId}
        />
      )}
    </>
  )
}
