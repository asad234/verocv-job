// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/user/contracts/[id]/route.ts
// URL:            GET  /api/user/contracts/:id
// WHAT IT DOES:   Employee: view one contract with its full text (GET).
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/user/contracts/[id]/route.ts
// (Folders in parentheses don't change the URL. "[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'

async function requireUserId(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  if (!token?.id) return null
  const id = Number(token.id)
  return Number.isFinite(id) ? id : null
}

const relId = (v: any) => (v == null ? null : typeof v === 'object' ? v.id : v)

// Events the employee sees in their timeline. Internal events
// ("created", "ai_drafted") and all internal notes are never sent.
const VISIBLE_EVENTS = new Set([
  'sent',
  'signed',
  'manager_signed',
  'renewed',
  'extended',
  'terminated',
])

// GET — one contract with its full text, for the employee it is addressed to.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const userId = await requireUserId(req)
    if (userId === null) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const contract = (await payload.findByID({
      collection: 'employee-contracts',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })) as any

    // Same 404 for "doesn't exist", "not yours" and "still a draft".
    if (!contract || Number(relId(contract.employee)) !== userId || contract.status === 'draft') {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 })
    }

    const managerId = relId(contract.manager)
    const [contentResult, manager] = await Promise.all([
      payload.find({
        collection: 'contract-documents',
        where: { contract: { equals: contract.id } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      }),
      managerId != null
        ? payload.findByID({
            collection: 'users',
            id: managerId,
            depth: 0,
            overrideAccess: true,
            disableErrors: true,
          })
        : Promise.resolve(null),
    ])
    const content = (contentResult.docs[0] ?? {}) as any

    const history = (contract.history ?? [])
      .filter((h: any) => VISIBLE_EVENTS.has(h?.type))
      .map((h: any) => ({ id: String(h.id), type: h.type, date: h.date }))
    const sentEvents = history.filter((h: any) => h.type === 'sent')

    return NextResponse.json(
      {
        data: {
          id: String(contract.id),
          title: contract.title ?? '',
          status: contract.status,
          displayStatus:
            contract.signedAt && !contract.managerSignedAt && contract.status !== 'terminated'
              ? 'pending_manager_signature'
              : (contract.displayStatus ?? contract.status),
          contractType: contract.contractType,
          employmentExtent: contract.employmentExtent,
          startDate: contract.startDate ?? null,
          endDate: contract.endDate ?? null,
          signingMethod: contract.signingMethod ?? null,
          signedAt: contract.signedAt ?? null,
          signedByName: contract.signedByName ?? null,
          signatureDataUrl: contract.signatureDataUrl ?? null,
          signatureTypedName: contract.signatureTypedName ?? null,
          bankIdSignedAt: contract.bankIdSignedAt ?? null,
          // ── Manager signature — needed for "fully signed" and the employer signature line ──
          managerSignedAt: contract.managerSignedAt ?? null,
          managerSignedByName: contract.managerSignedByName ?? null,
          managerSignatureDataUrl: contract.managerSignatureDataUrl ?? null,
          sentAt: sentEvents.length > 0 ? sentEvents[sentEvents.length - 1].date : null,
          history,
          managerName: (manager as any)?.name ?? '',
          employeeName: contract.employeeName ?? '',

          // Contract text + parties (from contract-documents)
          sections: content.sections ?? {},
          documentStyle: content.documentStyle ?? {},
          companyName: content.companyName ?? '',
          orgNumber: content.orgNumber ?? '',
          companyAddress: content.companyAddress ?? '',
          contactPerson: content.contactPerson ?? '',
          personalNumber: content.personalNumber ?? '',
          employeeAddress: content.employeeAddress ?? '',
          positionTitle: content.positionTitle || contract.employeeTitle || '',
          workplace: content.workplace ?? '',
          signingPlace: content.signingPlace ?? '',
          signingDate: content.signingDate ?? null,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to load contract:', error)
    return NextResponse.json({ message: 'Failed to load contract' }, { status: 500 })
  }
}
