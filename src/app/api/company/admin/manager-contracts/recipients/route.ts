// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/recipients/route.ts   (NEW)
// URL:            GET  /api/company/admin/manager-contracts/recipients
// WHAT IT DOES:   The managers a business admin can send a contract to — in the same
//                 shape as GET /api/company/managers/employees, so the contract
//                 editor's person picker works unchanged: { data: [{ employeeId, employeeName, employeeEmail }] }
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireCompanyAdmin } from '@/utils/server/adminmanagers'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })

    const where: any =
      admin.role === 'admin'
        ? { roles: { equals: 'client-manager' } }
        : { and: [{ roles: { equals: 'client-manager' } }, { createdBy: { equals: admin.id } }] }
    const { docs: users } = await payload.find({
      collection: 'users',
      where,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    const ids = (users as any[]).map((u) => u.id)
    const { docs: infos } = ids.length
      ? await payload
          .find({
            collection: 'manager-info',
            where: { user: { in: ids } },
            pagination: false,
            depth: 0,
            overrideAccess: true,
          })
          .catch(() => ({ docs: [] }))
      : { docs: [] }
    const infoBy = new Map(
      (infos as any[]).map((i) => [String(typeof i.user === 'object' ? i.user?.id : i.user), i]),
    )

    const data = (users as any[]).map((u) => {
      const i: any = infoBy.get(String(u.id))
      const name = [i?.firstName, i?.lastName].filter(Boolean).join(' ').trim() || u.name || u.email
      return {
        employeeId: String(u.id),
        employeeName: name,
        employeeEmail: u.email || '',
        jobTitle: i?.jobTitle || '',
      }
    })
    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load contract recipients:', error)
    return NextResponse.json({ message: 'Failed to load managers' }, { status: 500 })
  }
}
