// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/adminEmployees.ts   (NEW — server only)
// WHAT IT DOES:   Which employees a business admin may see, and how much:
//   • employees with an ACCEPTED invitation from one of the admin's managers
//     (managers the admin created; a platform admin sees all)
//   • access = the best level over those invitations:
//       full            → profile, employment details, CVs, portfolio
//       cv_only         → CVs only
//       portfolio_only  → portfolio only
//   • CVs / portfolio items the employee marked hidden are never returned.
// ══════════════════════════════════════════════════════════════════════

import type { AccessLevel, AdminPortfolioItem, EmployeeManagerRef } from '@/utils/adminEmployees'
import { relId, type Admin } from '@/utils/server/adminmanagers'

/** The admin's managers: id → display name. */
export async function adminManagerNames(payload: any, admin: Admin): Promise<Map<string, string>> {
  const { docs } = await payload.find({
    collection: 'users',
    where: (admin.role === 'admin'
      ? { roles: { equals: 'client-manager' } }
      : {
          and: [{ roles: { equals: 'client-manager' } }, { createdBy: { equals: admin.id } }],
        }) as any,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const users = docs as any[]
  const out = new Map<string, string>()
  if (!users.length) return out
  const { docs: infos } = await payload
    .find({
      collection: 'manager-info',
      where: { user: { in: users.map((u) => u.id) } },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] }))
  const infoBy = new Map((infos as any[]).map((i) => [String(relId(i.user)), i]))
  for (const u of users) {
    const i: any = infoBy.get(String(u.id))
    out.set(
      String(u.id),
      [i?.firstName, i?.lastName].filter(Boolean).join(' ').trim() || u.name || u.email,
    )
  }
  return out
}

/** Accepted invitations from the admin's managers, optionally for one employee. */
export async function acceptedInvites(
  payload: any,
  managerIds: string[],
  employeeId?: string | number,
) {
  if (!managerIds.length) return [] as any[]
  const and: any[] = [{ manager: { in: managerIds } }, { status: { equals: 'accepted' } }]
  if (employeeId != null) and.push({ employee: { equals: employeeId } })
  const { docs } = await payload.find({
    collection: 'employee-invitations',
    where: { and },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return docs as any[]
}

export function accessFrom(levels: AccessLevel[]) {
  const full = levels.includes('full')
  return {
    canSeeProfile: full,
    canSeeCvs: full || levels.includes('cv_only'),
    canSeePortfolio: full || levels.includes('portfolio_only'),
  }
}

const level = (v: unknown): AccessLevel => (v === 'cv_only' || v === 'portfolio_only' ? v : 'full')

/** For one employee: their managers (in this admin's company) + what the admin may see. Null = not visible. */
export async function employeeAccess(payload: any, admin: Admin, employeeId: string | number) {
  const names = await adminManagerNames(payload, admin)
  const invites = await acceptedInvites(payload, [...names.keys()], employeeId)
  if (!invites.length) return null
  const managers: EmployeeManagerRef[] = []
  for (const inv of invites) {
    const id = String(relId(inv.manager))
    if (!managers.some((m) => m.id === id))
      managers.push({ id, name: names.get(id) ?? '', accessLevel: level(inv.accessLevel) })
  }
  return {
    managers,
    connectedAt:
      invites
        .map((i) => i.respondedAt ?? i.updatedAt ?? null)
        .filter(Boolean)
        .sort()[0] ?? null,
    ...accessFrom(managers.map((m) => m.accessLevel)),
  }
}

/* ─── CV + portfolio collections (same as the manager routes use) ─── */
export const CV_COLLECTION = 'cvs'
export const PORTFOLIO_COLLECTION = 'portfolio'

const mediaUrl = (m: any): string | undefined =>
  !m ? undefined : typeof m === 'string' ? m : (m.url ?? undefined)

export function normalisePortfolioItem(doc: any): AdminPortfolioItem {
  const tags: string[] = (doc.tags ?? [])
    .map((t: any) => (typeof t === 'string' ? t : (t?.tag ?? '')))
    .filter(Boolean)
  const base: AdminPortfolioItem = {
    id: String(doc.id),
    type: doc.type,
    title: doc.title ?? '',
    description: doc.description ?? undefined,
    tags: tags.length ? tags : undefined,
    featured: Boolean(doc.featured),
    createdAt: doc.createdAt,
  }
  switch (doc.type) {
    case 'image':
      return { ...base, imageUrl: mediaUrl(doc.image) }
    case 'video':
      return {
        ...base,
        videoUrl: mediaUrl(doc.video),
        videoThumbnailUrl: mediaUrl(doc.videoThumbnail),
      }
    case 'youtube':
      return {
        ...base,
        youtubeUrl: doc.youtubeUrl,
        youtubeVideoId: doc.youtubeVideoId,
        youtubeThumbnailUrl: doc.youtubeVideoId
          ? `https://img.youtube.com/vi/${doc.youtubeVideoId}/hqdefault.jpg`
          : undefined,
      }
    case 'link':
      return { ...base, linkUrl: doc.linkUrl, linkThumbnailUrl: mediaUrl(doc.linkThumbnail) }
    case 'document':
      return {
        ...base,
        documentUrl: mediaUrl(doc.document),
        documentName: doc.documentName,
        documentSize: doc.documentSize,
        documentExt: doc.documentExt,
      }
    default:
      return base
  }
}

/** Visible CV / portfolio counts per employee (one query each). */
export async function docCounts(payload: any, employeeIds: string[]) {
  const cvs = new Map<string, number>()
  const portfolio = new Map<string, number>()
  if (!employeeIds.length) return { cvs, portfolio }
  const [c, p] = await Promise.all([
    payload
      .find({
        collection: CV_COLLECTION,
        where: { and: [{ user: { in: employeeIds } }, { hidden: { not_equals: true } }] },
        pagination: false,
        depth: 0,
        overrideAccess: true,
        select: { user: true },
      })
      .catch(() => ({ docs: [] })),
    payload
      .find({
        collection: PORTFOLIO_COLLECTION,
        where: { and: [{ user: { in: employeeIds } }, { hidden: { not_equals: true } }] },
        pagination: false,
        depth: 0,
        overrideAccess: true,
        select: { user: true },
      })
      .catch(() => ({ docs: [] })),
  ])
  for (const d of c.docs as any[])
    cvs.set(String(relId(d.user)), (cvs.get(String(relId(d.user))) ?? 0) + 1)
  for (const d of p.docs as any[])
    portfolio.set(String(relId(d.user)), (portfolio.get(String(relId(d.user))) ?? 0) + 1)
  return { cvs, portfolio }
}
