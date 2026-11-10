import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from 'payload'
import config from '@payload-config'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 })
    }

    console.log('📧 Sending profile completion reminder for user:', userId)

    const payload = await getPayload({ config })

    // Get user information
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

    // Only send reminder for credential-based users
    if (user.authType !== 'credentials') {
      console.log('⚠️ Skipping reminder - OAuth user:', user.authType)
      return NextResponse.json(
        {
          error: 'Profile reminders are only sent to email/password accounts',
          authType: user.authType,
        },
        { status: 400 },
      )
    }

    // Check if user has already completed onboarding
    if (user.onboardingCompleted) {
      console.log('ℹ️ User has already completed onboarding')
      return NextResponse.json(
        {
          message: 'User has already completed onboarding',
        },
        { status: 200 },
      )
    }

    // Get personal information
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

    // Check if we've already sent a reminder
    if (personalInfo.profileReminderSent) {
      console.log('ℹ️ Profile reminder already sent to this user')
      return NextResponse.json(
        {
          message: 'Profile reminder already sent',
        },
        { status: 200 },
      )
    }

    const { firstName, lastName, recoveryEmail } = personalInfo
    const email = recoveryEmail || user.email

    if (!email) {
      return NextResponse.json({ error: 'No email address found for user' }, { status: 400 })
    }

    // Send reminder email
    const emailResponse = await sendProfileReminderEmail({
      to: email,
      firstName: firstName || 'there',
      lastName: lastName || '',
      userName: user.name,
    })

    if (!emailResponse.success) {
      throw new Error('Failed to send reminder email')
    }

    // Update personal information to mark reminder as sent
    await payload.update({
      collection: 'personal-information',
      id: personalInfo.id,
      data: {
        profileReminderSent: true,
        profileReminderSentAt: new Date().toISOString(),
      },
    })

    console.log('✅ Profile completion reminder sent successfully')

    return NextResponse.json({
      success: true,
      message: 'Profile completion reminder sent successfully',
    })
  } catch (error) {
    console.error('❌ Error sending profile completion reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send profile completion reminder' },
      { status: 500 },
    )
  }
}

async function sendProfileReminderEmail({
  to,
  firstName,
  lastName,
  userName,
}: {
  to: string
  firstName: string
  lastName: string
  userName: string
}) {
  try {
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : userName

    const { data, error } = await resend.emails.send({
      from: 'onboarding@verocv.se',
      to: [to],
      subject: "Don't Forget to Complete Your VeroCV Profile! 🎯",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Complete Your Profile</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Complete Your Profile 🎯</h1>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${displayName},</p>

              <p style="font-size: 16px; margin-bottom: 25px;">
                We noticed you created an account with VeroCV 24 hours ago, but haven't completed your profile yet.
                Your professional profile is waiting to be completed! 🚀
              </p>

              <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #667eea;">Why complete your profile?</h3>
                <ul style="padding-left: 20px; margin-bottom: 0;">
                  <li style="margin-bottom: 10px;">📝 Create professional CVs in minutes</li>
                  <li style="margin-bottom: 10px;">✨ Showcase your skills and experience</li>
                  <li style="margin-bottom: 10px;">🎨 Choose from multiple templates</li>
                  <li style="margin-bottom: 10px;">📊 Track and manage your career documents</li>
                </ul>
              </div>

              <p style="font-size: 16px; margin-bottom: 25px;">
                It only takes a few minutes to complete your profile and unlock all features!
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://verocv.se'}/dashboard"
                   style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Complete My Profile Now
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">

              <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                <strong>Quick Tips:</strong>
              </p>
              <ul style="font-size: 14px; color: #666; padding-left: 20px;">
                <li>Start with your personal information</li>
                <li>Add your work experience and education</li>
                <li>List your skills and certifications</li>
                <li>Upload a professional photo (optional)</li>
              </ul>

              <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
                Need help? Reply to this email and we'll be happy to assist you.
                <br>
                If you're no longer interested, you can safely ignore this email.
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>
                VeroCV - Your Professional CV Platform
                <br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://verocv.se'}" style="color: #667eea; text-decoration: none;">Visit our website</a>
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error(`❌ Error sending reminder email to ${to}:`, error)
      return { success: false, error }
    }

    console.log(`✅ Profile reminder email sent to ${to}`)
    return { success: true, data }
  } catch (error) {
    console.error(`❌ Error sending profile reminder email to ${to}:`, error)
    return { success: false, error }
  }
}
