import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/managerDelegation'

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

// GET — read-only portfolio for a specific employee, only if that employee has
// an accepted invitation from this manager. This is the *only* gate — there is
// no separate "manager can read any portfolio" access rule anywhere, so an
// unaccepted or nonexistent invitation means a hard 403, not partial data.
//
// Items the employee has marked `hidden` are filtered out here, server-side,
// before the manager ever sees them — this is deliberate: the employee controls
// what's shared, and that control must not depend on the client-side UI.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const { employeeId: employeeIdParam } = await params // ← Next.js 15: params is a Promise

    const managerId = await requireManagerId(req)
    if (managerId === null) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const payload = await getPayload({ config })

    const employeeId = Number(employeeIdParam)
    if (!Number.isFinite(employeeId)) {
      return NextResponse.json({ message: 'Invalid employee id' }, { status: 400 })
    }

    const invitationResult = await payload.find({
      collection: 'employee-invitations',
      where: {
        and: [
          { manager: { equals: managerId } },
          { employee: { equals: employeeId } },
          { status: { equals: 'accepted' } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    if (invitationResult.docs.length === 0) {
      return NextResponse.json(
        { message: 'This employee has not accepted an invitation from you' },
        { status: 403 },
      )
    }

    const portfolioResult = await payload.find({
      collection: 'portfolio',
      where: { user: { equals: employeeId } },
      sort: '-createdAt',
      depth: 2,
      limit: 200,
      overrideAccess: true,
    })

    // Employees control what's visible to their manager — never leak hidden
    // items past this point, regardless of what any client sends.
    const visibleDocs = portfolioResult.docs.filter((doc: any) => !doc.hidden)

    const employeeDoc = await payload.findByID({
      collection: 'users',
      id: employeeId,
      overrideAccess: true,
      disableErrors: true,
    })

    return NextResponse.json(
      {
        employee: {
          id: String(employeeId),
          name: employeeDoc?.name || '',
          email: employeeDoc?.email || '',
        },
        items: visibleDocs.map(normaliseItem),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to load employee portfolio:', error)
    return NextResponse.json({ message: 'Failed to load portfolio' }, { status: 500 })
  }
}
