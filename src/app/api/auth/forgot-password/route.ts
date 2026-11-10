import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('🔐 Password reset requested for:', email)

    const payload = await getPayload({ config })

    // Find user by email
    const { docs: users } = await payload.find({
      collection: 'users',
      where: {
        email: { equals: email },
      },
      limit: 1,
    })

    // Always return success to prevent email enumeration attacks
    if (users.length === 0) {
      console.log('⚠️ User not found, but returning success to prevent enumeration')
      return NextResponse.json({
        message: "If an account exists with that email, we've sent password reset instructions.",
      })
    }

    const user = users[0]

    if (!user) {
      console.log('⚠️ User not found after query')
      return NextResponse.json({
        message: "If an account exists with that email, we've sent password reset instructions.",
      })
    }

    // Check if user has a password (OAuth users might not)
    if (!user.hasPassword) {
      console.log('⚠️ User signed up with OAuth, no password to reset')
      return NextResponse.json({
        isOAuth: true,
        message:
          'You signed up using Google or another social provider. Please reset your password through your social account provider.',
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    // Update user with reset token
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiration: expiresAt.toISOString(),
      },
    })

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://verocv.se'}/reset-password?token=${resetToken}`

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'VeroCV <info@verocv.se>'

    // Send email using Resend
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: 'Reset Your Password - VeroCV',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
            </div>

            <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Hi ${user.name || 'there'},
              </p>

              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                We received a request to reset your password for your VeroCV account. Click the button below to create a new password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="background-color: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #667eea; word-break: break-all; background-color: #f8fafc; padding: 12px; border-radius: 6px;">
                ${resetUrl}
              </p>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                  <strong>This link will expire in 1 hour.</strong>
                </p>
                <p style="font-size: 14px; color: #666;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
              <p>© ${new Date().getFullYear()} VeroCV. All rights reserved.</p>
            </div>
          </div>
        `,
      })

      if (error) {
        console.error('❌ Failed to send reset email:', error)
        if (error.message?.includes('verify a domain')) {
          return NextResponse.json(
            {
              error:
                'Email service configuration error. Please contact support or verify your domain at resend.com/domains.',
              needsDomainVerification: true,
            },
            { status: 500 },
          )
        }
        return NextResponse.json(
          { error: 'Failed to send reset email. Please try again later.' },
          { status: 500 },
        )
      }

      console.log('✅ Password reset email sent successfully:', data?.id)

      return NextResponse.json({
        message: "If an account exists with that email, we've sent password reset instructions.",
      })
    } catch (emailError: any) {
      console.error('❌ Email sending exception:', emailError)
      return NextResponse.json(
        {
          error: 'Failed to send reset email. Please contact support.',
          details: emailError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('❌ Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process password reset request' }, { status: 500 })
  }
}
