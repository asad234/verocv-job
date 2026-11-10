// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/delegations/team/route.ts
// URL:            GET /api/company/managers/delegations/team
//                 → { owners: [...], employees: [{ employeeId, employeeName, employeeEmail,
//                      acceptedAt, accessLevel, coveringFor: { id, name } }] }
// WHAT IT DOES:   The employees of every colleague the logged-in manager is
//                 covering for RIGHT NOW (accepted + inside the dates), in the same
//                 shape as /api/company/managers/employees — so the substitute's own
//                 pages can list them next to their own team, marked "from Lena".
//                 Based on who is logged in — a workspace cookie doesn't change it.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { delegationState } from '@/utils/delegations'
import { loadPeople, resolveManagerContext } from '@/utils/server/managerDelegation'

const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveManagerContext(req)
    if (!ctx) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const empty = NextResponse.json(
      { owners: [], employees: [] },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )

    const payload = await getPayload({ config })
    const { docs: delegations } = await payload.find({
      collection: 'manager-delegations',
      where: { and: [{ delegate: { equals: ctx.actorId } }, { status: { equals: 'accepted' } }] },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })
    const active = (delegations as any[]).filter((d) => delegationState(d) === 'active')
    if (!active.length) return empty

    const ownerIds = [...new Set(active.map((d) => Number(relId(d.owner))))]
    const { docs: invites } = await payload.find({
      collection: 'employee-invitations',
      where: { and: [{ manager: { in: ownerIds } }, { status: { equals: 'accepted' } }] },
      limit: 2000,
      depth: 0,
      overrideAccess: true,
    })

    const employeeIds = [
      ...new Set((invites as any[]).map((i) => Number(relId(i.employee))).filter(Number.isFinite)),
    ]
    const [people, users, personal] = await Promise.all([
      loadPeople(payload, ownerIds),
      employeeIds.length
        ? payload.find({
            collection: 'users',
            where: { id: { in: employeeIds } },
            limit: employeeIds.length,
            depth: 0,
            overrideAccess: true,
          })
        : { docs: [] },
      employeeIds.length
        ? payload
            .find({
              collection: 'personal-information',
              where: { user: { in: employeeIds } },
              limit: employeeIds.length * 2,
              depth: 0,
              overrideAccess: true,
            })
            .catch(() => ({ docs: [] }))
        : { docs: [] },
    ])
    const userById = new Map((users.docs as any[]).map((u) => [String(u.id), u]))
    const piByUser = new Map((personal.docs as any[]).map((p) => [String(relId(p.user)), p]))

    const seen = new Set<string>()
    const employees = (invites as any[])
      .map((i) => {
        const id = String(relId(i.employee))
        const owner = people.get(String(relId(i.manager)))
        const u: any = userById.get(id) ?? {}
        const pi: any = piByUser.get(id)
        return {
          employeeId: id,
          employeeName:
            [pi?.firstName, pi?.lastName].filter(Boolean).join(' ').trim() || u.name || '',
          employeeEmail: u.email || i.employeeEmail || '',
          acceptedAt: i.respondedAt ?? null,
          accessLevel: i.accessLevel || 'full',
          coveringFor: { id: owner?.id ?? String(relId(i.manager)), name: owner?.name ?? '' },
        }
      })
      .filter((e) => (seen.has(e.employeeId) ? false : (seen.add(e.employeeId), true)))

    const owners = active.map((d) => ({
      ...(people.get(String(relId(d.owner))) ?? {
        id: String(relId(d.owner)),
        name: '',
        email: '',
      }),
      delegationId: String(d.id),
      endsAt: d.endsAt ?? null,
      reason: d.reason ?? 'other',
    }))

    return NextResponse.json(
      { owners, employees },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load covered team:', error)
    return NextResponse.json({ message: 'Failed to load covered team' }, { status: 500 })
  }
}
