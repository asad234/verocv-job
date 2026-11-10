// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/home/route.ts   (NEW)
// URL:            GET /api/company/admin/home
// WHAT IT DOES:   What the business admin sees first on Dashboard → Home:
//   • report   — the same report as Reports (this week): to-do list ("needs your attention"),
//                numbers, and every manager with today's status (team lists left out)
//   • away     — managers away (approved days off) in the next 7 days
//   • interviews — your own interviews in the next 7 days
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireCompanyAdmin } from '@/utils/server/adminmanagers'
import { buildAdminReport } from '@/utils/server/adminReports'
import {
  activeRequestsIn,
  adminManagerIds,
  managerNames,
  toRequestDto,
} from '@/utils/server/managerAvailability'
import { addDaysStr, todayStr } from '@/utils/managerAvailability'
import type { AdminHomeData } from '@/utils/adminHome'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })
    const today = todayStr()
    const weekEnd = addDaysStr(today, 6)
    const now = Date.now()

    const ids = await adminManagerIds(payload, admin)
    const [report, requests, names, interviewsRes] = await Promise.all([
      buildAdminReport(payload, admin, 'week'),
      activeRequestsIn(payload, ids, today, weekEnd),
      managerNames(payload, ids),
      payload
        .find({
          collection: 'interviews',
          where: {
            and: [
              { manager: { equals: admin.id } },
              { status: { equals: 'scheduled' } },
              { startAt: { greater_than_equal: new Date(now - 60 * 60_000).toISOString() } },
              { startAt: { less_than: new Date(now + 7 * 86_400_000).toISOString() } },
            ],
          },
          sort: 'startAt',
          limit: 10,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] })),
    ])

    const away = (requests as any[])
      .filter((r) => r.status === 'approved')
      .map((r) => toRequestDto(r, names))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))

    const data: AdminHomeData = {
      // The home page doesn't list each manager's employees — keep the response small.
      report: { ...report, managers: report.managers.map((m) => ({ ...m, employees: [] })) },
      away,
      interviews: (interviewsRes.docs as any[])
        .filter((v) => Date.parse(v.startAt) + Number(v.durationMinutes ?? 45) * 60_000 >= now)
        .map((v) => ({
          id: String(v.id),
          name: v.candidateName ?? '',
          position: v.position ?? '',
          startAt: v.startAt,
          durationMinutes: Number(v.durationMinutes ?? 45),
          format: v.format ?? 'video',
          meetingLink: v.meetingLink ?? null,
          location: v.format === 'in_person' ? (v.location ?? '') : '',
        })),
    }
    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load admin home:', error)
    return NextResponse.json({ message: 'Failed to load' }, { status: 500 })
  }
}
