// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/employee-contracts/route.ts
// URL:            GET · POST  /api/company/managers/employee-contracts
// WHAT IT DOES:   Manager: list own contracts (GET) and create a new draft (POST).
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/employee-contracts/route.ts
// (Folders in parentheses don't change the URL. "[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/managerDelegation'
import {
  CONTRACT_WRITABLE_FIELDS,
  DOCUMENT_WRITABLE_FIELDS,
  findContractDocument,
  isValidEmail,
  normalizeEmail,
  pickFields,
  requireAcceptedEmployee,
} from '@/utils/server/Contractaccess'

// GET — every contract this manager created (summary only), newest first.
export async function GET(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'employee-contracts',
      where: { manager: { equals: managerId } },
      sort: '-createdAt',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({ docs: result.docs }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to list contracts:', error)
    return NextResponse.json({ message: 'Failed to load contracts' }, { status: 500 })
  }
}

// POST — create a new draft. body: { contract: {...}, document: {...} }
export async function POST(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const body = (await req.json().catch(() => ({}))) as { contract?: any; document?: any }
    const payload = await getPayload({ config })

    // A manager may only link employees who accepted their invitation.
    const employeeId = body.contract?.employee ? Number(body.contract.employee) : null
    if (employeeId && !(await requireAcceptedEmployee(payload, managerId, employeeId))) {
      return NextResponse.json(
        { message: 'This employee has not accepted an invitation from you' },
        { status: 403 },
      )
    }

    const recipientEmail = normalizeEmail(body.contract?.recipientEmail)

    const created = await payload.create({
      collection: 'employee-contracts',
      data: {
        ...pickFields(body.contract, CONTRACT_WRITABLE_FIELDS),
        employee: employeeId,
        recipientEmail: recipientEmail && isValidEmail(recipientEmail) ? recipientEmail : null,
        manager: managerId,
      } as any,
      overrideAccess: true,
    })

    // The editor document was created by the collection hook — fill it in.
    if (body.document) {
      await payload.update({
        collection: 'contract-documents',
        where: { contract: { equals: created.id } },
        data: pickFields(body.document, DOCUMENT_WRITABLE_FIELDS) as any,
        overrideAccess: true,
      })
    }

    const [contract, document] = await Promise.all([
      payload.findByID({
        collection: 'employee-contracts',
        id: created.id,
        depth: 0,
        overrideAccess: true,
      }),
      findContractDocument(payload, created.id),
    ])

    return NextResponse.json({ contract, document }, { status: 201 })
  } catch (error) {
    console.error('❌ Failed to create contract:', error)
    return NextResponse.json(
      { message: (error as Error)?.message || 'Failed to save contract' },
      { status: 500 },
    )
  }
}
