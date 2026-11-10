/* ═════════════════════════════════════════════════════════════
   REPORTS — calculations (pure functions, no fetching).
   Everything on the Reports page is derived here from ReportData,
   so every number traces back to a real record.
═════════════════════════════════════════════════════════════ */

import type { Interview } from './interviewsApi'
import type { EmployeeContract } from './contractsStore'
import type { ReportData, ReportEmployee, EmployeeReportData } from './reportsData'

export type PeriodKey = '7d' | '30d' | '90d' | '12m'
export const PERIOD_DAYS: Record<PeriodKey, number> = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 }

export interface Range {
  from: number
  to: number
}

export function periodRange(
  period: PeriodKey,
  now = Date.now(),
): { current: Range; previous: Range } {
  const len = PERIOD_DAYS[period] * 86_400_000
  return { current: { from: now - len, to: now }, previous: { from: now - 2 * len, to: now - len } }
}

const ts = (d: string | null | undefined) => (d ? new Date(d).getTime() : NaN)
const inRange = (d: string | null | undefined, r: Range) => {
  const t = ts(d)
  return Number.isFinite(t) && t >= r.from && t < r.to
}
const lower = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

/* ─── Contracts helpers ─── */
const contractEventDate = (c: EmployeeContract, type: string) =>
  [...(c.history ?? [])].reverse().find((h) => h.type === type)?.date ?? null

/** When the contract became fully signed (manager signature). */
const fullySignedAt = (c: EmployeeContract) =>
  c.managerSignedAt ?? contractEventDate(c, 'manager_signed')

export function contractStatusOf(c: EmployeeContract): string {
  return c.displayStatus ?? c.status ?? 'draft'
}

/* ─── Interviews linked to an employee (by account or email) ─── */
export function interviewsFor(emp: ReportEmployee, interviews: Interview[]) {
  const email = lower(emp.employeeEmail)
  return interviews.filter(
    (iv) => iv.employeeId === emp.employeeId || (email && lower(iv.candidateEmail) === email),
  )
}

export function contractsFor(emp: ReportEmployee, contracts: EmployeeContract[]) {
  const email = lower(emp.employeeEmail)
  return contracts.filter(
    (c) => c.employeeId === emp.employeeId || (email && lower(c.recipientEmail) === email),
  )
}

/* ─── Profile completeness ─── */
export interface Completeness {
  /** 0–100, or null when the profile isn't accessible (access level). */
  percent: number | null
  missing: string[]
}

export function profileCompleteness(
  d: EmployeeReportData | undefined,
  isEn: boolean,
): Completeness {
  if (!d?.profile) return { percent: null, missing: [] }
  const pi = d.profile.personalInformation ?? {}
  const ed = d.profile.employmentDetails ?? {}
  const ec = pi.emergencyContact ?? {}
  const checks: [boolean, string, string][] = [
    [!!(pi.firstName && pi.lastName), 'Name', 'Namn'],
    [!!pi.title, 'Title', 'Titel'],
    [!!(pi.phoneNumber || pi.workPhoneNumber), 'Phone', 'Telefon'],
    [!!pi.homeAddress, 'Address', 'Adress'],
    [!!(pi.professionalPresentation || pi.personalPresentation), 'Presentation', 'Presentation'],
    [
      !!((ec.firstName || ec.lastName) && (ec.phoneNumber || ec.email)),
      'Emergency contact',
      'Nödkontakt',
    ],
    [
      !!(ed.presentTitle || ed.workArea || ed.employmentRate),
      'Employment details',
      'Anställningsuppgifter',
    ],
    [(d.cvs?.length ?? 0) > 0, 'CV', 'CV'],
    [
      (d.cvs ?? []).some((cv) => (cv.skills?.length ?? 0) > 0) ||
        (d.profile.cv?.skills?.length ?? 0) > 0,
      'Skills',
      'Kompetenser',
    ],
    [
      (d.cvs ?? []).some((cv) => (cv.experience?.length ?? 0) > 0) ||
        (d.profile.cv?.experience?.length ?? 0) > 0,
      'Work experience',
      'Arbetslivserfarenhet',
    ],
    [(d.portfolio?.length ?? 0) > 0, 'Portfolio', 'Portfolio'],
  ]
  const ok = checks.filter(([v]) => v).length
  return {
    percent: Math.round((ok / checks.length) * 100),
    missing: checks.filter(([v]) => !v).map(([, en, sv]) => (isEn ? en : sv)),
  }
}

