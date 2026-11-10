// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/myAvailabilityHandlers.ts   (NEW — server only)
// WHAT IT DOES:   "My availability" for anyone — the same code for managers and employees:
//   myAvailabilityHandlers(scope)  GET · PUT   working week + status (+ the next 14 days)
//   myTimeOffHandlers(scope)       GET · POST  my days-off requests
//   myTimeOffItemHandler(scope)    PATCH       withdraw / "I'm back"
//   The routes are one line each, e.g.
//     export const { GET, PUT } = myAvailabilityHandlers(EMPLOYEE_SELF)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  REPORTED_TYPES,
  TIME_OFF_TYPES,
  TIME_RE,
  addDaysStr,
  countWorkingDays,
  dayCell,
  dayRange,
  daysBetween,
  isValidDay,
  normalizeWeek,
  todayStr,
} from '@/utils/managerAvailability'
import {
  MANUAL_STATUSES,
  activeRequestsIn,
  findAvailabilityDoc,
  managerNames,
  relId,
  requireManagerSelf,
  toMyAvailability,
  toRequestDto,
} from '@/utils/server/managerAvailability'
import {
  calendarMap,
  employeeManagerIds,
  personNames,
  requireEmployee,
} from '@/utils/server/teamAvailability'

export interface SelfScope {
  /** The logged-in person, or null → 403 */
  self: (req: NextRequest) => Promise<number | null>
  /** Saved as `approver` on a request (managers: their business admin) */
  approver: (payload: any, me: number) => Promise<number | null>
  /** Is there anyone to send a (non-sick) request to? */
  canAsk: (payload: any, me: number) => Promise<boolean>
  /** Include the person's calendar (employees) in the day overview */
  calendar: boolean
  names: (payload: any, ids: (string | number)[]) => Promise<Map<string, { name: string }>>
}

