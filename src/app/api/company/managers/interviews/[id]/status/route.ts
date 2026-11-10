// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/interviews/[id]/status/route.ts
// URL:            POST /api/company/managers/interviews/:id/status
//                 { status: "completed" | "cancelled" | "no_show", reason?, notifyCandidate? }
// WHAT IT DOES:   Marks a scheduled interview as completed, cancelled or no-show.
//                 Cancelling removes the Google Calendar event (and, by default, Google
//                 emails the candidate that the interview is cancelled).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/Contractaccess'
import { findOwnInterview, removeFromCalendar, toInterviewDto } from '@/utils/server/interviews'

const TARGETS = ['completed', 'cancelled', 'no_show'] as const

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const status = body?.status
    if (!TARGETS.includes(status))
      return NextResponse.json({ message: 'Unknown status' }, { status: 400 })

    const payload = await getPayload({ config })
    const current = await findOwnInterview(payload, managerId, id)
    if (!current) return NextResponse.json({ message: 'Interview not found' }, { status: 404 })
    if (current.status !== 'scheduled') {
      return NextResponse.json(
        { message: 'Only scheduled interviews can change status.' },
        { status: 409 },
      )
    }

    const data: Record<string, unknown> = { status }
    if (typeof body?.reason === 'string' && body.reason.trim())
      data.cancelReason = body.reason.trim().slice(0, 2000)

    let warning = null
    if (status === 'cancelled') {
      const notify = body?.notifyCandidate !== false && current.google?.sendInvite !== false
      const removed = await removeFromCalendar(payload, managerId, current, notify)
      Object.assign(data, removed.data)
      warning = removed.warning
    }

    const doc = await payload.update({
      collection: 'interviews',
      id: current.id,
      data: data as any,
      overrideAccess: true,
    })
    return NextResponse.json({ interview: toInterviewDto(doc), warning }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to change interview status:', error)
    return NextResponse.json({ message: 'Failed to update the interview' }, { status: 500 })
  }
}
