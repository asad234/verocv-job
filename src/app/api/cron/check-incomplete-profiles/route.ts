import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external cron service)
// Recommended: Run every hour to catch users at the 24-hour mark
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (cron job)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Cron job started: Checking for incomplete profiles...')

    const payload = await getPayload({ config })

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Calculate 25 hours ago (to create a 1-hour window)
    const twentyFiveHoursAgo = new Date()
    twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25)

    console.log('📅 Checking users created between:', {
      from: twentyFiveHoursAgo.toISOString(),
      to: twentyFourHoursAgo.toISOString(),
    })

    // Find users who:
    // 1. Were created approximately 24 hours ago (within 1-hour window)
    // 2. Haven't completed onboarding
    // 3. Use credential-based authentication (not OAuth)
    const usersResult = await payload.find({
      collection: 'users',
      where: {
        and: [
          {
            createdAt: {
              greater_than_equal: twentyFiveHoursAgo.toISOString(),
            },
          },
          {
            createdAt: {
              less_than_equal: twentyFourHoursAgo.toISOString(),
            },
          },
          {
            onboardingCompleted: {
              equals: false,
            },
          },
          {
            authType: {
              equals: 'credentials',
            },
          },
        ],
      },
      limit: 100, // Process max 100 users per run
    })

    console.log(`📊 Found ${usersResult.docs.length} users with incomplete profiles`)

    if (usersResult.docs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found with incomplete profiles',
        processed: 0,
      })
    }

    const results = {
      total: usersResult.docs.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each user
    for (const user of usersResult.docs) {
      try {
        console.log(`📧 Processing user: ${user.email} (ID: ${user.id})`)

        // Get personal information to check if reminder was already sent
        const personalInfoResult = await payload.find({
          collection: 'personal-information',
          where: {
            user: { equals: user.id },
          },
          limit: 1,
        })

        if (personalInfoResult.docs.length === 0) {
          console.log(`⚠️ No personal information found for user ${user.id}, skipping...`)
          results.skipped++
          continue
        }

        const personalInfo = personalInfoResult.docs[0]

        // Skip if reminder was already sent
        if (personalInfo?.profileReminderSent) {
          console.log(`ℹ️ Reminder already sent to user ${user.id}, skipping...`)
          results.skipped++
          continue
        }

        // Send reminder email
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://verocv.se'}/api/send-profile-reminder`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
          },
        )

        if (response.ok) {
          console.log(`✅ Reminder sent successfully to user ${user.id}`)
          results.sent++
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error(`❌ Failed to send reminder to user ${user.id}:`, errorData)
          results.failed++
          results.errors.push(`User ${user.id}: ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.id}:`, error)
        results.failed++
        results.errors.push(
          `User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }

    console.log('🏁 Cron job completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Profile reminder check completed',
      results,
    })
  } catch (error) {
    console.error('❌ Error in cron job:', error)
    return NextResponse.json(
      {
        error: 'Failed to process incomplete profiles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// POST endpoint for manual triggering (useful for testing)
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Manual trigger: Checking for incomplete profiles...')

    // Call the GET handler
    return GET(request)
  } catch (error) {
    console.error('❌ Error in manual trigger:', error)
    return NextResponse.json(
      {
        error: 'Failed to process incomplete profiles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
