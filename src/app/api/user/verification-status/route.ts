import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const userId = session.user.id

    // Get user's auth type and recovery email (signup email)
    const userResult = await payload.find({
      collection: 'users',
      where: {
        id: { equals: userId },
      },
      limit: 1,
    })

    if (userResult.docs.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.docs[0]
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const authType = user.authType || 'credentials'
    const requiresVerification = authType === 'credentials'
    const recoveryEmail = user.email

    // Get user's personal information
    const personalInfoResult = await payload.find({
      collection: 'personal-information',
      where: {
        user: { equals: userId },
      },
      limit: 1,
    })

    if (personalInfoResult.docs.length === 0) {
      return NextResponse.json({
        hasPersonalInfo: false,
        recoveryEmailVerified: false,
        recoveryEmail,
        authType,
        requiresVerification,
      })
    }

    const personalInfo = personalInfoResult.docs[0]
    if (!personalInfo) {
      return NextResponse.json({
        hasPersonalInfo: false,
        recoveryEmailVerified: false,
        recoveryEmail,
        authType,
        requiresVerification,
      })
    }

    return NextResponse.json({
      hasPersonalInfo: true,
      recoveryEmailVerified: personalInfo.recoveryEmailVerified || false,
      recoveryEmail,
      authType,
      requiresVerification,
    })
  } catch (error) {
    console.error('Error checking verification status:', error)
    return NextResponse.json({ error: 'Failed to check verification status' }, { status: 500 })
  }
}
