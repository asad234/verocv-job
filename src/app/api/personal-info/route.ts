import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'
import config from '@payload-config'

// Optional helper: upload image to Payload Media collection
async function uploadFileToServer(file: File | null) {
  if (!file) return null

  try {
    const formData = new FormData()
    formData.append('file', file)

    const mediaResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/media`, {
      method: 'POST',
      body: formData,
    })

    if (!mediaResponse.ok) {
      throw new Error(`Media upload failed with status: ${mediaResponse.status}`)
    }

    const mediaData = await mediaResponse.json()
    return mediaData?.doc?.id || null
  } catch (err) {
    console.error('Error uploading file:', err)
    throw err
  }
}

// ✅ GET – fetch personal info
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const userId = session.user.id

  try {
    const result = await payload.find({
      collection: 'personal-information',
      where: { user: { equals: userId } },
    })

    const [doc] = result.docs
    if (!doc) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(doc, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to fetch', error: error.message }, { status: 500 })
  }
}

// ✅ POST – create personal info
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const userId = session.user.id
  const data = await req.json()

  try {
    const created = await payload.create({
      collection: 'personal-information',
      data: {
        ...data,
        user: userId,
      },
    })

    return NextResponse.json({ message: 'Created', created }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: 'Creation failed', error: error.message }, { status: 500 })
  }
}

// ✅ PATCH – update personal info
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const requestBody = await req.json()
  const userId = session.user.id
  try {
    const [personalInfo] = await payload
      .find({
        collection: 'personal-information',
        where: { user: { equals: userId } },
      })
      .then((res) => res.docs)

    if (!personalInfo) {
      return NextResponse.json({ message: 'Personal information not found' }, { status: 404 })
    }

    const updateData: any = {}
    const profileImageUpdate: any = {}

    for (const [key, value] of Object.entries(requestBody)) {
      if (key === 'image' && value instanceof Object && 'name' in value && 'size' in value) {
        const uploadedId = await uploadFileToServer(value as File)
        profileImageUpdate.uploadImage = uploadedId
      } else if (key === 'avatar' && typeof value === 'string') {
        profileImageUpdate.staticImage = value
      } else if (key === 'dateOfBirth' && value === '') {
        updateData[key] = null
      } else {
        updateData[key] = value
      }
    }

    if (Object.keys(profileImageUpdate).length > 0) {
      updateData.profileImage = profileImageUpdate
    }
    console.log(updateData)
    const updated = await payload.update({
      collection: 'personal-information',
      id: personalInfo.id,
      data: updateData,
    })

    return NextResponse.json({ message: 'Updated successfully', updated })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 })
  }
}

// ✅ DELETE – delete personal info
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const userId = session.user.id

  try {
    const result = await payload.find({
      collection: 'personal-information',
      where: { user: { equals: userId } },
    })

    const [doc] = result.docs
    if (!doc) {
      return NextResponse.json({ message: 'No personal info to delete' }, { status: 404 })
    }

    await payload.delete({
      collection: 'personal-information',
      id: doc.id,
    })

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ message: 'Deletion failed', error: error.message }, { status: 500 })
  }
}
