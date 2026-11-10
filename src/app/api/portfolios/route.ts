import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function uploadBase64ToMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  base64DataUrl: string,
  filename: string,
  userId: string,
) {
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) throw new Error(`Invalid base64 data URL for file: ${filename}`)

  const mimeType = matches[1]!
  const nodeBuffer = Buffer.from(matches[2]!, 'base64')
  const arrayBuffer = nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength,
  ) as ArrayBuffer

  const formData = new FormData()
  const blob = new Blob([arrayBuffer], { type: mimeType })
  formData.append('file', blob, filename)
  formData.append('alt', filename)

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const response = await fetch(`${serverUrl}/api/media`, {
    method: 'POST',
    headers: { 'x-payload-user': userId },
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Media upload failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  return { id: data.doc.id as string, url: data.doc.url as string }
}

// ─── Numeric ID helper ────────────────────────────────────────────────────────
// next-auth returns session.user.id as a string.
// Payload's PostgreSQL adapter stores IDs as integers — passing a string
// to a relationship field causes a ValidationError.

function toPayloadId(id: string): number | string {
  const n = Number(id)
  return isNaN(n) ? id : n
}

// ─── GET /api/portfolios ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'portfolio',
      where: { user: { equals: toPayloadId(session.user.id) } },
      sort: '-createdAt',
      depth: 2,
      limit: 200,
      overrideAccess: true,
    })

    return NextResponse.json({ items: docs.map(normaliseItem) }, { status: 200 })
  } catch (err) {
    console.error('[GET /api/portfolios]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── POST /api/portfolios ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const userId = session.user.id

    const {
      type,
      title,
      description,
      tags,
      featured,
      hidden,
      imageUrl,
      videoUrl,
      videoThumbnailUrl,
      videoMediaId, // media doc ID when client uploads directly
      youtubeUrl,
      youtubeVideoId,
      linkUrl,
      linkThumbnailUrl,
      documentUrl,
      documentName,
      documentSize,
      documentExt,
      documentMediaId, // media doc ID when client uploads directly
    } = body

    if (!type || !title) {
      return NextResponse.json({ error: 'type and title are required' }, { status: 400 })
    }

    const data: Record<string, unknown> = {
      user: toPayloadId(userId), // ← integer, not string
      type,
      title: title.trim(),
      description: description?.trim() || undefined,
      featured: Boolean(featured),
      hidden: Boolean(hidden),
      tags: Array.isArray(tags) ? tags.filter(Boolean).map((t: string) => ({ tag: t })) : [],
    }

    if (type === 'image') {
      if (!imageUrl)
        return NextResponse.json({ error: 'imageUrl is required for type=image' }, { status: 400 })
      if (imageUrl.startsWith('data:')) {
        const ext = imageUrl.match(/^data:image\/([^;]+)/)?.[1] ?? 'jpg'
        const { id } = await uploadBase64ToMedia(
          payload,
          imageUrl,
          `portfolio-image.${ext}`,
          userId,
        )
        data.image = id
      } else {
        data.image = imageUrl
      }
    }

    if (type === 'video') {
      if (!videoMediaId && !videoUrl)
        return NextResponse.json(
          { error: 'videoMediaId or videoUrl is required for type=video' },
          { status: 400 },
        )

      if (videoMediaId) {
        // Primary path: client uploaded directly to /api/media and sent back the media doc ID
        data.video = toPayloadId(videoMediaId)
      } else if (videoUrl?.startsWith('data:')) {
        // Fallback: base64 (small clips only — large videos will time out this way)
        const ext = videoUrl.match(/^data:video\/([^;]+)/)?.[1] ?? 'mp4'
        const { id } = await uploadBase64ToMedia(
          payload,
          videoUrl,
          `portfolio-video.${ext}`,
          userId,
        )
        data.video = id
      }

      if (videoThumbnailUrl?.startsWith('data:')) {
        const ext = videoThumbnailUrl.match(/^data:image\/([^;]+)/)?.[1] ?? 'jpg'
        const { id } = await uploadBase64ToMedia(
          payload,
          videoThumbnailUrl,
          `portfolio-video-thumb.${ext}`,
          userId,
        )
        data.videoThumbnail = id
      }
    }

    if (type === 'youtube') {
      if (!youtubeUrl || !youtubeVideoId) {
        return NextResponse.json(
          { error: 'youtubeUrl and youtubeVideoId are required for type=youtube' },
          { status: 400 },
        )
      }
      data.youtubeUrl = youtubeUrl
      data.youtubeVideoId = youtubeVideoId
    }

    if (type === 'link') {
      if (!linkUrl)
        return NextResponse.json({ error: 'linkUrl is required for type=link' }, { status: 400 })
      data.linkUrl = linkUrl
      if (linkThumbnailUrl?.startsWith('data:')) {
        const ext = linkThumbnailUrl.match(/^data:image\/([^;]+)/)?.[1] ?? 'jpg'
        const { id } = await uploadBase64ToMedia(
          payload,
          linkThumbnailUrl,
          `portfolio-link-thumb.${ext}`,
          userId,
        )
        data.linkThumbnail = id
      }
    }

    if (type === 'document') {
      if (!documentMediaId && !documentUrl)
        return NextResponse.json(
          { error: 'documentMediaId or documentUrl is required for type=document' },
          { status: 400 },
        )

      if (documentMediaId) {
        // Primary path: client uploaded directly to /api/media and sent back the media doc ID
        data.document = toPayloadId(documentMediaId)
      } else if (documentUrl?.startsWith('data:')) {
        // Fallback: base64 (small files only)
        const { id } = await uploadBase64ToMedia(
          payload,
          documentUrl,
          documentName ?? 'document',
          userId,
        )
        data.document = id
      }

      data.documentName = documentName
      data.documentSize = documentSize
      data.documentExt = documentExt
    }

    const created = await payload.create({
      collection: 'portfolio',
      data: data as any,
      depth: 2,
      overrideAccess: true, // ← server-side: no req.user attached
    })

    return NextResponse.json({ item: normaliseItem(created) }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/portfolios]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── Normaliser ───────────────────────────────────────────────────────────────

function resolveMediaUrl(media: any): string | undefined {
  if (!media) return undefined
  if (typeof media === 'string') return media
  return media.url ?? undefined
}

function normaliseItem(doc: any) {
  const tags: string[] = (doc.tags ?? [])
    .map((t: any) => (typeof t === 'string' ? t : (t.tag ?? '')))
    .filter(Boolean)

  const base = {
    id: String(doc.id),
    type: doc.type,
    title: doc.title,
    description: doc.description ?? undefined,
    tags: tags.length ? tags : undefined,
    featured: Boolean(doc.featured),
    hidden: Boolean(doc.hidden),
    createdAt: doc.createdAt,
  }

  switch (doc.type) {
    case 'image':
      return { ...base, imageUrl: resolveMediaUrl(doc.image) }
    case 'video':
      return {
        ...base,
        videoUrl: resolveMediaUrl(doc.video),
        videoThumbnailUrl: resolveMediaUrl(doc.videoThumbnail),
      }
    case 'youtube':
      return {
        ...base,
        youtubeUrl: doc.youtubeUrl,
        youtubeVideoId: doc.youtubeVideoId,
        youtubeThumbnailUrl: doc.youtubeVideoId
          ? `https://img.youtube.com/vi/${doc.youtubeVideoId}/maxresdefault.jpg`
          : undefined,
      }
    case 'link':
      return { ...base, linkUrl: doc.linkUrl, linkThumbnailUrl: resolveMediaUrl(doc.linkThumbnail) }
    case 'document':
      return {
        ...base,
        documentUrl: resolveMediaUrl(doc.document),
        documentName: doc.documentName,
        documentSize: doc.documentSize,
        documentExt: doc.documentExt,
      }
    default:
      return base
  }
}
