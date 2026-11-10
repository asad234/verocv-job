// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/employees/[id]/route.ts   (NEW)
// URL:            GET /api/company/admin/employees/:id → { data: EmployeeProfile }
// WHAT IT DOES:   One employee, as far as the admin may see them. Contact details and
//                 employment details only when one of the managers has full access.
//                 Contracts (with their manager) are always listed; signed ones have a PDF.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { EmployeeProfile } from '@/utils/adminEmployees'
import { normalizeEmploymentDetails } from '@/utils/employmentDetails'
import { lastSeenOf, relId, requireCompanyAdmin } from '@/utils/server/adminmanagers'
import { docCounts, employeeAccess } from '@/utils/server/adminEmployees'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params
    const payload = await getPayload({ config })

    const access = await employeeAccess(payload, admin, id)
    if (!access) return NextResponse.json({ message: 'Employee not found' }, { status: 404 })

    const user: any = await payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    if (!user) return NextResponse.json({ message: 'Employee not found' }, { status: 404 })

    const [piRes, edRes, counts, seen, contractsRes] = await Promise.all([
      payload
        .find({
          collection: 'personal-information',
          where: { user: { equals: id } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] })),
      access.canSeeProfile
        ? payload
            .find({
              collection: 'employment-details',
              where: { user: { equals: id } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })
            .catch(() => ({ docs: [] }))
        : { docs: [] },
      docCounts(payload, [String(id)]),
      lastSeenOf(payload, [id]),
      // Contracts are the company's own agreements (manager ↔ employee), so the admin
      // sees them whatever the employee shares — but only those made by YOUR managers.
      payload
        .find({
          collection: 'employee-contracts',
          where: {
            and: [
              { employee: { equals: id } },
              { manager: { in: access.managers.map((m) => m.id) } },
            ],
          },
          sort: '-createdAt',
          limit: 50,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] })),
    ])
    const pi: any = (piRes.docs as any[])[0]
    const ed: any = (edRes.docs as any[])[0]
    const managerName = (mid: unknown) =>
      access.managers.find((m) => m.id === String(relId(mid)))?.name ?? ''

    const data: EmployeeProfile = {
      id: String(user.id),
      name:
        [pi?.firstName, pi?.lastName].filter(Boolean).join(' ').trim() || user.name || user.email,
      email: user.email || '',
      phone: access.canSeeProfile ? pi?.phoneNumber || '' : '',
      title: pi?.title || '',
      managers: access.managers,
      canSeeProfile: access.canSeeProfile,
      canSeeCvs: access.canSeeCvs,
      canSeePortfolio: access.canSeePortfolio,
      cvCount: access.canSeeCvs ? (counts.cvs.get(String(id)) ?? 0) : 0,
      portfolioCount: access.canSeePortfolio ? (counts.portfolio.get(String(id)) ?? 0) : 0,
      connectedAt: access.connectedAt,
      lastSeenAt: seen.get(String(id)) ?? null,
      personal:
        access.canSeeProfile && pi
          ? {
              firstName: pi.firstName ?? '',
              lastName: pi.lastName ?? '',
              title: pi.title ?? '',
              phone: pi.phoneNumber ?? '',
              workPhone: pi.workPhoneNumber ?? '',
              privateEmail: pi.privateEmail ?? '',
              workEmail: pi.workEmail ?? '',
              homeAddress: pi.homeAddress ?? '',
              professionalPresentation: pi.professionalPresentation ?? '',
              personalPresentation: pi.personalPresentation ?? '',
              linkedIn: pi.socialLinks?.linkedIn ?? '',
            }
          : null,
      employment:
        access.canSeeProfile && ed
          ? (normalizeEmploymentDetails(ed).data as unknown as Record<string, string>)
          : null,
      contracts: (contractsRes.docs as any[]).map((c) => ({
        id: String(c.id),
        title: c.title || c.name || '—',
        status: c.status || 'draft',
        managerName: managerName(c.manager),
        startDate: c.startDate ?? null,
        createdAt: c.createdAt,
        // Both parties have signed → the signed PDF can be opened.
        signed: Boolean(c.signedAt && c.managerSignedAt),
        signedAt:
          c.managerSignedAt && c.signedAt
            ? [c.signedAt, c.managerSignedAt].sort().reverse()[0]
            : null,
      })),
    }
    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load employee:', error)
    return NextResponse.json({ message: 'Failed to load employee' }, { status: 500 })
  }
}