/* ─── KPIs (current period vs previous period of the same length) ─── */
export interface Kpi {
  value: number
  previous: number | null
}

export function kpis(data: ReportData, period: PeriodKey, now = Date.now()) {
  const { current, previous } = periodRange(period, now)
  const allCvs = Object.values(data.perEmployee).flatMap((d) => d.cvs ?? [])
  const cvActivity = (r: Range) =>
    allCvs.filter((cv) => inRange(cv.createdAt, r) || inRange(cv.updatedAt, r)).length

  const interviewsHeld = (r: Range) =>
    data.interviews.filter(
      (iv) => iv.status === 'completed' && inRange(iv.completedAt ?? iv.startAt, r),
    ).length
  const signed = (r: Range) => data.contracts.filter((c) => inRange(fullySignedAt(c), r)).length

  return {
    teamMembers: data.employees.length,
    pendingInvitations: data.invitations.filter((i) => i.status === 'pending').length,
    interviewsHeld: { value: interviewsHeld(current), previous: interviewsHeld(previous) } as Kpi,
    upcomingInterviews: data.interviews.filter(
      (iv) => iv.status === 'scheduled' && ts(iv.startAt) >= now,
    ).length,
    contractsSigned: { value: signed(current), previous: signed(previous) } as Kpi,
    awaitingSignature: data.contracts.filter((c) =>
      ['pending_signature', 'pending_manager_signature'].includes(contractStatusOf(c)),
    ).length,
    awaitingMySignature: data.contracts.filter(
      (c) => contractStatusOf(c) === 'pending_manager_signature',
    ).length,
    cvActivity: { value: cvActivity(current), previous: cvActivity(previous) } as Kpi,
    totalCvs: allCvs.length,
  }
}

/* ─── Interviews report ─── */
export function interviewReport(interviews: Interview[], period: PeriodKey, now = Date.now()) {
  const { current } = periodRange(period, now)
  const inPeriod = interviews.filter((iv) => inRange(iv.startAt, current))
  const completed = inPeriod.filter((iv) => iv.status === 'completed')
  const evaluated = completed.filter((iv) => !!iv.evaluation?.evaluatedAt)
  const rated = interviews.filter(
    (iv) => (iv.evaluation?.overallRating ?? 0) > 0 && inRange(iv.startAt, current),
  )
  const recommendations = { strong_yes: 0, yes: 0, maybe: 0, no: 0, strong_no: 0 } as Record<
    string,
    number
  >
  for (const iv of inPeriod) {
    const r = iv.evaluation?.recommendation
    if (r && r in recommendations) recommendations[r]!++
  }
  const finished = inPeriod.filter((iv) => iv.status !== 'scheduled').length
  return {
    total: inPeriod.length,
    scheduled: inPeriod.filter((iv) => iv.status === 'scheduled').length,
    completed: completed.length,
    cancelled: inPeriod.filter((iv) => iv.status === 'cancelled').length,
    noShow: inPeriod.filter((iv) => iv.status === 'no_show').length,
    /** Share of finished interviews that actually took place. */
    showRate: finished ? Math.round((completed.length / finished) * 100) : null,
    evaluated: evaluated.length,
    needsEvaluation: interviews.filter(
      (iv) => iv.status === 'completed' && !iv.evaluation?.evaluatedAt,
    ).length,
    avgRating: rated.length
      ? Math.round(
          (rated.reduce((s, iv) => s + iv.evaluation.overallRating, 0) / rated.length) * 10,
        ) / 10
      : null,
    recommendations,
  }
}

/* ─── Contracts report ─── */
export const EXPIRING_DAYS = 30

export function contractReport(contracts: EmployeeContract[], now = Date.now()) {
  const byStatus: Record<string, number> = {}
  for (const c of contracts) {
    const s = contractStatusOf(c)
    byStatus[s] = (byStatus[s] ?? 0) + 1
  }
  const expiring = contracts
    .filter((c) => {
      const s = contractStatusOf(c)
      if (!c.endDate || (s !== 'active' && s !== 'expiring_soon')) return false
      const left = ts(c.endDate) - now
      return left >= 0 && left <= EXPIRING_DAYS * 86_400_000
    })
    .sort((a, b) => ts(a.endDate) - ts(b.endDate))
  return { total: contracts.length, byStatus, expiring }
}

