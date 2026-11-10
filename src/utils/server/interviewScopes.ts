// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/interviewScopes.ts   (NEW — server only)
// WHAT IT DOES:   The interview API as reusable route handlers, so the SAME
//                 interview system (collection "interviews", Google Calendar / Meet,
//                 notes, evaluation) works for more than one "interviewer → candidate" pair.
//
//   INTERVIEWER side (books, reschedules, evaluates):
//     interviewerListHandlers, interviewerItemHandlers, interviewerStatusHandler,
//     interviewerCalendarHandler, interviewerGoogleHandlers
//   CANDIDATE side (sees interviews booked with them):
//     candidateListHandler
//
//   Used by:
//     /api/company/admin/interviews/*         business admin interviews managers
//     /api/company/admin/google                admin's Google Calendar connection
//     /api/company/managers/my-interviews      manager sees interviews booked with them
//   The manager → candidate routes are unchanged. All the real work is done by your
//   existing utils/server/interviews.ts and utils/server/googleCalendar.ts.
//
//   In the database an admin's interview is a normal "interviews" row:
//     manager = the admin (interviewer)        employee = the manager (if linked)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  InterviewInputError,
  STATUSES,
  candidateHasAccount,
  findConflicts,
  findOwnInterview,
  managerDisplayName,
  parseBooking,
  parseEvaluation,
  parseNotes,
  removeFromCalendar,
  syncInterviewToCalendar,
  toInterviewDto,
} from '@/utils/server/interviews'
import { connectionStatus, disconnect } from '@/utils/server/googleCalendar'

const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)
const fail = (message: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ message, ...extra }, { status })

type Ctx = { params: Promise<{ id: string }> }

export interface Interviewer {
  /** Stored in interviews.manager (the interviewer). */
  id: number
  raw?: any
}

export interface InterviewerScope {
  interviewer: (req: NextRequest) => Promise<Interviewer | null>
  /** May this interviewer link this user as the candidate? (only called for a linked person) */
  canLinkCandidate: (payload: any, who: Interviewer, userId: number) => Promise<boolean>
  notAllowedMessage: string
}

async function checkCandidate(
  scope: InterviewerScope,
  payload: any,
  who: Interviewer,
  data: Record<string, unknown>,
) {
  if (data.employee == null) return
  if (!(await scope.canLinkCandidate(payload, who, Number(data.employee)))) {
    throw new InterviewInputError('employeeId', scope.notAllowedMessage)
  }
}

/** GET list (?from&to&status&q) · POST book. */
export function interviewerListHandlers(scope: InterviewerScope) {
  return {
    async GET(req: NextRequest) {
      try {
        const who = await scope.interviewer(req)
        if (!who) return fail('Not authorized', 403)
        const sp = req.nextUrl.searchParams
        const and: any[] = [{ manager: { equals: who.id } }]
        const from = sp.get('from')
        const to = sp.get('to')
        if (from && !Number.isNaN(Date.parse(from)))
          and.push({ startAt: { greater_than_equal: new Date(from).toISOString() } })
        if (to && !Number.isNaN(Date.parse(to)))
          and.push({ startAt: { less_than: new Date(to).toISOString() } })
        const status = sp.get('status')
        if (status && (STATUSES as readonly string[]).includes(status))
          and.push({ status: { equals: status } })
        const q = sp.get('q')?.trim()
        if (q)
          and.push({
            or: [
              { candidateName: { like: q } },
              { position: { like: q } },
              { candidateEmail: { like: q } },
            ],
          })

        const payload = await getPayload({ config })
        const { docs } = await payload.find({
          collection: 'interviews',
          where: { and },
          sort: '-startAt',
          limit: Math.min(Number(sp.get('limit')) || 500, 1000),
          depth: 0,
          overrideAccess: true,
        })
        return NextResponse.json({ data: (docs as any[]).map(toInterviewDto) }, { status: 200 })
      } catch (error) {
        console.error('❌ Failed to list interviews:', error)
        return fail('Failed to load interviews', 500)
      }
    },

    async POST(req: NextRequest) {
      try {
        const who = await scope.interviewer(req)
        if (!who) return fail('Not authorized', 403)
        const body = await req.json().catch(() => null)
        const payload = await getPayload({ config })
        let booking: Record<string, unknown>
        try {
          booking = parseBooking(body)
          await checkCandidate(scope, payload, who, booking)
        } catch (e) {
          if (e instanceof InterviewInputError) return fail(e.message, 400, { field: e.field })
          throw e
        }
        const google = {
          addToCalendar: true,
          sendInvite: true,
          ...((booking.google as object) ?? {}),
        }
        const created: any = await payload.create({
          collection: 'interviews',
          data: {
            ...booking,
            google,
            manager: who.id,
            status: 'scheduled',
            interviewerName:
              (booking.interviewerName as string) || (await managerDisplayName(payload, who.id)),
          } as any,
          overrideAccess: true,
        })

        let doc: any = created
        let warning = null
        if (google.addToCalendar) {
          const sync = await syncInterviewToCalendar(payload, who.id, created)
          warning = sync.warning
          if (Object.keys(sync.data).length) {
            doc = await payload.update({
              collection: 'interviews',
              id: created.id,
              data: sync.data as any,
              overrideAccess: true,
            })
          }
        }
        const conflicts = await findConflicts(payload, who.id, doc.startAt, doc.endAt, doc.id)
        const inApp = await candidateHasAccount(payload, doc)
        return NextResponse.json(
          { interview: toInterviewDto(doc), conflicts, warning, inApp },
          { status: 201 },
        )
      } catch (error) {
        console.error('❌ Failed to book interview:', error)
        return fail('Failed to book the interview', 500)
      }
    },
  }
}

