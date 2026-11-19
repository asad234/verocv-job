// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/settings/avatar/route.ts   (NEW)
// URL:            /api/company/admin/settings/avatar
// The business admin's own profile photo (Settings → General):
//   POST    multipart "file" → uploads the photo (JPG/PNG/GIF/WebP, max 2 MB) → { data: { url } }
//   DELETE  → removes it → { data: { url: null } }
// Saved on business-admin-info.avatar (uploadImage = media doc, staticImage = its URL).
// Shown in the dashboard header and to the admin's managers (/api/company/managers/my-admin).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  deleteMediaQuietly,
  readImage,
  relId,
  saveImage,
  sessionUser,
} from '@/utils/server/imageUpload'
import {
  findOrCreateAdminInfo as findOrCreate,
  withCleanPhones,
} from '@/utils/server/businessAdmininfo'

const fail = (message: string, status: number) => NextResponse.json({ message }, { status })

async function businessAdminOnly(req: NextRequest) {
  const me = await sessionUser(req)
  return me && me.role === 'client-admin' ? me.id : null
}

export async function POST(req: NextRequest) {
  try {
    const me = await businessAdminOnly(req)
    if (me === null) return fail('Not authorized', 403)
    const img = await readImage(req)
    if ('error' in img) return fail(img.error, 400)

    const payload = await getPayload({ config })
    const doc = await findOrCreate(payload, me)
    let saved: { id: number; url: string }
    try {
      saved = await saveImage(payload, img, 'Profile photo')
    } catch (e) {
      console.error('⚠️ Admin photo upload failed:', e)
      return fail('The photo could not be uploaded right now. Try again later.', 503)
    }
    try {
      await payload.update({
        collection: 'business-admin-info',
        id: doc.id,
        data: withCleanPhones(doc, { avatar: { uploadImage: saved.id, staticImage: saved.url } }),
        overrideAccess: true,
      })
    } catch (e: any) {
      await deleteMediaQuietly(payload, saved.id) // don't leave the new picture behind
      if (e?.name === 'ValidationError') {
        const fields = (e?.data?.errors ?? [])
          .map((x: any) => x.label || x.path)
          .filter(Boolean)
          .join(', ')
        console.warn('⚠️ Admin photo not saved — invalid fields on the record:', fields)
        return fail(
          `Fix these fields in your settings first: ${fields || 'some fields are invalid'}`,
          400,
        )
      }
      throw e
    }
    const old = relId(doc.avatar?.uploadImage)
    if (old !== null && String(old) !== String(saved.id)) await deleteMediaQuietly(payload, old)
    return NextResponse.json({ data: { url: saved.url } })
  } catch (error) {
    console.error('❌ Failed to upload admin photo:', error)
    return fail('Failed to upload the photo', 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const me = await businessAdminOnly(req)
    if (me === null) return fail('Not authorized', 403)
    const payload = await getPayload({ config })
    const doc = await findOrCreate(payload, me)
    await payload.update({
      collection: 'business-admin-info',
      id: doc.id,
      data: withCleanPhones(doc, { avatar: { uploadImage: null, staticImage: null } }),
      overrideAccess: true,
    })
    await deleteMediaQuietly(payload, doc.avatar?.uploadImage)
    return NextResponse.json({ data: { url: null } })
  } catch (error) {
    console.error('❌ Failed to remove admin photo:', error)
    return fail('Failed to remove the photo', 500)
  }
}