/* ─── Invitations report ─── */
export function invitationReport(
  invitations: ReportData['invitations'],
  period: PeriodKey,
  now = Date.now(),
) {
  const { current } = periodRange(period, now)
  const responded = invitations.filter((i) => i.respondedAt && i.status !== 'pending')
  const accepted = invitations.filter((i) => i.status === 'accepted').length
  const declined = invitations.filter((i) => i.status === 'declined').length
  const responseHours = responded
    .map((i) => (ts(i.respondedAt) - ts(i.createdAt)) / 3_600_000)
    .filter((h) => Number.isFinite(h) && h >= 0)
  return {
    total: invitations.length,
    sentInPeriod: invitations.filter((i) => inRange(i.createdAt, current)).length,
    accepted,
    pending: invitations.filter((i) => i.status === 'pending').length,
    declined,
    acceptanceRate:
      accepted + declined ? Math.round((accepted / (accepted + declined)) * 100) : null,
    avgResponseHours: responseHours.length
      ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length
      : null,
  }
}

/* ─── Employment status + upcoming HR events (from the Profile page data) ─── */
export function employmentReport(data: ReportData, now = Date.now()) {
  const status: Record<string, number> = { active: 0, 'on-leave': 0, terminated: 0, unknown: 0 }
  const events: { employeeName: string; title: string; date: string; eventType: string }[] = []
  let vacationTotal = 0
  let vacationUsed = 0
  let withLeave = 0
  for (const emp of data.employees) {
    const hr = data.perEmployee[emp.employeeId]?.profile?.hrInfo
    const s = hr?.employmentInfo?.status
    if (s && s in status) status[s]!++
    else status.unknown!++
    for (const ev of hr?.upcomingEvents ?? []) {
      const t = ts(ev?.date)
      if (Number.isFinite(t) && t >= now - 86_400_000 && t <= now + 30 * 86_400_000 && ev.title) {
        events.push({
          employeeName: emp.employeeName || emp.employeeEmail,
          title: ev.title,
          date: ev.date,
          eventType: ev.eventType ?? 'other',
        })
      }
    }
    if (hr?.leaveBalance) {
      vacationTotal += Number(hr.leaveBalance.vacationDaysTotal ?? 0)
      vacationUsed += Number(hr.leaveBalance.vacationDaysUsed ?? 0)
      withLeave++
    }
  }
  events.sort((a, b) => ts(a.date) - ts(b.date))
  return { status, events, vacationTotal, vacationUsed, withLeave }
}

/* ─── Team table ─── */
export interface TeamRow {
  employee: ReportEmployee
  cvs: number | null
  lastCvUpdate: string | null
  coverLetters: number | null
  portfolio: number | null
  completeness: Completeness
  interviews: number
  upcomingInterview: string | null
  contractStatus: string | null
  employmentStatus: string | null
  lastActivity: string | null
}

export function teamRows(data: ReportData, isEn: boolean, now = Date.now()): TeamRow[] {
  return data.employees.map((emp) => {
    const d = data.perEmployee[emp.employeeId]
    const cvs = d?.cvs ?? null
    const lastCvUpdate = cvs?.length
      ? (cvs
          .map((c) => c.updatedAt)
          .sort()
          .reverse()[0] ?? null)
      : null
    const ivs = interviewsFor(emp, data.interviews)
    const upcoming = ivs
      .filter((iv) => iv.status === 'scheduled' && ts(iv.startAt) >= now)
      .sort((a, b) => ts(a.startAt) - ts(b.startAt))[0]
    const latestContract = contractsFor(emp, data.contracts).sort(
      (a, b) => ts(b.createdAt) - ts(a.createdAt),
    )[0]
    const dates = [
      lastCvUpdate,
      ...(d?.coverLetters ?? []).map((l) => l.createdAt),
      ...(d?.portfolio ?? []).map((p) => p.createdAt),
    ].filter(Boolean) as string[]
    return {
      employee: emp,
      cvs: cvs ? cvs.length : null,
      lastCvUpdate,
      coverLetters: d?.coverLetters ? d.coverLetters.length : null,
      portfolio: d?.portfolio ? d.portfolio.length : null,
      completeness: profileCompleteness(d, isEn),
      interviews: ivs.length,
      upcomingInterview: upcoming?.startAt ?? null,
      contractStatus: latestContract ? contractStatusOf(latestContract) : null,
      employmentStatus: d?.profile?.hrInfo?.employmentInfo?.status ?? null,
      lastActivity: dates.sort().reverse()[0] ?? null,
    }
  })
}

