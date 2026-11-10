// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/interviews/[id]/route.ts
// URL:            GET    /api/company/managers/interviews/:id
//                 PATCH  /api/company/managers/interviews/:id
//                          booking fields (reschedule / edit — scheduled interviews only),
//                          { notes } and/or { evaluation } (any status)
//                 DELETE /api/company/managers/interviews/:id    (also removes the Google event)
// WHAT IT DOES:   One interview of the logged-in manager.
//
// If your app folder has no "(frontend)" group, use the same path without it.
// ("[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/managerDelegation'
import {
  InterviewInputError,
  checkLinkedEmployee,
  findConflicts,
  findOwnInterview,
  parseBooking,
  parseEvaluation,
  parseNotes,
  removeFromCalendar,
  syncInterviewToCalendar,
  toInterviewDto,
} from '@/utils/server/interviews'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params
    const payload = await getPayload({ config })
    const doc = await findOwnInterview(payload, managerId, id)
    if (!doc) return NextResponse.json({ message: 'Interview not found' }, { status: 404 })
    return NextResponse.json({ interview: toInterviewDto(doc) }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to load interview:', error)
    return NextResponse.json({ message: 'Failed to load the interview' }, { status: 500 })
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

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object')
      return NextResponse.json({ message: 'Invalid body' }, { status: 400 })

    const payload = await getPayload({ config })
    const current = await findOwnInterview(payload, managerId, id)
    if (!current) return NextResponse.json({ message: 'Interview not found' }, { status: 404 })

    const editsBooking = BOOKING_KEYS.some((k) => Object.prototype.hasOwnProperty.call(body, k))
    if (editsBooking && current.status !== 'scheduled') {
      return NextResponse.json(
        { message: 'Only scheduled interviews can be rescheduled or edited.' },
        { status: 409 },
      )
    }

    let data: Record<string, unknown> = {}
    try {
      if (editsBooking) {
        data = parseBooking(body, true)
        await checkLinkedEmployee(payload, managerId, data)
      }
    } catch (e) {
      if (e instanceof InterviewInputError)
        return NextResponse.json({ message: e.message, field: e.field }, { status: 400 })
      throw e
    }
    if (data.google) data.google = { ...(current.google ?? {}), ...(data.google as object) }
    Object.assign(data, parseNotes(body) ?? {}, parseEvaluation(body) ?? {})

    if (Object.keys(data).length === 0)
      return NextResponse.json({ interview: toInterviewDto(current) }, { status: 200 })

    // `as any`: the body is validated by parseBooking / parseNotes / parseEvaluation above,
    // and Payload's generated types can't see that through Record<string, unknown>.
    let doc: any = await payload.update({
      collection: 'interviews',
      id: current.id,
      data: data as any,
      overrideAccess: true,
    })

    // Keep Google Calendar in step when the booking changed and the interview is (or should be) in the calendar.
    let warning = null
    const togglesCalendar = typeof body.google?.addToCalendar === 'boolean'
    if (editsBooking && (current.google?.eventId || togglesCalendar)) {
      const sync = await syncInterviewToCalendar(payload, managerId, doc)
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
      ? await findConflicts(payload, managerId, doc.startAt, doc.endAt, doc.id)
      : []
    return NextResponse.json(
      { interview: toInterviewDto(doc), conflicts, warning },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to update interview:', error)
    return NextResponse.json({ message: 'Failed to update the interview' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params
    const payload = await getPayload({ config })
    const doc = await findOwnInterview(payload, managerId, id)
    if (!doc) return NextResponse.json({ message: 'Interview not found' }, { status: 404 })

    // An upcoming interview: tell the candidate it's cancelled (Google sends the email).
    const upcoming = doc.status === 'scheduled' && new Date(doc.startAt).getTime() > Date.now()
    await removeFromCalendar(payload, managerId, doc, upcoming && doc.google?.sendInvite !== false)

    await payload.delete({ collection: 'interviews', id: doc.id, overrideAccess: true })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to delete interview:', error)
    return NextResponse.json({ message: 'Failed to delete the interview' }, { status: 500 })
  }
}
