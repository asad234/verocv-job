// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/interviews/route.ts
// URL:            GET  /api/company/managers/interviews?from=ISO&to=ISO&status=scheduled&q=text
//                 POST /api/company/managers/interviews        (book an interview)
// WHAT IT DOES:   Manager: list own interviews / book a new one. Booking also creates the
//                 Google Calendar event + Google Meet link when Google Calendar is connected.
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/interviews/route.ts
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/managerDelegation'
import {
  InterviewInputError,
  STATUSES,
  checkLinkedEmployee,
  findConflicts,
  managerDisplayName,
  parseBooking,
  syncInterviewToCalendar,
  toInterviewDto,
} from '@/utils/server/interviews'

export async function GET(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const sp = req.nextUrl.searchParams
    const and: any[] = [{ manager: { equals: managerId } }]

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
    return NextResponse.json({ message: 'Failed to load interviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const body = await req.json().catch(() => null)
    const payload = await getPayload({ config })
    let booking: Record<string, unknown>
    try {
      booking = parseBooking(body)
      await checkLinkedEmployee(payload, managerId, booking)
    } catch (e) {
      if (e instanceof InterviewInputError)
        return NextResponse.json({ message: e.message, field: e.field }, { status: 400 })
      throw e
    }
    const google = { addToCalendar: true, sendInvite: true, ...((booking.google as object) ?? {}) }

    // `as any`: the body is validated by parseBooking / parseNotes / parseEvaluation above,
    // and Payload's generated types can't see that through Record<string, unknown>.
    const created = await payload.create({
      collection: 'interviews',
      data: {
        ...booking,
        google,
        manager: managerId,
        status: 'scheduled',
        interviewerName:
          (booking.interviewerName as string) || (await managerDisplayName(payload, managerId)),
      } as any,
      overrideAccess: true,
    })

    // Google Calendar + Meet. A Google problem never loses the booking — it comes back as a warning.
    let doc: any = created
    let warning = null
    if (google.addToCalendar) {
      const sync = await syncInterviewToCalendar(payload, managerId, created)
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

    const conflicts = await findConflicts(payload, managerId, doc.startAt, doc.endAt, doc.id)
    return NextResponse.json(
      { interview: toInterviewDto(doc), conflicts, warning },
      { status: 201 },
    )
  } catch (error) {
    console.error('❌ Failed to book interview:', error)
    return NextResponse.json({ message: 'Failed to book the interview' }, { status: 500 })
  }
}
