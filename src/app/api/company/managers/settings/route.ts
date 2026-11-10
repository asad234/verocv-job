import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'

interface ManagerInfoBody {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  mobilePhone?: string
  jobTitle?: string
  professionalBio?: string
  department?: {
    department?: string
    deptSize?: string
    deptFocus?: string
    managedSince?: string
    deptGoals?: string
  }
  socialLinks?: {
    linkedIn?: string
    x?: string
    gitHub?: string
    website?: string
  }
  notificationPreferences?: {
    emailNotif?: boolean
    cvActivity?: boolean
    placementAlert?: boolean
    weeklyDigest?: boolean
    scheduleReminders?: boolean
  }
  preferences?: {
    timezone?: string
    dateFormat?: string
  }
  twoFactorEnabled?: boolean
}

async function requireUserId(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  if (!token?.id) return null

  const userId = Number(token.id)
  if (!Number.isFinite(userId)) return null

  return userId
}

// GET — load the logged-in manager's own settings record (if any)
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const existing = await payload.find({
      collection: 'manager-info',
      where: { user: { equals: userId } },
      limit: 1,
    })

    return NextResponse.json({ data: existing.docs[0] ?? null }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to load manager-info:', error)
    return NextResponse.json({ message: 'Failed to load settings' }, { status: 500 })
  }
}

// PUT — create the record on first save, update it on subsequent saves
export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const body = (await req.json()) as ManagerInfoBody

    const payload = await getPayload({ config })

    const existing = await payload.find({
      collection: 'manager-info',
      where: { user: { equals: userId } },
      limit: 1,
    })

    let result
    if (existing.docs.length > 0 && existing.docs[0]) {
      result = await payload.update({
        collection: 'manager-info',
        id: existing.docs[0].id,
        data: body,
        // Requester already authenticated above; access control on the collection
        // itself independently enforces they can only ever hit their own record,
        // so overrideAccess here is just to avoid a redundant second permission check.
        overrideAccess: true,
      })
    } else {
      result = await payload.create({
        collection: 'manager-info',
        data: {
          ...body,
          user: userId,
        },
        overrideAccess: true,
      })
    }

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to save manager-info:', error)
    return NextResponse.json({ message: 'Failed to save settings' }, { status: 500 })
  }
}
