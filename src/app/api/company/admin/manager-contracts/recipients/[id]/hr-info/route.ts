// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/recipients/[id]/hr-info/route.ts   (NEW)
// URL:            GET  /api/company/admin/manager-contracts/recipients/:id/hr-info
// WHAT IT DOES:   Pre-fills the contract's "employee" part (name, address, title, phone)
//                 and the interview booking (name, phone, title)
//                 for one of the admin's managers — same shape as the manager's
//                 /employees/:id/hr-info so the contract form works unchanged.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { findManagerInfo, findOwnManager, requireCompanyAdmin } from '@/utils/server/adminmanagers'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params
    const payload = await getPayload({ config })
    const manager = await findOwnManager(payload, admin, id)
    if (!manager) return NextResponse.json({ message: 'Manager not found' }, { status: 404 })

    const [info, piRes]: any[] = await Promise.all([
      findManagerInfo(payload, manager.id),
      payload
        .find({
          collection: 'personal-information',
          where: { user: { equals: manager.id } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] })),
    ])
    const pi = piRes.docs?.[0]
    const [first, ...rest] = String(manager.name || '')
      .trim()
      .split(/\s+/)

    return NextResponse.json(
      {
        personalInformation: {
          firstName: info?.firstName || pi?.firstName || first || '',
          lastName: info?.lastName || pi?.lastName || rest.join(' '),
          homeAddress: info?.homeAddress || pi?.homeAddress || '',
          title: info?.jobTitle || pi?.title || '',
          phone: info?.phone || info?.mobilePhone || pi?.phoneNumber || '',
        },
        employmentDetails: null,
        hrInfo: { employmentInfo: { jobTitle: info?.jobTitle || '' } },
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load manager details:', error)
    return NextResponse.json({ message: 'Failed to load details' }, { status: 500 })
  }
}
