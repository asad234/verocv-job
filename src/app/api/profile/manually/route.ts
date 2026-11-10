import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Creating profile ===')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const userId = session.user.id
    const data = await request.json()

    console.log('Creating profile for user:', userId)
    console.log('Profile data:', JSON.stringify(data, null, 2))

    // Validate required data
    if (!data.language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 })
    }

    // Check if user already has a profile
    const existingProfile = await payload.find({
      collection: 'profiles',
      where: {
        user: { equals: userId },
      },
      limit: 1,
    })

    if (existingProfile.docs.length > 0) {
      console.log('Profile already exists, updating instead')
      const result = await payload.update({
        collection: 'profiles',
        id: existingProfile.docs[0]!.id,
        data: {
          ...data,
          user: userId,
        },
      })
      return NextResponse.json(result)
    }

    // Create new profile
    const result = await payload.create({
      collection: 'profiles',
      data: {
        ...data,
        user: userId,
      },
    })

    console.log('Profile created successfully:', result.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      {
        error: 'Failed to create profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const userId = session.user.id

    const result = await payload.find({
      collection: 'profiles',
      where: {
        user: { equals: userId },
      },
      limit: 1,
      depth: 2, // Include related data
    })

    return NextResponse.json(result.docs[0] || null)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
