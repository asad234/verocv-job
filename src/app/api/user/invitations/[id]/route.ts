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

// PATCH — the invited employee can:
//  - accept / decline a still-pending invitation
//  - revoke their own access on an already-accepted invitation (ending the
//    connection from their side, mirroring the manager's own revoke at
//    /api/company/managers/invitations/[id])
//
// Note: params is a Promise here (Next.js 15 route handler convention),
// matching every other dynamic route in this app — the previous version of
// this file destructured params synchronously instead, which is worth
// double-checking against your actual Next.js version if you haven't
// already hit an error from it.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const userId = await requireUserId(req)
    if (userId === null) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { action } = (await req.json()) as { action?: 'accept' | 'decline' | 'revoke' }
    if (action !== 'accept' && action !== 'decline' && action !== 'revoke') {
      return NextResponse.json(
        { message: 'action must be "accept", "decline", or "revoke"' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    const invitation = await payload.findByID({
      collection: 'employee-invitations',
      id,
      overrideAccess: true,
      disableErrors: true,
    })

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation not found' }, { status: 404 })
    }

    const employeeId =
      typeof invitation.employee === 'object'
        ? (invitation.employee as any)?.id
        : invitation.employee
    if (Number(employeeId) !== userId) {
      return NextResponse.json(
        { message: 'Not authorized to respond to this invitation' },
        { status: 403 },
      )
    }

    if (action === 'revoke') {
      if (invitation.status !== 'accepted') {
        return NextResponse.json(
          { message: 'Only an accepted invitation can be revoked' },
          { status: 400 },
        )
      }

      const updated = await payload.update({
        collection: 'employee-invitations',
        id,
        data: {
          status: 'declined',
          respondedAt: new Date().toISOString(),
          revokedBy: 'employee',
        },
        overrideAccess: true,
      })

      return NextResponse.json({ data: updated }, { status: 200 })
    }

    // action is 'accept' or 'decline'
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { message: 'This invitation has already been responded to' },
        { status: 409 },
      )
    }

    const updated = await payload.update({
      collection: 'employee-invitations',
      id,
      data: {
        status: action === 'accept' ? 'accepted' : 'declined',
        respondedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to respond to invitation:', error)
    return NextResponse.json({ message: 'Failed to respond to invitation' }, { status: 500 })
  }
}
