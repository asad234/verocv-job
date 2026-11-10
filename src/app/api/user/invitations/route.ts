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

// GET — list invitations addressed to the logged-in user (any status, most
// recent first — the notification bell filters to 'pending', and separately
// to 'declined' + revokedBy: 'manager', on the client).
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'employee-invitations',
      where: { employee: { equals: userId } },
      sort: '-createdAt',
      limit: 50,
      overrideAccess: true,
    })

    // IMPORTANT: every field the frontend reads off an invitation needs to be
    // listed here explicitly — this mapping doesn't pass through the raw
    // Payload doc, so a field can exist in the database and still never
    // reach the browser if it's missing from this object. respondedAt and
    // revokedBy in particular are what let the notification bell detect
    // "a manager revoked this" vs "you declined this invite yourself".
    const data = result.docs.map((doc: any) => ({
      id: String(doc.id),
      bossName: doc.bossName,
      companyName: doc.companyName,
      status: doc.status,
      createdAt: doc.createdAt,
      respondedAt: doc.respondedAt ?? null,
      revokedBy: doc.revokedBy ?? null,
      accessLevel: doc.accessLevel ?? null,
      personalMessage: doc.personalMessage ?? null,
      bossJobTitle: doc.bossJobTitle ?? null,
      bossDepartment: doc.bossDepartment ?? null,
    }))

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to load invitations:', error)
    return NextResponse.json({ message: 'Failed to load invitations' }, { status: 500 })
  }
}
