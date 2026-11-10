// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/reports/route.ts   (NEW)
// URL:            GET /api/company/admin/reports?period=week|month|quarter|year
// WHAT IT DOES:   Everything the business admin's Reports page shows, built from real
//                 data (see utils/server/adminReports.ts). → { data: AdminReport }
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireCompanyAdmin } from '@/utils/server/adminmanagers'
import { buildAdminReport } from '@/utils/server/adminReports'
import { REPORT_PERIODS, type ReportPeriod } from '@/utils/adminReports'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const p = req.nextUrl.searchParams.get('period')
    const period: ReportPeriod = (REPORT_PERIODS as readonly string[]).includes(p ?? '')
      ? (p as ReportPeriod)
      : 'month'
    const payload = await getPayload({ config })
    const data = await buildAdminReport(payload, admin, period)
    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to build report:', error)
    return NextResponse.json({ message: 'Failed to load the report' }, { status: 500 })
  }
}
