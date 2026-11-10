// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/employees/route.ts   (NEW)
// URL:            GET /api/company/admin/employees
//                 → { data: EmployeeRow[], managers: { id, name }[] }
// WHAT IT DOES:   Every employee connected to one of the admin's managers.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { AccessLevel, EmployeeRow } from '@/utils/adminEmployees'
import { relId, requireCompanyAdmin, lastSeenOf } from '@/utils/server/adminmanagers'
import {
  accessFrom,
  acceptedInvites,
  adminManagerNames,
  docCounts,
} from '@/utils/server/adminEmployees'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })

    const names = await adminManagerNames(payload, admin)
    const invites = await acceptedInvites(payload, [...names.keys()])

    // Group invitations per employee.
    const byEmp = new Map<
      string,
      {
        managers: { id: string; name: string; accessLevel: AccessLevel }[]
        connectedAt: string | null
      }
    >()
    for (const inv of invites) {
      const eid = String(relId(inv.employee))
      if (!eid || eid === 'null') continue
      const mid = String(relId(inv.manager))
      const e = byEmp.get(eid) ?? { managers: [], connectedAt: null }
      if (!e.managers.some((m) => m.id === mid))
        e.managers.push({
          id: mid,
          name: names.get(mid) ?? '',
          accessLevel:
            inv.accessLevel === 'cv_only' || inv.accessLevel === 'portfolio_only'
              ? inv.accessLevel
              : 'full',
        })
      const at = inv.respondedAt ?? inv.updatedAt ?? null
      if (at && (!e.connectedAt || at < e.connectedAt)) e.connectedAt = at
      byEmp.set(eid, e)
    }
    const ids = [...byEmp.keys()]

    const [users, personal, counts, seen] = await Promise.all([
      ids.length
        ? payload.find({
            collection: 'users',
            where: { id: { in: ids } },
            pagination: false,
            depth: 0,
            overrideAccess: true,
          })
        : { docs: [] },
      ids.length
        ? payload
            .find({
              collection: 'personal-information',
              where: { user: { in: ids } },
              pagination: false,
              depth: 0,
              overrideAccess: true,
            })
            .catch(() => ({ docs: [] }))
        : { docs: [] },
      docCounts(payload, ids),
      lastSeenOf(payload, ids),
    ])
    const userBy = new Map((users.docs as any[]).map((u) => [String(u.id), u]))
    const piBy = new Map((personal.docs as any[]).map((p) => [String(relId(p.user)), p]))

    const data: EmployeeRow[] = ids
      .filter((id) => userBy.has(id))
      .map((id) => {
        const u: any = userBy.get(id)
        const pi: any = piBy.get(id)
        const e = byEmp.get(id)!
        const access = accessFrom(e.managers.map((m) => m.accessLevel))
        return {
          id,
          name: [pi?.firstName, pi?.lastName].filter(Boolean).join(' ').trim() || u.name || u.email,
          email: u.email || '',
          phone: access.canSeeProfile ? pi?.phoneNumber || '' : '',
          title: pi?.title || '',
          managers: e.managers,
          ...access,
          cvCount: access.canSeeCvs ? (counts.cvs.get(id) ?? 0) : 0,
          portfolioCount: access.canSeePortfolio ? (counts.portfolio.get(id) ?? 0) : 0,
          connectedAt: e.connectedAt,
          lastSeenAt: seen.get(id) ?? null,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

    const managers = [...names.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
    return NextResponse.json(
      { data, managers },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to list employees:', error)
    return NextResponse.json({ message: 'Failed to load employees' }, { status: 500 })
  }
}