const BOOKING_KEYS = [
  'candidateName',
  'candidateEmail',
  'candidatePhone',
  'position',
  'startAt',
  'durationMinutes',
  'timeZone',
  'format',
  'location',
  'messageToCandidate',
  'interviewerName',
  'meetingLink',
  'google',
  'employeeId',
]

/** GET one · PATCH reschedule / notes / evaluation · DELETE. */
export function interviewerItemHandlers(scope: InterviewerScope) {
  return {
    async GET(req: NextRequest, { params }: Ctx) {
      try {
        const who = await scope.interviewer(req)
        if (!who) return fail('Not authorized', 403)
        const { id } = await params
        const payload = await getPayload({ config })
        const doc = await findOwnInterview(payload, who.id, id)
        if (!doc) return fail('Interview not found', 404)
        return NextResponse.json({ interview: toInterviewDto(doc) }, { status: 200 })
      } catch (error) {
        console.error('❌ Failed to load interview:', error)
        return fail('Failed to load the interview', 500)
      }
    },

    async PATCH(req: NextRequest, { params }: Ctx) {
      try {
        const who = await scope.interviewer(req)
        if (!who) return fail('Not authorized', 403)
        const { id } = await params
        const body = await req.json().catch(() => null)
        if (!body || typeof body !== 'object') return fail('Invalid body', 400)
        const payload = await getPayload({ config })
        const current: any = await findOwnInterview(payload, who.id, id)
        if (!current) return fail('Interview not found', 404)

        const editsBooking = BOOKING_KEYS.some((k) => Object.prototype.hasOwnProperty.call(body, k))
        if (editsBooking && current.status !== 'scheduled')
          return fail('Only scheduled interviews can be rescheduled or edited.', 409)

        let data: Record<string, unknown> = {}
        try {
          if (editsBooking) {
            data = parseBooking(body, true)
            await checkCandidate(scope, payload, who, data)
          }
        } catch (e) {
          if (e instanceof InterviewInputError) return fail(e.message, 400, { field: e.field })
          throw e
        }
        if (data.google) data.google = { ...(current.google ?? {}), ...(data.google as object) }
        Object.assign(data, parseNotes(body) ?? {}, parseEvaluation(body) ?? {})
        if (Object.keys(data).length === 0)
          return NextResponse.json({ interview: toInterviewDto(current) }, { status: 200 })

        let doc: any = await payload.update({
          collection: 'interviews',
          id: current.id,
          data: data as any,
          overrideAccess: true,
        })
        let warning = null
        const togglesCalendar = typeof body.google?.addToCalendar === 'boolean'
        if (editsBooking && (current.google?.eventId || togglesCalendar)) {
          const sync = await syncInterviewToCalendar(payload, who.id, doc)
          warning = sync.warning
          if (Object.keys(sync.data).length) {
            doc = await payload.update({
              collection: 'interviews',
              id: doc.id,
              data: sync.data as any,
              overrideAccess: true,
            })
          }
        }
        const conflicts = editsBooking
          ? await findConflicts(payload, who.id, doc.startAt, doc.endAt, doc.id)
          : []
        return NextResponse.json(
          { interview: toInterviewDto(doc), conflicts, warning },
          { status: 200 },
        )
      } catch (error) {
        console.error('❌ Failed to update interview:', error)
        return fail('Failed to update the interview', 500)
      }
    },

    async DELETE(req: NextRequest, { params }: Ctx) {
      try {
        const who = await scope.interviewer(req)
        if (!who) return fail('Not authorized', 403)
        const { id } = await params
        const payload = await getPayload({ config })
        const doc: any = await findOwnInterview(payload, who.id, id)
        if (!doc) return fail('Interview not found', 404)
        const upcoming = doc.status === 'scheduled' && new Date(doc.startAt).getTime() > Date.now()
        await removeFromCalendar(payload, who.id, doc, upcoming && doc.google?.sendInvite !== false)
        await payload.delete({ collection: 'interviews', id: doc.id, overrideAccess: true })
        return NextResponse.json({ ok: true }, { status: 200 })
      } catch (error) {
        console.error('❌ Failed to delete interview:', error)
        return fail('Failed to delete the interview', 500)
      }
    },
  }
}

