// app/api/profile/[id]/route.ts

import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'
import { getPayload } from 'payload'
import config from '@payload-config'

// ─── GET — fetch a single profile by ID ──────────────────────────────────────

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: rawId } = await params
    const id = isNaN(Number(rawId)) ? rawId : Number(rawId)
    const payload = await getPayload({ config })

    const profile = await payload.findByID({
      collection: 'profiles',
      id: id as any,
      depth: 2,
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Ensure it belongs to the session user
    const profileUserId = typeof profile.user === 'object' ? profile.user.id : profile.user
    if (String(profileUserId) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error('Error fetching profile by id:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// ─── DELETE — remove a profile by ID ─────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: rawId } = await params
    const id = isNaN(Number(rawId)) ? rawId : Number(rawId)
    const payload = await getPayload({ config })

    const profile = await payload.findByID({
      collection: 'profiles',
      id: id as any,
      depth: 0,
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profileUserId = typeof profile.user === 'object' ? profile.user.id : profile.user
    if (String(profileUserId) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await payload.delete({
      collection: 'profiles',
      where: { id: { equals: id } },
    })

    return new Response(null, { status: 204 })
  } catch (error: any) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
