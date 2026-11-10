// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/delegations/acting/route.ts
// URL:            GET  /api/company/managers/delegations/acting   → { actingAs, available }
//                 POST /api/company/managers/delegations/acting   { ownerId | null }
// WHAT IT DOES:   Switches the substitute into a colleague's workspace (or back).
//                 Sets an httpOnly cookie that every manager route checks against
//                 the database (managerDelegation.ts) — ending the delegation cuts
//                 access immediately, whatever the cookie says.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { delegationState } from '@/utils/delegations'
import {
  ACTING_COOKIE,
  findActiveDelegation,
  loadPeople,
  requireManagerActor,
  resolveManagerContext,
} from '@/utils/server/managerDelegation'

const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

async function availableOwners(payload: any, actorId: number) {
  const { docs } = await payload.find({
    collection: 'manager-delegations',
    where: { and: [{ delegate: { equals: actorId } }, { status: { equals: 'accepted' } }] },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  const ids = (docs as any[])
    .filter((d) => delegationState(d) === 'active')
    .map((d) => relId(d.owner))
  const people = await loadPeople(payload, ids)
  return ids.map((id) => people.get(String(id))).filter(Boolean)
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveManagerContext(req)
    if (!ctx) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })
    const available = await availableOwners(payload, ctx.actorId)
    const actingAs = ctx.actingAs
      ? ((await loadPeople(payload, [ctx.managerId])).get(String(ctx.managerId)) ?? null)
      : null

    const res = NextResponse.json(
      { actingAs, available },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
    // Tidy up a cookie that no longer points at an active delegation.
    if (!ctx.actingAs && req.cookies.get(ACTING_COOKIE)) res.cookies.delete(ACTING_COOKIE)
    return res
  } catch (error) {
    console.error('❌ Failed to load workspace:', error)
    return NextResponse.json({ message: 'Failed to load workspace' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireManagerActor(req)
    if (!actor) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const { ownerId } = (await req.json().catch(() => ({}))) as { ownerId?: string | number | null }
    const payload = await getPayload({ config })

    if (ownerId == null || ownerId === '' || Number(ownerId) === actor.id) {
      const res = NextResponse.json(
        { actingAs: null, available: await availableOwners(payload, actor.id) },
        { status: 200 },
      )
      res.cookies.delete(ACTING_COOKIE)
      return res
    }

    const owner = Number(ownerId)
    const active = Number.isFinite(owner)
      ? await findActiveDelegation(payload, owner, actor.id)
      : null
    if (!active) {
      return NextResponse.json(
        { message: 'You are not covering for this manager right now' },
        { status: 403 },
      )
    }

    const people = await loadPeople(payload, [owner])
    const res = NextResponse.json(
      {
        actingAs: people.get(String(owner)) ?? null,
        available: await availableOwners(payload, actor.id),
      },
      { status: 200 },
    )
    res.cookies.set(ACTING_COOKIE, String(owner), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12, // re-checked on every request anyway
    })
    return res
  } catch (error) {
    console.error('❌ Failed to switch workspace:', error)
    return NextResponse.json({ message: 'Failed to switch workspace' }, { status: 500 })
  }
}
