// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/employee-contracts/[id]/send/route.ts
// URL:            POST  /api/company/managers/employee-contracts/:id/send
// WHAT IT DOES:   Manager: send a contract for signature to a VeroCV employee account (POST).
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/employee-contracts/[id]/send/route.ts
// (Folders in parentheses don't change the URL. "[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  findContractDocument,
  isValidEmail,
  normalizeEmail,
  relId,
  requireManagerId,
} from '@/utils/server/Contractaccess'

// Must be filled before a contract can be sent (mirrors the editor's check).
const REQUIRED_ON_CONTRACT = ['employeeName', 'startDate']
const REQUIRED_ON_DOCUMENT = [
  'companyName',
  'orgNumber',
  'companyAddress',
  'personalNumber',
  'employeeAddress',
  'positionTitle',
  'workplace',
  'noticePeriod',
  'monthlySalaryAmount',
  'payDay',
  'vacationDaysPerYear',
  'hasCollectiveAgreement',
  'signingPlace',
  'signingDate',
]
const isBlank = (v: unknown) => v == null || String(v).trim() === ''

/* ═════════════════════════════════════════════════════════════
   POST /api/company/managers/employee-contracts/[id]/send
   body: { signingMethod: 'bankid' | 'verocv', recipientEmail?: string }

   Contracts are delivered inside VeroCV only (no email) — the employee
   sees them in their notification bell and on /dashboard/contracts.

   Recipient (must be a VeroCV employee account, like "Existing account"
   invitations):
   - An employee from the manager's list is linked → that account.
   - Otherwise recipientEmail must match an existing VeroCV employee account.
     Errors (data.code):
       recipient_required     → no email given / invalid email
       recipient_not_found    → no VeroCV account with that email
       recipient_not_employee → the account isn't an employee account
═════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const body = (await req.json().catch(() => ({}))) as {
      signingMethod?: string
      recipientEmail?: string
    }
    const method = body.signingMethod
    if (method !== 'bankid' && method !== 'verocv') {
      return NextResponse.json({ message: 'Invalid signing method' }, { status: 400 })
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
    if (contract.status !== 'draft') {
      return NextResponse.json({ message: 'This contract has already been sent' }, { status: 409 })
    }

    /* ── 1. Required information ── */
    const content: any = (await findContractDocument(payload, contract.id)) ?? {}
    const missing = [
      ...REQUIRED_ON_CONTRACT.filter((k) => isBlank(contract[k])),
      ...REQUIRED_ON_DOCUMENT.filter((k) => isBlank(content[k])),
    ]
    if (missing.length > 0) {
      return NextResponse.json(
        { message: 'Missing required information', missing },
        { status: 422 },
      )
    }

    /* ── 2. Recipient: a VeroCV employee account ── */
    let recipient: any = null
    const linkedId = relId(contract.employee)

    if (linkedId != null) {
      // Employee chosen from the manager's list.
      recipient = await payload.findByID({
        collection: 'users',
        id: linkedId,
        depth: 0,
        overrideAccess: true,
        disableErrors: true,
      })
      if (!recipient) {
        return NextResponse.json(
          {
            message:
              "The selected employee's account no longer exists. Enter the email of their VeroCV account instead.",
            code: 'recipient_required',
          },
          { status: 422 },
        )
      }
    } else {
      // No employee chosen → find the VeroCV account by email.
      const email = normalizeEmail(body.recipientEmail)
      if (!email || !isValidEmail(email)) {
        return NextResponse.json(
          {
            message: 'Enter the email of the employee’s VeroCV account',
            code: 'recipient_required',
          },
          { status: 422 },
        )
      }
      const { docs } = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      recipient = docs[0] ?? null
      if (!recipient) {
        return NextResponse.json(
          { message: 'No VeroCV account found with that email', code: 'recipient_not_found' },
          { status: 404 },
        )
      }
    }

    if (recipient.roles !== 'client') {
      return NextResponse.json(
        {
          message: 'This email does not belong to an employee account',
          code: 'recipient_not_employee',
        },
        { status: 400 },
      )
    }

    const employeeId = Number(recipient.id)
    const recipientEmail = normalizeEmail(recipient.email)

    /* ── 3. Mark as sent → appears in the employee's dashboard + notification bell ── */
    const now = new Date().toISOString()
    await payload.update({
      collection: 'employee-contracts',
      id,
      overrideAccess: true,
      data: {
        signingMethod: method,
        employee: employeeId,
        recipientEmail,
        history: [
          ...(contract.history ?? []),
          { type: 'sent', date: now, note: `signing_method:${method}; to_user:${employeeId}` },
        ],
      } as any,
    })

    const updated = await payload.findByID({
      collection: 'employee-contracts',
      id,
      depth: 0,
      overrideAccess: true,
    })
    return NextResponse.json(
      { contract: updated, recipientEmail, recipientName: recipient.name ?? '' },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to send contract:', error)
    return NextResponse.json({ message: 'Failed to send contract' }, { status: 500 })
  }
}
