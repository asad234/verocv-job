// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/adminManagers.ts   (NEW — server only)
// WHAT IT DOES:   Everything the business admin's manager routes share:
//   • requireCompanyAdmin    who's asking (client-admin or platform admin)
//   • findOwnManager         a manager this admin may manage (created by them;
//                            a platform admin may manage any manager)
//   • toRow / toProfile      what the pages get back
//   • deleteManagerCompletely  removes the manager and their personal data
// ══════════════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { ManagerProfile, ManagerRow, ManagerStatus } from '@/utils/adminManagers'

export const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)
const STATUSES: ManagerStatus[] = ['active', 'inactive', 'pending']

export interface Admin {
  id: number
  role: 'client-admin' | 'admin'
}

export async function requireCompanyAdmin(req: NextRequest): Promise<Admin | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const role = token?.roles
  const id = Number(token?.id)
  if (!token?.id || !Number.isFinite(id) || (role !== 'client-admin' && role !== 'admin'))
    return null
  return { id, role }
}

/** The manager (users doc), only if this admin may manage them. */
export async function findOwnManager(payload: any, admin: Admin, id: string | number) {
  const user: any = await payload
    .findByID({ collection: 'users', id, depth: 0, overrideAccess: true, disableErrors: true })
    .catch(() => null)
  if (!user || user.roles !== 'client-manager') return null
  if (admin.role !== 'admin' && Number(relId(user.createdBy)) !== admin.id) return null
  return user
}

