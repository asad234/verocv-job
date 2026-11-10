// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/employees/[id]/contracts/[contractId]/pdf/route.ts   (NEW)
// URL:            GET /api/company/admin/employees/:id/contracts/:contractId/pdf
//                 → the signed contract as a PDF (shown inline; add ?download=1 to download)
// WHAT IT DOES:   Lets the business admin read a contract between one of their managers
//                 and this employee — only once BOTH have signed. Uses the same stored
//                 signed PDF as the manager and the employee (ensureSignedPdf).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, requireCompanyAdmin } from '@/utils/server/adminmanagers'
import { employeeAccess } from '@/utils/server/adminEmployees'
import { ensureSignedPdf, readPdfFile } from '@/utils/server/contractPdf'

type Ctx = { params: Promise<{ id: string; contractId: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id, contractId } = await params
    const payload = await getPayload({ config })

    const access = await employeeAccess(payload, admin, id)
    if (!access) return NextResponse.json({ message: 'Employee not found' }, { status: 404 })

    const contract: any = await payload.findByID({
      collection: 'employee-contracts',
      id: contractId,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    // Must be this employee's contract, made by one of YOUR managers.
    const mine =
      contract &&
      String(relId(contract.employee)) === String(id) &&
      access.managers.some((m) => m.id === String(relId(contract.manager)))
    if (!mine) return NextResponse.json({ message: 'Contract not found' }, { status: 404 })
    if (!contract.signedAt || !contract.managerSignedAt) {
      return NextResponse.json(
        { message: 'The contract is not signed by both parties yet' },
        { status: 409 },
      )
    }

    const pdfDoc = await ensureSignedPdf(payload, contract.id)
    const bytes = pdfDoc ? await readPdfFile(pdfDoc) : null
    if (!bytes)
      return NextResponse.json({ message: 'The PDF could not be created' }, { status: 500 })

    const name = String(pdfDoc.filename || `contract-${contract.id}.pdf`).replace(/[^\w.\-]/g, '_')
    const download = req.nextUrl.searchParams.get('download') === '1'
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(bytes.length),
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${name}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('❌ Failed to load contract PDF:', error)
    return NextResponse.json({ message: 'Failed to load contract PDF' }, { status: 500 })
  }
}