/* ─── Activity over time (buckets for the chart) ─── */
export interface Bucket {
  label: string
  from: number
  to: number
  interviews: number
  cvs: number
  contracts: number
}

export function activityBuckets(
  data: ReportData,
  period: PeriodKey,
  isEn: boolean,
  now = Date.now(),
): Bucket[] {
  const locale = isEn ? 'en-GB' : 'sv-SE'
  const buckets: Bucket[] = []
  const end = new Date(now)
  if (period === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i)
      buckets.push({
        label: d.toLocaleDateString(locale, { weekday: 'short' }),
        from: d.getTime(),
        to: d.getTime() + 86_400_000,
        interviews: 0,
        cvs: 0,
        contracts: 0,
      })
    }
  } else if (period === '30d' || period === '90d') {
    const weeks = period === '30d' ? 5 : 13
    const today = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).getTime()
    for (let i = weeks - 1; i >= 0; i--) {
      const to = today - i * 7 * 86_400_000
      const from = to - 7 * 86_400_000
      buckets.push({
        label: new Date(from).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        from,
        to,
        interviews: 0,
        cvs: 0,
        contracts: 0,
      })
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1)
      const next = new Date(end.getFullYear(), end.getMonth() - i + 1, 1)
      buckets.push({
        label: d.toLocaleDateString(locale, { month: 'short' }),
        from: d.getTime(),
        to: next.getTime(),
        interviews: 0,
        cvs: 0,
        contracts: 0,
      })
    }
  }
  const put = (date: string | null | undefined, key: 'interviews' | 'cvs' | 'contracts') => {
    const t = ts(date)
    if (!Number.isFinite(t)) return
    const b = buckets.find((x) => t >= x.from && t < x.to)
    if (b) b[key]++
  }
  for (const iv of data.interviews) if (iv.status !== 'cancelled') put(iv.startAt, 'interviews')
  for (const d of Object.values(data.perEmployee))
    for (const cv of d.cvs ?? []) put(cv.updatedAt, 'cvs')
  for (const c of data.contracts) put(fullySignedAt(c), 'contracts')
  return buckets
}

/* ─── Recent activity feed ─── */
export type ActivityType =
  | 'cv_created'
  | 'cv_updated'
  | 'cover_letter'
  | 'portfolio'
  | 'interview_booked'
  | 'interview_completed'
  | 'interview_cancelled'
  | 'interview_no_show'
  | 'contract_sent'
  | 'contract_signed'
  | 'contract_completed'
  | 'contract_terminated'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'invitation_declined'

export interface ActivityItem {
  id: string
  type: ActivityType
  who: string
  detail: string
  date: string
}

