// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/employees/[id]/cvs/route.ts   (NEW)
// URL:            GET /api/company/admin/employees/:id/cvs → { data: CV[] }
// WHAT IT DOES:   The employee's CVs (full documents, so the page can render the
//                 PDF), newest first. Hidden CVs are never returned. 403 when the
//                 managers only have "Portfolio only" access.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireCompanyAdmin } from '@/utils/server/adminmanagers'
import { CV_COLLECTION, employeeAccess } from '@/utils/server/adminEmployees'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params
    const payload = await getPayload({ config })
    const access = await employeeAccess(payload, admin, id)
    if (!access) return NextResponse.json({ message: 'Employee not found' }, { status: 404 })
    if (!access.canSeeCvs)
      return NextResponse.json(
        { message: 'The employee has not shared their CVs' },
        { status: 403 },
      )

    const { docs } = await payload.find({
      collection: CV_COLLECTION,
      where: { and: [{ user: { equals: id } }, { hidden: { not_equals: true } }] },
      sort: '-updatedAt',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })
    return NextResponse.json(
      { data: docs },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load employee CVs:', error)
    return NextResponse.json({ message: 'Failed to load CVs' }, { status: 500 })
  }
}
