import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 })
    }

    console.log('📧 Sending verification email for user:', userId)

    const payload = await getPayload({ config })

    // Get user's account information (including their signup email)
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

    // Only send verification emails for credential-based users
    if (user.authType !== 'credentials') {
      console.log('⚠️ Skipping verification email - OAuth user:', user.authType)
      return NextResponse.json(
        {
          error: 'Email verification is only required for email/password accounts',
          authType: user.authType,
        },
        { status: 400 },
      )
    }

    // Get the signup email from user (this is the recovery email)
    const recoveryEmail = user.email

    if (!recoveryEmail) {
      return NextResponse.json({ error: 'Recovery email not found' }, { status: 404 })
    }

    // Get user's personal information for name
    const personalInfoResult = await payload.find({
      collection: 'personal-information',
      where: {
        user: { equals: userId },
      },
      limit: 1,
    })

    if (personalInfoResult.docs.length === 0) {
      return NextResponse.json(
        { error: 'Personal information not found for user' },
        { status: 404 },
      )
    }

    const personalInfo = personalInfoResult.docs[0]
    if (!personalInfo) {
      return NextResponse.json({ error: 'Personal information not found' }, { status: 404 })
    }

    const { firstName, lastName } = personalInfo

    // Generate verification token for recovery email
    const recoveryEmailToken = crypto.randomBytes(32).toString('hex')

    // Store verification token in the database
    await payload.update({
      collection: 'personal-information',
      id: personalInfo.id,
      data: {
        recoveryEmailVerificationToken: recoveryEmailToken,
        recoveryEmailVerified: false,
        verificationEmailsSentAt: new Date().toISOString(),
      },
    })

    // Generate verification link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verocv.se'
    const recoveryEmailVerificationLink = `${baseUrl}/api/verify-email?token=${recoveryEmailToken}&type=recovery`

    // Send verification email to recovery email only
    const recoveryEmailResponse = await sendVerificationEmail({
      to: recoveryEmail,
      firstName: firstName || '',
      lastName: lastName || '',
      verificationLink: recoveryEmailVerificationLink,
    })

    console.log('✅ Verification email sent successfully')

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        recoveryEmailSent: recoveryEmailResponse.success,
      },
    })
  } catch (error) {
    console.error('❌ Error sending verification email:', error)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}

async function sendVerificationEmail({
  to,
  firstName,
  lastName,
  verificationLink,
}: {
  to: string
  firstName: string
  lastName: string
  verificationLink: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@verocv.se',
      to: [to],
      subject: 'Verify Your Email Address - VeroCV',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email 📧</h1>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName} ${lastName},</p>

              <p style="font-size: 16px; margin-bottom: 25px;">
                Thank you for signing up with VeroCV! To complete your registration and ensure the security of your account,
                please verify your email address by clicking the button below.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}"
                   style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Verify Email Address
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; color: #007bff; word-break: break-all;">
                ${verificationLink}
              </p>

              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">

              <p style="font-size: 12px; color: #999; text-align: center;">
                This verification link will expire in 24 hours for security reasons.
                <br>
                If you didn't create an account with VeroCV, please ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error(`❌ Error sending email to ${to}:`, error)
      return { success: false, error }
    }

    console.log(`✅ Verification email sent to ${to}`)
    return { success: true, data }
  } catch (error) {
    console.error(`❌ Error sending verification email to ${to}:`, error)
    return { success: false, error }
  }
}
