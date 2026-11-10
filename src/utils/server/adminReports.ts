// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/adminReports.ts   (NEW — server only)
// WHAT IT DOES:   Builds the business admin's report from what already happens in the app:
//   managers (users you created) · their employees (accepted invitations) · CVs / portfolio
//   · manager → employee contracts · your contracts with the managers · interviews
//   · days off + availability · last seen.
//   Everything is read with overrideAccess, scoped to the admin's own managers
//   (a platform admin: all managers). CVs / portfolio items marked hidden are not counted.
// ══════════════════════════════════════════════════════════════════════

import { lastSeenOf, relId, type Admin } from '@/utils/server/adminmanagers'
import { CV_COLLECTION, PORTFOLIO_COLLECTION } from '@/utils/server/adminEmployees'
import {
  adminManagerIds,
  managerNames,
  toMyAvailability,
  toRequestDto,
} from '@/utils/server/managerAvailability'
import {
  addDaysStr,
  countWorkingDays,
  dayCell,
  todayStr,
  type TimeOffType,
} from '@/utils/managerAvailability'
import {
  bucketOf,
  dayOf,
  periodRange,
  type AdminReport,
  type AttentionItem,
  type ContractState,
  type ManagerReportRow,
  type MyContractState,
  type ReportEmployee,
  type ReportPeriod,
} from '@/utils/adminReports'

const ALL = { pagination: false, depth: 0, overrideAccess: true } as const
const WAIT_DAYS = 7 // a contract / invitation waiting longer than this is flagged
const EXPIRY_DAYS = 30 // an active contract ending within this is flagged
const INACTIVE_DAYS = 14 // a manager not seen for this long is flagged

const safeFind = (payload: any, args: any) =>
  payload.find({ ...ALL, ...args }).catch(() => ({ docs: [] }))
const inRange = (day: string | null, from: string, to: string) => !!day && day >= from && day <= to

/** Where a contract is right now. (For your contracts with managers the manager is the "employee".) */
export function contractState(c: any, today: string): ContractState {
  if (c.status === 'draft') return 'draft'
  if (c.status === 'terminated') return 'terminated'
  if (!c.signedAt) return 'awaiting_employee'
  if (!c.managerSignedAt) return 'awaiting_manager'
  const end = dayOf(c.endDate)
  if (end && end < today) return 'ended'
  return 'active'
}

/** When the contract was (last) sent. */
export function sentAt(c: any): string | null {
  const sent = (c.history ?? [])
    .filter((h: any) => h?.type === 'sent' && h.date)
    .map((h: any) => String(h.date))
    .sort()
  return sent.length ? sent[sent.length - 1]! : c.status === 'draft' ? null : (c.createdAt ?? null)
}

const MY_PRIORITY: MyContractState[] = [
  'active',
  'awaiting_you',
  'awaiting_manager',
  'draft',
  'ended',
  'terminated',
  'none',
]
const toMine = (s: ContractState): MyContractState =>
  s === 'awaiting_employee' ? 'awaiting_manager' : s === 'awaiting_manager' ? 'awaiting_you' : s

const level = (v: unknown): ReportEmployee['accessLevel'] =>
  v === 'cv_only' || v === 'portfolio_only' ? v : 'full'

