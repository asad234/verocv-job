// src/app/api/cv/route.ts

import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// GET - Fetch user's CVs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Convert userId to number if it's a string
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId

    if (isNaN(numericUserId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    console.log('Fetching CVs for user:', numericUserId)

    const result = await payload.find({
      collection: 'cvs',
      where: {
        user: {
          equals: numericUserId,
        },
      },
      page,
      limit,
      sort: '-updatedAt', // Sort by most recently updated first
      depth: 1, // Include related data
    })

    console.log(`Found ${result.docs.length} CVs for user ${numericUserId}`)

    return NextResponse.json({
      success: true,
      data: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    })
  } catch (error) {
    console.error('Error fetching CVs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch CVs',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 },
    )
  }
}

// PATCH - Update simple flags on a CV owned by the requesting user
// (currently used for toggling `hidden`, the employee-controlled flag that
// determines whether a manager can see this CV — see requireAcceptedEmployee
// in the manager route, which filters on this field server-side)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, hidden } = body as {
      id?: string
      userId?: string | number
      hidden?: boolean
    }

    if (!id) {
      return NextResponse.json({ error: 'CV ID is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (typeof hidden !== 'boolean') {
      return NextResponse.json({ error: '"hidden" must be a boolean' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId
    if (isNaN(numericUserId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    // Verify the CV belongs to the requesting user before allowing any change —
    // same ownership check pattern used by DELETE below.
    const cv = await payload.findByID({
      collection: 'cvs',
      id,
    })

    if (!cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }

    const cvUserId = typeof cv.user === 'object' ? cv.user.id : cv.user
    if (cvUserId !== numericUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own CVs' },
        { status: 403 },
      )
    }

    const updated = await payload.update({
      collection: 'cvs',
      id,
      data: { hidden },
    })

    console.log(`CV ${id} hidden=${hidden} set by user ${numericUserId}`)

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Error updating CV:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update CV',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 },
    )
  }
}

// DELETE - Delete a CV
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const cvId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!cvId) {
      return NextResponse.json({ error: 'CV ID is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Convert userId to number if it's a string
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId

    if (isNaN(numericUserId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    // First, verify the CV belongs to the user
    const cv = await payload.findByID({
      collection: 'cvs',
      id: cvId,
    })

    if (!cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }

    // Check if the CV belongs to the requesting user
    const cvUserId = typeof cv.user === 'object' ? cv.user.id : cv.user
    if (cvUserId !== numericUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own CVs' },
        { status: 403 },
      )
    }

    // Delete the CV
    await payload.delete({
      collection: 'cvs',
      id: cvId,
    })

    console.log(`CV ${cvId} deleted by user ${numericUserId}`)

    return NextResponse.json({
      success: true,
      message: 'CV deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting CV:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete CV',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 },
    )
  }
}
