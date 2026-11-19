// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/settings/avatar/route.ts   (NEW)
// The manager's profile photo (Settings → General → Profile photo):
//   GET     → { mode, preset, url }
//   POST    multipart "file" → uploads the photo (JPG/PNG/GIF/WebP, max 2 MB)
//   PUT     { mode: "initials" } or { mode: "preset", preset: "a3" }
// Stored on manager-info.avatar. A replaced or removed upload is deleted from media.
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

const PRESET_RE = /^a\d{1,2}$/
const fail = (message: string, status: number) => NextResponse.json({ message }, { status })

async function managerOnly(req: NextRequest) {
  const me = await sessionUser(req)
  return me && me.role === 'client-manager' ? me.id : null
}

/** The manager's settings record — created if it doesn't exist yet. */
async function findOrCreate(payload: any, userId: number) {
  const { docs } = await payload.find({
    collection: 'manager-info',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  if (docs[0]) return docs[0]
  return payload.create({
    collection: 'manager-info',
    data: { user: userId },
    overrideAccess: true,
    depth: 1,
  })
}

function toDto(doc: any) {
  const a = doc?.avatar ?? {}
  const upload = typeof a.uploadImage === 'object' && a.uploadImage ? a.uploadImage : null
  const mode =
    a.mode === 'upload' && upload?.url
      ? 'upload'
      : a.mode === 'preset' && a.preset
        ? 'preset'
        : 'initials'
  return { mode, preset: a.preset ?? null, url: upload?.url ?? null }
}

export async function GET(req: NextRequest) {
  try {
    const me = await managerOnly(req)
    if (me === null) return fail('Not authorized', 403)
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'manager-info',
      where: { user: { equals: me } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    return NextResponse.json(
      { data: toDto(docs[0]) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load avatar:', error)
    return fail('Failed to load the profile photo', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await managerOnly(req)
    if (me === null) return fail('Not authorized', 403)
    const img = await readImage(req)
    if ('error' in img) return fail(img.error, 400)

    const payload = await getPayload({ config })
    const doc = await findOrCreate(payload, me)
    const saved = await saveImage(payload, img, 'Profile photo')
    const updated = await payload.update({
      collection: 'manager-info',
      id: doc.id,
      data: { avatar: { mode: 'upload', uploadImage: saved.id, preset: null } },
      overrideAccess: true,
      depth: 1,
    })
    const old = relId(doc.avatar?.uploadImage)
    if (old !== null && String(old) !== String(saved.id)) await deleteMediaQuietly(payload, old)
    return NextResponse.json({ data: toDto(updated) })
  } catch (error) {
    console.error('❌ Failed to upload avatar:', error)
    return fail('Failed to upload the photo', 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const me = await managerOnly(req)
    if (me === null) return fail('Not authorized', 403)
    const body = await req.json().catch(() => null)
    const mode = body?.mode
    if (mode !== 'initials' && mode !== 'preset') return fail('Unknown photo type', 400)
    if (mode === 'preset' && !PRESET_RE.test(String(body?.preset ?? '')))
      return fail('Unknown avatar', 400)

    const payload = await getPayload({ config })
    const doc = await findOrCreate(payload, me)
    const updated = await payload.update({
      collection: 'manager-info',
      id: doc.id,
      data: { avatar: { mode, preset: mode === 'preset' ? body.preset : null, uploadImage: null } },
      overrideAccess: true,
      depth: 1,
    })
    await deleteMediaQuietly(payload, doc.avatar?.uploadImage)
    return NextResponse.json({ data: toDto(updated) })
  } catch (error) {
    console.error('❌ Failed to save avatar:', error)
    return fail('Failed to save the photo', 500)
  }
}