export async function findManagerInfo(payload: any, userId: number | string) {
  const { docs } = await payload.find({
    collection: 'manager-info',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (docs as any[])[0] ?? null
}

const splitName = (name: string) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
  return { first: parts[0] || '', last: parts.slice(1).join(' ') }
}

export function toRow(
  user: any,
  info: any,
  counts: { employees?: number; pending?: number } = {},
  lastSeenAt: string | null = null,
): ManagerRow {
  const n = splitName(user.name)
  const firstName = info?.firstName?.trim() || n.first
  const lastName = info?.lastName?.trim() || n.last
  return {
    id: String(user.id),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || user.email,
    email: user.email || '',
    phone: info?.phone || info?.mobilePhone || '',
    jobTitle: info?.jobTitle || '',
    department: info?.department?.department || '',
    accessLevel: user.accessLevel || '',
    status: STATUSES.includes(user.status) ? user.status : 'active',
    employeeCount: counts.employees ?? 0,
    pendingInvitations: counts.pending ?? 0,
    createdAt: user.createdAt ?? null,
    lastSeenAt,
  }
}

/** Accepted employees + pending invitations, per manager id. */
export async function teamCounts(payload: any, managerIds: (number | string)[]) {
  const employees = new Map<string, Set<string>>()
  const pending = new Map<string, number>()
  if (!managerIds.length) return { employees, pending }
  const { docs } = await payload.find({
    collection: 'employee-invitations',
    where: { and: [{ manager: { in: managerIds } }, { status: { in: ['accepted', 'pending'] } }] },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  for (const inv of docs as any[]) {
    const m = String(relId(inv.manager))
    if (inv.status === 'pending') pending.set(m, (pending.get(m) ?? 0) + 1)
    else if (relId(inv.employee) != null) {
      if (!employees.has(m)) employees.set(m, new Set())
      employees.get(m)!.add(String(relId(inv.employee)))
    }
  }
  return { employees, pending }
}

export async function lastSeenOf(payload: any, ids: (number | string)[]) {
  const out = new Map<string, string>()
  if (!ids.length) return out
  const { docs } = await payload
    .find({
      collection: 'user-presence',
      where: { user: { in: ids } },
      limit: ids.length,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] }))
  for (const d of docs as any[]) if (d.lastSeenAt) out.set(String(relId(d.user)), d.lastSeenAt)
  return out
}

export async function toProfile(payload: any, user: any): Promise<ManagerProfile> {
  const [info, counts, seen, invites, contracts, interviews] = await Promise.all([
    findManagerInfo(payload, user.id),
    teamCounts(payload, [user.id]),
    lastSeenOf(payload, [user.id]),
    payload.find({
      collection: 'employee-invitations',
      where: { and: [{ manager: { equals: user.id } }, { status: { equals: 'accepted' } }] },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    }),
    payload
      .count({
        collection: 'employee-contracts',
        where: { manager: { equals: user.id } },
        overrideAccess: true,
      })
      .catch(() => ({ totalDocs: 0 })),
    payload
      .count({
        collection: 'interviews',
        where: {
          and: [
            { manager: { equals: user.id } },
            { status: { equals: 'scheduled' } },
            { startAt: { greater_than: new Date().toISOString() } },
          ],
        },
        overrideAccess: true,
      })
      .catch(() => ({ totalDocs: 0 })),
  ])

  // Employee names (personal-information first, account name as fallback).
  const empIds = [
    ...new Set((invites.docs as any[]).map((i) => String(relId(i.employee))).filter(Boolean)),
  ]
  const [empUsers, empInfo] = empIds.length
    ? await Promise.all([
        payload.find({
          collection: 'users',
          where: { id: { in: empIds } },
          limit: empIds.length,
          depth: 0,
          overrideAccess: true,
        }),
        payload
          .find({
            collection: 'personal-information',
            where: { user: { in: empIds } },
            limit: empIds.length * 2,
            depth: 0,
            overrideAccess: true,
          })
          .catch(() => ({ docs: [] })),
      ])
    : [{ docs: [] }, { docs: [] }]
  const userById = new Map((empUsers.docs as any[]).map((u) => [String(u.id), u]))
  const piById = new Map((empInfo.docs as any[]).map((p) => [String(relId(p.user)), p]))
  const seenEmp = new Set<string>()
  const employees = (invites.docs as any[])
    .map((i) => {
      const id = String(relId(i.employee))
      const u: any = userById.get(id) ?? {}
      const pi: any = piById.get(id)
      return {
        id,
        name:
          [pi?.firstName, pi?.lastName].filter(Boolean).join(' ').trim() ||
          u.name ||
          u.email ||
          '—',
        email: u.email || '',
        acceptedAt: i.respondedAt ?? i.updatedAt ?? null,
        accessLevel: i.accessLevel || 'full',
      }
    })
    .filter((e) => (seenEmp.has(e.id) ? false : (seenEmp.add(e.id), true)))
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

  const row = toRow(
    user,
    info,
    {
      employees: counts.employees.get(String(user.id))?.size ?? 0,
      pending: counts.pending.get(String(user.id)) ?? 0,
    },
    seen.get(String(user.id)) ?? null,
  )
  return {
    ...row,
    phone: info?.phone || '',
    privateEmail: info?.privateEmail || '',
    mobilePhone: info?.mobilePhone || '',
    homeAddress: info?.homeAddress || '',
    professionalBio: info?.professionalBio || '',
    company: info?.department?.companyName || '',
    deptSize: info?.department?.deptSize || '',
    deptFocus: info?.department?.deptFocus || '',
    managedSince: info?.department?.managedSince || null,
    deptGoals: info?.department?.deptGoals || '',
    employees,
    stats: { contracts: contracts.totalDocs ?? 0, upcomingInterviews: interviews.totalDocs ?? 0 },
  }
}

/* ─── Delete ─────────────────────────────────────────────────────────── */

/**
 * Permanently removes the manager and their personal data:
 *   account, settings (manager-info), chat status, chats + messages,
 *   employee connections (invitations), substitute arrangements,
 *   Google Calendar connection, own contract templates.
 * KEPT on purpose: contracts and interviews (legal / employee records — the
 * employee still sees their signed contract).
 * Every step is best-effort: a collection that doesn't exist in this project is skipped.
 */
export async function deleteManagerCompletely(payload: any, managerId: number) {
  const removed: Record<string, number> = {}
  const delWhere = async (collection: string, where: any) => {
    try {
      const { docs } = await payload.find({
        collection,
        where,
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      for (const d of docs as any[])
        await payload.delete({ collection, id: d.id, overrideAccess: true })
      removed[collection] = (docs as any[]).length
      return docs as any[]
    } catch (e: any) {
      if (!/collection|not found|can't be found/i.test(String(e?.message)))
        console.warn(`⚠️ delete manager: ${collection}`, e?.message)
      return []
    }
  }

  // Chats first (messages belong to conversations).
  const convs = await (async () => {
    try {
      const { docs } = await payload.find({
        collection: 'chat-conversations',
        where: { 'members.user': { equals: managerId } },
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      return docs as any[]
    } catch {
      return []
    }
  })()
  if (convs.length) {
    await delWhere('chat-messages', { conversation: { in: convs.map((c) => c.id) } })
    await delWhere('chat-conversations', { id: { in: convs.map((c) => c.id) } })
  }

  await delWhere('employee-invitations', { manager: { equals: managerId } })
  await delWhere('manager-delegations', {
    or: [{ owner: { equals: managerId } }, { delegate: { equals: managerId } }],
  })
  await delWhere('google-calendar-connections', { user: { equals: managerId } })
  await delWhere('contract-templates', { owner: { equals: managerId } })
  await delWhere('user-presence', { user: { equals: managerId } })
  await delWhere('manager-info', { user: { equals: managerId } })

  await payload.delete({ collection: 'users', id: managerId, overrideAccess: true })
  removed.users = 1
  return removed
}
