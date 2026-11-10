import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const cvId = searchParams.get('cvId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 401 })
    }

    const query: any = {
      user: { equals: userId },
    }

    if (cvId) {
      const cvIdNum = parseInt(cvId, 10)
      if (!isNaN(cvIdNum)) {
        query.cv = { equals: cvIdNum }
      }
    }

    const coverLetters = await payload.find({
      collection: 'coverLetters',
      where: query,
      sort: '-createdAt',
      limit: 100,
    })

    return NextResponse.json({ success: true, data: coverLetters.docs })
  } catch (error) {
    console.error('Error fetching cover letters:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cover letters' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const { content, jobTitle, companyName, jobDescription, tone, notes, userId, cvId } =
      await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 401 })
    }

    if (!content || !jobTitle) {
      return NextResponse.json(
        { success: false, error: 'Content and job title are required' },
        { status: 400 },
      )
    }

    let cvIdNum: number | null = null
    if (cvId) {
      const parsed = parseInt(cvId, 10)
      if (!isNaN(parsed)) cvIdNum = parsed
    }

    const userIdNum = parseInt(userId, 10)
    if (isNaN(userIdNum)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 })
    }

    const coverLetter = await payload.create({
      collection: 'coverLetters',
      data: {
        user: userIdNum,
        ...(cvIdNum !== null && { cv: cvIdNum }),
        content,
        jobTitle,
        companyName: companyName || '',
        jobDescription: jobDescription || '',
        tone: tone || 'professional',
        notes: notes || '',
      },
    })

    return NextResponse.json({ success: true, data: coverLetter })
  } catch (error) {
    console.error('Error creating cover letter:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create cover letter' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const coverLetterId = searchParams.get('id')

    if (!userId || !coverLetterId) {
      return NextResponse.json(
        { success: false, error: 'User ID and cover letter ID are required' },
        { status: 401 },
      )
    }

    const coverLetter = await payload.findByID({
      collection: 'coverLetters',
      id: coverLetterId,
    })

    if (!coverLetter) {
      return NextResponse.json({ success: false, error: 'Cover letter not found' }, { status: 404 })
    }

    const letterUserId =
      typeof coverLetter.user === 'object' ? coverLetter.user.id : coverLetter.user

    if (letterUserId?.toString() !== userId.toString()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    await payload.delete({
      collection: 'coverLetters',
      id: coverLetterId,
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

export async function PATCH(request: Request) {
  try {
    const payload = await getPayload({ config })
    const { coverLetterId, notes, userId } = await request.json()

    if (!userId || !coverLetterId) {
      return NextResponse.json(
        { success: false, error: 'User ID and cover letter ID are required' },
        { status: 401 },
      )
    }

    const coverLetter = await payload.findByID({
      collection: 'coverLetters',
      id: coverLetterId,
    })

    if (!coverLetter) {
      return NextResponse.json({ success: false, error: 'Cover letter not found' }, { status: 404 })
    }

    const letterUserId =
      typeof coverLetter.user === 'object' ? coverLetter.user.id : coverLetter.user

    if (letterUserId?.toString() !== userId.toString()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const updated = await payload.update({
      collection: 'coverLetters',
      id: coverLetterId,
      data: { notes },
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
