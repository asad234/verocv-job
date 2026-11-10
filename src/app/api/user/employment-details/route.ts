// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/user/employment-details/route.ts
// URL:            GET /api/user/employment-details   → { data: EmploymentDetailsData | null, id }
//                 PUT /api/user/employment-details   → save (create or update) my details
//                 DELETE /api/user/employment-details → remove my details
// WHAT IT DOES:   The logged-in user's own "Present Employment Details".
//                 Validation is shared with the form (utils/employmentDetails.ts):
//                 what's required depends on the employment status.
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/user/employment-details/route.ts
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { normalizeEmploymentDetails, toPayloadData } from '@/utils/employmentDetails'
import { getToken } from 'next-auth/jwt'

async function requireUserId(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  if (!token?.id) return null
  const id = Number(token.id)
  return Number.isFinite(id) ? id : null
}

async function findMine(payload: any, userId: number) {
  const { docs } = await payload.find({
    collection: 'employment-details',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const payload = await getPayload({ config })
    const doc = await findMine(payload, userId)
    return NextResponse.json(
      {
        id: doc ? String(doc.id) : null,
        data: doc ? normalizeEmploymentDetails(doc).data : null,
        updatedAt: doc?.updatedAt ?? null,
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load employment details:', error)
    return NextResponse.json({ message: 'Failed to load employment details' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const { data, errors } = normalizeEmploymentDetails(body)
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { message: 'Please check the highlighted fields', errors },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const existing = await findMine(payload, userId)
    const values = toPayloadData(data)

    const saved = existing
      ? await payload.update({
          collection: 'employment-details',
          id: existing.id,
          data: values as any,
          overrideAccess: true,
        })
      : await payload.create({
          collection: 'employment-details',
          data: { ...values, user: userId } as any,
          overrideAccess: true,
        })

    return NextResponse.json(
      {
        id: String((saved as any).id),
        data: normalizeEmploymentDetails(saved).data,
        updatedAt: (saved as any).updatedAt ?? null,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to save employment details:', error)
    return NextResponse.json({ message: 'Failed to save employment details' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    const payload = await getPayload({ config })
    const existing = await findMine(payload, userId)
    if (existing)
      await payload.delete({
        collection: 'employment-details',
        id: existing.id,
        overrideAccess: true,
      })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to delete employment details:', error)
    return NextResponse.json({ message: 'Failed to delete employment details' }, { status: 500 })
  }
}
