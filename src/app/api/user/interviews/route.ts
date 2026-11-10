// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/user/interviews/route.ts
// URL:            GET /api/user/interviews
// WHAT IT DOES:   Employee: the interviews a manager booked with me — either linked to my
//                 account (picked from the manager's employees) or booked with my
//                 account's email. Used by the employee Interviews page + notification bell.
//
//                 PRIVATE manager data is never sent: interview notes, the evaluation
//                 form, the internal cancel reason and Google sync details stay server-side.
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/user/interviews/route.ts
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { normalizeEmail, relId, requireUserId } from '@/utils/server/Contractaccess'

/** What an employee may see about an interview booked with them. */
function toMyInterviewDto(d: any, managers: Map<string, any>) {
  const m = managers.get(String(relId(d.manager))) ?? {}
  const managerName =
    d.interviewerName || m.name || [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || ''
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
    // In-person address / the number the manager will call.
    location: d.format === 'in_person' ? (d.location ?? '') : '',
    phone: d.format === 'phone' ? (d.candidatePhone ?? '') : '',
    // The video link only matters while the interview is still on.
    meetingLink: scheduled ? (d.meetingLink ?? null) : null,
    message: d.messageToCandidate ?? '',
    interviewerName: managerName,
    companyName: (m.companyName || m.company?.name || '') as string,
    cancelledAt: d.cancelledAt ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const payload = await getPayload({ config })
    const me: any = await payload
      .findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true })
      .catch(() => null)
    const email = normalizeEmail(me?.email)

    const { docs } = await payload.find({
      collection: 'interviews',
      where: {
        or: [
          { employee: { equals: userId } },
          ...(email ? [{ candidateEmail: { equals: email } }] : []),
        ],
      },
      sort: '-startAt',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })

    const managerIds = [
      ...new Set((docs as any[]).map((d) => relId(d.manager)).filter((v) => v != null)),
    ]
    const managers = new Map<string, any>()
    if (managerIds.length) {
      const res = await payload.find({
        collection: 'users',
        where: { id: { in: managerIds } },
        limit: managerIds.length,
        depth: 0,
        overrideAccess: true,
      })
      for (const u of res.docs as any[]) managers.set(String(u.id), u)
    }

    return NextResponse.json(
      { data: (docs as any[]).map((d) => toMyInterviewDto(d, managers)) },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load my interviews:', error)
    return NextResponse.json({ message: 'Failed to load interviews' }, { status: 500 })
  }
}
