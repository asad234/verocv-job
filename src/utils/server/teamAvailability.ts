// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/teamAvailability.ts   (NEW — server only)
// WHAT IT DOES:   Availability for EMPLOYEES (the same system managers use):
//   • requireEmployee      — the logged-in employee (role "client")
//   • employeeManagerIds   — the managers who may see / answer an employee's availability
//                            (accepted invitation with FULL access — availability is part of it)
//   • managedEmployees     — a manager's employees (full access) + the team of any colleague
//                            they're covering for right now
//   • calendarMap          — what employees marked in their calendar (`availability` collection)
//   • buildTeamRows        — the manager's grid: employees × days
//   Uses the same collections as managers: `manager-availability` (working week + status,
//   one row per person) and `time-off-requests` (field `manager` = the person asking).
// ══════════════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { delegationState } from '@/utils/delegations'
import {
  dayCell,
  dayRange,
  todayStr,
  type CalendarStatus,
  type TeamAvailabilityRow,
} from '@/utils/managerAvailability'
import {
  activeRequestsIn,
  relId,
  toMyAvailability,
  toRequestDto,
} from '@/utils/server/managerAvailability'

const ALL = { pagination: false, depth: 0, overrideAccess: true } as const
const CAL: CalendarStatus[] = ['booked', 'available', 'vacation', 'none']

/** The logged-in employee (role "client"). */
export async function requireEmployee(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const id = Number(token?.id)
  if (!token?.id || !Number.isFinite(id) || token.roles !== 'client') return null
  return id
}

/** Managers who see this employee's availability (accepted, full access). */
export async function employeeManagerIds(
  payload: any,
  employeeId: number | string,
): Promise<string[]> {
  const { docs } = await payload.find({
    collection: 'employee-invitations',
    where: { and: [{ employee: { equals: employeeId } }, { status: { equals: 'accepted' } }] },
    ...ALL,
  })
  return [
    ...new Set(
      (docs as any[])
        .filter((i) => !i.accessLevel || i.accessLevel === 'full')
        .map((i) => String(relId(i.manager))),
    ),
  ]
}

/**
 * A manager's employees whose availability they may see:
 *   own accepted invitations with full access
 *   + the same for every colleague they're covering for right now (tagged coveringFor).
 * `hidden` = employees connected with CV-only / portfolio-only access (availability not shared).
 */
export async function managedEmployees(payload: any, managerId: number) {
  const { docs: delegations } = await payload
    .find({
      collection: 'manager-delegations',
      where: { and: [{ delegate: { equals: managerId } }, { status: { equals: 'accepted' } }] },
      ...ALL,
    })
    .catch(() => ({ docs: [] }))
  const owners = (delegations as any[])
    .filter((d) => delegationState(d) === 'active')
    .map((d) => Number(relId(d.owner)))
  const managerIds = [managerId, ...owners.filter((o) => o !== managerId)]

  const { docs } = await payload.find({
    collection: 'employee-invitations',
    where: { and: [{ manager: { in: managerIds } }, { status: { equals: 'accepted' } }] },
    ...ALL,
  })
  const ownerNames = owners.length ? await personNames(payload, owners) : new Map()
  const out = new Map<string, { coveringFor?: { id: string; name: string } }>()
  const hidden = new Set<string>()
  // Own employees first, so an employee you share with a colleague counts as yours.
  const sorted = [...(docs as any[])].sort(
    (a, b) =>
      (Number(relId(a.manager)) === managerId ? -1 : 0) -
      (Number(relId(b.manager)) === managerId ? -1 : 0),
  )
  for (const inv of sorted) {
    const emp = relId(inv.employee)
    if (emp == null) continue
    const id = String(emp)
    const full = !inv.accessLevel || inv.accessLevel === 'full'
    if (!full) {
      if (!out.has(id)) hidden.add(id)
      continue
    }
    hidden.delete(id)
    if (out.has(id)) continue
    const mgr = Number(relId(inv.manager))
    out.set(
      id,
      mgr === managerId
        ? {}
        : { coveringFor: { id: String(mgr), name: ownerNames.get(String(mgr))?.name ?? '' } },
    )
  }
  return { employees: out, hidden: hidden.size }
}

