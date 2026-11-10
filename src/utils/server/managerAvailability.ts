// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/managerAvailability.ts   (REPLACE — now also reads the managers' own calendars)
// WHAT IT DOES:   Shared server code for availability + time off:
//   who is asking (manager themselves / their business admin), loading a manager's
//   week and requests, turning records into what the pages get, and building the
//   admin's grid of managers × days.
// ══════════════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import {
  dayCell,
  dayRange,
  normalizeWeek,
  todayStr,
  type ManagerAvailabilityRow,
  type ManualStatus,
  type MyAvailability,
  type TimeOffRequest,
  type CalendarStatus,
} from '@/utils/managerAvailability'

export const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

/** The logged-in manager (always their own account — never a covered colleague). */
export async function requireManagerSelf(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const id = Number(token?.id)
  if (!token?.id || !Number.isFinite(id) || token.roles !== 'client-manager') return null
  return id
}

export const MANUAL_STATUSES: ManualStatus[] = ['auto', 'available', 'limited', 'unavailable']

export async function findAvailabilityDoc(payload: any, managerId: number | string) {
  const { docs } = await payload.find({
    collection: 'manager-availability',
    where: { manager: { equals: managerId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (docs as any[])[0] ?? null
}

export function toMyAvailability(doc: any): MyAvailability {
  const today = todayStr()
  // An ended status goes back to "follow my week".
  const expired = !!doc?.statusUntil && doc.statusUntil < today
  return {
    weekly: normalizeWeek(doc?.weekly),
    status: !expired && MANUAL_STATUSES.includes(doc?.status) ? doc.status : 'auto',
    statusNote: expired ? '' : (doc?.statusNote ?? ''),
    statusUntil: expired ? '' : (doc?.statusUntil ?? ''),
    updatedAt: doc?.updatedAt ?? null,
  }
}

/** Display names: manager-info first + last name, else the account name / email. */
export async function managerNames(payload: any, ids: (string | number)[]) {
  const unique = [...new Set(ids.map(String).filter(Boolean))]
  const out = new Map<
    string,
    { name: string; email: string; jobTitle: string; department: string; createdBy: string | null }
  >()
  if (!unique.length) return out
  const [users, infos] = await Promise.all([
    payload.find({
      collection: 'users',
      where: { id: { in: unique } },
      limit: unique.length,
      depth: 0,
      overrideAccess: true,
    }),
    payload
      .find({
        collection: 'manager-info',
        where: { user: { in: unique } },
        limit: unique.length * 2,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] })),
  ])
  const infoBy = new Map((infos.docs as any[]).map((i) => [String(relId(i.user)), i]))
  for (const u of users.docs as any[]) {
    const i: any = infoBy.get(String(u.id))
    out.set(String(u.id), {
      name:
        [i?.firstName, i?.lastName].filter(Boolean).join(' ').trim() || u.name || u.email || '—',
      email: u.email ?? '',
      jobTitle: i?.jobTitle ?? '',
      department: i?.department?.department ?? '',
      createdBy: relId(u.createdBy) != null ? String(relId(u.createdBy)) : null,
    })
  }
  return out
}

export function toRequestDto(d: any, names: Map<string, { name: string }>): TimeOffRequest {
  return {
    id: String(d.id),
    managerId: String(relId(d.manager)),
    managerName: names.get(String(relId(d.manager)))?.name ?? '',
    type: d.type,
    startDate: d.startDate,
    endDate: d.endDate,
    halfDay: d.halfDay === 'am' || d.halfDay === 'pm' ? d.halfDay : 'none',
    workingDays: Number(d.workingDays ?? 0),
    note: d.note ?? '',
    status: d.status,
    decidedAt: d.decidedAt ?? null,
    decidedByName:
      relId(d.decidedBy) != null ? (names.get(String(relId(d.decidedBy)))?.name ?? '') : '',
    decisionNote: d.decisionNote ?? '',
    createdAt: d.createdAt,
  }
}

/** Requests of these managers that touch [from, to] (pending + approved). */
export async function activeRequestsIn(
  payload: any,
  managerIds: (string | number)[],
  from: string,
  to: string,
) {
  if (!managerIds.length) return [] as any[]
  const { docs } = await payload.find({
    collection: 'time-off-requests',
    where: {
      and: [
        { manager: { in: managerIds.map(String) } },
        { status: { in: ['pending', 'approved'] } },
        { startDate: { less_than_equal: to } },
        { endDate: { greater_than_equal: from } },
      ],
    },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return docs as any[]
}

/** The business admin's managers (a platform admin: all managers). */
export async function adminManagerIds(
  payload: any,
  admin: { id: number; role: string },
): Promise<string[]> {
  const { docs } = await payload.find({
    collection: 'users',
    where:
      admin.role === 'admin'
        ? { roles: { equals: 'client-manager' } }
        : { and: [{ roles: { equals: 'client-manager' } }, { createdBy: { equals: admin.id } }] },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return (docs as any[]).map((u) => String(u.id))
}

/** One row per manager with a day cell for every day in [from, to]. */
export async function buildRows(
  payload: any,
  managerIds: string[],
  from: string,
  to: string,
): Promise<ManagerAvailabilityRow[]> {
  if (!managerIds.length) return []
  const today = todayStr()
  const horizon = to > today ? to : today
  const [names, availRes, requests, upcoming, calRes] = await Promise.all([
    managerNames(payload, managerIds),
    payload.find({
      collection: 'manager-availability',
      where: { manager: { in: managerIds } },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    }),
    activeRequestsIn(payload, managerIds, from < today ? from : today, horizon),
    payload.find({
      collection: 'time-off-requests',
      where: {
        and: [
          { manager: { in: managerIds } },
          { status: { equals: 'approved' } },
          { endDate: { greater_than_equal: today } },
        ],
      },
      sort: 'startDate',
      pagination: false,
      depth: 0,
      overrideAccess: true,
    }),
    // What the managers marked in their own calendar (booked / available / vacation)
    payload
      .find({
        collection: 'availability',
        where: { user: { in: managerIds } },
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] })),
  ])
  const calBy = new Map<string, Map<string, CalendarStatus>>()
  for (const c of calRes.docs as any[]) {
    const m = new Map<string, CalendarStatus>()
    for (const e of c.dateStatus ?? []) {
      if (e?.status && e.status !== 'none') m.set(String(e.date).slice(0, 10), e.status)
    }
    calBy.set(String(relId(c.user)), m)
  }
  const availBy = new Map((availRes.docs as any[]).map((a) => [String(relId(a.manager)), a]))
  const days = dayRange(from, to)

  return managerIds
    .map((id): ManagerAvailabilityRow => {
      const doc = availBy.get(id)
      const mine = toMyAvailability(doc)
      const reqs = requests
        .filter((r) => String(relId(r.manager)) === id)
        .map((r) => toRequestDto(r, names))
      const status = { status: mine.status, statusUntil: mine.statusUntil, today }
      const next = (upcoming.docs as any[]).find((r) => String(relId(r.manager)) === id)
      const info = names.get(id)
      const cal = calBy.get(id)
      return {
        id,
        name: info?.name ?? '—',
        email: info?.email ?? '',
        jobTitle: info?.jobTitle ?? '',
        department: info?.department ?? '',
        status: mine.status,
        statusNote: mine.statusNote,
        statusUntil: mine.statusUntil,
        days: days.map((d) => dayCell(d, mine.weekly, status, reqs, cal?.get(d))),
        today: dayCell(today, mine.weekly, status, reqs, cal?.get(today)),
        nextTimeOff: next ? toRequestDto(next, names) : null,
        pendingCount: reqs.filter((r) => r.status === 'pending').length,
        hasSchedule: !!doc,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
}
