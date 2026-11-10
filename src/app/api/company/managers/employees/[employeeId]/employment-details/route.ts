// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/employees/[employeeId]/employment-details/route.ts
// URL:            GET /api/company/managers/employees/:employeeId/employment-details
//                 → { data: EmploymentDetailsData | null, updatedAt }
// WHAT IT DOES:   Manager: read-only view of an employee's own employment details,
//                 for the Employee Profile page. Only for employees who have
//                 ACCEPTED this manager's invitation with full access (salary data
//                 is personal information — CV-only / portfolio-only access gets 403).
//
// If your app folder has no "(frontend)" group, use the same path without it.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/managerDelegation'
import { normalizeEmploymentDetails } from '@/utils/employmentDetails'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const { employeeId: raw } = await params
    const employeeId = Number(raw)
    if (!Number.isFinite(employeeId))
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 })

    const payload = await getPayload({ config })

    const { docs: invites } = await payload.find({
      collection: 'employee-invitations',
      where: {
        and: [
          { manager: { equals: managerId } },
          { employee: { equals: employeeId } },
          { status: { equals: 'accepted' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const invite: any = invites[0]
    if (!invite) return NextResponse.json({ message: 'Employee not found' }, { status: 404 })
    // Older invitations have no accessLevel → treated as full access (same as the UI).
    if (invite.accessLevel && invite.accessLevel !== 'full') {
      return NextResponse.json(
        { message: 'Your access level does not include employment details' },
        { status: 403 },
      )
    }

    const { docs } = await payload.find({
      collection: 'employment-details',
      where: { user: { equals: employeeId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const doc: any = docs[0]

    return NextResponse.json(
      {
        data: doc ? normalizeEmploymentDetails(doc).data : null,
        updatedAt: doc?.updatedAt ?? null,
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load employee employment details:', error)
    return NextResponse.json({ message: 'Failed to load employment details' }, { status: 500 })
  }
}
