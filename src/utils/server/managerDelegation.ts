// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/managerDelegation.ts   (NEW — server only)
// WHAT IT DOES:   Works out WHICH manager a request acts for.
//
//   • Normally: the logged-in manager.
//   • When a substitute has switched into a colleague's workspace (cookie
//     `verocv_acting_as`), and that colleague's delegation to them is accepted
//     and inside its dates: the colleague (the "owner").
//
// The cookie (or the x-verocv-acting-for header) is only a wish — it is checked against the database on EVERY
// request, so ending a delegation cuts access immediately.
//
// USE IN YOUR MANAGER ROUTES:
//   import { requireManagerId } from '@/utils/server/managerDelegation'
//   const managerId = await requireManagerId(req)   // owner's id while covering
//
// Routes about the manager PERSONALLY (their own settings, their own
// delegations) should keep using the logged-in id — see requireManagerActor().
// ══════════════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'
import { delegationState, type Delegation, type DelegationPerson } from '@/utils/delegations'

export const ACTING_COOKIE = 'verocv_acting_as'
/**
 * Per-request version of the cookie: the substitute's own pages send this for
 * employees / contracts / interviews that belong to the colleague they cover
 * (see utils/coveredTeam.ts). Verified exactly like the cookie.
 */
export const ACTING_HEADER = 'x-verocv-acting-for'
const MANAGER_ROLES = new Set(['client-manager', 'client-admin'])

const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

export interface ManagerContext {
  /** The person actually logged in. */
  actorId: number
  actorRole: string
  /** Whose data this request works on (owner while covering, else actorId). */
  managerId: number
  actingAs: boolean
  delegationId: string | null
}

async function readActor(req: NextRequest): Promise<{ id: number; role: string } | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const role = String(token?.roles ?? '')
  if (!token?.id || !MANAGER_ROLES.has(role)) return null
  const id = Number(token.id)
  return Number.isFinite(id) ? { id, role } : null
}

/** The accepted, currently-running delegation from `ownerId` to `delegateId`, if any. */
export async function findActiveDelegation(payload: any, ownerId: number, delegateId: number) {
  const { docs } = await payload.find({
    collection: 'manager-delegations',
    where: {
      and: [
        { owner: { equals: ownerId } },
        { delegate: { equals: delegateId } },
        { status: { equals: 'accepted' } },
      ],
    },
    sort: '-createdAt',
    limit: 5,
    depth: 0,
    overrideAccess: true,
  })
  return (docs as any[]).find((d) => delegationState(d) === 'active') ?? null
}

/** Logged-in manager + the workspace they're working in. Null if not a manager. */
export async function resolveManagerContext(req: NextRequest): Promise<ManagerContext | null> {
  const actor = await readActor(req)
  if (!actor) return null

  const base: ManagerContext = {
    actorId: actor.id,
    actorRole: actor.role,
    managerId: actor.id,
    actingAs: false,
    delegationId: null,
  }
  const wanted = Number(req.headers.get(ACTING_HEADER) || req.cookies.get(ACTING_COOKIE)?.value)
  try {
    const payload = await getPayload({ config })
    // 1. A request about ONE employee / contract / interview: the item decides.
    //    Your own → you. A covered colleague's → them. (A leftover workspace
    //    cookie can't send your own employees to the colleague any more.)
    const fromPath = await ownerFromPath(payload, actor.id, req.nextUrl?.pathname ?? '')
    if (fromPath === 'own') return base
    if (fromPath)
      return {
        ...base,
        managerId: fromPath.ownerId,
        actingAs: true,
        delegationId: fromPath.delegationId,
      }

    // 2. Lists etc.: the header (merged view) or the workspace cookie.
    if (Number.isFinite(wanted) && wanted > 0 && wanted !== actor.id) {
      const active = await findActiveDelegation(payload, wanted, actor.id)
      if (active)
        return { ...base, managerId: wanted, actingAs: true, delegationId: String(active.id) }
    }
    return base
  } catch (error) {
    console.error('❌ Failed to check manager delegation:', error)
    return base
  }
}

