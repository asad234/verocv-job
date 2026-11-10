// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/employees/[id]/portfolio/route.ts   (NEW)
// URL:            GET /api/company/admin/employees/:id/portfolio → { data: PortfolioItem[] }
// WHAT IT DOES:   The employee's portfolio (images, videos, YouTube, links,
//                 documents). Hidden items are never returned. 403 when the
//                 managers only have "CV only" access.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireCompanyAdmin } from '@/utils/server/adminmanagers'
import {
  PORTFOLIO_COLLECTION,
  employeeAccess,
  normalisePortfolioItem,
} from '@/utils/server/adminEmployees'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params
    const payload = await getPayload({ config })
    const access = await employeeAccess(payload, admin, id)
    if (!access) return NextResponse.json({ message: 'Employee not found' }, { status: 404 })
    if (!access.canSeePortfolio)
      return NextResponse.json(
        { message: 'The employee has not shared their portfolio' },
        { status: 403 },
      )

    const { docs } = await payload.find({
      collection: PORTFOLIO_COLLECTION,
      where: { user: { equals: id } },
      sort: '-createdAt',
      limit: 200,
      depth: 2,
      overrideAccess: true,
    })
    const data = (docs as any[]).filter((d) => !d.hidden).map(normalisePortfolioItem)
    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load employee portfolio:', error)
    return NextResponse.json({ message: 'Failed to load portfolio' }, { status: 500 })
  }
}
