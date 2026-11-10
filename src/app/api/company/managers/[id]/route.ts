import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'

interface UpdateManagerBody {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  department?: string
  accessLevel?: string
  status?: 'active' | 'inactive' | 'pending'
}

async function requireBusinessAdmin(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const role = token?.roles as string | undefined
  if (!token || (role !== 'client-admin' && role !== 'admin')) return null
  return token
}

// Confirms the target id actually belongs to a client-manager, AND (unless the
// requester is a full admin) that this specific client-admin created them —
// otherwise any client-admin could edit/delete another business-admin's
// managers just by guessing/inspecting an id.
//
// Managers created before the createdBy field existed have no owner recorded
// at all (createdBy is null/undefined) — treating those as strictly "not
// yours" would make every legacy manager permanently uneditable/undeletable
// for everyone. So: unclaimed (no createdBy) managers are accessible to any
// client-admin, same as before tenant scoping existed. Only managers with an
// actual createdBy set are enforced against the requester.
async function loadManagerOrNull(
  payload: any,
  id: string,
  requesterId: number,
  requesterRole: string | undefined,
) {
  const doc = await payload.findByID({ collection: 'users', id, disableErrors: true })
  if (!doc || doc.roles !== 'client-manager') return null

  if (requesterRole !== 'admin') {
    const createdById = typeof doc.createdBy === 'object' ? doc.createdBy?.id : doc.createdBy
    if (createdById !== null && createdById !== undefined && Number(createdById) !== requesterId) {
      return null
    }
  }

  return doc
}

// GET — full profile: Users fields + everything the manager has saved via
// their own Manager Settings (manager-info)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params // ← Next.js 15: params is a Promise

    const token = await requireBusinessAdmin(req)
    if (!token) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const payload = await getPayload({ config })

    const target = await loadManagerOrNull(
      payload,
      id,
      Number(token.id),
      token.roles as string | undefined,
    )
    if (!target) {
      return NextResponse.json({ message: 'Manager not found' }, { status: 404 })
    }

    const infoResult = await payload.find({
      collection: 'manager-info',
      where: { user: { equals: id } },
      limit: 1,
      overrideAccess: true,
    })
    const info = infoResult.docs[0] ?? null

    return NextResponse.json(
      {
        data: {
          id: String(target.id),
          name: target.name || '',
          email: target.email || '',
          accessLevel: target.accessLevel || '',
          status: (target.status as 'active' | 'inactive' | 'pending') || 'active',
          createdAt: target.createdAt || null,
          info,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to load manager profile:', error)
    return NextResponse.json({ message: 'Failed to load manager profile' }, { status: 500 })
  }
}

// PATCH — edit a manager's details
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params // ← Next.js 15: params is a Promise

    const token = await requireBusinessAdmin(req)
    if (!token) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const payload = await getPayload({ config })

    const target = await loadManagerOrNull(
      payload,
      id,
      Number(token.id),
      token.roles as string | undefined,
    )
    if (!target) {
      return NextResponse.json({ message: 'Manager not found' }, { status: 404 })
    }

    const body = (await req.json()) as UpdateManagerBody

    // ── Users fields: name, email, accessLevel, status ──
    const userData: Record<string, unknown> = {}
    if (body.firstName !== undefined || body.lastName !== undefined) {
      const existingParts = (target.name || '').split(' ')
      const firstName = body.firstName ?? existingParts[0] ?? ''
      const lastName = body.lastName ?? existingParts.slice(1).join(' ') ?? ''
      userData.name = `${firstName} ${lastName}`.trim()
    }
    if (body.email !== undefined) userData.email = body.email
    if (body.accessLevel !== undefined) userData.accessLevel = body.accessLevel
    if (body.status !== undefined) userData.status = body.status

    let updated = target
    if (Object.keys(userData).length > 0) {
      updated = await payload.update({
        collection: 'users',
        id,
        data: userData,
        overrideAccess: true,
      })
    }

    // ── manager-info fields: phone, department (manager-editable, so live there) ──
    const infoData: Record<string, unknown> = {}
    if (body.phone !== undefined) infoData.phone = body.phone
    if (body.department !== undefined) infoData.department = { department: body.department }
    if (body.firstName !== undefined) infoData.firstName = body.firstName
    if (body.lastName !== undefined) infoData.lastName = body.lastName
    if (body.email !== undefined) infoData.email = body.email

    if (Object.keys(infoData).length > 0) {
      const existingInfo = await payload.find({
        collection: 'manager-info',
        where: { user: { equals: id } },
        limit: 1,
        overrideAccess: true,
      })

      if (existingInfo.docs.length > 0 && existingInfo.docs[0]) {
        await payload.update({
          collection: 'manager-info',
          id: existingInfo.docs[0].id,
          data: infoData,
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'manager-info',
          data: { user: Number(id), ...infoData },
          overrideAccess: true,
        })
      }
    }

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to update manager:', error)
    return NextResponse.json({ message: 'Failed to update manager' }, { status: 500 })
  }
}

// DELETE — remove a manager account
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params // ← Next.js 15: params is a Promise

    const token = await requireBusinessAdmin(req)
    if (!token) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const payload = await getPayload({ config })

    const target = await loadManagerOrNull(
      payload,
      id,
      Number(token.id),
      token.roles as string | undefined,
    )
    if (!target) {
      return NextResponse.json({ message: 'Manager not found' }, { status: 404 })
    }

    await payload.delete({
      collection: 'users',
      id,
      overrideAccess: true,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to delete manager:', error)
    return NextResponse.json({ message: 'Failed to delete manager' }, { status: 500 })
  }
}