export function activityFeed(data: ReportData, limit = 12): ActivityItem[] {
  const out: ActivityItem[] = []
  const nameOf = (id?: string, email?: string) => {
    const e = data.employees.find(
      (x) => x.employeeId === id || (!!email && lower(x.employeeEmail) === lower(email)),
    )
    return e?.employeeName || e?.employeeEmail || email || ''
  }
  for (const emp of data.employees) {
    const d = data.perEmployee[emp.employeeId]
    const who = emp.employeeName || emp.employeeEmail
    for (const cv of d?.cvs ?? []) {
      out.push({ id: `cvc-${cv.id}`, type: 'cv_created', who, detail: cv.name, date: cv.createdAt })
      if (ts(cv.updatedAt) - ts(cv.createdAt) > 60_000)
        out.push({
          id: `cvu-${cv.id}`,
          type: 'cv_updated',
          who,
          detail: cv.name,
          date: cv.updatedAt,
        })
    }
    for (const l of d?.coverLetters ?? [])
      out.push({
        id: `cl-${l.id}`,
        type: 'cover_letter',
        who,
        detail: [l.jobTitle, l.companyName].filter(Boolean).join(' · '),
        date: l.createdAt,
      })
    for (const p of d?.portfolio ?? [])
      out.push({ id: `pf-${p.id}`, type: 'portfolio', who, detail: p.title, date: p.createdAt })
  }
  for (const iv of data.interviews) {
    out.push({
      id: `ivb-${iv.id}`,
      type: 'interview_booked',
      who: iv.candidateName,
      detail: iv.position,
      date: iv.createdAt,
    })
    if (iv.status === 'completed' && iv.completedAt)
      out.push({
        id: `ivc-${iv.id}`,
        type: 'interview_completed',
        who: iv.candidateName,
        detail: iv.position,
        date: iv.completedAt,
      })
    if (iv.status === 'cancelled' && iv.cancelledAt)
      out.push({
        id: `ivx-${iv.id}`,
        type: 'interview_cancelled',
        who: iv.candidateName,
        detail: iv.position,
        date: iv.cancelledAt,
      })
    if (iv.status === 'no_show' && iv.cancelledAt)
      out.push({
        id: `ivn-${iv.id}`,
        type: 'interview_no_show',
        who: iv.candidateName,
        detail: iv.position,
        date: iv.cancelledAt,
      })
  }
  for (const c of data.contracts) {
    const who = c.employeeName || nameOf(c.employeeId, c.recipientEmail)
    const detail = c.positionTitle || c.title || ''
    for (const h of c.history ?? []) {
      const type: ActivityType | null =
        h.type === 'sent'
          ? 'contract_sent'
          : h.type === 'signed'
            ? 'contract_signed'
            : h.type === 'manager_signed'
              ? 'contract_completed'
              : h.type === 'terminated'
                ? 'contract_terminated'
                : null
      if (type)
        out.push({ id: `ct-${c.id}-${h.id ?? h.date}-${h.type}`, type, who, detail, date: h.date })
    }
  }
  for (const inv of data.invitations) {
    const who =
      `${inv.firstName ?? ''} ${inv.lastName ?? ''}`.trim() ||
      nameOf(undefined, inv.employeeEmail) ||
      inv.employeeEmail
    out.push({
      id: `inv-${inv.id}`,
      type: 'invitation_sent',
      who,
      detail: inv.employeeEmail,
      date: inv.createdAt,
    })
    if (inv.respondedAt && inv.status === 'accepted')
      out.push({
        id: `inva-${inv.id}`,
        type: 'invitation_accepted',
        who,
        detail: inv.employeeEmail,
        date: inv.respondedAt,
      })
    if (inv.respondedAt && inv.status === 'declined')
      out.push({
        id: `invd-${inv.id}`,
        type: 'invitation_declined',
        who,
        detail: inv.employeeEmail,
        date: inv.respondedAt,
      })
  }
  return out
    .filter((a) => Number.isFinite(ts(a.date)) && ts(a.date) <= Date.now() + 60_000)
    .sort((a, b) => ts(b.date) - ts(a.date))
    .slice(0, limit)
}

/* ─── CSV export of the team table ─── */
export function teamCsv(rows: TeamRow[], isEn: boolean): string {
  const head = isEn
    ? [
        'Employee',
        'Email',
        'CVs',
        'Last CV update',
        'Cover letters',
        'Portfolio items',
        'Profile complete %',
        'Missing',
        'Interviews',
        'Next interview',
        'Contract',
        'Employment status',
      ]
    : [
        'Medarbetare',
        'E-post',
        'CV:n',
        'Senaste CV-uppdatering',
        'Personliga brev',
        'Portfolioobjekt',
        'Profil komplett %',
        'Saknas',
        'Intervjuer',
        'Nästa intervju',
        'Kontrakt',
        'Anställningsstatus',
      ]
  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = rows.map((r) =>
    [
      r.employee.employeeName,
      r.employee.employeeEmail,
      r.cvs,
      r.lastCvUpdate?.slice(0, 10),
      r.coverLetters,
      r.portfolio,
      r.completeness.percent,
      r.completeness.missing.join(' / '),
      r.interviews,
      r.upcomingInterview?.slice(0, 16).replace('T', ' '),
      r.contractStatus,
      r.employmentStatus,
    ]
      .map(cell)
      .join(','),
  )
  return [head.map(cell).join(','), ...lines].join('\n')
}
