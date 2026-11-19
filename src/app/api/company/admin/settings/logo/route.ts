// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/settings/logo/route.ts   (REPLACE — URL: /api/company/admin/settings/logo — used by BusinessAdminSettings)
// The business admin's company logo (Settings → Company):
//   POST    multipart "file" → uploads the logo (JPG/PNG/GIF/WebP, max 2 MB)
//   DELETE  → removes it
// Saved on business-admin-info.company.companyLogo:
//   uploadImage = the media document, staticImage = its URL (what the settings page
//   and the rest of the app already read).
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

/** Keep the other company fields as they are — only the logo changes (+ old phone numbers cleaned). */
const withLogo = (doc: any, logo: { uploadImage: number | null; staticImage: string | null }) =>
  withCleanPhones(doc, {}, { companyLogo: logo })

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
      saved = await saveImage(payload, img, 'Company logo')
    } catch (e) {
      console.error('⚠️ Company logo upload failed:', e)
      return fail('The logo could not be uploaded right now. Try again later.', 503)
    }
    await payload.update({
      collection: 'business-admin-info',
      id: doc.id,
      data: withLogo(doc, { uploadImage: saved.id, staticImage: saved.url }),
      overrideAccess: true,
    })
    const old = relId(doc.company?.companyLogo?.uploadImage)
    if (old !== null && String(old) !== String(saved.id)) await deleteMediaQuietly(payload, old)
    return NextResponse.json({ data: { url: saved.url } })
  } catch (error) {
    console.error('❌ Failed to upload logo:', error)
    return fail('Failed to upload the logo', 500)
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
      data: withLogo(doc, { uploadImage: null, staticImage: null }),
      overrideAccess: true,
    })
    await deleteMediaQuietly(payload, doc.company?.companyLogo?.uploadImage)
    return NextResponse.json({ data: { url: null } })
  } catch (error) {
    console.error('❌ Failed to remove logo:', error)
    return fail('Failed to remove the logo', 500)
  }
}
