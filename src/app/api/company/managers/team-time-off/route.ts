// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/team-time-off/route.ts   (NEW)
// URL:            GET /api/company/managers/team-time-off?status=pending|approved|declined|cancelled|all
// WHAT IT DOES:   Days-off requests from the manager's employees (+ a covered colleague's team).
//                 Pending first (oldest first), then the rest newest first.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerActor } from '@/utils/server/managerDelegation'
import { relId, toRequestDto } from '@/utils/server/managerAvailability'
import { managedEmployees, personNames } from '@/utils/server/teamAvailability'

const STATUSES = ['pending', 'approved', 'declined', 'cancelled']

export async function GET(req: NextRequest) {
  try {
    const actor = await requireManagerActor(req)
    if (!actor) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const status = req.nextUrl.searchParams.get('status') ?? 'all'
    const payload = await getPayload({ config })
    const { employees } = await managedEmployees(payload, actor.id)
    const ids = [...employees.keys()]
    if (!ids.length) return NextResponse.json({ data: [] }, { status: 200 })

    const and: any[] = [{ manager: { in: ids } }]
    if (STATUSES.includes(status)) and.push({ status: { equals: status } })
    const { docs } = await payload.find({
      collection: 'time-off-requests',
      where: { and },
      sort: '-createdAt',
      limit: 300,
      depth: 0,
      overrideAccess: true,
    })
    const list = docs as any[]
    const names = await personNames(payload, [
      ...ids,
      ...list.map((d) => relId(d.decidedBy)).filter(Boolean),
    ])
    const data = list.map((d) => ({
      ...toRequestDto(d, names),
      coveringFor: employees.get(String(relId(d.manager)))?.coveringFor,
    }))
    data.sort((a, b) =>
      a.status === 'pending' && b.status === 'pending'
        ? a.createdAt.localeCompare(b.createdAt)
        : a.status === 'pending'
          ? -1
          : b.status === 'pending'
            ? 1
            : b.createdAt.localeCompare(a.createdAt),
    )
    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load team time off:', error)
    return NextResponse.json({ message: 'Failed to load requests' }, { status: 500 })
  }
}