/** POST — completed / cancelled / no_show.  body: { status, reason?, notifyCandidate? } */
export function interviewerStatusHandler(scope: InterviewerScope) {
  const TARGETS = ['completed', 'cancelled', 'no_show']
  return async function POST(req: NextRequest, { params }: Ctx) {
    try {
      const who = await scope.interviewer(req)
      if (!who) return fail('Not authorized', 403)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const status = body?.status
      if (!TARGETS.includes(status)) return fail('Unknown status', 400)
      const payload = await getPayload({ config })
      const current: any = await findOwnInterview(payload, who.id, id)
      if (!current) return fail('Interview not found', 404)
      if (current.status !== 'scheduled')
        return fail('Only scheduled interviews can change status.', 409)

      const data: Record<string, unknown> = { status }
      if (typeof body?.reason === 'string' && body.reason.trim())
        data.cancelReason = body.reason.trim().slice(0, 2000)
      let warning = null
      if (status === 'cancelled') {
        const notify = body?.notifyCandidate !== false && current.google?.sendInvite !== false
        const removed = await removeFromCalendar(payload, who.id, current, notify)
        Object.assign(data, removed.data)
        warning = removed.warning
      }
      const doc = await payload.update({
        collection: 'interviews',
        id: current.id,
        data: data as any,
        overrideAccess: true,
      })
      const inApp = status === 'cancelled' ? await candidateHasAccount(payload, doc) : false
      return NextResponse.json({ interview: toInterviewDto(doc), warning, inApp }, { status: 200 })
    } catch (error) {
      console.error('❌ Failed to change interview status:', error)
      return fail('Failed to update the interview', 500)
    }
  }
}

/** POST — add to Google Calendar / create the Meet link now. */
export function interviewerCalendarHandler(scope: InterviewerScope) {
  return async function POST(req: NextRequest, { params }: Ctx) {
    try {
      const who = await scope.interviewer(req)
      if (!who) return fail('Not authorized', 403)
      const { id } = await params
      const payload = await getPayload({ config })
      const current: any = await findOwnInterview(payload, who.id, id)
      if (!current) return fail('Interview not found', 404)
      if (current.status !== 'scheduled')
        return fail('Only scheduled interviews can be added to Google Calendar.', 409)

      const target = { ...current, google: { ...(current.google ?? {}), addToCalendar: true } }
      const sync = await syncInterviewToCalendar(payload, who.id, target)
      const doc = await payload.update({
        collection: 'interviews',
        id: current.id,
        data: { google: target.google, ...sync.data } as any,
        overrideAccess: true,
      })
      if (sync.warning) {
        const status =
          sync.warning.code === 'not_connected' || sync.warning.code === 'reconnect_required'
            ? 409
            : sync.warning.code === 'not_configured'
              ? 503
              : 502
        return fail(sync.warning.message, status, {
          code: sync.warning.code,
          interview: toInterviewDto(doc),
        })
      }
      return NextResponse.json({ interview: toInterviewDto(doc) }, { status: 200 })
    } catch (error) {
      console.error('❌ Failed to sync interview to Google Calendar:', error)
      return fail('Failed to sync with Google Calendar', 500)
    }
  }
}

