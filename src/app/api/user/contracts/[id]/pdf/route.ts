// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/user/contracts/[id]/pdf/route.ts
// URL:            GET  /api/user/contracts/:id/pdf
// WHAT IT DOES:   (available once BOTH parties have signed) Employee: download the signed contract PDF (GET).
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/user/contracts/[id]/pdf/route.ts
// (Folders in parentheses don't change the URL. "[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, requireUserId } from '@/utils/server/Contractaccess'
import { ensureSignedPdf, readPdfFile } from '@/utils/server/contractPdf'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await requireUserId(req)
    if (userId === null) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const payload = await getPayload({ config })
    const contract: any = await payload.findByID({
      collection: 'employee-contracts',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    if (!contract || Number(relId(contract.employee)) !== userId || contract.status === 'draft') {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 })
    }
    if (!contract.signedAt || !contract.managerSignedAt) {
      return NextResponse.json(
        { message: 'This contract has not been signed by both parties yet' },
        { status: 404 },
      )
    }

    const doc = await ensureSignedPdf(payload, contract.id)
    const file = doc ? await readPdfFile(doc) : null
    if (!file)
      return NextResponse.json({ message: 'The signed PDF could not be found' }, { status: 404 })

    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${doc.filename ?? `contract-${contract.id}.pdf`}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('❌ Failed to download signed PDF:', error)
    return NextResponse.json({ message: 'Failed to download PDF' }, { status: 500 })
  }
}
