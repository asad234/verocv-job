// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/team-availability/route.ts   (NEW)
// URL:            GET /api/company/managers/team-availability?from=YYYY-MM-DD&days=7
// WHAT IT DOES:   The manager's employees (+ a covered colleague's team) × days:
//                 working week, status, approved / pending days off and their calendar.
//   → { data: TeamAvailabilityRow[], from, to, today, pendingRequests, hidden }
//     hidden = employees connected with CV-only / portfolio-only access (not shared)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerActor } from '@/utils/server/managerDelegation'
import { addDaysStr, isValidDay, mondayOf, todayStr } from '@/utils/managerAvailability'
import { buildTeamRows, managedEmployees } from '@/utils/server/teamAvailability'

export async function GET(req: NextRequest) {
  try {
    const actor = await requireManagerActor(req)
    if (!actor) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const sp = req.nextUrl.searchParams
    const today = todayStr()
    const fromParam = sp.get('from')
    const from = isValidDay(fromParam) ? fromParam : mondayOf(today)
    const days = Math.min(Math.max(Number(sp.get('days')) || 7, 1), 42)
    const to = addDaysStr(from, days - 1)

    const payload = await getPayload({ config })
    const { employees, hidden } = await managedEmployees(payload, actor.id)
    const ids = [...employees.keys()]
    const [rows, pending] = await Promise.all([
      buildTeamRows(payload, employees, from, to),
      ids.length
        ? payload.count({
            collection: 'time-off-requests',
            where: { and: [{ manager: { in: ids } }, { status: { equals: 'pending' } }] },
            overrideAccess: true,
          })
        : { totalDocs: 0 },
    ])
    return NextResponse.json(
      { data: rows, from, to, today, pendingRequests: pending.totalDocs ?? 0, hidden },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load team availability:', error)
    return NextResponse.json({ message: 'Failed to load availability' }, { status: 500 })
  }
}
