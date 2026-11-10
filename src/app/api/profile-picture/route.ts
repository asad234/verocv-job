// app/api/profile-picture/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'
import config from '@payload-config'

// Helper: upload image to Payload Media collection
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

// Helper: get media ID from profile image (handles both object and string)
function getMediaId(profileImage: any): string | null {
  if (!profileImage?.uploadImage) return null
  
  // If it's already a string ID
  if (typeof profileImage.uploadImage === 'string') {
    return profileImage.uploadImage
  }
  
  // If it's a Media object with id property
  if (typeof profileImage.uploadImage === 'object' && profileImage.uploadImage?.id) {
    return profileImage.uploadImage.id
  }
  
  return null
}

// ✅ POST/PATCH – update profile picture
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const userId = session.user.id

  try {
    // Get existing personal information
    const result = await payload.find({
      collection: 'personal-information',
      where: { user: { equals: userId } },
    })

    const [personalInfo] = result.docs
    if (!personalInfo) {
      return NextResponse.json({ message: 'Personal information not found' }, { status: 404 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const staticImage = formData.get('staticImage') as string | null
    const removeImage = formData.get('removeImage') === 'true'

    // Prepare profile image update
    const profileImageUpdate: any = {}

    // Case 1: Remove image
    if (removeImage) {
      // Delete old uploaded image if exists
      const oldMediaId = getMediaId(personalInfo.profileImage)
      if (oldMediaId) {
        try {
          await payload.delete({
            collection: 'media',
            id: oldMediaId,
          })
        } catch (err) {
          console.error('Failed to delete old media:', err)
        }
      }
      
      profileImageUpdate.uploadImage = null
      profileImageUpdate.staticImage = null
    }
    // Case 2: Upload new file
    else if (file && file.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { message: 'Invalid file type. Please upload JPEG, PNG, WEBP, or GIF' },
          { status: 400 }
        )
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json(
          { message: 'File too large. Maximum size is 5MB' },
          { status: 400 }
        )
      }

      // Delete old uploaded image if exists
      const oldMediaId = getMediaId(personalInfo.profileImage)
      if (oldMediaId) {
        try {
          await payload.delete({
            collection: 'media',
            id: oldMediaId,
          })
        } catch (err) {
          console.error('Failed to delete old media:', err)
        }
      }

      // Upload new image
      const uploadedId = await uploadFileToServer(file)
      if (!uploadedId) {
        return NextResponse.json(
          { message: 'Failed to upload image' },
          { status: 500 }
        )
      }

      profileImageUpdate.uploadImage = uploadedId
      profileImageUpdate.staticImage = null
    }
    // Case 3: Select static avatar
    else if (staticImage) {
      // Delete old uploaded image if exists (cleanup)
      const oldMediaId = getMediaId(personalInfo.profileImage)
      if (oldMediaId) {
        try {
          await payload.delete({
            collection: 'media',
            id: oldMediaId,
          })
        } catch (err) {
          console.error('Failed to delete old media:', err)
        }
      }

      profileImageUpdate.uploadImage = null
      profileImageUpdate.staticImage = staticImage
    }
    else {
      return NextResponse.json(
        { message: 'No image provided. Send file, staticImage, or removeImage=true' },
        { status: 400 }
      )
    }

    // Update personal information with new profile image
    const updated = await payload.update({
      collection: 'personal-information',
      id: personalInfo.id,
      data: {
        profileImage: profileImageUpdate,
      },
    })

    return NextResponse.json({
      message: 'Profile picture updated successfully',
      updated,
      profileImage: profileImageUpdate,
    })

  } catch (error: any) {
    console.error('Error updating profile picture:', error)
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}

// ✅ GET – fetch profile picture
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

    const [personalInfo] = result.docs
    if (!personalInfo) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    let profileImageUrl = null
    const profileImageData = personalInfo.profileImage || null

    // Resolve full URL for uploaded images
    const mediaId = getMediaId(personalInfo.profileImage)
    if (mediaId) {
      try {
        const media = await payload.findByID({
          collection: 'media',
          id: mediaId,
        })
        profileImageUrl = media?.url || `${process.env.NEXT_PUBLIC_SERVER_URL}/api/media/file/${mediaId}`
      } catch (err) {
        console.error('Failed to fetch media:', err)
      }
    } else if (personalInfo.profileImage?.staticImage) {
      profileImageUrl = personalInfo.profileImage.staticImage
    }

    return NextResponse.json({
      success: true,
      profileImage: profileImageUrl,
      profileImageData,
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch', error: error.message },
      { status: 500 }
    )
  }
}

// ✅ DELETE – remove profile picture only
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

    const [personalInfo] = result.docs
    if (!personalInfo) {
      return NextResponse.json({ message: 'Personal information not found' }, { status: 404 })
    }

    // Delete uploaded image from media collection if exists
    const mediaId = getMediaId(personalInfo.profileImage)
    if (mediaId) {
      try {
        await payload.delete({
          collection: 'media',
          id: mediaId,
        })
      } catch (err) {
        console.error('Failed to delete media:', err)
      }
    }

    // Clear profile image field
    const updated = await payload.update({
      collection: 'personal-information',
      id: personalInfo.id,
      data: {
        profileImage: {
          uploadImage: null,
          staticImage: null,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully',
      updated,
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Deletion failed', error: error.message },
      { status: 500 }
    )
  }
}