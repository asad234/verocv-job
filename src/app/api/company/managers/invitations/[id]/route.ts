import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'

async function requireManagerId(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const role = token?.roles as string | undefined
  if (!token?.id || role !== 'client-manager') return null
  const id = Number(token.id)
  return Number.isFinite(id) ? id : null
}

// PATCH — manager revokes their own access to an employee's data.
//
// Mirrors the employee-side revoke at /api/user/invitations/[id]: either
// party to an accepted connection can end it. Reuses the existing
// status: "pending" | "accepted" | "declined" enum (setting it to
// "declined") rather than introducing a new "revoked" value, since several
// frontend files already type against that exact union — the optional
// `revokedBy` field is what actually distinguishes "they declined the
// invite" from "the connection was later ended by one side".
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const managerId = await requireManagerId(req)
    if (managerId === null) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const { action } = (await req.json()) as { action?: string }
    if (action !== 'revoke') {
      return NextResponse.json({ message: 'Unsupported action' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const doc = await payload.findByID({
      collection: 'employee-invitations',
      id,
      overrideAccess: true,
      disableErrors: true,
    })

    const docManagerId = typeof doc?.manager === 'object' ? doc.manager?.id : doc?.manager
    if (!doc || Number(docManagerId) !== managerId) {
      return NextResponse.json({ message: 'Invitation not found' }, { status: 404 })
    }

    if (doc.status !== 'accepted') {
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
        revokedBy: 'manager',
      },
      overrideAccess: true,
    })

    // TODO: once a real notifications mechanism exists (push, email, or a
    // dedicated notifications collection), notify the employee here that
    // this manager's access has ended. Today the employee's dashboard only
    // detects this by polling /api/user/invitations and noticing
    // status: "declined" + revokedBy: "manager" on their own next fetch.

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to revoke access:', error)
    return NextResponse.json({ message: 'Failed to revoke access' }, { status: 500 })
  }
}