/** Display names for anyone: personal information → manager info → account. */
export async function personNames(payload: any, ids: (string | number)[]) {
  const unique = [...new Set(ids.map(String).filter(Boolean))]
  const out = new Map<
    string,
    { name: string; email: string; jobTitle: string; department: string }
  >()
  if (!unique.length) return out
  const [users, personal, managers] = await Promise.all([
    payload.find({ collection: 'users', where: { id: { in: unique } }, ...ALL }),
    payload
      .find({ collection: 'personal-information', where: { user: { in: unique } }, ...ALL })
      .catch(() => ({ docs: [] })),
    payload
      .find({ collection: 'manager-info', where: { user: { in: unique } }, ...ALL })
      .catch(() => ({ docs: [] })),
  ])
  const pBy = new Map((personal.docs as any[]).map((p) => [String(relId(p.user)), p]))
  const mBy = new Map((managers.docs as any[]).map((m) => [String(relId(m.user)), m]))
  for (const u of users.docs as any[]) {
    const p: any = pBy.get(String(u.id))
    const m: any = mBy.get(String(u.id))
    const name = [p?.firstName ?? m?.firstName, p?.lastName ?? m?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim()
    out.set(String(u.id), {
      name: name || u.name || u.email || '—',
      email: u.email ?? '',
      jobTitle: p?.title ?? m?.jobTitle ?? '',
      department: m?.department?.department ?? '',
    })
  }
  return out
}

/** The employees' calendars: userId → (YYYY-MM-DD → status). */
export async function calendarMap(payload: any, ids: (string | number)[]) {
  const out = new Map<string, Map<string, CalendarStatus>>()
  if (!ids.length) return out
  const { docs } = await payload
    .find({ collection: 'availability', where: { user: { in: ids.map(String) } }, ...ALL })
    .catch(() => ({ docs: [] }))
  for (const d of docs as any[]) {
    const days = new Map<string, CalendarStatus>()
    for (const e of d.dateStatus ?? []) {
      const day = String(e?.date ?? '').slice(0, 10)
      if (day && CAL.includes(e.status)) days.set(day, e.status)
    }
    out.set(String(relId(d.user)), days)
  }
  return out
}

/** The manager's grid: one row per employee with a day cell for each day in [from, to]. */
export async function buildTeamRows(
  payload: any,
  team: Map<string, { coveringFor?: { id: string; name: string } }>,
  from: string,
  to: string,
): Promise<TeamAvailabilityRow[]> {
  const ids = [...team.keys()]
  if (!ids.length) return []
  const today = todayStr()
  const [names, availRes, requests, calendars, upcoming] = await Promise.all([
    personNames(payload, ids),
    payload.find({ collection: 'manager-availability', where: { manager: { in: ids } }, ...ALL }),
    activeRequestsIn(payload, ids, from < today ? from : today, to > today ? to : today),
    calendarMap(payload, ids),
    payload.find({
      collection: 'time-off-requests',
      where: {
        and: [
          { manager: { in: ids } },
          { status: { equals: 'approved' } },
          { endDate: { greater_than_equal: today } },
        ],
      },
      sort: 'startDate',
      ...ALL,
    }),
  ])
  const availBy = new Map((availRes.docs as any[]).map((a) => [String(relId(a.manager)), a]))
  const days = dayRange(from, to)

  return ids
    .map((id): TeamAvailabilityRow => {
      const doc = availBy.get(id)
      const mine = toMyAvailability(doc)
      const reqs = (requests as any[])
        .filter((r) => String(relId(r.manager)) === id)
        .map((r) => toRequestDto(r, names))
      const cal = calendars.get(id) ?? new Map<string, CalendarStatus>()
      const status = { status: mine.status, statusUntil: mine.statusUntil, today }
      const next = (upcoming.docs as any[]).find((r) => String(relId(r.manager)) === id)
      const info = names.get(id)
      const cells = days.map((d) => dayCell(d, mine.weekly, status, reqs, cal.get(d)))
      return {
        id,
        name: info?.name ?? '—',
        email: info?.email ?? '',
        jobTitle: info?.jobTitle ?? '',
        department: info?.department ?? '',
        status: mine.status,
        statusNote: mine.statusNote,
        statusUntil: mine.statusUntil,
        days: cells,
        today: dayCell(today, mine.weekly, status, reqs, cal.get(today)),
        nextTimeOff: next ? toRequestDto(next, names) : null,
        pendingCount: reqs.filter((r) => r.status === 'pending').length,
        hasSchedule: !!doc || cal.size > 0,
        bookedDays: cells.filter((c) => c.kind === 'booked').length,
        ...(team.get(id)?.coveringFor ? { coveringFor: team.get(id)!.coveringFor } : {}),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
}
