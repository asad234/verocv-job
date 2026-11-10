// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/employee-contracts/[id]/sign/route.ts
// URL:            POST  /api/company/managers/employee-contracts/:id/sign
// WHAT IT DOES:   Manager: sign a contract the employee has already signed (POST).
//                 Completes the contract (status → active / fully signed) and
//                 creates the signed PDF with both signatures in 'contract-pdfs'.
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/employee-contracts/[id]/sign/route.ts
// (Folders in parentheses don't change the URL. "[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, requireManagerId } from '@/utils/server/Contractaccess'
import { ensureSignedPdf } from '@/utils/server/contractPdf'

const MAX_SIGNATURE_CHARS = 700_000
const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/

// body: { fullName: string, signatureDataUrl: string, typedName?: string | null, consent: true }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const body = (await req.json().catch(() => ({}))) as {
      fullName?: string
      signatureDataUrl?: string
      typedName?: string | null
      consent?: boolean
    }
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 120) : ''
    const typedName =
      typeof body.typedName === 'string' ? body.typedName.trim().slice(0, 120) : null
    const signatureDataUrl = typeof body.signatureDataUrl === 'string' ? body.signatureDataUrl : ''

    if (body.consent !== true) {
      return NextResponse.json(
        { message: 'You must confirm that you sign on behalf of the employer' },
        { status: 400 },
      )
    }
    if (fullName.length < 2) {
      return NextResponse.json({ message: 'Your full name is required' }, { status: 400 })
    }
    if (
      !signatureDataUrl ||
      signatureDataUrl.length > MAX_SIGNATURE_CHARS ||
      !PNG_DATA_URL.test(signatureDataUrl)
    ) {
      return NextResponse.json({ message: 'A valid signature is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const contract: any = await payload.findByID({
      collection: 'employee-contracts',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    if (!contract || Number(relId(contract.manager)) !== managerId) {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 })
    }
    if (contract.status === 'terminated') {
      return NextResponse.json({ message: 'This contract has been terminated' }, { status: 409 })
    }
    if (!contract.signedAt) {
      return NextResponse.json(
        { message: 'The employee has not signed this contract yet' },
        { status: 409 },
      )
    }
    if (contract.managerSignedAt) {
      return NextResponse.json(
        { message: 'You have already signed this contract' },
        { status: 409 },
      )
    }

    // Audit trail for the electronic signature.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = (req.headers.get('user-agent') ?? 'unknown').slice(0, 200)
    const now = new Date().toISOString()

    await payload.update({
      collection: 'employee-contracts',
      id,
      overrideAccess: true,
      data: {
        managerSignedAt: now,
        managerSignedByName: fullName,
        managerSignatureDataUrl: signatureDataUrl,
        managerSignatureTypedName: typedName || null,
        history: [
          ...(contract.history ?? []),
          {
            type: 'manager_signed',
            date: now,
            note: `signing_method:verocv; user:${managerId}; ip:${ip}; ua:${userAgent}`,
          },
        ],
      } as any,
    })

    // Both have signed → create the final PDF. A PDF problem never undoes the
    // signature; it's re-created automatically on the first download instead.
    let pdfGenerated = false
    try {
      pdfGenerated = !!(await ensureSignedPdf(payload, contract.id))
    } catch (pdfError) {
      console.error('❌ Signed, but the PDF could not be generated:', pdfError)
    }

    const updated = await payload.findByID({
      collection: 'employee-contracts',
      id,
      depth: 0,
      overrideAccess: true,
    })
    return NextResponse.json({ contract: updated, pdfGenerated }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to sign contract (manager):', error)
    return NextResponse.json({ message: 'Failed to sign contract' }, { status: 500 })
  }
}