export async function buildAdminReport(
  payload: any,
  admin: Admin,
  period: ReportPeriod,
  now = new Date(),
): Promise<AdminReport> {
  const today = todayStr()
  const { from, to, prevFrom, prevTo, buckets } = periodRange(period, today)
  const ids = await adminManagerIds(payload, admin)
  const waitBefore = addDaysStr(today, -WAIT_DAYS)
  const expiryUntil = addDaysStr(today, EXPIRY_DAYS)

  const empty: AdminReport = {
    period,
    from,
    to,
    prevFrom,
    prevTo,
    today,
    generatedAt: now.toISOString(),
    kpis: {
      newEmployees: { value: 0, previous: 0 },
      contractsSent: { value: 0, previous: 0 },
      contractsSigned: { value: 0, previous: 0 },
      interviewsHeld: { value: 0, previous: 0 },
      cvsCreated: { value: 0, previous: 0 },
      daysOff: { value: 0, previous: 0 },
    },
    snapshot: {
      managers: 0,
      activeManagers: 0,
      employees: 0,
      activeContracts: 0,
      pendingInvitations: 0,
      awayToday: 0,
    },
    attention: [],
    series: {
      buckets,
      newEmployees: buckets.map(() => 0),
      contractsSigned: buckets.map(() => 0),
      interviewsHeld: buckets.map(() => 0),
    },
    pipeline: {
      draft: 0,
      awaitingEmployee: 0,
      awaitingManager: 0,
      active: 0,
      expiringSoon: 0,
      ended: 0,
      terminated: 0,
    },
    interviewOutcomes: { completed: 0, cancelled: 0, noShow: 0, upcoming: 0 },
    timeOffByType: [],
    managers: [],
  }

  // Your own items show even without managers (e.g. interviews today).
  const sinceIso = new Date(Date.parse(`${prevFrom}T00:00:00Z`) - 86_400_000).toISOString()
  const [
    names,
    usersRes,
    invitesRes,
    teamContractsRes,
    myContractsRes,
    interviewsRes,
    timeOffRes,
    availRes,
    lastSeen,
  ] = await Promise.all([
    managerNames(payload, ids),
    ids.length
      ? safeFind(payload, { collection: 'users', where: { id: { in: ids } } })
      : { docs: [] },
    ids.length
      ? safeFind(payload, { collection: 'employee-invitations', where: { manager: { in: ids } } })
      : { docs: [] },
    ids.length
      ? safeFind(payload, { collection: 'employee-contracts', where: { manager: { in: ids } } })
      : { docs: [] },
    safeFind(payload, {
      collection: 'employee-contracts',
      where: { manager: { equals: admin.id } },
    }),
    safeFind(payload, {
      collection: 'interviews',
      where: {
        and: [
          { manager: { in: [...ids, String(admin.id)] } },
          { startAt: { greater_than_equal: sinceIso } },
        ],
      },
    }),
    ids.length
      ? safeFind(payload, {
          collection: 'time-off-requests',
          where: {
            and: [
              { manager: { in: ids } },
              { status: { in: ['approved', 'pending'] } },
              { endDate: { greater_than_equal: prevFrom } },
            ],
          },
        })
      : { docs: [] },
    ids.length
      ? safeFind(payload, { collection: 'manager-availability', where: { manager: { in: ids } } })
      : { docs: [] },
    lastSeenOf(payload, ids),
  ])

  const invites = invitesRes.docs as any[]
  const accepted = invites.filter((i) => i.status === 'accepted' && relId(i.employee) != null)
  const empIds = [...new Set(accepted.map((i) => String(relId(i.employee))))]

  const [empUsers, empInfos, cvsRes, portRes] = empIds.length
    ? await Promise.all([
        safeFind(payload, { collection: 'users', where: { id: { in: empIds } } }),
        safeFind(payload, { collection: 'personal-information', where: { user: { in: empIds } } }),
        safeFind(payload, {
          collection: CV_COLLECTION,
          where: { and: [{ user: { in: empIds } }, { hidden: { not_equals: true } }] },
        }),
        safeFind(payload, {
          collection: PORTFOLIO_COLLECTION,
          where: { and: [{ user: { in: empIds } }, { hidden: { not_equals: true } }] },
        }),
      ])
    : [{ docs: [] }, { docs: [] }, { docs: [] }, { docs: [] }]

  /* ── lookups ── */
  const userBy = new Map((usersRes.docs as any[]).map((u) => [String(u.id), u]))
  const empUserBy = new Map((empUsers.docs as any[]).map((u) => [String(u.id), u]))
  const empInfoBy = new Map((empInfos.docs as any[]).map((p) => [String(relId(p.user)), p]))
  const empName = (id: string) => {
    const p: any = empInfoBy.get(id)
    const u: any = empUserBy.get(id)
    return (
      [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() || u?.name || u?.email || '—'
    )
  }
  const cvsBy = new Map<string, any[]>()
  for (const c of cvsRes.docs as any[]) {
    const k = String(relId(c.user))
    cvsBy.set(k, [...(cvsBy.get(k) ?? []), c])
  }
  const portBy = new Map<string, number>()
  for (const p of portRes.docs as any[])
    portBy.set(String(relId(p.user)), (portBy.get(String(relId(p.user))) ?? 0) + 1)
  const weeklyBy = new Map((availRes.docs as any[]).map((a) => [String(relId(a.manager)), a]))
  const weekOf = (managerId: string) => toMyAvailability(weeklyBy.get(managerId)).weekly
  const reqDtos = (timeOffRes.docs as any[]).map((r) => toRequestDto(r, names))

  const report = empty
  const attention: AttentionItem[] = []
  const typeDays = new Map<TimeOffType, number>()
  const nowMs = now.getTime()

  /** Approved working days inside [a, b] for one request. */
  const daysIn = (r: any, a: string, b: string) => {
    const s = r.startDate > a ? r.startDate : a
    const e = r.endDate < b ? r.endDate : b
    if (s > e) return 0
    return countWorkingDays(
      s,
      e,
      weekOf(String(relId(r.manager))),
      r.startDate === r.endDate ? (r.halfDay ?? 'none') : 'none',
    )
  }

  /* ── per manager ── */
  const rows: ManagerReportRow[] = ids
    .map((id) => {
      const info = names.get(id)
      const user: any = userBy.get(id)
      const myInvites = invites.filter((i) => String(relId(i.manager)) === id)
      const myAccepted = myInvites.filter(
        (i) => i.status === 'accepted' && relId(i.employee) != null,
      )
      const teamIds = [...new Set(myAccepted.map((i) => String(relId(i.employee))))]
      const contracts = (teamContractsRes.docs as any[]).filter(
        (c) => String(relId(c.manager)) === id,
      )
      const interviews = (interviewsRes.docs as any[]).filter(
        (v) => String(relId(v.manager)) === id,
      )
      const timeOff = (timeOffRes.docs as any[]).filter((r) => String(relId(r.manager)) === id)

      const states = contracts.map((c) => ({
        c,
        s: contractState(c, today),
        end: dayOf(c.endDate),
      }))
      const employees: ReportEmployee[] = teamIds
        .map((eid) => {
          const inv = myAccepted.find((i) => String(relId(i.employee)) === eid)!
          // Latest contract this manager sent to this employee (drafts don't count).
          const latest = states
            .filter((x) => String(relId(x.c.employee)) === eid && x.s !== 'draft')
            .sort((a, b) => String(b.c.createdAt).localeCompare(String(a.c.createdAt)))[0]
          return {
            id: eid,
            name: empName(eid),
            joinedAt: inv.respondedAt ?? inv.updatedAt ?? null,
            accessLevel: level(inv.accessLevel),
            cvs: (cvsBy.get(eid) ?? []).length,
            portfolio: portBy.get(eid) ?? 0,
            contract: latest?.s ?? null,
            contractEndsAt: latest?.c.endDate ?? null,
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

      const teamCvs = teamIds.flatMap((e) => cvsBy.get(e) ?? [])
      const mine = (myContractsRes.docs as any[]).filter((c) => String(relId(c.employee)) === id)
      const mineStates = mine.map((c) => ({ c, s: toMine(contractState(c, today)) }))
      const myContract =
        mineStates
          .map((x) => x.s)
          .sort((a, b) => MY_PRIORITY.indexOf(a) - MY_PRIORITY.indexOf(b))[0] ?? 'none'

      const avail = toMyAvailability(weeklyBy.get(id))
      const todayCell = dayCell(
        today,
        avail.weekly,
        { status: avail.status, statusUntil: avail.statusUntil, today },
        reqDtos.filter((r) => r.managerId === id),
      )

      const row: ManagerReportRow = {
        id,
        name: info?.name ?? '—',
        email: info?.email ?? '',
        jobTitle: info?.jobTitle ?? '',
        department: info?.department ?? '',
        createdAt: user?.createdAt ?? null,
        lastSeenAt: lastSeen.get(id) ?? null,
        today: {
          kind: todayCell.kind,
          ...(todayCell.timeOffType ? { timeOffType: todayCell.timeOffType } : {}),
        },
        team: teamIds.length,
        newInPeriod: myAccepted.filter((i) => inRange(dayOf(i.respondedAt), from, to)).length,
        leftInPeriod: myInvites.filter(
          (i) =>
            i.status === 'declined' &&
            i.revokedBy === 'employee' &&
            inRange(dayOf(i.respondedAt), from, to),
        ).length,
        pendingInvites: myInvites.filter((i) => i.status === 'pending').length,
        contracts: {
          active: states.filter((x) => x.s === 'active').length,
          awaitingEmployee: states.filter((x) => x.s === 'awaiting_employee').length,
          awaitingManager: states.filter((x) => x.s === 'awaiting_manager').length,
          sentInPeriod: contracts.filter((c) => inRange(dayOf(sentAt(c)), from, to)).length,
          signedInPeriod: contracts.filter((c) => inRange(dayOf(c.managerSignedAt), from, to))
            .length,
          expiringSoon: states.filter((x) => x.s === 'active' && x.end && x.end <= expiryUntil)
            .length,
        },
        interviews: {
          held: interviews.filter(
            (v) => v.status === 'completed' && inRange(dayOf(v.startAt), from, to),
          ).length,
          cancelled: interviews.filter(
            (v) => v.status === 'cancelled' && inRange(dayOf(v.startAt), from, to),
          ).length,
          noShow: interviews.filter(
            (v) => v.status === 'no_show' && inRange(dayOf(v.startAt), from, to),
          ).length,
          upcoming: interviews.filter(
            (v) =>
              v.status === 'scheduled' &&
              Date.parse(v.startAt) >= nowMs &&
              Date.parse(v.startAt) < nowMs + 7 * 86_400_000,
          ).length,
        },
        cvs: {
          total: teamCvs.length,
          newInPeriod: teamCvs.filter((c) => inRange(dayOf(c.createdAt), from, to)).length,
        },
        portfolio: teamIds.reduce((a, e) => a + (portBy.get(e) ?? 0), 0),
        daysOff: timeOff
          .filter((r) => r.status === 'approved')
          .reduce((a, r) => a + daysIn(r, from, to), 0),
        pendingTimeOff: timeOff.filter((r) => r.status === 'pending').length,
        myContract,
        employees,
      }

      /* ── this manager's "needs attention" ── */
      const base = { managerId: id, managerName: row.name }
      for (const { c, s } of mineStates) {
        if (s === 'awaiting_you')
          attention.push({
            ...base,
            key: `contract_to_sign:${c.id}`,
            kind: 'contract_to_sign',
            level: 'high',
            contractId: String(c.id),
            title: c.title ?? '',
            at: c.signedAt,
          })
        if (s === 'awaiting_manager' && (dayOf(sentAt(c)) ?? today) <= waitBefore)
          attention.push({
            ...base,
            key: `manager_contract_waiting:${c.id}`,
            kind: 'manager_contract_waiting',
            level: 'medium',
            contractId: String(c.id),
            title: c.title ?? '',
            at: sentAt(c),
          })
        const end = dayOf(c.endDate)
        if (s === 'active' && end && end <= expiryUntil)
          attention.push({
            ...base,
            key: `contract_expiring:${c.id}`,
            kind: 'contract_expiring',
            level: 'medium',
            contractId: String(c.id),
            title: c.title ?? '',
            at: c.endDate,
            forManager: true,
          })
      }
      if (myContract === 'none' || myContract === 'draft')
        attention.push({
          ...base,
          key: `manager_no_contract:${id}`,
          kind: 'manager_no_contract',
          level: 'medium',
          at: row.createdAt,
        })
      for (const { c, s, end } of states) {
        if (s === 'active' && end && end <= expiryUntil)
          attention.push({
            ...base,
            key: `contract_expiring:${c.id}`,
            kind: 'contract_expiring',
            level: 'medium',
            contractId: String(c.id),
            title: c.title ?? '',
            at: c.endDate,
            employeeName: empName(String(relId(c.employee))),
            employeeId: String(relId(c.employee)),
          })
      }
      const waitingLong = states.filter(
        (x) => x.s === 'awaiting_employee' && (dayOf(sentAt(x.c)) ?? today) <= waitBefore,
      ).length
      if (waitingLong)
        attention.push({
          ...base,
          key: `employee_contracts_waiting:${id}`,
          kind: 'employee_contracts_waiting',
          level: 'low',
          count: waitingLong,
        })
      if (row.contracts.awaitingManager)
        attention.push({
          ...base,
          key: `employee_contracts_to_sign:${id}`,
          kind: 'employee_contracts_to_sign',
          level: 'low',
          count: row.contracts.awaitingManager,
        })
      const oldInvites = myInvites.filter(
        (i) => i.status === 'pending' && (dayOf(i.createdAt) ?? today) <= waitBefore,
      ).length
      if (oldInvites)
        attention.push({
          ...base,
          key: `invitations_pending:${id}`,
          kind: 'invitations_pending',
          level: 'low',
          count: oldInvites,
        })
      const seen = dayOf(row.lastSeenAt)
      const created = dayOf(row.createdAt)
      if (seen ? seen <= addDaysStr(today, -INACTIVE_DAYS) : !!created && created <= waitBefore)
        attention.push({
          ...base,
          key: `manager_inactive:${id}`,
          kind: 'manager_inactive',
          level: 'low',
          at: row.lastSeenAt,
        })

      return row
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

  /* ── time off: pending (yours to answer) + days per type ── */
  for (const r of timeOffRes.docs as any[]) {
    const mid = String(relId(r.manager))
    if (r.status === 'pending') {
      attention.push({
        key: `time_off_pending:${r.id}`,
        kind: 'time_off_pending',
        level: 'high',
        managerId: mid,
        managerName: names.get(mid)?.name ?? '',
        title: r.type,
        at: r.startDate,
        count: Number(r.workingDays ?? 0),
      })
    } else {
      const d = daysIn(r, from, to)
      if (d) typeDays.set(r.type, (typeDays.get(r.type) ?? 0) + d)
    }
  }

  /* ── interviews today (yours + your managers') ── */
  const todays = (interviewsRes.docs as any[]).filter(
    (v) => v.status === 'scheduled' && dayOf(v.startAt) === today,
  )
  if (todays.length)
    attention.push({
      key: `interviews_today:${today}`,
      kind: 'interviews_today',
      level: 'low',
      count: todays.length,
      at: todays.map((v) => v.startAt).sort()[0],
    })

  /* ── totals ── */
  const teamContracts = (teamContractsRes.docs as any[]).filter((c) =>
    ids.includes(String(relId(c.manager))),
  )
  const teamInterviews = (interviewsRes.docs as any[]).filter((v) =>
    ids.includes(String(relId(v.manager))),
  )
  const count = <T>(list: T[], day: (x: T) => string | null, a: string, b: string) =>
    list.filter((x) => inRange(day(x), a, b)).length
  const kpi = <T>(list: T[], day: (x: T) => string | null) => ({
    value: count(list, day, from, to),
    previous: count(list, day, prevFrom, prevTo),
  })
  const completed = teamInterviews.filter((v) => v.status === 'completed')
  const allCvs = [...cvsBy.values()].flat()
  const approved = (timeOffRes.docs as any[]).filter((r) => r.status === 'approved')

  report.kpis = {
    newEmployees: kpi(accepted, (i) => dayOf(i.respondedAt)),
    contractsSent: kpi(teamContracts, (c) => dayOf(sentAt(c))),
    contractsSigned: kpi(teamContracts, (c) => dayOf(c.managerSignedAt)),
    interviewsHeld: kpi(completed, (v) => dayOf(v.startAt)),
    cvsCreated: kpi(allCvs, (c) => dayOf(c.createdAt)),
    daysOff: {
      value: approved.reduce((a, r) => a + daysIn(r, from, to), 0),
      previous: approved.reduce((a, r) => a + daysIn(r, prevFrom, prevTo), 0),
    },
  }
  report.snapshot = {
    managers: rows.length,
    activeManagers: rows.filter((r) => inRange(dayOf(r.lastSeenAt), from, to)).length,
    employees: empIds.length,
    activeContracts: rows.reduce((a, r) => a + r.contracts.active, 0),
    pendingInvitations: rows.reduce((a, r) => a + r.pendingInvites, 0),
    awayToday: rows.filter((r) => ['time_off', 'unavailable', 'off'].includes(r.today.kind)).length,
  }
  for (const i of accepted) {
    const b = bucketOf(buckets, dayOf(i.respondedAt) ?? '')
    if (b >= 0) report.series.newEmployees[b]!++
  }
  for (const c of teamContracts) {
    const b = bucketOf(buckets, dayOf(c.managerSignedAt) ?? '')
    if (b >= 0) report.series.contractsSigned[b]!++
  }
  for (const v of completed) {
    const b = bucketOf(buckets, dayOf(v.startAt) ?? '')
    if (b >= 0) report.series.interviewsHeld[b]!++
  }

  for (const c of teamContracts) {
    const s = contractState(c, today)
    if (s === 'draft') report.pipeline.draft++
    else if (s === 'awaiting_employee') report.pipeline.awaitingEmployee++
    else if (s === 'awaiting_manager') report.pipeline.awaitingManager++
    else if (s === 'active') {
      report.pipeline.active++
      const end = dayOf(c.endDate)
      if (end && end <= expiryUntil) report.pipeline.expiringSoon++
    } else if (s === 'ended') report.pipeline.ended++
    else report.pipeline.terminated++
  }
  report.interviewOutcomes = {
    completed: rows.reduce((a, r) => a + r.interviews.held, 0),
    cancelled: rows.reduce((a, r) => a + r.interviews.cancelled, 0),
    noShow: rows.reduce((a, r) => a + r.interviews.noShow, 0),
    upcoming: rows.reduce((a, r) => a + r.interviews.upcoming, 0),
  }
  report.timeOffByType = [...typeDays.entries()]
    .map(([type, days]) => ({ type, days }))
    .sort((a, b) => b.days - a.days)

  const LEVEL = { high: 0, medium: 1, low: 2 }
  report.attention = attention.sort(
    (a, b) =>
      LEVEL[a.level] - LEVEL[b.level] || String(a.at ?? '').localeCompare(String(b.at ?? '')),
  )
  report.managers = rows
  return report
}
