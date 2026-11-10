import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rating, perfectTenFeedback, changeRemoveFeedback } = body

    // Validate required fields
    if (rating === null || rating === undefined) {
      return NextResponse.json({ error: 'Rating is required' }, { status: 400 })
    }

    // Validate rating range
    if (rating < 1 || rating > 10) {
      return NextResponse.json({ error: 'Rating must be between 1 and 10' }, { status: 400 })
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Generate a unique feedback ID
    const feedbackId = `FEEDBACK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Determine rating category and color
    const getRatingInfo = (rating: number) => {
      if (rating >= 9) return { category: 'Excellent', color: '#10b981', emoji: '🌟' }
      if (rating >= 7) return { category: 'Good', color: '#3b82f6', emoji: '👍' }
      if (rating >= 5) return { category: 'Average', color: '#f59e0b', emoji: '😐' }
      return { category: 'Needs Improvement', color: '#ef4444', emoji: '😞' }
    }

    const ratingInfo = getRatingInfo(rating)

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Feedback System <noreply@verocv.se>',
      to: ['info@verocv.se'],
      subject: `${ratingInfo.emoji} Customer Feedback: ${rating}/10 - ${ratingInfo.category} [${feedbackId}]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${ratingInfo.color}; border-bottom: 2px solid ${ratingInfo.color}; padding-bottom: 10px;">
            ${ratingInfo.emoji} New Customer Feedback
          </h2>

          <div style="background-color: #f8fafc; border-left: 4px solid ${ratingInfo.color}; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="font-size: 48px; font-weight: bold; color: ${ratingInfo.color}; margin-right: 20px;">
                ${rating}/10
              </div>
              <div>
                <div style="font-size: 18px; font-weight: bold; color: ${ratingInfo.color};">
                  ${ratingInfo.category}
                </div>
                <div style="color: #64748b; font-size: 14px;">
                  Feedback ID: ${feedbackId}
                </div>
              </div>
            </div>
          </div>

          ${
            perfectTenFeedback
              ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
              💡 What would make us a perfect 10?
            </h3>
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
              ${perfectTenFeedback.replace(/\n/g, '<br>')}
            </div>
          </div>
          `
              : ''
          }

          ${
            changeRemoveFeedback
              ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
              🔧 What would you add / change / remove?
            </h3>
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
              ${changeRemoveFeedback.replace(/\n/g, '<br>')}
            </div>
          </div>
          `
              : ''
          }

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>This feedback was submitted from your website's feedback form.</p>
            <p><strong>Feedback ID:</strong> ${feedbackId}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #f1f5f9; border-radius: 6px;">
            <h4 style="margin: 0 0 10px 0; color: #334155;">Quick Stats:</h4>
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
              <span><strong>Rating:</strong> ${rating}/10</span>
              <span><strong>Category:</strong> ${ratingInfo.category}</span>
              <span><strong>Has Suggestions:</strong> ${perfectTenFeedback || changeRemoveFeedback ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        {
          error: 'Failed to send feedback',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Email service error',
        },
        { status: 500 },
      )
    }

    console.log('Feedback sent successfully:', data)
    return NextResponse.json(
      {
        message: 'Feedback submitted successfully',
        feedbackId: feedbackId,
        id: data?.id,
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
