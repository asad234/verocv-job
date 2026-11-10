// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/company-logo/route.ts
// URL:            GET  /api/company/managers/company-logo
// WHAT IT DOES:   Manager: the company logo used on their most recent contract, so a
//                 new contract starts with the same logo. { logo: string | null }
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/company-logo/route.ts
// (Folders in parentheses don't change the URL.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/Contractaccess'

export async function GET(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'contract-documents',
      where: {
        and: [{ manager: { equals: managerId } }, { companyLogo: { exists: true } }],
      },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const logo =
      typeof docs[0]?.companyLogo === 'string' && docs[0].companyLogo ? docs[0].companyLogo : null
    return NextResponse.json({ logo }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to load company logo:', error)
    return NextResponse.json({ message: 'Failed to load company logo' }, { status: 500 })
  }
}
