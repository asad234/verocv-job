import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, magicLink } = await request.json()

    if (!email || !firstName || !magicLink) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, magicLink' },
        { status: 400 },
      )
    }

    console.log('📧 Sending email to:', email)
    console.log('🔗 Magic link:', magicLink)

    const { data, error } = await resend.emails.send({
      from: `onboarding@verocv.se`, // Use your verified domain
      to: [email],
      subject: "You're invited to join our platform!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale: 1.0">
            <title>You're Invited!</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited! 🎉</h1>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${firstName},</p>

              <p style="font-size: 16px; margin-bottom: 25px;">
                You've been invited to join our platform! Click the button below to visit our website and complete your registration.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}"
                   style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Visit VeroCV
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                You'll be taken to our website where you can learn more about our platform and complete your registration if you choose to join us.
              </p>

              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">

              <p style="font-size: 12px; color: #999; text-align: center;">
                This invitation link will expire in 24 hours for security reasons.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('✅ Email sent successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('❌ Error in send-magic-link API:', error)
    return NextResponse.json({ error: 'Failed to send magic link email' }, { status: 500 })
  }
}
