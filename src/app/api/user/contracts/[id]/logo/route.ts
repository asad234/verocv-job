// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/user/contracts/[id]/logo/route.ts
// URL:            GET  /api/user/contracts/:id/logo
// WHAT IT DOES:   Employee: the company logo of a contract sent to me, so the
//                 contract view can show the small logo and (once fully signed)
//                 the watermark. { logo: string | null }
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/user/contracts/[id]/logo/route.ts
// (Folders in parentheses don't change the URL. "[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { findContractDocument, relId, requireUserId } from '@/utils/server/Contractaccess'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const { id } = await params
    const payload = await getPayload({ config })

    const contract = (await payload
      .findByID({ collection: 'employee-contracts', id, depth: 0, overrideAccess: true })
      .catch(() => null)) as any

    // Only the employee the contract was sent to, and never drafts.
    if (!contract || relId(contract.employee) !== userId || contract.status === 'draft') {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 })
    }

    const content = await findContractDocument(payload, contract.id)
    const logo =
      typeof content?.companyLogo === 'string' && content.companyLogo ? content.companyLogo : null

    return NextResponse.json(
      { logo },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load contract logo:', error)
    return NextResponse.json({ message: 'Failed to load contract logo' }, { status: 500 })
  }
}
