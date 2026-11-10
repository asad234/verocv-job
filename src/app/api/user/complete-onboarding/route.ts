import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Completing onboarding ===')

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const userId = session.user.id

    console.log('Marking onboarding complete for user:', userId)

    // First, get the current user to understand their authType
    const currentUser = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,

    })

    console.log('Current user authType:', currentUser.authType)

    // Update only the onboarding status - don't touch password-related fields
    const updatedUser = await payload.update({
      collection: 'users',
      id: userId,
      data: {
        onboardingCompleted: true,
      },
      overrideAccess: true, // Bypass access control
      depth: 0, // Don't populate relationships
      // Don't include any auth-related fields in the update
    })

    console.log('✅ User onboarding completed successfully:', {
      userId: updatedUser.id,
      onboardingCompleted: updatedUser.onboardingCompleted,
      authType: updatedUser.authType,
    })

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser.id,
        onboardingCompleted: updatedUser.onboardingCompleted,


      },
    })



  } catch (error) {
    console.error('❌ Error completing onboarding:', error)

    // Log more details about the error
    if (error && typeof error === 'object' && 'data' in error) {
      console.error('Error details:', error.data)
    }

    return NextResponse.json(
      {
        error: 'Failed to complete onboarding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}