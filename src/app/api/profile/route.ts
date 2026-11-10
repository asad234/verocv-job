// app/api/profiles/route.ts  (UPDATED)
// Key change: POST no longer blocks if a user already has a profile.
// It now allows multiple profiles per user, differentiated by `language`.
// A conflict (same user + same language) still returns 409.

import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PersonalInformation } from '@/types/payloadTypes'

// ─── Utilities (unchanged) ────────────────────────────────────────────────────

function removeIdFields(obj: any, isPersonalInformationChild = false): any {
  if (Array.isArray(obj)) return obj.map((i) => removeIdFields(i, isPersonalInformationChild))
  if (obj && typeof obj === 'object') {
    const newObj: any = {}
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue
      if (key === 'id' && !isPersonalInformationChild) continue
      newObj[key] = removeIdFields(obj[key], key === 'personalInformation')
    }
    return newObj
  }
  return obj
}

function convertDateStrings(
  obj: any,
  keysToConvert = ['startDate', 'endDate', 'validDate', 'createdAt', 'updatedAt'],
): any {
  if (Array.isArray(obj)) return obj.map((i) => convertDateStrings(i, keysToConvert))
  if (obj && typeof obj === 'object') {
    const newObj: any = {}
    for (const key in obj) {
      const value = obj[key]
      if (keysToConvert.includes(key)) {
        if (typeof value === 'string') {
          const parsed = new Date(value)
          newObj[key] = isNaN(parsed.getTime()) ? new Date() : parsed
        } else if (value !== null && typeof value === 'object' && Object.keys(value).length === 0) {
          newObj[key] = new Date()
        } else {
          newObj[key] = value
        }
      } else {
        newObj[key] = convertDateStrings(value, keysToConvert)
      }
    }
    return newObj
  }
  return obj
}

function sanitizeEmptyStringsToNull(data: Record<string, any>) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]))
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number(searchParams.get('page') || '1')
  const limit = Number(searchParams.get('limit') || '10')
  const depth = Math.min(Number(searchParams.get('depth') || '1'), 3)
  const userFilter = searchParams.get('where[user][equals]')

  try {
    const payload = await getPayload({ config })
    const query: any = { collection: 'profiles', page, limit, depth }
    if (userFilter) {
      query.where = { user: { equals: Number(userFilter) } }
    }
    const result = await payload.find(query)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch profiles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
// Now allows multiple profiles per user.
// Returns 409 only if the exact same (user + language) combo already exists.

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const data = await request.json()
    const cleanData = convertDateStrings(removeIdFields(data))
    const { personalInformation } = cleanData

    // Check for duplicate (user + language) only
    const duplicate = await payload.find({
      collection: 'profiles',
      where: {
        and: [{ user: { equals: cleanData.user } }, { language: { equals: cleanData.language } }],
      },
      limit: 1,
    })

    if (duplicate.docs.length > 0) {
      return NextResponse.json(
        {
          error: `A profile in this language already exists`,
          existingProfileId: duplicate.docs[0]!.id,
        },
        { status: 409 },
      )
    }

    // Handle personalInformation
    if (personalInformation && typeof personalInformation === 'object') {
      const existingPI = await payload.find({
        collection: 'personal-information',
        where: { user: { equals: cleanData.user } },
        limit: 1,
      })

      if (existingPI.docs.length > 0) {
        cleanData.personalInformation = existingPI.docs[0]!.id
      } else {
        const sanitized = sanitizeEmptyStringsToNull(
          convertDateStrings(removeIdFields(personalInformation)),
        ) as Omit<PersonalInformation, 'id' | 'createdAt' | 'updatedAt' | 'sizes'>

        const created = await payload.create({
          collection: 'personal-information',
          data: sanitized,
        })
        cleanData.personalInformation = created.id
      }
    }

    const result = await payload.create({ collection: 'profiles', data: cleanData })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      {
        error: 'Failed to create profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    const data = await request.json()

    if (!id) return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })

    const cleanedData = convertDateStrings(removeIdFields(data))
    let personalInformationIdToLink: string | number | undefined

    if (data.personalInformation) {
      const pi = data.personalInformation
      const rawUser = pi.user || data.user
      const userId = typeof rawUser === 'object' ? rawUser?.id : rawUser

      if (!userId) {
        return NextResponse.json({ error: 'personalInformation.user is required' }, { status: 400 })
      }

      const imageId = pi.profileImage?.uploadImage?.id || null
      const imageStatic = pi.profileImage?.staticImage || null

      if (pi.id) {
        const updateData: any = convertDateStrings(removeIdFields(pi))
        updateData.user = userId
        if (pi.profileImage)
          updateData.profileImage = { uploadImage: imageId, staticImage: imageStatic }
        await payload.update({ collection: 'personal-information', id: pi.id, data: updateData })
        personalInformationIdToLink = pi.id
      } else {
        const createData: any = convertDateStrings(removeIdFields(pi))
        createData.user = userId
        if (pi.profileImage)
          createData.profileImage = { uploadImage: imageId, staticImage: imageStatic }
        const createdPI = await payload.create({
          collection: 'personal-information',
          data: createData,
        })
        personalInformationIdToLink = createdPI.id
      }

      delete cleanedData.personalInformation
    }

    const result = await payload.update({
      collection: 'profiles',
      id,
      data: {
        ...cleanedData,
        ...(personalInformationIdToLink !== undefined && {
          personalInformation: personalInformationIdToLink,
        }),
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const rawId = request.nextUrl.searchParams.get('id')
    if (!rawId) return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    const id = isNaN(Number(rawId)) ? rawId : Number(rawId)
    await payload.delete({ collection: 'profiles', where: { id: { equals: id } } })
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
