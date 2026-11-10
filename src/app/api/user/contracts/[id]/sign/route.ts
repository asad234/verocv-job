// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/user/contracts/[id]/sign/route.ts
// URL:            POST  /api/user/contracts/:id/sign
// WHAT IT DOES:   Employee: sign a contract with VeroCV signing (POST).
//                 Afterwards the status is 'pending_manager_signature' and the manager is
//                 notified. The signed PDF is created once the manager has signed too.
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/user/contracts/[id]/sign/route.ts
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

/** A drawn or typed signature as a PNG — ~500 KB is far more than a signature needs. */
const MAX_SIGNATURE_CHARS = 700_000
const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/

// POST — the employee signs a contract with VeroCV signing.
// body: { fullName: string, signatureDataUrl: string, typedName?: string | null, consent: true }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const userId = await requireUserId(req)
    if (userId === null) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim().slice(0, 120) : ''
    const typedName =
      typeof body?.typedName === 'string' ? body.typedName.trim().slice(0, 120) : null
    const signatureDataUrl = typeof body?.signatureDataUrl === 'string' ? body.signatureDataUrl : ''

    if (body?.consent !== true) {
      return NextResponse.json(
        { message: 'You must confirm that you agree to the contract' },
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

    const contract = (await payload.findByID({
      collection: 'employee-contracts',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })) as any

    if (!contract || Number(relId(contract.employee)) !== userId || contract.status === 'draft') {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 })
    }
    if (contract.status !== 'pending_signature' || contract.signedAt) {
      return NextResponse.json(
        { message: 'This contract is not waiting for your signature' },
        { status: 409 },
      )
    }
    if (contract.signingMethod !== 'verocv') {
      return NextResponse.json(
        { message: 'This contract must be signed with BankID' },
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

    const updated = (await payload.update({
      collection: 'employee-contracts',
      id,
      overrideAccess: true,
      data: {
        signedAt: now,
        signedByName: fullName,
        signatureDataUrl,
        signatureTypedName: typedName || null,
        history: [
          ...(contract.history ?? []),
          {
            type: 'signed',
            date: now,
            note: `signing_method:verocv; user:${userId}; ip:${ip}; ua:${userAgent}`,
          },
        ],
      },
    })) as any

    // Status is now "pending_manager_signature" — the manager's notification bell
    // picks it up. The final PDF is created when the manager signs.
    return NextResponse.json(
      { data: { id: String(updated.id), status: updated.status, signedAt: updated.signedAt } },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to sign contract:', error)
    return NextResponse.json({ message: 'Failed to sign contract' }, { status: 500 })
  }
}
