import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const issueType = formData.get('issueType') as string
    const title = formData.get('title') as string
    const details = formData.get('details') as string
    const email = formData.get('email') as string
    const files = formData.getAll('files') as File[]

    // Validate required fields
    if (!issueType || !title || !details || !email) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Process uploaded files with better error handling
    const attachments = []
    for (const file of files) {
      if (file.size > 0) {
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            {
              error: `File ${file.name} exceeds 5MB limit`,
            },
            { status: 400 },
          )
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            {
              error: `File ${file.name} is not a supported image format`,
            },
            { status: 400 },
          )
        }

        try {
          // Convert file to buffer for email attachment
          const buffer = await file.arrayBuffer()
          attachments.push({
            filename: file.name,
            content: Buffer.from(buffer),
            contentType: file.type,
          })
        } catch (fileError) {
          console.error('File processing error:', fileError)
          return NextResponse.json(
            {
              error: `Failed to process file ${file.name}`,
            },
            { status: 400 },
          )
        }
      }
    }

    // Create issue ID for tracking
    const issueId = `ISS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Issue Reports <noreply@verocv.se>',
      to: ['info@verocv.se'],
      subject: `[${issueType.toUpperCase()}] ${title} - ${issueId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">New Issue Report</h2>
            <p style="margin: 0; color: #666; font-size: 14px;">Issue ID: <strong>${issueId}</strong></p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
            <div style="margin-bottom: 15px;">
              <strong style="color: #333;">Issue Type:</strong>
              <span style="background-color: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">
                ${issueType.toUpperCase()}
              </span>
            </div>

            <div style="margin-bottom: 15px;">
              <strong style="color: #333;">Title:</strong>
              <p style="margin: 5px 0 0 0; color: #555;">${title}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <strong style="color: #333;">Reporter Email:</strong>
              <p style="margin: 5px 0 0 0; color: #555;">${email}</p>
            </div>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Issue Details:</h3>
            <div style="background-color: #f8fafc; border-radius: 4px; padding: 15px;">
              ${details.replace(/\n/g, '<br>')}
            </div>
          </div>

          ${
            attachments.length > 0
              ? `
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Attachments:</h3>
              <p style="color: #666; margin: 0;">${attachments.length} file(s) attached to this email.</p>
            </div>
          `
              : ''
          }

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p style="margin: 0 0 5px 0;">This issue report was submitted through your website.</p>
            <p style="margin: 0;">You can reply directly to this email to respond to the reporter.</p>
          </div>
        </div>
      `,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyTo: email,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        {
          error: 'Failed to send issue report',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Email service error',
        },
        { status: 500 },
      )
    }

    console.log('Issue report sent successfully:', data)
    return NextResponse.json(
      {
        message: 'Issue report submitted successfully',
        issueId: issueId,
        emailId: data?.id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'Server error',
      },
      { status: 500 },
    )
  }
}
