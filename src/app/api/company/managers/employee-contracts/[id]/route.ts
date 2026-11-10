// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/employee-contracts/[id]/route.ts
// URL:            GET · PATCH · DELETE  /api/company/managers/employee-contracts/:id
// WHAT IT DOES:   Manager: load one contract (GET), save draft (PATCH), delete draft (DELETE).
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/employee-contracts/[id]/route.ts
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
  relId,
  requireAcceptedEmployee,
} from '@/utils/server/Contractaccess'

type Ctx = { params: Promise<{ id: string }> }

async function loadOwnContract(payload: any, id: string, managerId: number) {
  const contract = await payload.findByID({
    collection: 'employee-contracts',
    id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!contract || Number(relId(contract.manager)) !== managerId) return null
  return contract
}

// GET — full contract (summary + editor content) for the editor page.
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const payload = await getPayload({ config })
    const contract = await loadOwnContract(payload, id, managerId)
    if (!contract) return NextResponse.json({ message: 'Contract not found' }, { status: 404 })

    const document = await findContractDocument(payload, contract.id)
    return NextResponse.json({ contract, document }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to load contract:', error)
    return NextResponse.json({ message: 'Failed to load contract' }, { status: 500 })
  }
}

// PATCH — save a draft. body: { contract?: {...}, document?: {...} }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const body = (await req.json().catch(() => ({}))) as { contract?: any; document?: any }
    const payload = await getPayload({ config })

    const existing = await loadOwnContract(payload, id, managerId)
    if (!existing) return NextResponse.json({ message: 'Contract not found' }, { status: 404 })

    if (body.contract) {
      const data: Record<string, unknown> = pickFields(body.contract, CONTRACT_WRITABLE_FIELDS)

      if ('employee' in body.contract) {
        const employeeId = body.contract.employee ? Number(body.contract.employee) : null
        const changed =
          employeeId !==
          (relId(existing.employee) != null ? Number(relId(existing.employee)) : null)
        if (
          employeeId &&
          changed &&
          !(await requireAcceptedEmployee(payload, managerId, employeeId))
        ) {
          return NextResponse.json(
            { message: 'This employee has not accepted an invitation from you' },
            { status: 403 },
          )
        }
        data.employee = employeeId
      }
      if ('recipientEmail' in body.contract) {
        const email = normalizeEmail(body.contract.recipientEmail)
        data.recipientEmail = email && isValidEmail(email) ? email : null
      }

      await payload.update({
        collection: 'employee-contracts',
        id,
        data: data as any,
        overrideAccess: true,
      })
    }

    if (body.document) {
      if (existing.status !== 'draft') {
        return NextResponse.json(
          { message: 'This contract has been sent and can no longer be edited.' },
          { status: 409 },
        )
      }
      await payload.update({
        collection: 'contract-documents',
        where: { contract: { equals: existing.id } },
        data: pickFields(body.document, DOCUMENT_WRITABLE_FIELDS) as any,
        overrideAccess: true,
      })
    }

    const [contract, document] = await Promise.all([
      payload.findByID({ collection: 'employee-contracts', id, depth: 0, overrideAccess: true }),
      findContractDocument(payload, existing.id),
    ])
    return NextResponse.json({ contract, document }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to save contract:', error)
    return NextResponse.json(
      { message: (error as Error)?.message || 'Failed to save contract' },
      { status: 500 },
    )
  }
}

// DELETE — only drafts; sent contracts are legal records.
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const payload = await getPayload({ config })
    const contract = await loadOwnContract(payload, id, managerId)
    if (!contract) return NextResponse.json({ message: 'Contract not found' }, { status: 404 })
    if (contract.status !== 'draft') {
      return NextResponse.json({ message: 'Only drafts can be deleted' }, { status: 409 })
    }

    await payload.delete({ collection: 'employee-contracts', id, overrideAccess: true })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to delete contract:', error)
    return NextResponse.json({ message: 'Failed to delete contract' }, { status: 500 })
  }
}
