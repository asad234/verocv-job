// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/imageUpload.ts   (NEW — server only)
// Shared by the avatar and logo routes:
//   sessionUser()      who is logged in (next-auth) + their role
//   readImage()        the uploaded file from a multipart form, checked (type + 2 MB)
//   saveImage()        stores it in the `media` collection
//   deleteMediaQuietly() removes an old picture when it's replaced
// ══════════════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { roleOf, type Role } from '@/utils/authRoutes'
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/utils/imageRules'

export async function sessionUser(req: NextRequest): Promise<{ id: number; role: Role } | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const id = Number(token?.id)
  const role = roleOf(token?.roles)
  if (!token?.id || !Number.isFinite(id) || !role) return null
  return { id, role }
}

export interface UploadedImage {
  data: Buffer
  mimetype: string
  name: string
  size: number
}

/** Reads `file` from multipart form data. Returns the image, or an error message. */
export async function readImage(req: NextRequest): Promise<UploadedImage | { error: string }> {
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!file || typeof file === 'string') return { error: 'No image was sent' }
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type))
    return { error: 'Choose a JPG, PNG, GIF or WebP image' }
  if (file.size > MAX_IMAGE_BYTES) return { error: 'The image is larger than 2 MB' }
  const data = Buffer.from(await file.arrayBuffer())
  // A safe file name: letters, digits, dots and dashes only.
  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'img'
  const base =
    (file.name || 'image')
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w.-]+/g, '-')
      .slice(0, 40) || 'image'
  return { data, mimetype: file.type, name: `${base}-${Date.now()}.${ext}`, size: data.length }
}

/** A pasted image ("data:image/png;base64,…") → the same checked image as an upload. */
export function imageFromDataUrl(
  dataUrl: string,
  name = 'image',
): UploadedImage | { error: string } {
  const m = /^data:(image\/[a-z+.-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl)
  if (!m || !m[1] || !m[2]) return { error: 'The image could not be read' }
  const mimetype = m[1].toLowerCase()
  if (!(IMAGE_TYPES as readonly string[]).includes(mimetype))
    return { error: 'Choose a JPG, PNG, GIF or WebP image' }
  const data = Buffer.from(m[2], 'base64')
  if (data.length > MAX_IMAGE_BYTES) return { error: 'The image is larger than 2 MB' }
  const ext = mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'img'
  return { data, mimetype, name: `${name}-${Date.now()}.${ext}`, size: data.length }
}

export async function saveImage(
  payload: any,
  img: UploadedImage,
  alt: string,
): Promise<{ id: number; url: string }> {
  const doc: any = await payload.create({
    collection: 'media',
    data: { alt },
    file: img,
    overrideAccess: true,
  })
  return { id: Number(doc.id), url: doc.url }
}

export async function deleteMediaQuietly(payload: any, id: unknown): Promise<void> {
  const mediaId = relId(id)
  if (mediaId === null) return
  try {
    await payload.delete({ collection: 'media', id: mediaId, overrideAccess: true })
  } catch {
    /* already gone — fine */
  }
}

/** A relationship value can be an id or a populated document. */
export function relId(v: unknown): number | string | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'object') return (v as { id?: number | string }).id ?? null
  return v as number | string
}
