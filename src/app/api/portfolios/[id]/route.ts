import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'

// ─── Numeric ID helper ────────────────────────────────────────────────────────

function toPayloadId(id: string): number | string {
  const n = Number(id)
  return isNaN(n) ? id : n
}

// ─── Shared auth + ownership guard ───────────────────────────────────────────

async function getAuthorisedItem(itemId: string, userId: string) {
  const payload = await getPayload({ config: configPromise })

  const item = await payload.findByID({
    collection: 'portfolio',
    id: itemId,
    depth: 2,
    overrideAccess: true,
  })

  if (!item) return { payload, item: null, error: 'Not found', status: 404 }

  const ownerId = typeof item.user === 'object' ? (item.user as any).id : item.user
  if (String(ownerId) !== String(userId)) {
    return { payload, item: null, error: 'Forbidden', status: 403 }
  }

  return { payload, item, error: null, status: 200 }
}

// ─── GET /api/portfolios/[id] ─────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params // ← Next.js 15: params is a Promise
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { item, error, status } = await getAuthorisedItem(id, session.user.id)
    if (error) return NextResponse.json({ error }, { status })

    return NextResponse.json({ item: normaliseItem(item) }, { status: 200 })
  } catch (err) {
    console.error('[GET /api/portfolios/[id]]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── PATCH /api/portfolios/[id] ───────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { payload, item, error, status } = await getAuthorisedItem(id, session.user.id)
    if (error || !item) return NextResponse.json({ error }, { status })

    const body = await req.json()
    const userId = session.user.id
    const updates: Record<string, unknown> = {}

    if ('title' in body) updates.title = body.title?.trim()
    if ('description' in body) updates.description = body.description?.trim() || null
    if ('featured' in body) updates.featured = Boolean(body.featured)
    if ('hidden' in body) updates.hidden = Boolean(body.hidden)
    if ('tags' in body) {
      updates.tags = Array.isArray(body.tags)
        ? body.tags.filter(Boolean).map((t: string) => ({ tag: t }))
        : []
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

    async function maybeUpload(
      dataUrl: string | undefined,
      filename: string,
    ): Promise<string | undefined> {
      if (!dataUrl) return undefined
      if (!dataUrl.startsWith('data:')) return dataUrl

      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) return undefined

      const mimeType = matches[1]!
      const nodeBuffer = Buffer.from(matches[2]!, 'base64')
      const arrayBuffer = nodeBuffer.buffer.slice(
        nodeBuffer.byteOffset,
        nodeBuffer.byteOffset + nodeBuffer.byteLength,
      ) as ArrayBuffer
      const blob = new Blob([arrayBuffer], { type: mimeType })
      const form = new FormData()
      form.append('file', blob, filename)
      form.append('alt', filename)

      const res = await fetch(`${serverUrl}/api/media`, {
        method: 'POST',
        headers: { 'x-payload-user': userId },
        body: form,
      })
      if (!res.ok) throw new Error(`Media upload failed: ${res.status}`)
      const { doc } = await res.json()
      return doc.id as string
    }

    switch (item.type) {
      case 'image':
        if ('imageUrl' in body)
          updates.image = await maybeUpload(body.imageUrl, 'portfolio-image.jpg')
        break
      case 'video':
        if ('videoUrl' in body)
          updates.video = await maybeUpload(body.videoUrl, 'portfolio-video.mp4')
        if ('videoThumbnailUrl' in body)
          updates.videoThumbnail = await maybeUpload(
            body.videoThumbnailUrl,
            'portfolio-video-thumb.jpg',
          )
        break
      case 'youtube':
        if ('youtubeUrl' in body) updates.youtubeUrl = body.youtubeUrl
        if ('youtubeVideoId' in body) updates.youtubeVideoId = body.youtubeVideoId
        break
      case 'link':
        if ('linkUrl' in body) updates.linkUrl = body.linkUrl
        if ('linkThumbnailUrl' in body)
          updates.linkThumbnail = await maybeUpload(
            body.linkThumbnailUrl,
            'portfolio-link-thumb.jpg',
          )
        break
      case 'document':
        if ('documentUrl' in body)
          updates.document = await maybeUpload(body.documentUrl, body.documentName ?? 'document')
        if ('documentName' in body) updates.documentName = body.documentName
        if ('documentSize' in body) updates.documentSize = body.documentSize
        if ('documentExt' in body) updates.documentExt = body.documentExt
        break
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    const updated = await payload.update({
      collection: 'portfolio',
      id,
      data: updates as any,
      depth: 2,
      overrideAccess: true,
    })

    return NextResponse.json({ item: normaliseItem(updated) }, { status: 200 })
  } catch (err) {
    console.error('[PATCH /api/portfolios/[id]]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── DELETE /api/portfolios/[id] ──────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params // ← Next.js 15: must await params before use
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { payload, item, error, status } = await getAuthorisedItem(id, session.user.id)
    if (error || !item) return NextResponse.json({ error }, { status })

    await payload.delete({
      collection: 'portfolio',
      id,
      overrideAccess: true,
    })

    return NextResponse.json({ success: true, id }, { status: 200 })
  } catch (err) {
    console.error('[DELETE /api/portfolios/[id]]', err)
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
