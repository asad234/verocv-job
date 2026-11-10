import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'

async function requireBusinessAdmin(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const role = token?.roles as string | undefined
  if (!token?.id || (role !== 'client-admin' && role !== 'admin')) return null
  return token
}

const relId = (v: any) => (v && typeof v === 'object' ? v.id : v)

// GET — list manager accounts (roles: 'client-manager')
//
// Scoped by createdBy: a client-admin only sees managers they personally
// created. A full admin (platform-level) sees every manager in the system.
export async function GET(req: NextRequest) {
  try {
    const token = await requireBusinessAdmin(req)
    if (!token) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const requesterId = Number(token.id)
    if (!Number.isFinite(requesterId)) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const payload = await getPayload({ config })

    const where =
      token.roles === 'admin'
        ? { roles: { equals: 'client-manager' } }
        : {
            and: [{ roles: { equals: 'client-manager' } }, { createdBy: { equals: requesterId } }],
          }

    // All managers, not just the first 100.
    const result = await payload.find({
      collection: 'users',
      where: where as any,
      sort: '-createdAt',
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    const users = result.docs as any[]
    const userIds = users.map((doc) => doc.id)

    // manager-info (name, phone, department) and the managers' accepted
    // employees, each in one query rather than one per manager.
    const [infoResult, inviteResult] = userIds.length
      ? await Promise.all([
          payload.find({
            collection: 'manager-info',
            where: { user: { in: userIds } },
            pagination: false,
            depth: 0,
            overrideAccess: true,
          }),
          payload.find({
            collection: 'employee-invitations',
            where: {
              and: [{ manager: { in: userIds } }, { status: { in: ['accepted', 'pending'] } }],
            },
            pagination: false,
            depth: 0,
            overrideAccess: true,
          }),
        ])
      : [{ docs: [] }, { docs: [] }]

    const infoByUserId = new Map<string, any>()
    for (const info of infoResult.docs as any[]) {
      const uid = relId(info.user)
      if (uid != null) infoByUserId.set(String(uid), info)
    }

    // Distinct employees per manager (an employee invited twice counts once).
    const employeesByManager = new Map<string, Set<string>>()
    const pendingByManager = new Map<string, number>()
    for (const inv of inviteResult.docs as any[]) {
      const mid = String(relId(inv.manager))
      if (inv.status === 'pending') {
        pendingByManager.set(mid, (pendingByManager.get(mid) ?? 0) + 1)
        continue
      }
      const eid = relId(inv.employee)
      if (eid == null) continue
      if (!employeesByManager.has(mid)) employeesByManager.set(mid, new Set())
      employeesByManager.get(mid)!.add(String(eid))
    }

    const managers = users.map((doc) => {
      const info = infoByUserId.get(String(doc.id))
      // The name the manager set in their settings wins over the account name.
      const nameParts = String(doc.name || '')
        .trim()
        .split(/\s+/)
      const firstName = info?.firstName?.trim() || nameParts[0] || ''
      const lastName = info?.lastName?.trim() || nameParts.slice(1).join(' ') || ''

      return {
        id: String(doc.id),
        firstName,
        lastName,
        email: doc.email || '',
        phone: info?.phone || info?.mobilePhone || '',
        jobTitle: info?.jobTitle || '',
        department: info?.department?.department || '',
        accessLevel: doc.accessLevel || '',
        status: (doc.status as 'active' | 'inactive' | 'pending') || 'active',
        employeeCount: employeesByManager.get(String(doc.id))?.size ?? 0,
        pendingInvitations: pendingByManager.get(String(doc.id)) ?? 0,
        joinedAt: doc.createdAt
          ? new Date(doc.createdAt).toLocaleDateString('en-GB', {
              month: 'short',
              year: 'numeric',
              timeZone: 'Europe/Stockholm',
            })
          : '',
        createdAt: doc.createdAt ?? null,
      }
    })

    return NextResponse.json(
      { data: managers },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to list managers:', error)
    return NextResponse.json({ message: 'Failed to load managers' }, { status: 500 })
  }
}