const relNum = (v: any) => Number(v && typeof v === 'object' ? v.id : v)

/** Active delegations where `delegateId` covers someone → Map(ownerId → delegationId). */
async function activeOwnersFor(payload: any, delegateId: number): Promise<Map<number, string>> {
  const { docs } = await payload.find({
    collection: 'manager-delegations',
    where: { and: [{ delegate: { equals: delegateId } }, { status: { equals: 'accepted' } }] },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  const owners = new Map<number, string>()
  for (const d of docs as any[])
    if (delegationState(d) === 'active') owners.set(relNum(d.owner), String(d.id))
  return owners
}

/**
 * Works out the owner from the URL when the request carries no header:
 *   /api/company/managers/employees/:id/…          → colleague who has that employee
 *   /api/company/managers/employee-contracts/:id/… → colleague who owns that contract
 *   /api/company/managers/interviews/:id/…         → colleague who owns that interview
 * Only while you're covering for them, and never for your own employees/items.
 */
async function ownerFromPath(
  payload: any,
  actorId: number,
  pathname: string,
): Promise<'own' | { ownerId: number; delegationId: string } | null> {
  const m = pathname.match(
    /\/api\/company\/managers\/(employees|employee-contracts|interviews)\/(\d+)(?:\/|$)/,
  )
  if (!m) return null
  const kind = m[1]!
  const itemId = Number(m[2])

  const owners = await activeOwnersFor(payload, actorId)
  if (owners.size === 0) return null

  if (kind === 'employees') {
    const { docs } = await payload.find({
      collection: 'employee-invitations',
      where: {
        and: [
          { manager: { in: [actorId, ...owners.keys()] } },
          { employee: { equals: itemId } },
          { status: { equals: 'accepted' } },
        ],
      },
      limit: 20,
      depth: 0,
      overrideAccess: true,
    })
    const managers = (docs as any[]).map((d) => relNum(d.manager))
    if (managers.includes(actorId)) return 'own'
    const ownerId = managers.find((id) => owners.has(id))
    return ownerId ? { ownerId, delegationId: owners.get(ownerId)! } : null
  }

  const collection = kind === 'employee-contracts' ? 'employee-contracts' : 'interviews'
  let doc: any = null
  try {
    doc = await payload.findByID({
      collection,
      id: itemId,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
  } catch {
    doc = null
  }
  const ownerId = doc ? relNum(doc.manager) : NaN
  if (ownerId === actorId) return 'own'
  return owners.has(ownerId) ? { ownerId, delegationId: owners.get(ownerId)! } : null
}

/** Drop-in for the old requireManagerId: the manager whose data to use (or null). */
export async function requireManagerId(req: NextRequest): Promise<number | null> {
  return (await resolveManagerContext(req))?.managerId ?? null
}

/** The logged-in manager themself — never the workspace they're covering. */
export async function requireManagerActor(
  req: NextRequest,
): Promise<{ id: number; role: string } | null> {
  return readActor(req)
}

/* ─── DTO helpers ─── */

/** id → { name, email, jobTitle } for the given user ids (users + manager-info). */
export async function loadPeople(
  payload: any,
  ids: (number | string)[],
): Promise<Map<string, DelegationPerson>> {
  const unique = [...new Set(ids.map(String).filter(Boolean))]
  const out = new Map<string, DelegationPerson>()
  if (!unique.length) return out

  const [users, infos] = await Promise.all([
    payload.find({
      collection: 'users',
      where: { id: { in: unique } },
      limit: unique.length,
      depth: 0,
      overrideAccess: true,
    }),
    payload
      .find({
        collection: 'manager-info',
        where: { user: { in: unique } },
        limit: unique.length,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] })),
  ])
  const infoByUser = new Map<string, any>(
    (infos.docs as any[]).map((i) => [String(relId(i.user)), i]),
  )
  for (const u of users.docs as any[]) {
    const info = infoByUser.get(String(u.id))
    const infoName = [info?.firstName, info?.lastName].filter(Boolean).join(' ').trim()
    out.set(String(u.id), {
      id: String(u.id),
      name: infoName || u.name || u.email || '',
      email: u.email ?? '',
      jobTitle: info?.jobTitle || undefined,
    })
  }
  return out
}

export function toDelegationDto(d: any, people: Map<string, DelegationPerson>): Delegation {
  const ownerId = String(relId(d.owner))
  const delegateId = String(relId(d.delegate))
  return {
    id: String(d.id),
    status: d.status,
    state: delegationState(d),
    reason: d.reason ?? 'other',
    message: d.message ?? '',
    startsAt: d.startsAt ?? null,
    endsAt: d.endsAt ?? null,
    createdAt: d.createdAt,
    respondedAt: d.respondedAt ?? null,
    endedAt: d.endedAt ?? null,
    endedBy: d.endedBy ?? null,
    owner: people.get(ownerId) ?? { id: ownerId, name: '', email: '' },
    delegate: people.get(delegateId) ?? { id: delegateId, name: '', email: '' },
  }
}

const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '')

/**
 * All managers in the same company as `userId` (excluding `userId`).
 *
 * A company is found in this order, and everything that matches is combined:
 *   1. the business admin who created me (users.createdBy) — or me, if I'm the admin
 *   2. other business admins with the SAME company name (business-admin-info)
 *   3. managers whose own Settings → Department → Company name matches that
 *      company name (covers managers created before createdBy was stored)
 *
 * reason = 'no_company' when this account isn't linked to any company at all.
 */
export async function companyManagerIds(
  payload: any,
  userId: number,
): Promise<{ ids: number[]; reason: 'no_company' | null }> {
  const me: any = await payload
    .findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!me) return { ids: [], reason: 'no_company' }

  const adminIds = new Set<number>()
  if (me.roles === 'client-admin') adminIds.add(userId)
  const createdBy = relId(me.createdBy)
  if (createdBy != null) adminIds.add(Number(createdBy))

  // Company name: from the business admin's info, else my own manager settings.
  let companyName = ''
  if (adminIds.size) {
    const { docs } = await payload
      .find({
        collection: 'business-admin-info',
        where: { user: { in: [...adminIds] } },
        limit: 10,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] }))
    companyName = norm((docs as any[]).map((d) => d?.company?.companyName).find(Boolean))
  }
  if (!companyName) {
    const { docs } = await payload
      .find({
        collection: 'manager-info',
        where: { user: { equals: userId } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] }))
    companyName = norm((docs as any[])[0]?.department?.companyName)
  }

  // 2. Other business admins of the same company.
  if (companyName) {
    const { docs } = await payload
      .find({ collection: 'business-admin-info', limit: 1000, depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] }))
    for (const info of docs as any[]) {
      if (norm(info?.company?.companyName) === companyName && relId(info.user) != null)
        adminIds.add(Number(relId(info.user)))
    }
  }

  if (!adminIds.size && !companyName) return { ids: [], reason: 'no_company' }

  const ids = new Set<number>()
  if (adminIds.size) {
    const { docs } = await payload.find({
      collection: 'users',
      where: {
        and: [{ roles: { equals: 'client-manager' } }, { createdBy: { in: [...adminIds] } }],
      },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })
    for (const u of docs as any[]) ids.add(Number(u.id))
  }

  // 3. Managers who typed the same company name in their own settings.
  if (companyName) {
    const { docs: infos } = await payload
      .find({ collection: 'manager-info', limit: 2000, depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] }))
    const byName = (infos as any[])
      .filter((i) => norm(i?.department?.companyName) === companyName)
      .map((i) => Number(relId(i.user)))
      .filter((n) => Number.isFinite(n))
    if (byName.length) {
      const { docs } = await payload.find({
        collection: 'users',
        where: { and: [{ id: { in: byName } }, { roles: { equals: 'client-manager' } }] },
        limit: byName.length,
        depth: 0,
        overrideAccess: true,
      })
      for (const u of docs as any[]) ids.add(Number(u.id))
    }
  }

  ids.delete(userId)
  return { ids: [...ids], reason: null }
}
