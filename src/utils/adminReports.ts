// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/adminReports.ts   (NEW — shared by the API and the page)
// WHAT IT DOES:   Types for the business admin's Reports page + the period rules.
// ══════════════════════════════════════════════════════════════════════

import type { DayKind, TimeOffType } from '@/utils/managerAvailability'

/** Same order as `t.periods` in Businessadmintranslations: This week · This month · Last 3 months · This year */
export const REPORT_PERIODS = ['week', 'month', 'quarter', 'year'] as const
export type ReportPeriod = (typeof REPORT_PERIODS)[number]

export interface Kpi {
  value: number
  /** Same measure for the period before (same length) — for the ↑ / ↓ */
  previous: number
}

export type AttentionKind =
  | 'contract_to_sign' //          a manager signed your contract — you sign to complete it
  | 'time_off_pending' //          days-off request waiting for your answer
  | 'manager_no_contract' //       manager has no contract from you yet
  | 'manager_contract_waiting' //  your contract waits for the manager's signature (> 7 days)
  | 'contract_expiring' //         an active contract ends within 30 days
  | 'employee_contracts_waiting' // a manager's contracts wait for employees (> 7 days)
  | 'employee_contracts_to_sign' // employees signed, the manager hasn't countersigned
  | 'manager_inactive' //          not seen for 14+ days
  | 'invitations_pending' //       invitations not answered for 7+ days
  | 'interviews_today' //          interviews today (you or your managers)

export interface AttentionItem {
  key: string
  kind: AttentionKind
  /** high = you must act · medium = follow up · low = good to know */
  level: 'high' | 'medium' | 'low'
  managerId?: string
  managerName?: string
  contractId?: string
  title?: string
  /** Relevant day/time (ISO): signed at, ends at, last seen, … */
  at?: string | null
  count?: number
  /** contract_expiring: a manager's own contract (from you) or an employee contract */
  forManager?: boolean
  employeeName?: string
  employeeId?: string
}

export interface Bucket {
  label: string
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
}

export type ContractState =
  | 'draft'
  | 'awaiting_employee'
  | 'awaiting_manager'
  | 'active'
  | 'ended'
  | 'terminated'

export interface ReportEmployee {
  id: string
  name: string
  joinedAt: string | null
  accessLevel: 'full' | 'cv_only' | 'portfolio_only'
  cvs: number
  portfolio: number
  contract: ContractState | null
  contractEndsAt: string | null
}

/** The manager's own contract from you (admin → manager). */
export type MyContractState =
  | 'none'
  | 'draft'
  | 'awaiting_manager'
  | 'awaiting_you'
  | 'active'
  | 'ended'
  | 'terminated'

export interface ManagerReportRow {
  id: string
  name: string
  email: string
  jobTitle: string
  department: string
  createdAt: string | null
  lastSeenAt: string | null
  today: { kind: DayKind; timeOffType?: TimeOffType }
  team: number
  newInPeriod: number
  leftInPeriod: number
  pendingInvites: number
  contracts: {
    active: number
    awaitingEmployee: number
    awaitingManager: number
    sentInPeriod: number
    signedInPeriod: number
    expiringSoon: number
  }
  interviews: { held: number; cancelled: number; noShow: number; upcoming: number }
  cvs: { total: number; newInPeriod: number }
  portfolio: number
  daysOff: number
  pendingTimeOff: number
  myContract: MyContractState
  employees: ReportEmployee[]
}

export interface AdminReport {
  period: ReportPeriod
  from: string
  to: string
  prevFrom: string
  prevTo: string
  today: string
  generatedAt: string
  kpis: {
    newEmployees: Kpi
    contractsSent: Kpi
    contractsSigned: Kpi
    interviewsHeld: Kpi
    cvsCreated: Kpi
    daysOff: Kpi
  }
  snapshot: {
    managers: number
    activeManagers: number // seen in the period
    employees: number
    activeContracts: number
    pendingInvitations: number
    awayToday: number
  }
  attention: AttentionItem[]
  series: {
    buckets: Bucket[]
    newEmployees: number[]
    contractsSigned: number[]
    interviewsHeld: number[]
  }
  /** Manager → employee contracts right now */
  pipeline: {
    draft: number
    awaitingEmployee: number
    awaitingManager: number
    active: number
    expiringSoon: number
    ended: number
    terminated: number
  }
  interviewOutcomes: { completed: number; cancelled: number; noShow: number; upcoming: number }
  timeOffByType: { type: TimeOffType; days: number }[]
  managers: ManagerReportRow[]
}

/* ─── Period rules (Europe/Stockholm days, YYYY-MM-DD) ─── */

const pad = (n: number) => String(n).padStart(2, '0')
const toUtc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
const fromUtc = (ms: number) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
const addDays = (d: string, n: number) => fromUtc(toUtc(d) + n * 86_400_000)
const monthStart = (d: string) => `${d.slice(0, 7)}-01`
const addMonths = (d: string, n: number) => {
  const y = +d.slice(0, 4)
  const m = +d.slice(5, 7) - 1 + n
  return fromUtc(Date.UTC(y + Math.floor(m / 12), ((m % 12) + 12) % 12, 1))
}
const monday = (d: string) => addDays(d, -((new Date(toUtc(d)).getUTCDay() + 6) % 7))
const lengthDays = (a: string, b: string) => Math.round((toUtc(b) - toUtc(a)) / 86_400_000) + 1

/**
 * The period up to and including today, the period before it (same length),
 * and the chart buckets (days for a week/month, weeks for 3 months, months for a year).
 */
export function periodRange(period: ReportPeriod, today: string) {
  let from: string
  if (period === 'week') from = monday(today)
  else if (period === 'month') from = monthStart(today)
  else if (period === 'quarter') from = addDays(today, -89)
  else from = `${today.slice(0, 4)}-01-01`
  const to = today
  const len = lengthDays(from, to)
  const prevTo = addDays(from, -1)
  const prevFrom = addDays(prevTo, -(len - 1))

  const buckets: Bucket[] = []
  if (period === 'week' || period === 'month') {
    // Whole week / month on the chart so the shape is stable; future days stay empty.
    const end = period === 'week' ? addDays(from, 6) : addDays(addMonths(from, 1), -1)
    for (let d = from; d <= end; d = addDays(d, 1)) buckets.push({ label: d, from: d, to: d })
  } else if (period === 'quarter') {
    for (let d = monday(from); d <= to; d = addDays(d, 7))
      buckets.push({
        label: d,
        from: d < from ? from : d,
        to: addDays(d, 6) > to ? to : addDays(d, 6),
      })
  } else {
    for (let m = 0; m < 12; m++) {
      const s = addMonths(from, m)
      buckets.push({ label: s, from: s, to: addDays(addMonths(s, 1), -1) })
    }
  }
  return { from, to, prevFrom, prevTo, buckets }
}

/** Index of the bucket a YYYY-MM-DD day falls in (-1 = none). */
export function bucketOf(buckets: Bucket[], day: string): number {
  for (let i = 0; i < buckets.length; i++)
    if (day >= buckets[i]!.from && day <= buckets[i]!.to) return i
  return -1
}

/** ISO timestamp → Europe/Stockholm YYYY-MM-DD */
export function dayOf(
  iso: string | null | undefined,
  timeZone = 'Europe/Stockholm',
): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}
