// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/managers/route.ts   (NEW)
//                 (next to your create-manager route)
// URL:            GET /api/company/admin/managers → { data: ManagerRow[] }
// WHAT IT DOES:   The business admin's managers (the ones they created; a platform
//                 admin sees all), with team size, pending invitations and last seen.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  lastSeenOf,
  relId,
  requireCompanyAdmin,
  teamCounts,
  toRow,
} from '@/utils/server/adminmanagers'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })

    const { docs: users } = await payload.find({
      collection: 'users',
      where: (admin.role === 'admin'
        ? { roles: { equals: 'client-manager' } }
        : {
            and: [{ roles: { equals: 'client-manager' } }, { createdBy: { equals: admin.id } }],
          }) as any,
      sort: '-createdAt',
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    const ids = (users as any[]).map((u) => u.id)

    const [infos, counts, seen] = await Promise.all([
      ids.length
        ? payload.find({
            collection: 'manager-info',
            where: { user: { in: ids } },
            pagination: false,
            depth: 0,
            overrideAccess: true,
          })
        : Promise.resolve({ docs: [] as any[] }),
      teamCounts(payload, ids),
      lastSeenOf(payload, ids),
    ])
    const infoBy = new Map((infos.docs as any[]).map((i) => [String(relId(i.user)), i]))

    const data = (users as any[]).map((u) =>
      toRow(
        u,
        infoBy.get(String(u.id)),
        {
          employees: counts.employees.get(String(u.id))?.size ?? 0,
          pending: counts.pending.get(String(u.id)) ?? 0,
        },
        seen.get(String(u.id)) ?? null,
      ),
    )
    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to list managers:', error)
    return NextResponse.json({ message: 'Failed to load managers' }, { status: 500 })
  }
}
