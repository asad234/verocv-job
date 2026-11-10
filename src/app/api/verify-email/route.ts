import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  // Define baseUrl at the top level of the function
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verocv.se'

  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    if (!token || type !== 'recovery') {
      return NextResponse.redirect(
        new URL(`${baseUrl}/dashboard?verification=error&message=Invalid verification link`),
      )
    }

    console.log('🔐 Verifying recovery email with token:', token)

    const payload = await getPayload({ config })

    const personalInfoResult = await payload.find({
      collection: 'personal-information',
      where: {
        recoveryEmailVerificationToken: { equals: token },
      },
      limit: 1,
    })

    if (personalInfoResult.docs.length === 0) {
      return NextResponse.redirect(
        new URL(
          `${baseUrl}/dashboard?verification=error&message=Invalid or expired verification link`,
        ),
      )
    }

    const personalInfo = personalInfoResult.docs[0]
    if (!personalInfo) {
      return NextResponse.redirect(
        new URL(`${baseUrl}/dashboard?verification=error&message=Verification failed`),
      )
    }

    // Check if verification email was sent within the last 24 hours
    if (personalInfo.verificationEmailsSentAt) {
      const sentAt = new Date(personalInfo.verificationEmailsSentAt)
      const now = new Date()
      const hoursDiff = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60)

      if (hoursDiff > 24) {
        return NextResponse.redirect(
          new URL(
            `${baseUrl}/dashboard?verification=error&message=Verification link has expired. Please request a new one.`,
          ),
        )
      }
    }

    // Update the verification status
    await payload.update({
      collection: 'personal-information',
      id: personalInfo.id,
      data: {
        recoveryEmailVerified: true,
        recoveryEmailVerificationToken: null,
      },
    })

    console.log('✅ Recovery email verified successfully')

    return NextResponse.redirect(
      new URL(`${baseUrl}/dashboard?verification=success&message=Email verified successfully!`),
    )
  } catch (error) {
    console.error('❌ Error verifying email:', error)
    return NextResponse.redirect(
      new URL(
        `${baseUrl}/dashboard?verification=error&message=An error occurred during verification`,
      ),
    )
  }
}