export const MANAGER_SELF: SelfScope = {
  self: requireManagerSelf,
  approver: async (payload, me) => {
    const u: any = await payload.findByID({
      collection: 'users',
      id: me,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    return relId(u?.createdBy) ?? null
  },
  canAsk: async () => true,
  calendar: true, // the manager's own calendar marks (booked / available) count too
  names: managerNames,
}

export const EMPLOYEE_SELF: SelfScope = {
  self: requireEmployee,
  // An employee can have several managers — any of them (with full access) may answer.
  approver: async () => null,
  canAsk: async (payload, me) => (await employeeManagerIds(payload, me)).length > 0,
  calendar: true,
  names: personNames,
}

const fail = (message: string, status: number, field?: string) =>
  NextResponse.json({ message, field }, { status })
const noStore = { 'Cache-Control': 'private, no-store' }

/* ═════════════════════════ Working week + status ═════════════════════════ */

export function myAvailabilityHandlers(scope: SelfScope) {
  async function respond(payload: any, me: number, doc: any) {
    const mine = toMyAvailability(doc)
    const today = todayStr()
    const to = addDaysStr(today, 13)
    const [reqs, names, cal] = await Promise.all([
      activeRequestsIn(payload, [me], today, to),
      scope.names(payload, [me]),
      scope.calendar ? calendarMap(payload, [me]) : Promise.resolve(new Map()),
    ])
    const list = reqs.map((r: any) => toRequestDto(r, names))
    const myCal = cal.get(String(me))
    const status = { status: mine.status, statusUntil: mine.statusUntil, today }
    return NextResponse.json(
      {
        data: mine,
        days: dayRange(today, to).map((d) => dayCell(d, mine.weekly, status, list, myCal?.get(d))),
      },
      { status: 200, headers: noStore },
    )
  }

  return {
    async GET(req: NextRequest) {
      try {
        const me = await scope.self(req)
        if (me === null) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        return respond(payload, me, await findAvailabilityDoc(payload, me))
      } catch (error) {
        console.error('❌ Failed to load availability:', error)
        return fail('Failed to load availability', 500)
      }
    },

    async PUT(req: NextRequest) {
      try {
        const me = await scope.self(req)
        if (me === null) return fail('Not authorized', 403)
        const body = await req.json().catch(() => null)
        if (!body || typeof body !== 'object') return fail('Invalid body', 400)

        const data: Record<string, unknown> = {}
        if ('weekly' in body) {
          if (!Array.isArray(body.weekly)) return fail('Invalid working week', 400, 'weekly')
          for (const w of body.weekly) {
            if (
              w?.mode === 'partial' &&
              (!TIME_RE.test(w.start ?? '') || !TIME_RE.test(w.end ?? '') || w.start >= w.end)
            ) {
              return fail('Enter a start time before the end time', 400, `weekly.${w.day}`)
            }
          }
          data.weekly = normalizeWeek(body.weekly).map((w) => ({
            day: String(w.day),
            mode: w.mode,
            start: w.start,
            end: w.end,
          }))
        }
        if ('status' in body) {
          if (!MANUAL_STATUSES.includes(body.status)) return fail('Unknown status', 400, 'status')
          data.status = body.status
        }
        if ('statusNote' in body)
          data.statusNote =
            typeof body.statusNote === 'string' ? body.statusNote.trim().slice(0, 200) : ''
        if ('statusUntil' in body) {
          const u = body.statusUntil
          if (u && (!isValidDay(u) || u < todayStr()))
            return fail('Choose today or a later date', 400, 'statusUntil')
          data.statusUntil = u || null
        }
        if (data.status === 'auto') {
          data.statusNote = ''
          data.statusUntil = null
        }

        const payload = await getPayload({ config })
        const existing = await findAvailabilityDoc(payload, me)
        const saved = existing
          ? await payload.update({
              collection: 'manager-availability',
              id: existing.id,
              data: data as any,
              overrideAccess: true,
            })
          : await payload.create({
              collection: 'manager-availability',
              data: { ...data, manager: me } as any,
              overrideAccess: true,
            })
        return respond(payload, me, saved)
      } catch (error) {
        console.error('❌ Failed to save availability:', error)
        return fail('Failed to save availability', 500)
      }
    },
  }
}

/* ═════════════════════════ Days-off requests ═════════════════════════ */

export function myTimeOffHandlers(scope: SelfScope) {
  return {
    async GET(req: NextRequest) {
      try {
        const me = await scope.self(req)
        if (me === null) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        const { docs } = await payload.find({
          collection: 'time-off-requests',
          where: { manager: { equals: me } },
          sort: '-startDate',
          limit: 200,
          depth: 0,
          overrideAccess: true,
        })
        const names = await personNames(payload, [
          me,
          ...(docs as any[]).map((d) => relId(d.decidedBy)).filter(Boolean),
        ])
        return NextResponse.json(
          { data: (docs as any[]).map((d) => toRequestDto(d, names)) },
          { status: 200, headers: noStore },
        )
      } catch (error) {
        console.error('❌ Failed to load time off:', error)
        return fail('Failed to load requests', 500)
      }
    },

    async POST(req: NextRequest) {
      try {
        const me = await scope.self(req)
        if (me === null) return fail('Not authorized', 403)
        const body = await req.json().catch(() => null)
        if (!body || typeof body !== 'object') return fail('Invalid body', 400)

        const type = body.type
        if (!TIME_OFF_TYPES.includes(type)) return fail('Choose a type', 400, 'type')
        const { startDate, endDate } = body
        if (!isValidDay(startDate)) return fail('Choose a start date', 400, 'startDate')
        if (!isValidDay(endDate)) return fail('Choose an end date', 400, 'endDate')
        if (endDate < startDate)
          return fail('The end date is before the start date', 400, 'endDate')
        if (daysBetween(startDate, endDate) > 365)
          return fail('A request can be at most one year long', 400, 'endDate')

        const today = todayStr()
        const reported = REPORTED_TYPES.includes(type)
        const earliest = reported ? addDaysStr(today, -14) : today
        if (startDate < earliest)
          return fail(
            reported ? 'You can report at most 14 days back' : 'Choose today or a later date',
            400,
            'startDate',
          )

        const halfDay =
          startDate === endDate && (body.halfDay === 'am' || body.halfDay === 'pm')
            ? body.halfDay
            : 'none'
        const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : ''

        const payload = await getPayload({ config })
        if (!reported && !(await scope.canAsk(payload, me))) {
          return fail('You have no manager to send the request to yet', 409)
        }
        const { docs: overlapping } = await payload.find({
          collection: 'time-off-requests',
          where: {
            and: [
              { manager: { equals: me } },
              { status: { in: ['pending', 'approved'] } },
              { startDate: { less_than_equal: endDate } },
              { endDate: { greater_than_equal: startDate } },
            ],
          },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        if (overlapping.length)
          return fail('You already have a request for some of these days', 409, 'startDate')

        const [approver, availability] = await Promise.all([
          scope.approver(payload, me),
          findAvailabilityDoc(payload, me),
        ])
        const workingDays = countWorkingDays(
          startDate,
          endDate,
          toMyAvailability(availability).weekly,
          halfDay,
        )
        if (workingDays === 0 && !reported)
          return fail('These days are not working days in your week', 400, 'endDate')

        const created = await payload.create({
          collection: 'time-off-requests',
          data: {
            manager: me,
            approver,
            type,
            startDate,
            endDate,
            halfDay,
            workingDays,
            note,
            status: reported ? 'approved' : 'pending',
            ...(reported ? { decidedAt: new Date().toISOString() } : {}),
          } as any,
          overrideAccess: true,
        })
        return NextResponse.json(
          { data: toRequestDto(created, await scope.names(payload, [me])) },
          { status: 201 },
        )
      } catch (error) {
        console.error('❌ Failed to create time off request:', error)
        return fail('Failed to send the request', 500)
      }
    },
  }
}

export function myTimeOffItemHandler(scope: SelfScope) {
  return {
    async PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
      try {
        const me = await scope.self(req)
        if (me === null) return fail('Not authorized', 403)
        const { id } = await params
        const body = await req.json().catch(() => ({}))
        if (body?.action !== 'cancel') return fail('Unknown action', 400)

        const payload = await getPayload({ config })
        const doc: any = await payload.findByID({
          collection: 'time-off-requests',
          id,
          depth: 0,
          overrideAccess: true,
          disableErrors: true,
        })
        if (!doc || Number(relId(doc.manager)) !== me) return fail('Request not found', 404)
        const names = await scope.names(payload, [me])

        const today = todayStr()
        if (
          doc.status === 'approved' &&
          REPORTED_TYPES.includes(doc.type) &&
          doc.startDate <= today &&
          doc.endDate >= today
        ) {
          // Back from sick / VAB earlier: end it yesterday (or drop it if it started today).
          const updated =
            doc.startDate === today
              ? await payload.update({
                  collection: 'time-off-requests',
                  id,
                  data: { status: 'cancelled', cancelledAt: new Date().toISOString() } as any,
                  overrideAccess: true,
                })
              : await payload.update({
                  collection: 'time-off-requests',
                  id,
                  data: {
                    endDate: addDaysStr(today, -1),
                    workingDays: countWorkingDays(
                      doc.startDate,
                      addDaysStr(today, -1),
                      toMyAvailability(await findAvailabilityDoc(payload, me)).weekly,
                      doc.halfDay,
                    ),
                  } as any,
                  overrideAccess: true,
                })
          return NextResponse.json({ data: toRequestDto(updated, names) }, { status: 200 })
        }
        const cancellable =
          doc.status === 'pending' || (doc.status === 'approved' && doc.startDate > today)
        if (!cancellable) return fail('This request can no longer be withdrawn', 409)

        const updated = await payload.update({
          collection: 'time-off-requests',
          id,
          data: { status: 'cancelled', cancelledAt: new Date().toISOString() } as any,
          overrideAccess: true,
        })
        return NextResponse.json({ data: toRequestDto(updated, names) }, { status: 200 })
      } catch (error) {
        console.error('❌ Failed to cancel time off request:', error)
        return fail('Failed to withdraw the request', 500)
      }
    },
  }
}
