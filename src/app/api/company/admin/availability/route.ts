// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/availability/route.ts   (NEW)
// URL:            GET /api/company/admin/availability?from=YYYY-MM-DD&days=7
// WHAT IT DOES:   The business admin's managers, each with a day-by-day availability
//                 (working week + time off + their status) for the chosen period.
//   → { data: ManagerAvailabilityRow[], from, to, today, pendingRequests }
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireCompanyAdmin } from '@/utils/server/adminmanagers'
import { addDaysStr, isValidDay, mondayOf, todayStr } from '@/utils/managerAvailability'
import { adminManagerIds, buildRows } from '@/utils/server/managerAvailability'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const sp = req.nextUrl.searchParams
    const today = todayStr()
    const fromParam = sp.get('from')
    const from = isValidDay(fromParam) ? fromParam : mondayOf(today)
    const days = Math.min(Math.max(Number(sp.get('days')) || 7, 1), 42)
    const to = addDaysStr(from, days - 1)

    const payload = await getPayload({ config })
    const ids = await adminManagerIds(payload, admin)
    const [rows, pending] = await Promise.all([
      buildRows(payload, ids, from, to),
      ids.length
        ? payload.count({
            collection: 'time-off-requests',
            where: { and: [{ manager: { in: ids } }, { status: { equals: 'pending' } }] },
            overrideAccess: true,
          })
        : { totalDocs: 0 },
    ])
    return NextResponse.json(
      { data: rows, from, to, today, pendingRequests: pending.totalDocs ?? 0 },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load manager availability:', error)
    return NextResponse.json({ message: 'Failed to load availability' }, { status: 500 })
  }
}
