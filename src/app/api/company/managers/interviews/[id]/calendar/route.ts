// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/interviews/[id]/calendar/route.ts
// URL:            POST /api/company/managers/interviews/:id/calendar
// WHAT IT DOES:   Adds / re-syncs a scheduled interview to the manager's Google Calendar
//                 and creates the Google Meet link (e.g. booked before Google was
//                 connected, or the last sync failed).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/Contractaccess'
import {
  findOwnInterview,
  syncInterviewToCalendar,
  toInterviewDto,
} from '@/utils/server/interviews'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params

    const payload = await getPayload({ config })
    const current = await findOwnInterview(payload, managerId, id)
    if (!current) return NextResponse.json({ message: 'Interview not found' }, { status: 404 })
    if (current.status !== 'scheduled') {
      return NextResponse.json(
        { message: 'Only scheduled interviews can be added to Google Calendar.' },
        { status: 409 },
      )
    }

    const target = { ...current, google: { ...(current.google ?? {}), addToCalendar: true } }
    const sync = await syncInterviewToCalendar(payload, managerId, target)
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
      return NextResponse.json(
        { message: sync.warning.message, code: sync.warning.code, interview: toInterviewDto(doc) },
        { status },
      )
    }
    return NextResponse.json({ interview: toInterviewDto(doc) }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to sync interview to Google Calendar:', error)
    return NextResponse.json({ message: 'Failed to sync with Google Calendar' }, { status: 500 })
  }
}