/** GET connection status · DELETE disconnect — the interviewer's own Google Calendar. */
export function interviewerGoogleHandlers(scope: InterviewerScope) {
  return {
    async GET(req: NextRequest) {
      try {
        const who = await scope.interviewer(req)
        if (!who) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        return NextResponse.json(await connectionStatus(payload, who.id), { status: 200 })
      } catch (error) {
        console.error('❌ Google status failed:', error)
        return fail('Could not load the Google Calendar connection.', 500)
      }
    },
    async DELETE(req: NextRequest) {
      try {
        const who = await scope.interviewer(req)
        if (!who) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        await disconnect(payload, who.id)
        return NextResponse.json(await connectionStatus(payload, who.id), { status: 200 })
      } catch (error) {
        console.error('❌ Google disconnect failed:', error)
        return fail('Could not disconnect Google Calendar.', 500)
      }
    },
  }
}

/* ═════════════════════════ CANDIDATE side ═════════════════════════ */

export interface CandidateScope {
  /** Logged-in candidate: user id + email, or null → 403. */
  candidate: (req: NextRequest) => Promise<{ id: number; email: string } | null>
}

/** GET — interviews booked with me (linked to my account or to my email), newest first. */
export function candidateListHandler(scope: CandidateScope) {
  return async function GET(req: NextRequest) {
    try {
      const me = await scope.candidate(req)
      if (!me) return fail('Not authorized', 403)
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'interviews',
        where: {
          and: [
            { manager: { not_equals: me.id } }, // never my own bookings as interviewer
            {
              or: [
                { employee: { equals: me.id } },
                ...(me.email ? [{ candidateEmail: { equals: me.email } }] : []),
              ],
            },
          ],
        },
        sort: '-startAt',
        limit: 200,
        depth: 0,
        overrideAccess: true,
      })
      const ids = [
        ...new Set((docs as any[]).map((d) => relId(d.manager)).filter((v) => v != null)),
      ]
      const users = ids.length
        ? ((
            await payload.find({
              collection: 'users',
              where: { id: { in: ids } },
              limit: ids.length,
              depth: 0,
              overrideAccess: true,
            })
          ).docs as any[])
        : []
      const byId = new Map(users.map((u) => [String(u.id), u]))

      const data = (docs as any[]).map((d) => {
        const m: any = byId.get(String(relId(d.manager))) ?? {}
        const scheduled = d.status === 'scheduled'
        return {
          id: String(d.id),
          status: d.status ?? 'scheduled',
          position: d.position ?? '',
          startAt: d.startAt,
          endAt: d.endAt ?? null,
          durationMinutes: Number(d.durationMinutes ?? 45),
          timeZone: d.timeZone ?? 'Europe/Stockholm',
          format: d.format ?? 'video',
          location: d.format === 'in_person' ? (d.location ?? '') : '',
          phone: d.format === 'phone' ? (d.candidatePhone ?? '') : '',
          meetingLink: scheduled ? (d.meetingLink ?? null) : null,
          message: d.messageToCandidate ?? '',
          interviewerName: d.interviewerName || m.name || m.email || '',
          cancelReason: d.status === 'cancelled' ? (d.cancelReason ?? '') : '',
          cancelledAt: d.status === 'cancelled' ? (d.cancelledAt ?? null) : null,
          rescheduledAt: d.rescheduledAt ?? null,
          previousStartAt: d.rescheduledAt ? (d.previousStartAt ?? null) : null,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }
      })
      return NextResponse.json(
        { data },
        { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
      )
    } catch (error) {
      console.error('❌ Failed to load my interviews:', error)
      return fail('Failed to load interviews', 500)
    }
  }
}
