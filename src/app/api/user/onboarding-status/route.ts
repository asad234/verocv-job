import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'
import { getPayload } from 'payload'
import config from '@payload-config'

// Roles whose accounts are set up directly by an admin/business-admin rather
// than through self-serve signup. They never have personal-information or
// profiles records (they use business-admin-info / manager-info instead), so
// checking those collections for them always returns false — this used to
// make onboarding permanently "incomplete" for every login, and worse, the
// sync-write below was overwriting Users.onboardingCompleted back to false
// each time, undoing the true value create-manager sets at account creation.
const ONBOARDING_EXEMPT_ROLES = new Set(['client-admin', 'client-manager'])

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const userId = session.user.id

    const userResult = await payload.find({
      collection: 'users',
      where: { id: { equals: userId } },
      limit: 1,
    })

    if (!userResult.docs.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.docs[0]
    const role = user!.roles as string | undefined

    // Optional: force onboarding for testing
    const forceNewUser = request.nextUrl.searchParams.get('forceNew') === 'true'

    // client-admin / client-manager: onboarding never applies to these roles
    // at all — always report completed, regardless of whatever the stored
    // flag happens to say. This also self-heals any account whose flag was
    // set incorrectly (e.g. created directly via the Payload admin panel,
    // bypassing create-manager's API route) without needing a manual fix.
    if (ONBOARDING_EXEMPT_ROLES.has(role || '')) {
      // Opportunistically correct the stored flag if it's wrong, so the
      // Users collection stays consistent for anything else that might read
      // it directly — but this route's own response never depends on it.
      if (!user!.onboardingCompleted) {
        await payload
          .update({
            collection: 'users',
            id: userId,
            data: { onboardingCompleted: true },
          })
          .catch((err) => console.error('Failed to self-heal onboardingCompleted flag:', err))
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('Onboarding status (exempt role, always true):', { userId, role, forceNewUser })
      }

      return NextResponse.json({
        completed: forceNewUser ? false : true,
        hasPersonalInfo: true, // not applicable to this role — reported true so nothing downstream treats it as "missing"
        hasProfile: true,
        onboardingCompletedFlag: true,
      })
    }

    // admin / client: original logic, unchanged
    const [personalInfoResult, profileResult] = await Promise.all([
      payload.find({
        collection: 'personal-information',
        where: { user: { equals: userId } },
        limit: 1,
      }),
      payload.find({
        collection: 'profiles',
        where: { user: { equals: userId } },
        limit: 1,
      }),
    ])

    const hasPersonalInfo = personalInfoResult.docs.length > 0
    const hasProfile = profileResult.docs.length > 0

    // ✅ SINGLE SOURCE OF TRUTH (for admin/client only)
    const completed = hasPersonalInfo && hasProfile

    // ✅ Sync onboarding flag (both directions) — only for roles that
    // actually use personal-information/profiles as their completion signal
    if (user!.onboardingCompleted !== completed) {
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          onboardingCompleted: completed,
        },
      })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Onboarding status:', {
        userId,
        hasPersonalInfo,
        hasProfile,
        dbFlag: user!.onboardingCompleted,
        computed: completed,
        forceNewUser,
      })
    }

    return NextResponse.json({
      completed: forceNewUser ? false : completed,
      hasPersonalInfo,
      hasProfile,
      onboardingCompletedFlag: completed,
    })
  } catch (error) {
    console.error('Error checking onboarding status:', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
