import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function PATCH(request: Request, context: any) {
  try {
    const payload = await getPayload({ config })
    const { coverLetterId, content, notes, userId } = await request.json()

    const id = coverLetterId || context.params.id

    if (!userId || !id) {
      return NextResponse.json(
        { success: false, error: 'User ID and cover letter ID are required' },
        { status: 400 },
      )
    }

    const userIdNum = parseInt(userId, 10)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 },
      )
    }

    const coverLetter = await payload.findByID({
      collection: 'coverLetters',
      id,
    })

    if (!coverLetter) {
      return NextResponse.json(
        { success: false, error: 'Cover letter not found' },
        { status: 404 },
      )
    }

    const letterUserId =
      typeof coverLetter.user === 'object'
        ? coverLetter.user.id
        : coverLetter.user

    if (letterUserId?.toString() !== userIdNum.toString()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      )
    }

    const updateData: Record<string, unknown> = {}
    if (content !== undefined) updateData.content = content
    if (notes !== undefined) updateData.notes = notes

    const updated = await payload.update({
      collection: 'coverLetters',
      id,
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating cover letter:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update cover letter' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const payload = await getPayload({ config })

    const id = context.params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || !id) {
      return NextResponse.json(
        { success: false, error: 'User ID and cover letter ID are required' },
        { status: 400 },
      )
    }

    const userIdNum = parseInt(userId, 10)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 },
      )
    }

    const coverLetter = await payload.findByID({
      collection: 'coverLetters',
      id,
    })

    if (!coverLetter) {
      return NextResponse.json(
        { success: false, error: 'Cover letter not found' },
        { status: 404 },
      )
    }

    const letterUserId =
      typeof coverLetter.user === 'object'
        ? coverLetter.user.id
        : coverLetter.user

    if (letterUserId?.toString() !== userIdNum.toString()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      )
    }

    await payload.delete({
      collection: 'coverLetters',
      id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cover letter:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete cover letter' },
      { status: 500 },
    )
  }
}